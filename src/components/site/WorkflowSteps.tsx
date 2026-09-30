"use client";

import type { CSSProperties } from "react";
import { ArrowBigDown, ArrowBigRight } from "lucide-react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

interface Step {
  n: string;
  title: string;
  body: string;
}

const STAGGER_MS = 45;

function delayStyle(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}

/**
 * Vier stappen met pijlen ertussen die de volgorde van het proces tonen —
 * gestapeld met een verticale pijl (↓) op smalle schermen, op een rij met
 * horizontale pijlen (→) vanaf lg. Kaarten én pijlen verschijnen in dezelfde
 * gestaggerde scroll-reveal (.reveal-step in globals.css, gedeeld met
 * SystemsGrid) zodra de sectie voor het eerst in beeld komt — "explanation" +
 * "spatial consistency": de pijlen tonen letterlijk waar het proces naartoe
 * gaat, niet decoratie. Het stapnummer krijgt zijn eigen, iets latere
 * pop-in (.reveal-step-number) voor wat meer laagjes in de reveal, en de
 * horizontale pijl blijft daarna zachtjes naar rechts "vloeien"
 * (.arrow-flow-right) om de procesrichting te onderstrepen.
 */
export function WorkflowSteps({ steps }: { steps: Step[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div ref={ref} className="flex flex-col items-stretch gap-4 lg:flex-row">
      {steps.map((step, i) => (
        <div key={step.n} className="contents">
          <div
            data-inview={inView || undefined}
            className="reveal-step relative w-full rounded-[18px] border border-border bg-surface p-8 lg:flex-1"
            style={delayStyle(i * 2 * STAGGER_MS)}
          >
            <span
              className="reveal-step-number absolute top-8 right-7 font-[family-name:var(--font-space-grotesk)] text-sm font-bold text-appwizer-blue/50"
            >
              {step.n}
            </span>
            <h3 className="m-0 mb-2.5 max-w-[85%] text-[19px] font-semibold">{step.title}</h3>
            <p className="m-0 text-[15px] leading-[1.6] text-muted-foreground">{step.body}</p>
          </div>

          {i < steps.length - 1 && (
            <div
              data-inview={inView || undefined}
              aria-hidden="true"
              className="reveal-step flex shrink-0 items-center justify-center text-muted-foreground"
              style={delayStyle((i * 2 + 1) * STAGGER_MS)}
            >
              <ArrowBigDown className="h-7 w-7 lg:hidden" fill="currentColor" />
              <ArrowBigRight
                className="arrow-flow-right hidden h-7 w-7 lg:block"
                fill="currentColor"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
