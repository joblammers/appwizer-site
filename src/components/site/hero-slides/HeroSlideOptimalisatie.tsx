"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QuickscanModalButton } from "@/components/QuickscanModalButton";
import type { Scan } from "@/lib/quickscan/types";

const jakarta = "font-[family-name:var(--font-plus-jakarta)]";

const AUTO_CYCLE_MS = 5_000;

interface Demo {
  percentage: number;
  hours: number;
  amount: number;
}

const DEFAULT_DEMO: Demo = { percentage: 45, hours: 12, amount: 2936 };

/** Zelfde idee als de vorige HeroThermometerDemo: hoe lager het percentage, hoe meer er te besparen valt — uren/euro's lopen dus mee omhoog. */
const RANDOM_DEMOS: Demo[] = [
  { percentage: 24, hours: 28, amount: 6600 },
  { percentage: 33, hours: 22, amount: 5150 },
  { percentage: 41, hours: 18, amount: 4200 },
  { percentage: 45, hours: 12, amount: 2936 },
  { percentage: 58, hours: 10, amount: 2300 },
  { percentage: 71, hours: 6, amount: 1400 },
  { percentage: 86, hours: 3, amount: 700 },
];

const DEFAULT_PROCESS = "factuurverwerking";

/** Onafhankelijk van de percentage/uren/euro-combi — wisselt apart random mee, zodat niet elke wissel toevallig weer over hetzelfde proces gaat. */
const RANDOM_PROCESSES = [
  "factuurverwerking",
  "bankafschriften verwerking",
  "creditcard verwerking",
  "debiteurenbeheer",
  "orderverwerking & 3-way matching",
  "salarisverwerking","abonnementenbeheer",
  "inkoop & voorraadbeheer",
  "projectadministratie",
  "urenregistratie",
  "verkopen & offertes",
  "urenregistratie",
];

function pickRandom<T>(options: readonly T[], current: T): T {
  const rest = options.filter((o) => o !== current);
  return rest[Math.floor(Math.random() * rest.length)];
}

/** Laag→Hoog loopt van rood naar groen, met het AppWizer-oranje (#DF7D3C) als middentint — zelfde drieband als rateScore() in lib/quickscan/scoring. */
const TONE_HEX = { low: "#CE2233", medium: "#DF7D3C", high: "#4CB949" } as const;

function toneFor(percentage: number): keyof typeof TONE_HEX {
  if (percentage < 40) return "low";
  if (percentage < 70) return "medium";
  return "high";
}

/**
 * Slide 1/3 van de hero-carrousel — overgenomen uit Job's Claude Design-canvas
 * ("1 · Optimalisatie"). Kleurenschema omgezet naar het AppWizer-oranje
 * (--color-appwizer-orange #DF7D3C i.p.v. het ontwerp's eigen #2B4BDB-blauw),
 * op verzoek van Job. Typografie (Plus Jakarta Sans) blijft uit het ontwerp.
 * De eigen nav/logo-balk uit het ontwerp is weggelaten: SiteHeader voorziet
 * daar al in boven de carrousel, een tweede balk zou dubbel ogen.
 *
 * Het voorbeeldresultaat-kaartje wisselt elke 5s random naar een andere
 * realistische combi (percentage/uren/euro's horen bij elkaar) — zelfde
 * ambient-patroon als de vorige HeroThermometerDemo, alleen sneller omdat dit
 * kaartje kleiner en minder dominant is dan de hele hero. Het administratieve
 * proces ("factuurverwerking", "debiteurenbeheer", ...) wisselt daar los van
 * mee, zodat de twee niet steeds in hetzelfde paar terugkomen. Pauzeert op
 * prefers-reduced-motion.
 */
export function HeroSlideOptimalisatie({
  scan,
  peerScores,
}: {
  scan: Scan | null;
  peerScores: Record<string, number>;
}) {
  const [demo, setDemo] = useState<Demo>(DEFAULT_DEMO);
  const [process, setProcess] = useState<string>(DEFAULT_PROCESS);
  const toneColor = TONE_HEX[toneFor(demo.percentage)];

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setDemo((current) => pickRandom(RANDOM_DEMOS, current));
      setProcess((current) => pickRandom(RANDOM_PROCESSES, current));
    }, AUTO_CYCLE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex h-full w-full flex-col bg-[#FAF4EF] text-[#2B1B0F] ${jakarta}`}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:gap-18 lg:py-0">
        <div className="flex flex-1 flex-col items-start gap-6">
          <div className="rounded-full bg-[#FBE6D4] px-4 py-2 text-sm font-semibold text-appwizer-orange">
            Voor finance &amp; controllers in het MKB
          </div>
          <h1 className="m-0 text-[clamp(32px,4.5vw,56px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
            Zie precies waar je administratie tijd en geld lekt.
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-[1.55] text-[#5C4A3C]">
            Wij analyseren en optimaliseren je administratieve processen in NetSuite, Odoo,
            Exact Online en Twinfield. Minder handwerk, binnen de software die je al hebt.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {scan ? (
              <QuickscanModalButton
                scan={scan}
                label="Doe de Quickscan"
                peerScores={peerScores}
                className="rounded-full bg-appwizer-orange px-8 py-4 text-lg font-bold text-white transition hover:brightness-110"
              />
            ) : (
              <Link
                href="/mkb"
                className="rounded-full bg-appwizer-orange px-8 py-4 text-lg font-bold text-white no-underline transition hover:brightness-110"
              >
                Doe de Quickscan
              </Link>
            )}
            <a href="#werkwijze" className="px-6 py-4 text-lg font-semibold text-[#2B1B0F] no-underline">
              Bekijk de werkwijze
            </a>
          </div>
        </div>

        <div className="w-full max-w-[480px] flex-none rounded-3xl bg-white p-9 shadow-[0_24px_60px_-12px_rgba(223,125,60,0.25)]">
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold tracking-[0.08em] text-[#8A7A6C]">
              QUICKSCAN RESULTAAT
            </div>
            <div className="rounded-full bg-[#DDF4E7] px-3 py-1.5 text-[13px] font-semibold text-[#1B7A4B]">
              Voorbeeld
            </div>
          </div>
          <div className="mt-6 flex items-end gap-4">
            <div className="text-[72px] leading-[0.9] font-extrabold tracking-[-0.04em] text-appwizer-orange transition-all duration-300 sm:text-[88px]">
              {demo.percentage}%
            </div>
            <div className="pb-1.5 text-base leading-[1.4] text-[#5C4A3C]">
              Jouw Administratie Optimalisatiegraad
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <div className="h-3 overflow-hidden rounded-full bg-[#F1E4D8]">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${demo.percentage}%`, backgroundColor: toneColor }}
              />
            </div>
            <div className="flex justify-between text-[13px] font-medium text-[#8A7A6C]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX.low }} />
                Laag
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX.medium }} />
                Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: TONE_HEX.high }} />
                Hoog
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-[#FAF4EF] p-5">
              <div className="text-[28px] font-extrabold tracking-[-0.02em] transition-all duration-300">
                {demo.hours} uur
              </div>
              <div className="mt-1 text-sm leading-[1.4] text-[#5C4A3C] transition-all duration-300">
                per maand bespaard op {process}
              </div>
            </div>
            <div className="rounded-2xl bg-[#FAF4EF] p-5">
              <div className="text-[28px] font-extrabold tracking-[-0.02em] transition-all duration-300">
                € {demo.amount.toLocaleString("nl-NL")}
              </div>
              <div className="mt-1 text-sm leading-[1.4] text-[#5C4A3C]">
                per jaar geschatte besparing
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
