import { formatPercentage, rateScore } from "@/lib/quickscan/scoring";
import { TONE_COLORS } from "./ScoreThermometer";

/**
 * Percentage + Laag/Gemiddeld/Hoog in één gekleurd blokje — vaste
 * statuskleuren (zelfde als de thermometer), niet de continue
 * rood-groen-gradient van de antwoorddrill-down.
 */
export function ScoreBadge({ fraction }: { fraction: number }) {
  const { label, tone } = rateScore(fraction);
  return (
    <div
      className="flex w-16 shrink-0 flex-col items-center justify-center rounded-lg py-1 leading-tight"
      style={{ backgroundColor: TONE_COLORS[tone] }}
    >
      <span className="text-sm font-bold text-white">{formatPercentage(fraction)}</span>
      <span className="text-[10px] font-medium text-white/90">{label}</span>
    </div>
  );
}
