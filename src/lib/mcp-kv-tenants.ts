import { isDatabaseConfigured, sql } from "@/lib/db";
import { escapeHtml } from "@/lib/escapeHtml";

/**
 * Leest/schrijft de échte MCP-aanmeldingen — niet via `mcp-db.ts`'s
 * `mcp_tenants`-tabel (die bestaat wel, maar niets schrijft er ooit naar),
 * maar via de `kv_store`-tabel: de losse exact-online-mcp-app (eol.appwizer.com)
 * is kennelijk omgezet van Upstash Redis naar deze gedeelde Postgres-database,
 * met exact hetzelfde sleutelschema als zijn oorspronkelijke `tenants.ts`
 * (`tenant:<slug>` per record, `tenants:index` voor de lijst met slugs). Dit
 * bestand spreekt die tabel aan met diezelfde sleutels, zodat een echte
 * aanmelding via eol.appwizer.com hier zichtbaar en goed te keuren is.
 */

export type KvTenantStatus = "pending" | "active" | "suspended";

export interface KvTenantRecord {
  slug: string;
  name: string;
  contactEmail: string;
  status: KvTenantStatus;
  exact?: { baseUrl: string; clientId: string };
  twinfield?: { baseUrl: string; clientId: string };
  allowedUsers: string[];
  ownerUserId: string | null;
  createdAt: string;
  approvedAt: string | null;
}

const INDEX_KEY = "tenants:index";
const recordKey = (slug: string) => `tenant:${slug}`;

const FROM = "Support | AppWizer <support@appwizer.com>";

/** Via Resend — zelfde account als de quickscan-mails. Mag een goedkeur-/pauzeer-/verwijderactie nooit laten mislukken: alleen loggen bij een fout. */
async function sendTenantMail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error(`[mcp-tenants] Resend ${res.status} bij versturen naar ${to}: ${await res.text()}`);
    }
  } catch (error) {
    console.error(`[mcp-tenants] mail versturen mislukt naar ${to}:`, error);
  }
}

function systemName(record: Pick<KvTenantRecord, "exact" | "twinfield">): string {
  if (record.exact) return "Exact Online";
  if (record.twinfield) return "Twinfield";
  return "je systeem";
}

/** Host waarop de connector-URL's draaien — zelfde domeinen als de kaarten op /mcp. Pas aan zodra het echte domein per systeem vaststaat. */
const CONNECTOR_HOST: Record<string, string> = {
  "Exact Online": "https://eol.appwizer.com",
  Twinfield: "https://twf.appwizer.com",
};

async function notifyApproved(record: KvTenantRecord): Promise<void> {
  if (!record.contactEmail) return;
  const system = systemName(record);
  const host = CONNECTOR_HOST[system];
  const connectorUrl = host ? `${host}/c/${record.slug}/mcp` : null;
  await sendTenantMail(
    record.contactEmail,
    `Je ${system}-koppeling met Claude is actief`,
    `<p>Hoi,</p>
     <p>Goed nieuws: de koppeling tussen ${system} van <strong>${escapeHtml(record.name)}</strong> en Claude is goedgekeurd.</p>
     ${
       connectorUrl
         ? `<p><strong>Zo voeg je hem toe in Claude</strong></p>
            <ol>
              <li>Ga naar Instellingen → Connectors → Custom connector toevoegen.</li>
              <li>Vul als URL in: <code style="background:#eef3f9;padding:2px 6px;border-radius:6px">${escapeHtml(connectorUrl)}</code></li>
              <li>Klik op Verbinden en log in bij ${system}.</li>
            </ol>`
         : `<p>We nemen op korte termijn contact met je op met de connector-URL.</p>`
     }
     <p>Vragen? Beantwoord deze mail of schrijf naar support@appwizer.com.</p>`,
  );
}

async function notifySuspended(record: KvTenantRecord): Promise<void> {
  if (!record.contactEmail) return;
  const system = systemName(record);
  await sendTenantMail(
    record.contactEmail,
    `Je ${system}-koppeling met Claude is gepauzeerd`,
    `<p>Hoi,</p>
     <p>De koppeling tussen ${system} van <strong>${escapeHtml(record.name)}</strong> en Claude is zojuist gepauzeerd. De connector werkt tot nader order niet meer.</p>
     <p>Vragen hierover? Beantwoord deze mail of schrijf naar support@appwizer.com.</p>`,
  );
}

async function notifyDeleted(record: KvTenantRecord): Promise<void> {
  if (!record.contactEmail) return;
  const system = systemName(record);
  await sendTenantMail(
    record.contactEmail,
    `Je aanmelding voor de ${system}-koppeling is verwijderd`,
    `<p>Hoi,</p>
     <p>De aanmelding voor de ${system}-koppeling van <strong>${escapeHtml(record.name)}</strong> met Claude is verwijderd.</p>
     <p>Had je dit niet verwacht, of wil je je opnieuw aanmelden? Beantwoord deze mail of schrijf naar support@appwizer.com.</p>`,
  );
}

async function getIndex(): Promise<string[]> {
  if (!sql) return [];
  const rows = (await sql`select value from kv_store where key = ${INDEX_KEY}`) as { value: string[] }[];
  return rows.length > 0 ? rows[0].value : [];
}

/** Haalt alleen de velden op die de admin nodig heeft — nooit het versleutelde secret. */
function toPublicRecord(raw: Record<string, unknown>): KvTenantRecord {
  return {
    slug: String(raw.slug),
    name: String(raw.name),
    contactEmail: String(raw.contactEmail ?? ""),
    status: raw.status === "active" || raw.status === "suspended" ? raw.status : "pending",
    exact: raw.exact
      ? { baseUrl: String((raw.exact as Record<string, unknown>).baseUrl), clientId: String((raw.exact as Record<string, unknown>).clientId) }
      : undefined,
    twinfield: raw.twinfield
      ? { baseUrl: String((raw.twinfield as Record<string, unknown>).baseUrl), clientId: String((raw.twinfield as Record<string, unknown>).clientId) }
      : undefined,
    allowedUsers: Array.isArray(raw.allowedUsers) ? (raw.allowedUsers as string[]) : [],
    ownerUserId: (raw.ownerUserId as string) ?? null,
    createdAt: String(raw.createdAt),
    approvedAt: (raw.approvedAt as string) ?? null,
  };
}

export async function listKvTenants(): Promise<KvTenantRecord[]> {
  if (!isDatabaseConfigured || !sql) return [];
  const slugs = await getIndex();
  if (slugs.length === 0) return [];
  const keys = slugs.map(recordKey);
  const rows = (await sql`
    select value from kv_store where key = any(${keys})
  `) as { value: Record<string, unknown> }[];
  return rows
    .map((r) => toPublicRecord(r.value))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function approveKvTenant(slug: string): Promise<void> {
  if (!isDatabaseConfigured || !sql) return;
  const rows = (await sql`select value from kv_store where key = ${recordKey(slug)}`) as {
    value: Record<string, unknown>;
  }[];
  if (rows.length === 0) return;
  const record = rows[0].value;
  record.status = "active";
  record.approvedAt = new Date().toISOString();
  await sql`update kv_store set value = ${JSON.stringify(record)}::jsonb where key = ${recordKey(slug)}`;
  await notifyApproved(toPublicRecord(record));
}

export async function suspendKvTenant(slug: string): Promise<void> {
  if (!isDatabaseConfigured || !sql) return;
  const rows = (await sql`select value from kv_store where key = ${recordKey(slug)}`) as {
    value: Record<string, unknown>;
  }[];
  if (rows.length === 0) return;
  const record = rows[0].value;
  record.status = "suspended";
  await sql`update kv_store set value = ${JSON.stringify(record)}::jsonb where key = ${recordKey(slug)}`;
  await notifySuspended(toPublicRecord(record));
}

export async function deleteKvTenant(slug: string): Promise<void> {
  if (!isDatabaseConfigured || !sql) return;
  const rows = (await sql`select value from kv_store where key = ${recordKey(slug)}`) as {
    value: Record<string, unknown>;
  }[];
  await sql`delete from kv_store where key = ${recordKey(slug)}`;
  const slugs = await getIndex();
  const next = slugs.filter((s) => s !== slug);
  await sql`update kv_store set value = ${JSON.stringify(next)}::jsonb where key = ${INDEX_KEY}`;
  if (rows.length > 0) await notifyDeleted(toPublicRecord(rows[0].value));
}
