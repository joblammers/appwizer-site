import { isDatabaseConfigured, sql } from "@/lib/db";
import type { Scan } from "../types";
import { accountancyScan } from "./accountancy";
import { mkbScan } from "./mkb";

/**
 * De bestandsgebaseerde scans blijven de standaard: zonder database (de
 * meeste installaties van deze module) werkt de site precies als voorheen.
 * Zodra DATABASE_URL/POSTGRES_URL is gezet, wint de database — het admin-
 * paneel bewerkt dan deze rijen in plaats van de .ts-bestanden.
 */
export const defaultScans: Scan[] = [mkbScan, accountancyScan];

let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (!sql) return;
  if (!bootstrapped) {
    bootstrapped = (async () => {
      await sql`
        create table if not exists quickscan_scans (
          slug text primary key,
          data jsonb not null,
          updated_at timestamptz not null default now()
        )
      `;
      const [{ count }] = (await sql`
        select count(*)::int as count from quickscan_scans
      `) as { count: number }[];
      if (count > 0) return;
      for (const scan of defaultScans) {
        await sql`
          insert into quickscan_scans (slug, data)
          values (${scan.slug}, ${JSON.stringify(scan)}::jsonb)
          on conflict (slug) do nothing
        `;
      }
    })();
  }
  return bootstrapped;
}

export async function getScans(): Promise<Scan[]> {
  if (!isDatabaseConfigured || !sql) return defaultScans;
  try {
    await bootstrap();
    const rows = (await sql`
      select data from quickscan_scans order by slug
    `) as { data: Scan }[];
    return rows.map((row) => row.data);
  } catch {
    return defaultScans;
  }
}

export async function getScan(slug: string): Promise<Scan | undefined> {
  const scans = await getScans();
  return scans.find((scan) => scan.slug === slug);
}

/** Slaat een scan op (insert of update). Vereist een geconfigureerde database. */
export async function saveScan(scan: Scan, previousSlug?: string): Promise<void> {
  if (!isDatabaseConfigured || !sql) {
    throw new Error(
      "Geen database geconfigureerd — zet DATABASE_URL om scans te kunnen opslaan.",
    );
  }
  await bootstrap();
  if (previousSlug && previousSlug !== scan.slug) {
    await sql`delete from quickscan_scans where slug = ${previousSlug}`;
  }
  await sql`
    insert into quickscan_scans (slug, data, updated_at)
    values (${scan.slug}, ${JSON.stringify(scan)}::jsonb, now())
    on conflict (slug) do update set data = excluded.data, updated_at = now()
  `;
}

export async function deleteScan(slug: string): Promise<void> {
  if (!isDatabaseConfigured || !sql) {
    throw new Error(
      "Geen database geconfigureerd — zet DATABASE_URL om scans te kunnen verwijderen.",
    );
  }
  await bootstrap();
  await sql`delete from quickscan_scans where slug = ${slug}`;
}
