import { isDatabaseConfigured, sql } from "@/lib/db";

let mcpBootstrapped: Promise<void> | null = null;

/**
 * Bootstrap MCP tables (tenants, tokens, cache) in Neon.
 * Idempotent: safe to call multiple times.
 */
async function bootstrapMCP(): Promise<void> {
  if (!sql) return;
  if (!mcpBootstrapped) {
    mcpBootstrapped = (async () => {
      // Tenants (klanten)
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_tenants (
          slug TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          exact_client_id TEXT,
          exact_client_secret_enc TEXT,
          twinfield_client_id TEXT,
          twinfield_client_secret_enc TEXT,
          twinfield_base_url TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          approved_at TIMESTAMPTZ
        )
      `;

      // Exact tokens
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_exact_tokens (
          tenant_slug TEXT REFERENCES mcp_tenants(slug),
          user_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at BIGINT,
          divisions JSONB,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (tenant_slug, user_id)
        )
      `;

      // Twinfield tokens
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_twinfield_tokens (
          tenant_slug TEXT REFERENCES mcp_tenants(slug),
          user_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at BIGINT,
          organisation_code TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (tenant_slug, user_id)
        )
      `;

      // OAuth pending requests
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_oauth_pending (
          id TEXT PRIMARY KEY,
          kind TEXT NOT NULL,
          tenant_slug TEXT,
          state TEXT,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;

      // OAuth codes
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
          code_hash TEXT PRIMARY KEY,
          grant JSONB NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;

      // Cache
      await sql`
        CREATE TABLE IF NOT EXISTS mcp_cache (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          expires_at TIMESTAMPTZ
        )
      `;
    })();
  }
  return mcpBootstrapped;
}

/**
 * MCP database functions using shared Neon connection.
 */
export const mcp = {
  /**
   * KV-like interface for shared SQL storage.
   */
  kv: {
    async set<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<void> {
      if (!sql) throw new Error("Database not configured");
      await bootstrapMCP();
      const expiresAt = options?.ttlSeconds
        ? new Date(Date.now() + options.ttlSeconds * 1000).toISOString()
        : null;
      await sql`
        INSERT INTO mcp_cache (key, value, expires_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${expiresAt})
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, expires_at = ${expiresAt}
      `;
    },

    async get<T>(key: string): Promise<T | null> {
      if (!sql) return null;
      await bootstrapMCP();
      const rows = (await sql`
        SELECT value FROM mcp_cache
        WHERE key = ${key} AND (expires_at IS NULL OR expires_at > NOW())
      `) as { value: T }[];
      if (rows.length === 0) {
        // Delete expired entry
        await sql`DELETE FROM mcp_cache WHERE key = ${key}`;
        return null;
      }
      return rows[0].value;
    },

    async del(key: string): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`DELETE FROM mcp_cache WHERE key = ${key}`;
    },

    async setIfAbsent<T>(key: string, value: T, options?: { ttlSeconds?: number }): Promise<boolean> {
      if (!sql) throw new Error("Database not configured");
      await bootstrapMCP();
      const expiresAt = options?.ttlSeconds
        ? new Date(Date.now() + options.ttlSeconds * 1000).toISOString()
        : null;
      const result = await sql`
        INSERT INTO mcp_cache (key, value, expires_at)
        VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${expiresAt})
        ON CONFLICT (key) DO NOTHING
      `;
      return (result.count ?? 0) > 0;
    },
  },

  /**
   * Tenant management.
   */
  tenants: {
    async create(slug: string, data: Record<string, unknown>): Promise<void> {
      if (!sql) throw new Error("Database not configured");
      await bootstrapMCP();
      await sql`
        INSERT INTO mcp_tenants (slug, name, email, exact_client_id, exact_client_secret_enc, twinfield_client_id, twinfield_client_secret_enc, twinfield_base_url, status)
        VALUES (
          ${slug},
          ${(data.name as string) || null},
          ${(data.email as string) || null},
          ${(data.exact_client_id as string) || null},
          ${(data.exact_client_secret_enc as string) || null},
          ${(data.twinfield_client_id as string) || null},
          ${(data.twinfield_client_secret_enc as string) || null},
          ${(data.twinfield_base_url as string) || null},
          'pending'
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          exact_client_id = EXCLUDED.exact_client_id,
          exact_client_secret_enc = EXCLUDED.exact_client_secret_enc,
          twinfield_client_id = EXCLUDED.twinfield_client_id,
          twinfield_client_secret_enc = EXCLUDED.twinfield_client_secret_enc,
          twinfield_base_url = EXCLUDED.twinfield_base_url
      `;
    },

    async get(slug: string): Promise<Record<string, unknown> | null> {
      if (!sql) return null;
      await bootstrapMCP();
      const rows = (await sql`SELECT * FROM mcp_tenants WHERE slug = ${slug}`) as Record<string, unknown>[];
      return rows.length > 0 ? rows[0] : null;
    },

    async list(): Promise<Record<string, unknown>[]> {
      if (!sql) return [];
      await bootstrapMCP();
      return (await sql`SELECT * FROM mcp_tenants ORDER BY created_at DESC`) as Record<string, unknown>[];
    },

    async approve(slug: string): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`UPDATE mcp_tenants SET status = 'approved', approved_at = NOW() WHERE slug = ${slug}`;
    },

    async delete(slug: string): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      // Delete dependent records first
      await sql`DELETE FROM mcp_exact_tokens WHERE tenant_slug = ${slug}`;
      await sql`DELETE FROM mcp_twinfield_tokens WHERE tenant_slug = ${slug}`;
      await sql`DELETE FROM mcp_tenants WHERE slug = ${slug}`;
    },
  },

  /**
   * Token management.
   */
  tokens: {
    async setExact(tenantSlug: string, userId: string, tokens: Record<string, unknown>): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`
        INSERT INTO mcp_exact_tokens (tenant_slug, user_id, access_token, refresh_token, expires_at, divisions)
        VALUES (
          ${tenantSlug},
          ${userId},
          ${(tokens.access_token as string) || null},
          ${(tokens.refresh_token as string) || null},
          ${(tokens.expires_at as number) || null},
          ${tokens.divisions ? JSON.stringify(tokens.divisions) : null}::jsonb
        )
        ON CONFLICT (tenant_slug, user_id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          divisions = EXCLUDED.divisions,
          updated_at = NOW()
      `;
    },

    async getExact(tenantSlug: string, userId: string): Promise<Record<string, unknown> | null> {
      if (!sql) return null;
      await bootstrapMCP();
      const rows = (await sql`
        SELECT * FROM mcp_exact_tokens
        WHERE tenant_slug = ${tenantSlug} AND user_id = ${userId}
      `) as Record<string, unknown>[];
      return rows.length > 0 ? rows[0] : null;
    },

    async setTwinfield(tenantSlug: string, userId: string, tokens: Record<string, unknown>): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`
        INSERT INTO mcp_twinfield_tokens (tenant_slug, user_id, access_token, refresh_token, expires_at, organisation_code)
        VALUES (
          ${tenantSlug},
          ${userId},
          ${(tokens.access_token as string) || null},
          ${(tokens.refresh_token as string) || null},
          ${(tokens.expires_at as number) || null},
          ${(tokens.organisation_code as string) || null}
        )
        ON CONFLICT (tenant_slug, user_id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          expires_at = EXCLUDED.expires_at,
          organisation_code = EXCLUDED.organisation_code,
          updated_at = NOW()
      `;
    },

    async getTwinfield(tenantSlug: string, userId: string): Promise<Record<string, unknown> | null> {
      if (!sql) return null;
      await bootstrapMCP();
      const rows = (await sql`
        SELECT * FROM mcp_twinfield_tokens
        WHERE tenant_slug = ${tenantSlug} AND user_id = ${userId}
      `) as Record<string, unknown>[];
      return rows.length > 0 ? rows[0] : null;
    },

    async deleteExact(tenantSlug: string, userId: string): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`DELETE FROM mcp_exact_tokens WHERE tenant_slug = ${tenantSlug} AND user_id = ${userId}`;
    },

    async deleteTwinfield(tenantSlug: string, userId: string): Promise<void> {
      if (!sql) return;
      await bootstrapMCP();
      await sql`DELETE FROM mcp_twinfield_tokens WHERE tenant_slug = ${tenantSlug} AND user_id = ${userId}`;
    },
  },
};

export { isDatabaseConfigured, sql };
