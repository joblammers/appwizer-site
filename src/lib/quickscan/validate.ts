import type { Scan } from "./types";

/**
 * Dezelfde regels als in de README onder "Een scan aanpassen": elke vraag
 * heeft exact vijf antwoorden met punten 0 t/m 4 in oplopende volgorde, en de
 * som van alle categoriewegingen is 1.
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
    if (question.options.length !== 5) {
      errors.push(`${label}: moet exact 5 antwoorden hebben (nu ${question.options.length}).`);
      continue;
    }
    const points = question.options.map((o) => o.points);
    const expected = [0, 1, 2, 3, 4];
    if (points.some((p, i) => p !== expected[i])) {
      errors.push(`${label}: punten moeten oplopend 0, 1, 2, 3, 4 zijn.`);
    }
  }

  return errors;
}
