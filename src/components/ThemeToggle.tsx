"use client";

import { useEffect, useSyncExternalStore } from "react";

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

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Licht" },
  { value: "dark", label: "Donker" },
  { value: "system", label: "Systeem" },
];

export function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  function choose(value: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div
      role="group"
      aria-label="Kleurthema"
      className="fixed top-3 right-3 z-50 inline-flex rounded-full border border-border bg-surface/90 p-1 text-[11px] font-medium shadow-sm backdrop-blur sm:top-4 sm:right-4 sm:text-xs"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => choose(option.value)}
          aria-pressed={preference === option.value}
          className={[
            "rounded-full px-2 py-1 transition sm:px-3 sm:py-1.5",
            preference === option.value
              ? "bg-appwizer-orange text-white"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
