"use client";

import Link from "next/link";
import { QuickscanModalButton } from "@/components/QuickscanModalButton";
import type { Scan } from "@/lib/quickscan/types";
import { HeroQuickscanCard } from "./HeroQuickscanCard";

const jakarta = "font-[family-name:var(--font-plus-jakarta)]";

/**
 * Slide 1/3 van de hero-carrousel — overgenomen uit Job's Claude Design-canvas
 * ("1 · Optimalisatie"). Kleurenschema omgezet naar het AppWizer-oranje
 * (--color-appwizer-orange #DF7D3C i.p.v. het ontwerp's eigen #2B4BDB-blauw),
 * op verzoek van Job. Typografie (Plus Jakarta Sans) blijft uit het ontwerp.
 * De eigen nav/logo-balk uit het ontwerp is weggelaten: SiteHeader voorziet
 * daar al in boven de carrousel, een tweede balk zou dubbel ogen.
 *
 * Gebruikt de thema-tokens (bg-background/text-foreground/bg-surface/
 * text-muted-foreground/border-border) i.p.v. de ontwerp's eigen vaste hex-
 * kleuren, zodat deze slide (als enige van de drie) gewoon meeschakelt met
 * de licht/donker-toggle — slides 2 en 3 zijn bewust vaste donkere banden,
 * net als de #software-sectie, maar deze slide hoort zich wél aan te passen.
 * Het voorbeeldresultaat-kaartje is verborgen onder lg: op mobiel viel het
 * over de tekst heen binnen de vaste hoogte van de carrousel (HeroCarousel.tsx) —
 * zelfde reden als de fotopaneel-afweging bij slide 3.
 *
 * Het voorbeeldresultaat-kaartje is een geanimeerde SVG (HeroQuickscanCard.tsx,
 * inline zodat hij het thema volgt) die zelf elke 3s van percentage/uren/besparing
 * wisselt; bij prefers-reduced-motion staat hij stil.
 */
export function HeroSlideOptimalisatie({
  scan,
  peerScores,
}: {
  scan: Scan | null;
  peerScores: Record<string, number>;
}) {
  return (
    <div className={`flex h-full w-full flex-col bg-background text-foreground ${jakarta}`}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:gap-18 lg:py-0">
        <div className="flex flex-1 flex-col items-start gap-6">
          <div className="rounded-full bg-appwizer-orange/15 px-4 py-2 text-sm font-semibold text-appwizer-orange">
            Voor finance &amp; controllers in het MKB
          </div>
          <h1 className="m-0 text-[clamp(32px,4.5vw,56px)] leading-[1.08] font-extrabold tracking-[-0.03em]">
            Zie precies waar je administratie tijd en geld lekt.
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-[1.55] text-muted-foreground">
            Wij analyseren en optimaliseren je administratieve processen in o.a. NetSuite, Odoo,
            Exact Online en Twinfield. Minder handwerk, binnen de software die je al gebruikt.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {scan ? (
              <QuickscanModalButton
                scan={scan}
                label="Doe de Quickscan"
                peerScores={peerScores}
                className="rounded-xl bg-appwizer-orange px-8 py-4 text-lg font-bold text-white transition hover:brightness-110"
              />
            ) : (
              <Link
                href="/mkb"
                className="rounded-xl bg-appwizer-orange px-8 py-4 text-lg font-bold text-white no-underline transition hover:brightness-110"
              >
                Doe de Quickscan
              </Link>
            )}
            <a href="#werkwijze" className="px-6 py-4 text-lg font-semibold text-foreground no-underline">
              Bekijk de werkwijze
            </a>
          </div>
        </div>

        <div className="hidden w-full max-w-[480px] flex-none overflow-hidden rounded-3xl border border-border shadow-[0_24px_70px_-12px_var(--hero-glow)] lg:block">
          <HeroQuickscanCard />
        </div>
      </div>
    </div>
  );
}
