import { isDatabaseConfigured, sql } from "@/lib/db";

let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (!sql) return;
  if (!bootstrapped) {
    bootstrapped = (async () => {
      await sql`
        create table if not exists rate_limits (
          key text not null,
          bucket bigint not null,
          count int not null default 0,
          expires_at timestamptz not null,
          primary key (key, bucket)
        )
      `;
    })();
  }
  return bootstrapped;
}

/**
 * Vaste-venster rate limiter op de bestaande Postgres-database (serverless
 * instanties delen geen geheugen, dus in-memory telt niet). Geeft true terwijl
 * de aanroeper binnen de limiet blijft. Faalt open — zonder database of bij
 * een databasefout wordt niets geblokkeerd, zodat de leadflow nooit stuk gaat
 * door de limiter zelf.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  if (!isDatabaseConfigured || !sql) return true;
  try {
    await bootstrap();
    const bucket = Math.floor(Date.now() / 1000 / windowSeconds);
    const rows = (await sql`
      insert into rate_limits (key, bucket, count, expires_at)
      values (${key}, ${bucket}, 1, now() + (${windowSeconds * 2} * interval '1 second'))
      on conflict (key, bucket) do update set count = rate_limits.count + 1
      returning count
    `) as { count: number }[];
    if (Math.random() < 0.02) {
      await sql`delete from rate_limits where expires_at < now()`;
    }
    return (rows[0]?.count ?? 1) <= limit;
  } catch {
    return true;
  }
}

/** Client-IP achter Vercel's proxy (die x-forwarded-for zelf zet). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}
