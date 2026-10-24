"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

interface Step {
  n: string;
  title: string;
  body: string;
  benefit: string;
}

const STAGGER_MS = 80;
const HIGHLIGHT_MS = 15_000;

function delayStyle(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}

/**
 * Vier-fasen-kaarten uit Job's Claude Design-canvas ("Onze werkwijze"),
 * overgenomen met site-kleuren i.p.v. het ontwerp's eigen blauw/zwart
 * (appwizer-blue voor de stapnummers, hetzelfde navy/oranje-duo #16324A /
 * #F3C6A2 als de bestaande #software-sectie en de AI-hero-slide). Een
 * doorlopende lijn (alleen vanaf lg, net als in het ontwerp) verbindt de vier
 * genummerde cirkels boven de kaarten — spatial consistency, geen pijlen meer
 * nodig om de volgorde te tonen.
 *
 * De donkere kaart-styling hoort NIET vast bij één stap — die beweegt mee
 * met de highlight: elke 15s krijgt de volgende fase de donkere achtergrond +
 * gevulde oranje cirkel, de rest blijft licht. Pauzeert op
 * prefers-reduced-motion (dan blijft gewoon fase 1 gemarkeerd, geen
 * doorlopende wissel-beweging). Scroll-reveal blijft hetzelfde patroon als
 * SystemsGrid (.reveal-step in globals.css).
 */
export function WorkflowSteps({ steps }: { steps: Step[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setActive((i) => (i + 1) % steps.length);
    }, HIGHLIGHT_MS);
    return () => clearInterval(id);
  }, [inView, steps.length]);

  return (
    <div ref={ref} className="relative grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div
        aria-hidden="true"
        className="absolute top-7 right-7 left-7 hidden h-px bg-border lg:block"
      />
      {steps.map((step, i) => {
        const isActive = i === active;
        return (
          <div
            key={step.n}
            data-inview={inView || undefined}
            className="reveal-step relative flex flex-col gap-5"
            style={delayStyle(i * STAGGER_MS)}
          >
            <div
              className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 text-xl font-extrabold transition-all duration-500 ${
                isActive
                  ? "border-appwizer-orange bg-appwizer-orange text-white ring-4 ring-appwizer-orange/25"
                  : "border-appwizer-blue bg-surface text-appwizer-blue"
              }`}
            >
              <span className="reveal-step-number">{step.n}</span>
            </div>
            <div
              className={`relative flex flex-1 flex-col gap-3 rounded-[20px] p-7 transition-all duration-500 ${
                isActive
                  ? "-translate-y-1 bg-[#16324A] text-white shadow-lg ring-2 ring-appwizer-orange/50"
                  : "border border-border bg-surface text-foreground shadow-sm"
              }`}
            >
              <h3 className="m-0 text-[19px] font-semibold tracking-[-0.01em]">{step.title}</h3>
              <p
                className={`m-0 text-[15px] leading-[1.6] ${
                  isActive ? "text-[#B7CBDD]" : "text-muted-foreground"
                }`}
              >
                {step.body}
              </p>
              <div
                className={`mt-auto flex flex-col gap-1.5 border-t pt-4 ${
                  isActive ? "border-[#234159]" : "border-border"
                }`}
              >
                <div
                  className={`text-xs font-bold tracking-[0.08em] ${
                    isActive ? "text-[#9FB7CC]" : "text-muted-foreground"
                  }`}
                >
                  JIJ KRIJGT
                </div>
                <div className="text-[15px] font-semibold">{step.benefit}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
