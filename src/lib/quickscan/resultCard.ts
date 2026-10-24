import { rateScore, type ScoreRatingTone } from "./scoring";

/**
 * Kleuren van de drie scorebanden. Zelfde waarden als TONE_HEX in
 * components/site/hero-slides/HeroSlideOptimalisatie.tsx (daar niet
 * geëxporteerd en bewust niet aangeraakt); de band zelf komt uit rateScore().
 */
export const TONE_HEX: Record<ScoreRatingTone, string> = {
  low: "#CE2233",
  medium: "#DF7D3C",
  high: "#4CB949",
};

export const MAX_PROCESS_LENGTH = 60;
export const MAX_HOURS = 99;
export const MAX_AMOUNT = 999_999;

/** Tekens per regel in de tegel (13px vet in 156px breed); langer wordt afgekapt met "…". */
const LINE_CHARS = 20;

export interface ResultCardInput {
  percentage: number;
  hours: number;
  amount: number;
  process: string;
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Verwijdert tekens die in XML 1.0 niet mogen voorkomen (bv. NUL, besturingstekens) en klapt witruimte in. */
function cleanText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F-\u009F￾￿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, max: number): string {
  const chars = Array.from(text);
  return chars.length <= max ? text : `${chars.slice(0, max - 1).join("")}…`;
}

/** Verdeelt over maximaal twee regels op woordgrenzen; wat niet past wordt afgekapt met "…". */
export function splitProcessLines(process: string): string[] {
  const words = cleanText(process).split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";
  let i = 0;
  for (; i < words.length; i++) {
    const next = current ? `${current} ${words[i]}` : words[i];
    if (Array.from(next).length <= LINE_CHARS) {
      current = next;
    } else if (!current) {
      current = truncate(words[i], LINE_CHARS); // één woord dat nooit past
    } else if (lines.length === 0) {
      lines.push(current);
      current = "";
      i--; // woord opnieuw proberen op de tweede regel
    } else {
      break; // tweede regel vol, rest valt weg
    }
  }
  if (current) lines.push(current);
  if (i < words.length && lines.length > 0) {
    const last = lines.length - 1;
    if (!lines[last].endsWith("…")) lines[last] = truncate(`${lines[last]}…`, LINE_CHARS);
  }
  return lines;
}

const nlAmount = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });

export function formatAmount(amount: number): string {
  return `€ ${nlAmount.format(Math.round(amount))}`;
}

export type CardTheme = "light" | "dark";

/** Neutrale kleuren per thema; dezelfde waarden als de tokens in globals.css (--surface enz.). */
const PALETTES: Record<
  CardTheme,
  { card: string; track: string; tile: string; muted: string; strong: string; badgeBg: string; badgeFg: string }
> = {
  light: { card: "#F8FAFC", track: "#E2E8F0", tile: "#FFFFFF", muted: "#475569", strong: "#0F172A", badgeBg: "#E4EEF8", badgeFg: "#2E6AA6" },
  dark: { card: "#1E293B", track: "#334155", tile: "#0F172A", muted: "#94A3B8", strong: "#F8FAFC", badgeBg: "#2A3E58", badgeFg: "#A8CBEE" },
};

const BAR_X = 36;
const BAR_WIDTH = 408;

/**
 * Eén vaste stand van de quickscan-resultaatkaart (ontwerp: quickscan-animatie.svg).
 * Verwacht al gevalideerde invoer (zie route.ts).
 */
export function buildResultCardSvg(input: ResultCardInput, theme: CardTheme = "light"): string {
  const c = PALETTES[theme];
  const percentage = Math.min(100, Math.max(0, Math.round(input.percentage)));
  const hours = Math.round(input.hours);
  const tone = rateScore(percentage / 100).tone;
  const color = TONE_HEX[tone];

  const fillWidth = (BAR_WIDTH * percentage) / 100;
  const knobX = BAR_X + fillWidth;

  const labelFill = (t: ScoreRatingTone) => (t === tone ? c.strong : c.muted);

  const hoursText = `${hours} uur`;
  const amountText = formatAmount(input.amount);
  const lines = splitProcessLines(input.process);
  const processSvg = lines
    .map((line, i) => `<tspan x="56" y="${368 + i * 17}">${xmlEscape(line)}</tspan>`)
    .join("");

  const label = xmlEscape(
    `Quickscan-resultaat: ${percentage}% optimalisatiegraad, ${hoursText} per maand bespaard op ${lines.join(" ")}, ${amountText} geschatte besparing per jaar`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="884" viewBox="0 0 480 442" role="img" aria-label="${label}">
<style>text{font-family:'Plus Jakarta Sans','Helvetica Neue',Arial,sans-serif;font-variant-numeric:tabular-nums}</style>
<rect width="480" height="442" rx="24" fill="${c.card}"/>
<text x="36" y="58" font-size="13" font-weight="700" letter-spacing="1" fill="${c.muted}">QUICKSCAN RESULTAAT</text>
<rect x="364" y="38" width="80" height="28" rx="14" fill="${c.badgeBg}"/>
<text x="404" y="57" text-anchor="middle" font-size="13" font-weight="600" fill="${c.badgeFg}">Resultaat</text>
<text x="226" y="140" font-size="16" fill="${c.muted}">Jouw Administratie</text>
<text x="226" y="162" font-size="16" fill="${c.muted}">Optimalisatiegraad</text>
<text x="36" y="170" font-size="88" font-weight="800" letter-spacing="-3" fill="${color}">${percentage}%</text>
<rect x="${BAR_X}" y="214" width="${BAR_WIDTH}" height="12" rx="6" fill="${c.track}"/>
<rect x="${BAR_X}" y="214" width="${fillWidth.toFixed(2)}" height="12" rx="6" fill="${color}"/>
<rect x="198.2" y="214" width="2" height="12" fill="${c.card}"/>
<rect x="320.6" y="214" width="2" height="12" fill="${c.card}"/>
<circle cx="${knobX.toFixed(2)}" cy="220" r="8" fill="${color}" stroke="${c.card}" stroke-width="4"/>
<text x="117.6" y="252" text-anchor="middle" font-size="13" font-weight="600" fill="${labelFill("low")}">Laag</text>
<text x="260.4" y="252" text-anchor="middle" font-size="13" font-weight="600" fill="${labelFill("medium")}">Medium</text>
<text x="382.8" y="252" text-anchor="middle" font-size="13" font-weight="600" fill="${labelFill("high")}">Hoog</text>
<rect x="36" y="282" width="196" height="124" rx="16" fill="${c.tile}"/>
<rect x="248" y="282" width="196" height="124" rx="16" fill="${c.tile}"/>
<text x="56" y="324" font-size="28" font-weight="800" letter-spacing="-0.5" fill="${c.strong}">${xmlEscape(hoursText)}</text>
<text x="268" y="324" font-size="28" font-weight="800" letter-spacing="-0.5" fill="${c.strong}">${xmlEscape(amountText)}</text>
<text x="56" y="350" font-size="13" fill="${c.muted}">per maand bespaard op</text>
<text x="268" y="350" font-size="13" fill="${c.muted}">per jaar geschatte</text>
<text x="268" y="367" font-size="13" fill="${c.muted}">besparing</text>
<text font-size="13" font-weight="700" fill="${c.strong}">${processSvg}</text>
</svg>
`;
}
