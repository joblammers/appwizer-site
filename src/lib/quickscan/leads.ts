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
