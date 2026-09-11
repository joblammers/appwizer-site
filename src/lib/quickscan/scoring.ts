import type {
  Answers,
  CategoryScore,
  Scan,
  ScanResult,
  Tier,
} from "./types";

/** Maximale punten per vraag. Vijf antwoorden, 0 t/m 4. */
export const MAX_POINTS_PER_QUESTION = 4;

/**
 * Bepaalt het niveau bij een score.
 *
 * De banden zijn gedefinieerd als 0–39%, 40–59%, 60–79% en 80–100%, maar een
 * werkelijke score is een veelvoud van 1/96 en valt dus regelmatig tussen twee
 * banden in (38/96 = 39,58%). Daarom wordt eerst afgerond op hele procenten —
 * zodat het getoonde percentage en het niveau altijd bij elkaar passen — en
 * vervolgens de hoogste band gekozen waarvan de ondergrens is gehaald.
 */
export function findTier(scan: Scan, percentage: number): Tier {
  const rounded = Math.round(percentage * 100) / 100;
  const ordered = [...scan.tiers].sort((a, b) => a.min - b.min);

  let match = ordered[0];
  for (const tier of ordered) {
    if (rounded >= tier.min) match = tier;
  }
  return match;
}

/**
 * Rekent een ingevulde scan door.
 *
 * De deelnemer ziet `percentage`: ongewogen, behaalde punten gedeeld door het
 * maximum. Dat is eenvoudig uit te leggen. `weightedPercentage` past de
 * categoriewegingen toe en is bedoeld voor het adviesgesprek.
 *
 * Onbeantwoorde vragen tellen als 0 punten maar wel mee in het maximum, zodat
 * een half ingevulde scan nooit een te rooskleurig beeld geeft.
 */
export function scoreScan(scan: Scan, answers: Answers): ScanResult {
  const categories: CategoryScore[] = scan.categories.map((category) => {
    const questions = scan.questions.filter((q) => q.category === category.code);
    const maxPoints = questions.length * MAX_POINTS_PER_QUESTION;
    const points = questions.reduce(
      (sum, q) => sum + (answers[q.id] ?? 0),
      0,
    );
    const percentage = maxPoints === 0 ? 0 : points / maxPoints;

    return {
      code: category.code,
      name: category.name,
      points,
      maxPoints,
      percentage,
      weight: category.weight,
      improvementPotential: (1 - percentage) * category.weight,
    };
  });

  const points = categories.reduce((sum, c) => sum + c.points, 0);
  const maxPoints = categories.reduce((sum, c) => sum + c.maxPoints, 0);
  const percentage = maxPoints === 0 ? 0 : points / maxPoints;
  const weightedPercentage = categories.reduce(
    (sum, c) => sum + c.percentage * c.weight,
    0,
  );

  const lowestCategory = categories.reduce((worst, c) =>
    c.improvementPotential > worst.improvementPotential ? c : worst,
  );

  return {
    points,
    maxPoints,
    percentage,
    weightedPercentage,
    tier: findTier(scan, percentage),
    categories,
    lowestCategory,
  };
}

export function formatPercentage(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
