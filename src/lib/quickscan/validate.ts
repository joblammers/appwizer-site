import type { Scan } from "./types";

/**
 * Dezelfde regels als in de README onder "Een scan aanpassen": elke vraag
 * heeft minstens twee antwoorden, met punten die bij het eerste antwoord op
 * 0 beginnen en daarna strikt oplopen (niet per se in stappen van 1 — de
 * punten zijn de weging per antwoord). De som van alle categoriewegingen is 1.
 */
export function validateScan(scan: Scan): string[] {
  const errors: string[] = [];

  if (!scan.slug.trim()) errors.push("Slug mag niet leeg zijn.");
  if (!/^[a-z0-9-]+$/.test(scan.slug)) {
    errors.push("Slug mag alleen kleine letters, cijfers en koppeltekens bevatten.");
  }
  if (!scan.title.trim()) errors.push("Titel mag niet leeg zijn.");
  if (scan.categories.length === 0) errors.push("Voeg minstens één categorie toe.");
  if (scan.tiers.length === 0) errors.push("Voeg minstens één niveau (tier) toe.");

  const categoryCodes = new Set(scan.categories.map((c) => c.code));
  const weightSum = scan.categories.reduce((sum, c) => sum + c.weight, 0);
  if (Math.abs(weightSum - 1) > 0.001) {
    errors.push(
      `De som van alle categoriewegingen moet 1 zijn (nu ${weightSum.toFixed(3)}).`,
    );
  }

  for (const question of scan.questions) {
    const label = `Vraag ${question.id}`;
    if (!categoryCodes.has(question.category)) {
      errors.push(`${label}: onbekende categorie "${question.category}".`);
    }
    if (question.options.length < 2) {
      errors.push(`${label}: moet minstens 2 antwoorden hebben (nu ${question.options.length}).`);
      continue;
    }
    const points = question.options.map((o) => o.points);
    if (points[0] !== 0) {
      errors.push(`${label}: het eerste antwoord moet 0 punten waard zijn.`);
    }
    if (points.some((p, i) => i > 0 && p <= points[i - 1])) {
      errors.push(`${label}: punten moeten strikt oplopen per antwoord.`);
    }
  }

  return errors;
}
