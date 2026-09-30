import { useId } from "react";
import { formatPercentage, rateScore } from "@/lib/quickscan/scoring";

export const TONE_COLORS: Record<string, string> = {
  low: "#DC2626",
  medium: "#DF7D3C",
  high: "#16A34A",
};

const TONE_LEGEND: { tone: "low" | "medium" | "high"; label: string }[] = [
  { tone: "low", label: "Laag" },
  { tone: "medium", label: "Gemiddeld" },
  { tone: "high", label: "Hoog" },
];

const TUBE_TOP = 34;
const TUBE_BOTTOM = 172;
const TUBE_LEFT = 40;
const TUBE_RIGHT = 80;
const TUBE_RADIUS = (TUBE_RIGHT - TUBE_LEFT) / 2;
const BULB_CENTER_Y = 172;
const BULB_RADIUS = 36;
const STEM_HALF_WIDTH = 8;

const TUBE_PATH_OPEN = `M ${TUBE_LEFT},${TUBE_BOTTOM} L ${TUBE_LEFT},${TUBE_TOP + TUBE_RADIUS} A ${TUBE_RADIUS},${TUBE_RADIUS} 0 0 1 ${TUBE_RIGHT},${TUBE_TOP + TUBE_RADIUS} L ${TUBE_RIGHT},${TUBE_BOTTOM}`;
const TUBE_PATH_CLOSED = `${TUBE_PATH_OPEN} Z`;

/**
 * Alleen de SVG-tekening (buis, bol, kwikkolom) — zonder label of legenda
 * eronder, zodat de resultaatpagina die apart naast de scoretekst kan
 * plaatsen. Tube en bol staan beide gecentreerd op x=60, dus de viewBox is
 * bewust symmetrisch daaromheen (geen asymmetrische versiering ernaast) —
 * anders oogt de tekening scheef in zijn eigen kader.
 */
export function ScoreThermometerGraphic({
  fraction,
  label,
  className,
}: {
  fraction: number;
  label: string;
  className?: string;
}) {
  const clipId = useId();
  const { tone } = rateScore(fraction);
  const color = TONE_COLORS[tone];

  // Volledige buishoogte (incl. de ronde kop) telt mee voor 0–100%, anders
  // oogt elk percentage te laag: de kop nam anders ~15% van de zichtbare
  // buis in beslag zonder ooit te vullen. De clip-path zorgt dat de rechte
  // kwikkolom netjes de ronde kop volgt in plaats van eroverheen te steken.
  const fillableHeight = TUBE_BOTTOM - TUBE_TOP;
  const clamped = Math.max(0, Math.min(1, fraction));
  const stemTop = TUBE_BOTTOM - clamped * fillableHeight;

  return (
    <svg
      viewBox="0 20 120 200"
      className={className ?? "h-56 w-auto"}
      role="img"
      aria-label={`${label}: ${formatPercentage(fraction)}`}
    >
      <clipPath id={clipId}>
        <path d={TUBE_PATH_CLOSED} />
      </clipPath>

      <path d={TUBE_PATH_OPEN} className="fill-surface" />

      {/* Kwik "rijst" bij het laden naar het echte percentage (@starting-style,
          zie .thermometer-fill in globals.css) — de buisvorm-clip zit op de
          <g>, de rijs-animatie op de <rect> zelf, want één element kan maar
          één clip-path hebben en deze twee moeten allebei gelden. */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={60 - STEM_HALF_WIDTH}
          y={stemTop}
          width={STEM_HALF_WIDTH * 2}
          height={BULB_CENTER_Y - stemTop + BULB_RADIUS}
          rx={STEM_HALF_WIDTH}
          fill={color}
          className="thermometer-fill"
        />
      </g>

      <path
        d={TUBE_PATH_OPEN}
        fill="none"
        className="stroke-foreground"
        strokeWidth={6}
        strokeLinecap="round"
      />
      <circle
        cx={60}
        cy={BULB_CENTER_Y}
        r={BULB_RADIUS}
        fill={color}
        className="stroke-foreground"
        strokeWidth={6}
      />

      <text
        x={60}
        y={BULB_CENTER_Y + 8}
        textAnchor="middle"
        className="thermometer-value fill-white text-2xl font-bold"
      >
        {formatPercentage(fraction)}
      </text>
    </svg>
  );
}

/** Laag/Gemiddeld/Hoog-legenda — losstaand zodat 'm ook naast in plaats van onder de tekening kan. */
export function ScoreLegend() {
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
      {TONE_LEGEND.map((item) => (
        <li key={item.tone} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: TONE_COLORS[item.tone] }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/**
 * Volledig staand exemplaar (tekening + label + legenda) — voor plekken waar
 * de thermometer zelf de hoofdweergave is, zoals de admin-drill-down.
 */
export function ScoreThermometer({
  fraction,
  label,
}: {
  fraction: number;
  label: string;
}) {
  const { tone } = rateScore(fraction);
  const color = TONE_COLORS[tone];

  return (
    <div className="flex flex-col items-center">
      <ScoreThermometerGraphic fraction={fraction} label={label} />
      <p className="mt-2 text-center text-sm font-semibold" style={{ color }}>
        {label}
      </p>
      <div className="mt-3">
        <ScoreLegend />
      </div>
    </div>
  );
}
