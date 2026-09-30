"use client";

import { useState } from "react";
import { Calculator, Clock, Database, Receipt, ScanLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { siOdoo } from "simple-icons";
import { Modal } from "@/components/Modal";
import { useInViewOnce } from "@/hooks/useInViewOnce";
import { normalizeDomain, type ClientCase } from "@/lib/cases";

interface System {
  name: string;
  body: string;
}

/**
 * Odoo heeft een geverifieerd, correct merklogo via simple-icons (MIT-
 * licensed, precies gemaakt voor dit "wij werken met X"-gebruik — enkel pad,
 * dus vanzelf monotoon via currentColor). Oracle NetSuite, Exact, Simplicate
 * en Twinfield (Wolters Kluwer) staan niet in die library — geen
 * betrouwbare bron om hun echte merklogo te verifiëren, dus die houden
 * voorlopig een generiek, functioneel passend icoon totdat er echte
 * logobestanden zijn aangeleverd.
 */
function SystemIcon({ name, className }: { name: string; className?: string }) {
  if (name === "Odoo") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path d={siOdoo.path} fill="currentColor" />
      </svg>
    );
  }
  const Icon = GENERIC_ICONS[name];
  return Icon ? <Icon aria-hidden="true" className={className} /> : null;
}

const GENERIC_ICONS: Record<string, LucideIcon> = {
  NetSuite: Database,
  "Exact Online": Calculator,
  Twinfield: Receipt,
  Simplicate: Clock,
  Zenvoices: ScanLine,
};

/** Cases die een systeemnaam noemen — contains-check (case-insensitive): het cv zegt "Oracle NetSuite", de kaart heet "NetSuite". */
function matchCases(cases: ClientCase[], systemName: string): ClientCase[] {
  const needle = systemName.toLowerCase();
  return cases.filter((c) => c.applications.some((app) => app.toLowerCase().includes(needle)));
}

/**
 * Klantlogo via Google's favicon-service op basis van het domein (bv.
 * "optiver.com") — Clearbit's publieke logo-API (logo.clearbit.com) bestaat
 * niet meer (DNS lost 'm niet eens meer op sinds hun overname door HubSpot),
 * dit is de vervanging. Het is een favicon, geen echt merklogo, dus lagere
 * kwaliteit — maar wel een dienst die nog bestaat en bij een onbekend domein
 * netjes 404't (in tegenstelling tot bv. unavatar.io, dat altijd 200 teruggeeft
 * met een generieke placeholder), zodat de onError-fallback naar de
 * initialen-badge blijft werken. `normalizeDomain` vangt een geplakte volledige
 * URL op ("https://www.klant.nl/" i.p.v. "klant.nl") uit het beheerformulier.
 */
function ClientLogo({ client, domain }: { client: string; domain: string }) {
  const [failed, setFailed] = useState(false);
  const cleanDomain = normalizeDomain(domain);
  const initials = client
    .split(/[\s/]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  if (!cleanDomain || failed) {
    return (
      <span
        aria-hidden="true"
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-semibold text-muted-foreground"
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- extern logo-serviceplaatje per klant, geen lokaal bestand om te registreren
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=64`}
      alt=""
      className="h-16 w-16 shrink-0 rounded-2xl border border-border bg-white object-contain p-3"
      onError={() => setFailed(true)}
    />
  );
}

/**
 * Kaarten verschijnen gestaggerd zodra de sectie in beeld scrollt (eenmalig,
 * IntersectionObserver via useInViewOnce) — dit is "delight"-budget: een
 * bezoeker ziet dit hooguit een paar keer per sessie, niet tientallen keren
 * per dag. De hover-lift en de reveal zelf staan in globals.css
 * (.system-card) in plaats van als inline transform-style: een inline stijl
 * wint altijd van een :hover-regel uit het stylesheet, dus zou de hover-lift
 * na de reveal niets meer doen. De hele kaart is klikbaar (een <button>, niet
 * een <div> met onClick, voor gratis toetsenbordondersteuning) en opent de
 * bestaande Modal met alle klantcases die dit systeem noemen.
 */
export function SystemsGrid({ systems, cases }: { systems: System[]; cases: ClientCase[] }) {
  const { ref: containerRef, inView } = useInViewOnce<HTMLDivElement>();
  const [openSystem, setOpenSystem] = useState<string | null>(null);

  const openCases = openSystem ? matchCases(cases, openSystem) : [];

  return (
    <div
      ref={containerRef}
      className="grid gap-5"
      style={{ gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))" }}
    >
      {systems.map((system, i) => (
        <button
          key={system.name}
          type="button"
          onClick={() => setOpenSystem(system.name)}
          data-inview={inView || undefined}
          className="system-card relative flex w-full flex-col rounded-2xl border border-white/[0.12] bg-white/[0.07] p-[26px] text-left"
          style={{ transitionDelay: `${i * 50}ms` }}
        >
          <SystemIcon
            name={system.name}
            className="absolute top-[22px] right-[22px] h-5 w-5 text-white/30"
          />
          <h3 className="m-0 mb-2 max-w-[85%] text-lg font-semibold text-white font-[family-name:var(--font-space-grotesk)]">
            {system.name}
          </h3>
          <p className="m-0 text-[14.5px] leading-[1.6] text-[#B7CBDD]">{system.body}</p>
          <span className="mt-4 text-[13.5px] font-semibold text-white/70">
            Bekijk klantcase →
          </span>
        </button>
      ))}

      {openSystem && (
        <Modal
          onClose={() => setOpenSystem(null)}
          ariaLabel={`Klantcases: ${openSystem}`}
          maxWidthClassName="max-w-2xl"
        >
          <div className="flex items-center gap-3">
            <SystemIcon name={openSystem} className="h-6 w-6 shrink-0 text-muted-foreground" />
            <h2 className="text-xl font-semibold text-foreground">{openSystem}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {openCases.length === 0
              ? "Nog geen klantcases voor dit systeem."
              : `${openCases.length} klantcase${openCases.length === 1 ? "" : "s"}`}
          </p>

          <ul className="mt-6 space-y-5">
            {openCases.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-4 border-t border-border pt-5 first:border-0 first:pt-0"
              >
                <ClientLogo client={c.client} domain={c.domain} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-foreground">{c.client}</h3>
                    <span className="text-xs text-muted-foreground">
                      {c.location} · {c.period} · {c.duration}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {c.sector}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{c.descriptionNl}</p>
                </div>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
