interface Series {
  scanSlug: string;
  label: string;
  color: string;
  dailyCounts: { date: string; count: number }[];
}

interface Props {
  series: Series[];
}

const DAYS = 30;
const WIDTH = 600;
const HEIGHT = 140;
const PAD_LEFT = 28;
const PAD_BOTTOM = 8;

/** Vult de laatste 30 kalenderdagen aan met 0 waar geen rijen zijn — anders springt de lijn over gaten heen. */
function last30Days(dailyCounts: { date: string; count: number }[]): number[] {
  const byDate = new Map(dailyCounts.map((d) => [d.date, d.count]));
  const today = new Date();
  const values: number[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    values.push(byDate.get(key) ?? 0);
  }
  return values;
}

/**
 * Eén lijn per scan, laatste 30 dagen — meerdere series dus vaste
 * categorische kleuren (nooit gecycled) en altijd een legenda met precieze
 * tellingen; de lijn zelf laat vooral de vorm/trend zien.
 */
export function LeadTrendChart({ series }: Props) {
  const seriesValues = series.map((s) => ({ ...s, values: last30Days(s.dailyCounts) }));
  const max = Math.max(1, ...seriesValues.flatMap((s) => s.values));
  const plotWidth = WIDTH - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_BOTTOM;

  function pathFor(values: number[]): string {
    return values
      .map((v, i) => {
        const x = PAD_LEFT + (i / (DAYS - 1)) * plotWidth;
        const y = plotHeight - (v / max) * (plotHeight - 4) - 2;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-40 w-full"
      role="img"
      aria-label="Aantal complete scans per dag per scan, laatste 30 dagen"
    >
      {/* Y-as: 0 en max, hairline en recessief */}
      <line x1={PAD_LEFT} y1={plotHeight - 2} x2={WIDTH} y2={plotHeight - 2} className="stroke-border" strokeWidth={1} />
      <text x={0} y={plotHeight} className="fill-muted-foreground text-[10px]">0</text>
      <text x={0} y={10} className="fill-muted-foreground text-[10px]">{max}</text>

      {seriesValues.map((s) => (
        <path
          key={s.scanSlug}
          d={pathFor(s.values)}
          fill="none"
          stroke={s.color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
