interface Bar {
  scanSlug: string;
  label: string;
  color: string;
  averagePercentage: number;
  totalLeads: number;
}

interface Props {
  bars: Bar[];
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD_LEFT = 32;
const PAD_BOTTOM = 28;
const PAD_TOP = 20;
const GAP = 24;

/**
 * Eén balk per scan met de gemiddelde totaalscore — een vergelijking tussen
 * scans is een magnitude-vraag ("welke scan scoort hoger"), geen
 * tijd-verloop-vraag, dus een staafdiagram past hier beter dan een lijn over
 * de tijd. Elke balk is direct gelabeld (percentage + naam), dus geen aparte
 * legenda nodig — dat is alleen verplicht zodra kleur de enige manier is om
 * een reeks te identificeren.
 */
export function ScanScoreChart({ bars }: Props) {
  const plotWidth = WIDTH - PAD_LEFT;
  const plotHeight = HEIGHT - PAD_BOTTOM - PAD_TOP;
  const barWidth = Math.min(64, (plotWidth - GAP * (bars.length - 1)) / bars.length);
  const totalBarsWidth = barWidth * bars.length + GAP * (bars.length - 1);
  const startX = PAD_LEFT + Math.max(0, (plotWidth - totalBarsWidth) / 2);

  function y(fraction: number): number {
    return PAD_TOP + plotHeight - fraction * plotHeight;
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-52 w-full"
      role="img"
      aria-label="Gemiddelde totaalscore per scan"
    >
      <line
        x1={PAD_LEFT}
        y1={y(0)}
        x2={WIDTH}
        y2={y(0)}
        className="stroke-border"
        strokeWidth={1}
      />
      <text x={0} y={y(0) + 4} className="fill-muted-foreground text-[10px]">
        0%
      </text>
      <text x={0} y={y(1) + 4} className="fill-muted-foreground text-[10px]">
        100%
      </text>

      {bars.map((bar, i) => {
        const x = startX + i * (barWidth + GAP);
        const barTop = y(bar.averagePercentage);
        const barHeight = y(0) - barTop;
        return (
          <g key={bar.scanSlug}>
            <rect
              x={x}
              y={barTop}
              width={barWidth}
              height={Math.max(barHeight, 0)}
              rx={4}
              fill={bar.color}
            />
            <text
              x={x + barWidth / 2}
              y={barTop - 6}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-semibold"
            >
              {Math.round(bar.averagePercentage * 100)}%
            </text>
            <text
              x={x + barWidth / 2}
              y={y(0) + 16}
              textAnchor="middle"
              className="fill-muted-foreground text-[10px]"
            >
              {bar.label.length > 14 ? `${bar.label.slice(0, 13)}…` : bar.label}
            </text>
            <text
              x={x + barWidth / 2}
              y={y(0) + 27}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {bar.totalLeads} {bar.totalLeads === 1 ? "lead" : "leads"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
