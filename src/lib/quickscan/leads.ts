import { isDatabaseConfigured, sql } from "@/lib/db";
import type { Answers, CategoryScore, ProfileAnswers, ScanResult } from "./types";

let bootstrapped: Promise<void> | null = null;

/**
 * Naast de kolommen voor het eindresultaat ondersteunt de tabel ook een
 * "in behandeling"-rij: zodra de contactgegevens bekend zijn (vóór de
 * scorevragen) staat de lead al met completed=false in de tabel, zodat een
 * afgebroken scan zichtbaar blijft in /admin in plaats van spoorloos te
 * verdwijnen. saveLead() werkt die rij later bij tot completed=true.
 */
async function bootstrap(): Promise<void> {
  if (!sql) return;
  if (!bootstrapped) {
    bootstrapped = (async () => {
      await sql`
        create table if not exists quickscan_leads (
          id bigint generated always as identity primary key,
          scan_slug text not null,
          first_name text not null,
          email text not null,
          company text not null,
          phone text,
          percentage numeric,
          weighted_percentage numeric,
          tier text,
          lowest_category text,
          category_scores jsonb,
          profile jsonb not null default '{}'::jsonb,
          answers jsonb not null default '{}'::jsonb,
          completed boolean not null default false,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `;
      // Migratie voor tabellen van vóór "in behandeling"-leads: die rijen
      // waren altijd compleet (de oude opslaglogica bewaarde alleen
      // volledige scans), dus de default hier is bewust true.
      await sql`alter table quickscan_leads add column if not exists completed boolean not null default true`;
      await sql`alter table quickscan_leads add column if not exists updated_at timestamptz not null default now()`;
      await sql`alter table quickscan_leads alter column percentage drop not null`;
      await sql`alter table quickscan_leads alter column weighted_percentage drop not null`;
      await sql`alter table quickscan_leads alter column tier drop not null`;
      await sql`alter table quickscan_leads alter column lowest_category drop not null`;
      await sql`alter table quickscan_leads alter column category_scores drop not null`;
      await sql`alter table quickscan_leads alter column profile set default '{}'::jsonb`;
      await sql`alter table quickscan_leads alter column answers set default '{}'::jsonb`;
    })();
  }
  return bootstrapped;
}

interface StartLeadInput {
  scanSlug: string;
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  profile: ProfileAnswers;
}

/**
 * Legt de contactgegevens vast zodra ze bekend zijn, vóór de scorevragen.
 * Geeft de rij-id terug zodat saveLead() 'm later kan bijwerken in plaats van
 * een tweede rij aan te maken. Optioneel en stil: zonder database of bij een
 * fout blokkeert dit nooit de scanflow.
 */
export async function startLead(input: StartLeadInput): Promise<number | null> {
  if (!isDatabaseConfigured || !sql) return null;
  try {
    await bootstrap();
    const rows = (await sql`
      insert into quickscan_leads (scan_slug, first_name, email, company, phone, profile, completed)
      values (
        ${input.scanSlug}, ${input.firstName}, ${input.email}, ${input.company}, ${input.phone ?? null},
        ${JSON.stringify(input.profile)}::jsonb, false
      )
      returning id
    `) as { id: number }[];
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

interface SaveLeadInput {
  /** Id van een eerdere startLead()-rij om bij te werken; ontbreekt die (of bestaat de rij niet meer), dan volgt een nieuwe insert. */
  leadId?: number | null;
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

  if (input.leadId) {
    const updated = (await sql`
      update quickscan_leads set
        first_name = ${input.firstName},
        email = ${input.email},
        company = ${input.company},
        phone = ${input.phone ?? null},
        percentage = ${input.result.percentage},
        weighted_percentage = ${input.result.weightedPercentage},
        tier = ${input.result.tier.level},
        lowest_category = ${input.result.lowestCategory.name},
        category_scores = ${JSON.stringify(input.result.categories)}::jsonb,
        profile = ${JSON.stringify(input.profile)}::jsonb,
        answers = ${JSON.stringify(input.answers)}::jsonb,
        completed = true,
        updated_at = now()
      where id = ${input.leadId}
      returning id
    `) as { id: number }[];
    if (updated.length > 0) return;
  }

  await sql`
    insert into quickscan_leads (
      scan_slug, first_name, email, company, phone,
      percentage, weighted_percentage, tier, lowest_category,
      category_scores, profile, answers, completed
    ) values (
      ${input.scanSlug}, ${input.firstName}, ${input.email}, ${input.company}, ${input.phone ?? null},
      ${input.result.percentage}, ${input.result.weightedPercentage}, ${input.result.tier.level}, ${input.result.lowestCategory.name},
      ${JSON.stringify(input.result.categories)}::jsonb, ${JSON.stringify(input.profile)}::jsonb, ${JSON.stringify(input.answers)}::jsonb, true
    )
  `;
}

export interface ScanLeadStats {
  scanSlug: string;
  totalLeads: number;
  averagePercentage: number;
}

/**
 * Leadstatistieken per scan voor het admin-overzicht: totaal en gemiddelde
 * score, gebruikt voor de staafdiagramvergelijking tussen scans. Telt alleen
 * afgeronde scans mee — een in behandeling zijnde lead heeft nog geen score
 * om mee te wegen.
 */
export async function getLeadStatsByScan(): Promise<ScanLeadStats[]> {
  if (!isDatabaseConfigured || !sql) return [];
  try {
    await bootstrap();

    const totals = (await sql`
      select scan_slug, count(*)::int as total, avg(percentage)::float as avg_percentage
      from quickscan_leads
      where completed = true
      group by scan_slug
    `) as { scan_slug: string; total: number; avg_percentage: number }[];

    return totals.map((row) => ({
      scanSlug: row.scan_slug,
      totalLeads: row.total,
      averagePercentage: row.avg_percentage,
    }));
  } catch {
    return [];
  }
}

export interface LeadRow {
  id: number;
  scanSlug: string;
  company: string;
  completed: boolean;
  percentage: number | null;
  createdAt: string;
  categoryScores: CategoryScore[];
}

/**
 * Alle leads (nieuwste eerst) voor de tabel in /admin — inclusief nog niet
 * afgeronde scans (completed=false), zodat een afgehaakte deelnemer
 * zichtbaar blijft in plaats van onzichtbaar te verdwijnen.
 */
export async function getAllLeadRows(): Promise<LeadRow[]> {
  if (!isDatabaseConfigured || !sql) return [];
  try {
    await bootstrap();
    const rows = (await sql`
      select id, scan_slug, company, percentage::float as percentage, category_scores, completed, created_at
      from quickscan_leads
      order by created_at desc
    `) as {
      id: number;
      scan_slug: string;
      company: string;
      percentage: number | null;
      category_scores: CategoryScore[] | null;
      completed: boolean;
      created_at: string;
    }[];

    return rows.map((row) => ({
      id: row.id,
      scanSlug: row.scan_slug,
      company: row.company,
      completed: row.completed,
      percentage: row.percentage,
      createdAt: row.created_at,
      categoryScores: row.category_scores ?? [],
    }));
  } catch {
    return [];
  }
}

export interface LeadDetail {
  id: number;
  scanSlug: string;
  firstName: string;
  email: string;
  company: string;
  phone: string | null;
  completed: boolean;
  percentage: number | null;
  weightedPercentage: number | null;
  categoryScores: CategoryScore[];
  profile: ProfileAnswers;
  answers: Answers;
  createdAt: string;
}

/**
 * Eén ingevulde scan (de "entered scan") voor de admin-drill-down — niet het
 * scan-sjabloon (dat blijft bewerkbaar via /admin/[slug]). Kan een nog niet
 * afgeronde lead zijn: dan zijn percentage/weightedPercentage/categoryScores
 * leeg.
 */
export async function getLeadById(id: number): Promise<LeadDetail | null> {
  if (!isDatabaseConfigured || !sql) return null;
  try {
    await bootstrap();
    const rows = (await sql`
      select id, scan_slug, first_name, email, company, phone,
        percentage::float as percentage, weighted_percentage::float as weighted_percentage,
        category_scores, profile, answers, completed, created_at
      from quickscan_leads
      where id = ${id}
    `) as {
      id: number;
      scan_slug: string;
      first_name: string;
      email: string;
      company: string;
      phone: string | null;
      percentage: number | null;
      weighted_percentage: number | null;
      category_scores: CategoryScore[] | null;
      profile: ProfileAnswers;
      answers: Answers;
      completed: boolean;
      created_at: string;
    }[];

    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      scanSlug: row.scan_slug,
      firstName: row.first_name,
      email: row.email,
      company: row.company,
      phone: row.phone,
      completed: row.completed,
      percentage: row.percentage,
      weightedPercentage: row.weighted_percentage,
      categoryScores: row.category_scores ?? [],
      profile: row.profile,
      answers: row.answers,
      createdAt: row.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Gemiddelde score per categorie (code -> fractie 0–1) over alle afgeronde
 * inzendingen van déze scan — de "peergroup" waarmee een deelnemer zijn
 * eigen spiderweb-diagram kan vergelijken. Alleen completed=true telt mee:
 * een afgebroken scan heeft nog geen category_scores. Rekent zelf op de
 * server (JS, niet in SQL) omdat category_scores een jsonb-array is en het
 * aantal categorieën per scan verschilt.
 */
export async function getCategoryAverages(scanSlug: string): Promise<Record<string, number>> {
  if (!isDatabaseConfigured || !sql) return {};
  try {
    await bootstrap();
    const rows = (await sql`
      select category_scores
      from quickscan_leads
      where scan_slug = ${scanSlug} and completed = true
    `) as { category_scores: CategoryScore[] | null }[];

    const sums = new Map<string, { total: number; count: number }>();
    for (const row of rows) {
      for (const category of row.category_scores ?? []) {
        const entry = sums.get(category.code) ?? { total: 0, count: 0 };
        entry.total += category.percentage;
        entry.count += 1;
        sums.set(category.code, entry);
      }
    }

    const averages: Record<string, number> = {};
    for (const [code, { total, count }] of sums) {
      averages[code] = total / count;
    }
    return averages;
  } catch {
    return {};
  }
}
