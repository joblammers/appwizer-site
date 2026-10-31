import type { Answers, ProfileAnswers, Scan } from "./types";

/** Tekstveld uit een onbetrouwbaar verzoek: alleen strings, getrimd en afgekapt. */
export function cleanString(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

/**
 * Antwoorden uit een verzoek: alleen bekende vraag-id's met een waarde die
 * een bestaande antwoordoptie van die vraag is. Zonder deze controle kan een
 * los API-verzoek scores boven 100% of onder 0% opslaan en zo de peer-
 * benchmark vervuilen.
 *
 * `strict`: ongeldige of onbekende invoer geeft null (voor de lead-API);
 * anders worden ongeldige items genegeerd (voor een gedeelde ?r=-link).
 */
export function sanitizeAnswers(scan: Scan, raw: unknown, strict: boolean): Answers | null {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return strict ? null : {};

  const input = raw as Record<string, unknown>;
  const answers: Answers = {};
  const known = new Set(scan.questions.map((q) => String(q.id)));

  for (const key of Object.keys(input)) {
    if (!known.has(key)) {
      if (strict) return null;
      continue;
    }
    const question = scan.questions.find((q) => String(q.id) === key);
    const value = input[key];
    const valid =
      typeof value === "number" && question?.options.some((option) => option.points === value);
    if (!valid) {
      if (strict) return null;
      continue;
    }
    answers[Number(key)] = value;
  }
  return answers;
}

const MAX_PROFILE_JSON = 10_000;

/** Profielantwoorden: object van strings of lijsten strings, met een bovengrens op de totale grootte. Ongeldig = null. */
export function sanitizeProfile(raw: unknown): ProfileAnswers | null {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const profile: ProfileAnswers = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key.length > 100) return null;
    if (typeof value === "string") {
      profile[key] = value.slice(0, 1000);
    } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      profile[key] = (value as string[]).slice(0, 50).map((v) => v.slice(0, 200));
    } else {
      return null;
    }
  }
  return JSON.stringify(profile).length > MAX_PROFILE_JSON ? null : profile;
}
