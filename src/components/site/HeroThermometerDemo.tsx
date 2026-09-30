"use client";

import { useEffect, useRef, useState } from "react";
import { rateScore } from "@/lib/quickscan/scoring";

const AUTO_CYCLE_MS = 30_000;

const heading = "font-[family-name:var(--font-space-grotesk)]";

interface Demo {
  percentage: number;
  hours: number;
  amount: number;
}

const DEFAULT_DEMO: Demo = { percentage: 0.45, hours: 12, amount: 2936 };

/** Hoe lager de score, hoe meer er nog te besparen valt — uren en euro's dalen dus mee omhoog naarmate het percentage lager is, nooit omgekeerd. */
const RANDOM_DEMOS: Demo[] = [
  { percentage: 0.24, hours: 28, amount: 6600 },
  { percentage: 0.33, hours: 22, amount: 5150 },
  { percentage: 0.41, hours: 18, amount: 4200 },
  { percentage: 0.58, hours: 10, amount: 2300 },
  { percentage: 0.71, hours: 6, amount: 1400 },
  { percentage: 0.86, hours: 3, amount: 700 },
];

/** Zelfde drieband als de legenda eronder (Laag/Medium/Hoog) — geen nieuwe kleuren erbij verzinnen. */
const TONE_HEX: Record<"low" | "medium" | "high", string> = {
  low: "#CE2233",
  medium: "#F07A1A",
  high: "#4CB949",
};

const TIER_ROW_Y = [178, 144, 110, 76, 42];
const MERCURY_TOP_Y = 44;
const MERCURY_BOTTOM_Y = 214;
const MERCURY_RANGE = MERCURY_BOTTOM_Y - MERCURY_TOP_Y;

function pickRandom(current: Demo): Demo {
  const options = RANDOM_DEMOS.filter((d) => d !== current);
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Marketing-mockup in de hero — geen echte scan, puur een voorbeeldresultaat.
 * Wisselt uit zichzelf elke 30s naar een andere realistische voorbeeldcombi
 * (percentage, uren en euro's horen bij elkaar, dus geen drie losse random
 * getallen) — ambient, net als een rondlopende statistiek, dus geen
 * "explanation"-purpose die per se stilstaat. Hoveren geeft daarnaast een
 * directe, instant wissel (feedback dat er iets te ontdekken valt) en pauzeert
 * de auto-cyclus zolang de cursor erop staat, zodat een waarde niet onder de
 * muis vandaan verandert; op mouse-leave gaat 'm terug naar de standaardwaarde
 * en hervat de cyclus daarna gewoon. Gegated op (hover: hover) and
 * (pointer: fine) — op touch geeft een tik anders een valse hover-in/-uit.
 * De auto-cyclus zelf slaat over bij prefers-reduced-motion: dat is
 * ongevraagde, doorlopende beweging, geen interactie-feedback.
 */
export function HeroThermometerDemo() {
  const [demo, setDemo] = useState<Demo>(DEFAULT_DEMO);
  const hoveredRef = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      if (hoveredRef.current) return;
      setDemo((current) => pickRandom(current));
    }, AUTO_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  function randomize() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    hoveredRef.current = true;
    setDemo((current) => pickRandom(current));
  }

  function reset() {
    hoveredRef.current = false;
    setDemo(DEFAULT_DEMO);
  }

  const { tone } = rateScore(demo.percentage);
  const color = TONE_HEX[tone];
  const mercuryY = MERCURY_BOTTOM_Y - demo.percentage * MERCURY_RANGE;
  const mercuryHeight = MERCURY_BOTTOM_Y - mercuryY;
  const rowIndex = Math.min(4, Math.floor(demo.percentage * 5));

  return (
    <div className="relative min-h-[340px]">
      <div
        onMouseEnter={randomize}
        onMouseLeave={reset}
        className="absolute inset-0 flex items-center justify-center gap-[clamp(20px,4vw,44px)] rounded-3xl bg-surface p-[clamp(24px,4vw,40px)]"
      >
        <svg
          viewBox="0 0 150 300"
          className="h-[min(280px,100%)] w-auto flex-none"
          aria-label={`Administratie Optimalisatiegraad ${Math.round(demo.percentage * 100)} procent`}
        >
          {TIER_ROW_Y.map((y, i) => (
            <rect
              key={y}
              x={112}
              y={y}
              width={30}
              height={11}
              rx={5.5}
              fill={i === rowIndex ? color : undefined}
              className={`transition-colors duration-300 ${i === rowIndex ? "" : "fill-border"}`}
            />
          ))}
          <path
            d="M52 30 h22 a14 14 0 0 1 14 14 v148 a14 14 0 0 1 -14 14 h-22 a14 14 0 0 1 -14 -14 v-148 a14 14 0 0 1 14 -14 z"
            className="fill-surface stroke-foreground"
            strokeWidth={11}
          />
          <circle
            cx={63}
            cy={232}
            r={46}
            className="fill-surface stroke-foreground"
            strokeWidth={11}
          />
          <rect
            x={57}
            y={mercuryY}
            width={12}
            height={mercuryHeight}
            fill={color}
            className="hero-thermometer-fill"
          />
          <circle cx={63} cy={232} r={33} fill={color} className="transition-colors duration-300" />
          <text
            x={63}
            y={243}
            textAnchor="middle"
            fontFamily="var(--font-space-grotesk), sans-serif"
            fontSize={27}
            fontWeight={700}
            fill="#fff"
          >
            {Math.round(demo.percentage * 100)}%
          </text>
        </svg>
        <div className="min-w-0">
          <div className="mb-2 text-xs font-bold tracking-[0.04em] text-muted-foreground">
            QUICKSCAN RESULTAAT
          </div>
          <div
            className={`text-[clamp(24px,3.2vw,32px)] leading-[1.1] font-bold text-foreground ${heading}`}
          >
            {demo.hours} uur / maand
          </div>
          <div className="mt-1.5 text-[13.5px] text-muted-foreground">
            bespaard op factuurverwerking
          </div>
          <div className={`mt-[22px] text-[22px] font-bold text-foreground ${heading}`}>
            € {demo.amount.toLocaleString("nl-NL")} / jaar
          </div>
          <div className="mt-1 text-xs font-semibold text-muted-foreground">
            geschatte besparing
          </div>
          <div className="mt-[22px] text-[13px] font-bold text-appwizer-orange">
            Jouw Administratie Optimalisatiegraad
          </div>
          <div className="mt-2.5 flex flex-wrap gap-3.5">
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="h-[11px] w-[11px] rounded-full bg-[#CE2233]" />
              Laag
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="h-[11px] w-[11px] rounded-full bg-[#F07A1A]" />
              Medium
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
              <span className="h-[11px] w-[11px] rounded-full bg-[#4CB949]" />
              Hoog
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
