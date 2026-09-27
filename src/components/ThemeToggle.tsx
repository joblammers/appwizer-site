"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const THEME_EVENT = "quickscan-theme-change";

function isPreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function getSnapshot(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return isPreference(stored) ? stored : "system";
}

// Vóór hydratie is er geen betrouwbare client-waarde; "system" is ook wat
// het inline init-script in layout.tsx zonder opgeslagen voorkeur aanneemt.
function getServerSnapshot(): ThemePreference {
  return "system";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function applyTheme(preference: ThemePreference) {
  const isDark =
    preference === "dark" ||
    (preference === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Licht", Icon: Sun },
  { value: "dark", label: "Donker", Icon: Moon },
  { value: "system", label: "Systeem", Icon: Monitor },
];

/**
 * Icoon-only dropdown (Lucide sun/moon/monitor), ingebouwd in SiteHeader
 * naast "Plan een gesprek" — geldt voor elke pagina, want SiteHeader zit op
 * elke pagina (zie (site)/layout.tsx). Een native <select> kan geen SVG's in
 * zijn opties tonen, dus dit is een eigen klein menu (button + popover) in
 * plaats van een <select>.
 */
export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(value: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
    window.dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
  }

  const current = OPTIONS.find((o) => o.value === preference) ?? OPTIONS[2];
  const CurrentIcon = current.Icon;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Kleurthema: ${current.label}`}
        title={current.label}
        className="flex items-center justify-center rounded-full border border-border bg-surface p-2 text-foreground transition hover:border-appwizer-orange focus:border-appwizer-orange focus:outline-none"
      >
        <CurrentIcon aria-hidden="true" className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Kleurthema"
          className="absolute top-full right-0 z-10 mt-2 flex flex-col gap-1 rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === option.value}
              onClick={() => choose(option.value)}
              title={option.label}
              className={[
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition",
                preference === option.value
                  ? "bg-appwizer-orange text-white"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <option.Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
