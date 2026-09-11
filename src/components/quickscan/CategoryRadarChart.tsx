import type { CategoryScore } from "@/lib/quickscan/types";

interface Props {
  categories: CategoryScore[];
  lowestCode: string;
}

const SIZE = 460;
const CENTER = SIZE / 2;
const RADIUS = 100;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];
const LABEL_RADIUS = RADIUS * 1.35;
const MAX_LABEL_CHARS = 12;

function point(angle: number, fraction: number) {
  return {
    x: CENTER + RADIUS * fraction * Math.cos(angle),
    y: CENTER + RADIUS * fraction * Math.sin(angle),
  };
}

function polygonPoints(angles: number[], fractions: number[]) {
  return angles.map((angle, i) => point(angle, fractions[i])).map((p) => `${p.x},${p.y}`).join(" ");
}

/** Breekt een lange categorienaam in maximaal drie regels op woordgrenzen. */
function wrapLabel(text: string): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > MAX_LABEL_CHARS && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function labelAnchor(angle: number): "start" | "middle" | "end" {
  const cos = Math.cos(angle);
  if (cos > 0.3) return "start";
  if (cos < -0.3) return "end";
  return "middle";
}

/**
 * Spiderweb/radar-diagram van de categoriescores — één serie, dus geen
 * legenda nodig (de kop erboven noemt al wat er getoond wordt). De exacte
 * percentages staan in de lijst eronder; dit diagram laat vooral de vorm
 * (sterke/zwakke onderdelen) in één oogopslag zien.
 */
export function CategoryRadarChart({ categories, lowestCode }: Props) {
  const n = categories.length;
  if (n < 3) return null;

  const angles = categories.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
  const dataFractions = categories.map((c) => Math.max(0, Math.min(1, c.percentage)));

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-sm"
      role="img"
      aria-label="Spiderweb-diagram van de score per categorie — exacte percentages staan in de lijst hieronder"
    >
      {/* Grid: concentrische ringen, hairline, recessief */}
      {RING_FRACTIONS.map((fraction) => (
        <polygon
          key={fraction}
          points={polygonPoints(angles, angles.map(() => fraction))}
          className="fill-none stroke-border"
          strokeWidth={1}
        />
      ))}

      {/* Assen vanuit het midden */}
      {angles.map((angle, i) => {
        const outer = point(angle, 1);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={outer.x}
            y2={outer.y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {/* Data: gevulde polygon van de behaalde scores */}
      <polygon
        points={polygonPoints(angles, dataFractions)}
        className="fill-appwizer-orange/10 stroke-appwizer-orange"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {categories.map((category, i) => {
        const p = point(angles[i], dataFractions[i]);
        const isLowest = category.code === lowestCode;
        return (
          <circle
            key={category.code}
            cx={p.x}
            cy={p.y}
            r={isLowest ? 5 : 4}
            className="fill-appwizer-orange stroke-surface"
            strokeWidth={2}
          />
        );
      })}

      {/* Labels: categorienaam per as, tot drie regels */}
      {categories.map((category, i) => {
        const angle = angles[i];
        const labelPoint = point(angle, LABEL_RADIUS / RADIUS);
        const lines = wrapLabel(category.name);
        const dominantBaseline = Math.sin(angle) < -0.5 ? "auto" : Math.sin(angle) > 0.5 ? "hanging" : "middle";
        return (
          <text
            key={category.code}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor={labelAnchor(angle)}
            dominantBaseline={dominantBaseline}
            className="fill-muted-foreground text-[10px]"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={labelPoint.x} dy={li === 0 ? 0 : "1.15em"}>
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </svg>
  );
}
