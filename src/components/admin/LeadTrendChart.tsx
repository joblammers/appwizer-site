interface Props {
  dailyCounts: { date: string; count: number }[];
}

const DAYS = 30;
const WIDTH = 280;
const HEIGHT = 56;

/** Vult de laatste 30 kalenderdagen aan met 0 waar geen rijen zijn — anders springt de lijn over gaten heen. */
function last30Days(dailyCounts: { date: string; count: number }[]): number[] {
  const byDate = new Map(dailyCounts.map((d) => [d.date, d.count]));
  const today = new Date();
  const series: number[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    series.push(byDate.get(key) ?? 0);
  }
  return series;
}

/** Sparkline van complete scans per dag, laatste 30 dagen — één serie, dus één vaste kleur (geen legenda nodig). */
export function LeadTrendChart({ dailyCounts }: Props) {
  const series = last30Days(dailyCounts);
  const max = Math.max(1, ...series);

  const points = series.map((count, i) => {
    const x = (i / (DAYS - 1)) * WIDTH;
    const y = HEIGHT - (count / max) * (HEIGHT - 4) - 2;
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-14 w-full"
      role="img"
      aria-label="Aantal complete scans per dag, laatste 30 dagen"
    >
      <path d={areaPath} className="fill-appwizer-blue/10" />
      <path d={linePath} className="fill-none stroke-appwizer-blue" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
