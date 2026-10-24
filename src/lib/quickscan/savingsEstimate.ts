/**
 * Indicatieve besparing bij een score — op basis van de demogegevens uit de
 * hero (components/site/hero-slides/HeroSlideOptimalisatie.tsx): hoe lager de
 * score, hoe meer er te besparen valt. Geen echte berekening; tussen twee
 * demopunten wordt lineair geïnterpoleerd, buiten het bereik geldt het
 * dichtstbijzijnde punt.
 */
const DEMO_POINTS = [
  { percentage: 24, hours: 28, amount: 6600 },
  { percentage: 33, hours: 22, amount: 5150 },
  { percentage: 41, hours: 18, amount: 4200 },
  { percentage: 45, hours: 12, amount: 2936 },
  { percentage: 58, hours: 10, amount: 2300 },
  { percentage: 71, hours: 6, amount: 1400 },
  { percentage: 86, hours: 3, amount: 700 },
] as const;

export const DEMO_PROCESS = "factuurverwerking";

export interface SavingsEstimate {
  hours: number;
  amount: number;
}

/** `fraction` is 0–1, zoals ScanResult.percentage. */
export function estimateSavings(fraction: number): SavingsEstimate {
  const pct = Math.min(100, Math.max(0, fraction * 100));
  const first = DEMO_POINTS[0];
  const last = DEMO_POINTS[DEMO_POINTS.length - 1];
  if (pct <= first.percentage) return { hours: first.hours, amount: first.amount };
  if (pct >= last.percentage) return { hours: last.hours, amount: last.amount };

  const upperIndex = DEMO_POINTS.findIndex((p) => p.percentage >= pct);
  const lo = DEMO_POINTS[upperIndex - 1];
  const hi = DEMO_POINTS[upperIndex];
  const t = (pct - lo.percentage) / (hi.percentage - lo.percentage);
  return {
    hours: Math.round(lo.hours + (hi.hours - lo.hours) * t),
    amount: Math.round((lo.amount + (hi.amount - lo.amount) * t) / 10) * 10,
  };
}

export function resultCardUrl(
  fraction: number,
  theme: "light" | "dark" = "light",
  process: string = DEMO_PROCESS,
): string {
  const { hours, amount } = estimateSavings(fraction);
  const params = new URLSearchParams({
    percentage: String(Math.round(fraction * 100)),
    hours: String(hours),
    amount: String(amount),
    process,
    theme,
  });
  return `/api/quickscan/card?${params}`;
}
