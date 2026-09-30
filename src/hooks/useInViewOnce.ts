"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vuurt eenmalig zodra het element voor het eerst in beeld scrollt
 * (IntersectionObserver, disconnect na de eerste match) — voor
 * scroll-reveals die maar één keer per bezoek gebeuren (SystemsGrid,
 * WorkflowSteps). Geëxtraheerd zodat beide dezelfde intersection-logica
 * delen in plaats van 'm elk apart te herhalen.
 */
export function useInViewOnce<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
