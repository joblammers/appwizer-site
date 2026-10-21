"use client";

import type { CSSProperties } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import type { ClientCase } from "@/lib/cases";

const STAGGER_MS = 45;

function delayStyle(ms: number): CSSProperties {
  return { "--reveal-delay": `${ms}ms` } as CSSProperties;
}

/**
 * Kaarten zonder klik-interactie (elk project is op zichzelf al specifiek
 * genoeg, geen gekoppelde klantcases om in een modal te tonen zoals
 * SystemsGrid) — daarom de lichte .reveal-step-stijl hergebruikt in plaats
 * van SystemsGrid's donkere, hover-til-bare .system-card: zelfde
 * scroll-reveal-mechaniek (globals.css, gedeeld met WorkflowSteps), geen
 * nieuwe CSS-klasse nodig voor iets dat al bestaat. Krijgt dezelfde
 * ClientCase-rijen als de Klantcases-popup (gefilterd op category === "ai"
 * in page.tsx) — dus admin-bewerkbaar via de Klantcases-tab in /admin, in
 * plaats van een losse statische array.
 */
export function AiProjectsGrid({ projects }: { projects: ClientCase[] }) {
  const { ref, inView } = useInViewOnce<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="grid gap-5"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}
    >
      {projects.map((project, i) => (
        <div
          key={project.id}
          data-inview={inView || undefined}
          className="reveal-step relative rounded-[18px] border border-border bg-surface p-8"
          style={delayStyle(i * STAGGER_MS)}
        >
          <h3 className="m-0 mb-2.5 text-[19px] font-semibold">{project.client}</h3>
          <p className="m-0 text-[15px] leading-[1.6] text-muted-foreground">
            {project.descriptionNl}
          </p>
        </div>
      ))}
    </div>
  );
}
