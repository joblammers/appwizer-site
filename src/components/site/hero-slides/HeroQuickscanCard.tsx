"use client";

import { useEffect, useRef } from "react";
import { QUICKSCAN_CARD_SVG } from "./quickscanCardSvg";

/**
 * De geanimeerde quickscan-kaart, inline i.p.v. via <img>, zodat hij de
 * thema-tokens volgt (zie quickscanCardSvg.ts). SMIL respecteert
 * prefers-reduced-motion niet zelf, dus dat pauzeren we hier: de kaart blijft
 * dan op de beginstand staan.
 */
export function HeroQuickscanCard() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.querySelector<SVGSVGElement>("svg")?.pauseAnimations();
  }, []);

  return (
    <div
      ref={ref}
      className="[&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: QUICKSCAN_CARD_SVG }}
    />
  );
}
