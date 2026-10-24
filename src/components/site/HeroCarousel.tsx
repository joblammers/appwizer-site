"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Scan } from "@/lib/quickscan/types";
import { HeroSlideOptimalisatie } from "./hero-slides/HeroSlideOptimalisatie";
import { HeroSlideAI } from "./hero-slides/HeroSlideAI";
import { HeroSlideHuisartsen } from "./hero-slides/HeroSlideHuisartsen";

const ROTATE_MS = 30_000;

interface Props {
  mkbScan: Scan | null;
  huisartsScan: Scan | null;
  peerScores: Record<string, number>;
}

/**
 * Drie hero-varianten uit Job's Claude Design-canvas ("AppWizer hero-varianten"),
 * die elkaar elke 30s afwisselen — vervangt de vorige, vaste hero-sectie
 * volledig. Puntjes onderaan én pijltjes aan weerszijden voor handmatig
 * wisselen. De 30s-timer pauzeert bij prefers-reduced-motion — continu
 * wisselende content zonder pauzeknop is precies wat die voorkeur wil
 * voorkomen (WCAG 2.2.2); puntjes en pijltjes blijven dan gewoon werken voor
 * wie zelf wil wisselen. CSS-opacity-cross-fade i.p.v. een harde wissel, puur
 * transform/opacity dus geen layout-kosten.
 *
 * Alle slides delen dezelfde grid-cel (grid-area 1/1) i.p.v. een losstaande
 * vaste min-h-waarde — zo sizet de container zich automatisch naar de
 * langste slide op elke breedte, in plaats van een geschat getal dat op
 * mobiel (kortere viewportbreedte, dus meer regelafbrekingen en dus hogere
 * content) de volgende sectie erover liet overlappen.
 */
export function HeroCarousel({ mkbScan, huisartsScan, peerScores }: Props) {
  const slides = [
    <HeroSlideOptimalisatie key="optimalisatie" scan={mkbScan} peerScores={peerScores} />,
    <HeroSlideAI key="ai" />,
    <HeroSlideHuisartsen key="huisartsen" scan={huisartsScan} />,
  ];
  const [active, setActive] = useState(0);
  const goPrev = () => setActive((i) => (i - 1 + slides.length) % slides.length);
  const goNext = () => setActive((i) => (i + 1) % slides.length);

  const reducedMotionRef = useRef(false);
  useEffect(() => {
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (reducedMotionRef.current) return;
      setActive((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div className="relative grid">
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== active}
          className="col-start-1 row-start-1 w-full transition-opacity duration-500 ease-in-out"
          style={{ opacity: i === active ? 1 : 0, pointerEvents: i === active ? "auto" : "none" }}
        >
          {slide}
        </div>
      ))}

      <button
        type="button"
        onClick={goPrev}
        aria-label="Vorige hero-sectie"
        className="absolute top-1/2 left-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 lg:flex"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={goNext}
        aria-label="Volgende hero-sectie"
        className="absolute top-1/2 right-2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/50 lg:flex"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Toon hero-sectie ${i + 1}`}
            aria-current={i === active}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              i === active ? "w-6 bg-white" : "w-2.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
