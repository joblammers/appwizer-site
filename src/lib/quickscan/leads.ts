import { isDatabaseConfigured, sql } from "@/lib/db";
import type { Answers, ProfileAnswers, ScanResult } from "./types";

let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (!sql) return;
  if (!bootstrapped) {
    bootstrapped = sql`
      create table if not exists quickscan_leads (
        id bigint generated always as identity primary key,
        scan_slug text not null,
        first_name text not null,
        email text not null,
        company text not null,
        phone text,
        percentage numeric not null,
        weighted_percentage numeric not null,
        tier text not null,
        lowest_category text not null,
        category_scores jsonb not null,
        profile jsonb not null,
        answers jsonb not null,
        created_at timestamptz not null default now()
      )
    `.then(() => undefined);
  }
  return bootstrapped;
}

interface SaveLeadInput {
  scanSlug: string;
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  result: ScanResult;
  profile: ProfileAnswers;
  answers: Answers;
}

/**
 * Bewaart de ingevulde antwoorden en het uitgerekende resultaat.
 * Net als de webhook en de e-mail: optioneel, en faalt nooit de leadflow —
 * zonder DATABASE_URL/POSTGRES_URL is dit een stille no-op.
 */
export async function saveLead(input: SaveLeadInput): Promise<void> {
  if (!isDatabaseConfigured || !sql) return;
  await bootstrap();

  await sql`
    insert into quickscan_leads (
      scan_slug, first_name, email, company, phone,
      percentage, weighted_percentage, tier, lowest_category,
      category_scores, profile, answers
    ) values (
      ${input.scanSlug}, ${input.firstName}, ${input.email}, ${input.company}, ${input.phone ?? null},
      ${input.result.percentage}, ${input.result.weightedPercentage}, ${input.result.tier.level}, ${input.result.lowestCategory.name},
      ${JSON.stringify(input.result.categories)}::jsonb, ${JSON.stringify(input.profile)}::jsonb, ${JSON.stringify(input.answers)}::jsonb
    )
  `;
}

export interface ScanLeadStats {
  scanSlug: string;
  totalLeads: number;
  averagePercentage: number;
  /** Aantal complete scans per dag, laatste 30 dagen — voor de trendlijn in /admin. */
  dailyCounts: { date: string; count: number }[];
}

/**
 * Leadstatistieken per scan voor het admin-overzicht: totaal, gemiddelde
 * score en een dagelijkse trend over de laatste 30 dagen. Alleen complete
 * scans staan in deze tabel (zie de check in de lead-route), dus dit telt
 * vanzelf alleen bruikbare inzendingen.
 */
export async function getLeadStatsByScan(): Promise<ScanLeadStats[]> {
  if (!isDatabaseConfigured || !sql) return [];
  try {
    await bootstrap();

    const totals = (await sql`
      select scan_slug, count(*)::int as total, avg(percentage)::float as avg_percentage
      from quickscan_leads
      group by scan_slug
    `) as { scan_slug: string; total: number; avg_percentage: number }[];

    if (totals.length === 0) return [];

    const daily = (await sql`
      select scan_slug, to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as date, count(*)::int as count
      from quickscan_leads
      where created_at >= now() - interval '30 days'
      group by scan_slug, date_trunc('day', created_at)
      order by date_trunc('day', created_at)
    `) as { scan_slug: string; date: string; count: number }[];

    return totals.map((row) => ({
      scanSlug: row.scan_slug,
      totalLeads: row.total,
      averagePercentage: row.avg_percentage,
      dailyCounts: daily
        .filter((d) => d.scan_slug === row.scan_slug)
        .map((d) => ({ date: d.date, count: d.count })),
    }));
  } catch {
    return [];
  }
}
