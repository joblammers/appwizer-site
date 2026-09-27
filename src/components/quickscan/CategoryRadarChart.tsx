import type { CategoryScore } from "@/lib/quickscan/types";

interface Props {
  categories: CategoryScore[];
  lowestCode: string;
  className?: string;
  /** Grotere, vetgedrukte aslabels en meer canvasmarge — voor de modal. */
  large?: boolean;
  onClick?: () => void;
  /** Gemiddelde score per categoriecode van andere deelnemers van déze scan — toont een tweede, gestippelde lijn ter vergelijking. Ontbreekt een categorie (bv. net toegevoegd, nog geen peers), dan wordt de vergelijkingslijn helemaal weggelaten in plaats van een misleidende gedeeltelijke vorm. */
  peerScores?: Record<string, number>;
}

const RADIUS = 100;
const RING_FRACTIONS = [0.25, 0.5, 0.75, 1];

function point(center: number, angle: number, fraction: number) {
  return {
    x: center + RADIUS * fraction * Math.cos(angle),
    y: center + RADIUS * fraction * Math.sin(angle),
  };
}

function polygonPoints(center: number, angles: number[], fractions: number[]) {
  return angles
    .map((angle, i) => point(center, angle, fractions[i]))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
}

/** Breekt een lange categorienaam in maximaal drie regels op woordgrenzen. */
function wrapLabel(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
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
 * Spiderweb/radar-diagram van de categoriescores. Met peerScores erbij komt
 * er een tweede (gestippelde) lijn voor de gemiddelde score van andere
 * deelnemers van déze scan — dan hoort er ook een legenda bij (twee series),
 * die de aanroeper (ScanResult.tsx) los onder de chart rendert. Zonder
 * peerScores blijft het bij één serie en dus geen legenda nodig.
 */
export function CategoryRadarChart({
  categories,
  lowestCode,
  className,
  large,
  onClick,
  peerScores,
}: Props) {
  const n = categories.length;
  if (n < 3) return null;

  const hasPeerData =
    peerScores != null && categories.every((c) => peerScores[c.code] != null);
  const peerFractions = hasPeerData
    ? categories.map((c) => Math.max(0, Math.min(1, peerScores[c.code])))
    : null;

  // Grotere weergave krijgt extra canvasmarge, anders lopen de dikkere,
  // grotere labels tegen de rand van de viewBox aan (zelfde probleem als bij
  // de eerste versie van dit diagram, nu vermeden door meer ruimte te geven
  // in plaats van de labels te verkleinen).
  const size = large ? 560 : 460;
  const center = size / 2;
  const labelRadius = RADIUS * (large ? 1.4 : 1.35);
  const maxLabelChars = large ? 14 : 12;
  const labelClassName = large
    ? "fill-muted-foreground text-[16px] font-bold"
    : "fill-muted-foreground text-[10px]";

  const angles = categories.map((_, i) => (2 * Math.PI * i) / n - Math.PI / 2);
  const dataFractions = categories.map((c) => Math.max(0, Math.min(1, c.percentage)));

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={[className ?? "mx-auto w-full max-w-sm", onClick ? "cursor-pointer" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role="img"
      aria-label={
        hasPeerData
          ? "Spiderweb-diagram van jouw score per categorie vergeleken met het gemiddelde van andere deelnemers — exacte percentages staan in de lijst hieronder"
          : "Spiderweb-diagram van de score per categorie — exacte percentages staan in de lijst hieronder"
      }
    >
      {/* Grid: concentrische ringen, hairline, recessief */}
      {RING_FRACTIONS.map((fraction) => (
        <polygon
          key={fraction}
          points={polygonPoints(center, angles, angles.map(() => fraction))}
          className="fill-none stroke-border"
          strokeWidth={1}
        />
      ))}

      {/* Assen vanuit het midden */}
      {angles.map((angle, i) => {
        const outer = point(center, angle, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={outer.x}
            y2={outer.y}
            className="stroke-border"
            strokeWidth={1}
          />
        );
      })}

      {/* Peergroup: gemiddelde van andere deelnemers, gestippeld en achter de eigen score */}
      {peerFractions && (
        <>
          <polygon
            points={polygonPoints(center, angles, peerFractions)}
            className="fill-none stroke-appwizer-blue"
            strokeWidth={2}
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
          {peerFractions.map((fraction, i) => {
            const p = point(center, angles[i], fraction);
            return (
              <circle
                key={categories[i].code}
                cx={p.x}
                cy={p.y}
                r={3}
                className="fill-surface stroke-appwizer-blue"
                strokeWidth={2}
              />
            );
          })}
        </>
      )}

      {/* Data: gevulde polygon van de behaalde scores */}
      <polygon
        points={polygonPoints(center, angles, dataFractions)}
        className="fill-appwizer-orange/10 stroke-appwizer-orange"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {categories.map((category, i) => {
        const p = point(center, angles[i], dataFractions[i]);
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
        const labelPoint = point(center, angle, labelRadius / RADIUS);
        const lines = wrapLabel(category.name, maxLabelChars);
        const dominantBaseline = Math.sin(angle) < -0.5 ? "auto" : Math.sin(angle) > 0.5 ? "hanging" : "middle";
        return (
          <text
            key={category.code}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor={labelAnchor(angle)}
            dominantBaseline={dominantBaseline}
            className={labelClassName}
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
