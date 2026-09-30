"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Scan } from "@/lib/quickscan/types";
import { Modal } from "@/components/Modal";
import { ScanRunner } from "@/components/quickscan/ScanRunner";

interface Props {
  scans: Scan[];
  label: string;
  className: string;
}

/**
 * Vervangt de losse "Boek een intakegesprek"-knop: één trigger die een
 * dropdown opent met alle beschikbare quickscans (zelfde open/sluit-patroon
 * als ThemeToggle: click-outside + Escape), en een gekozen scan opent daarna
 * gewoon in de bestaande Modal + ScanRunner — net als QuickscanModalButton,
 * maar dan met een keuzemenu ervoor in plaats van één vaste scan.
 */
export function QuickscanDropdown({ scans, label, className }: Props) {
  const [open, setOpen] = useState(false);
  const [activeScan, setActiveScan] = useState<Scan | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={className}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={`ml-2 inline h-4 w-4 align-[-2px] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-full left-1/2 z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-border bg-surface p-2 text-left shadow-lg"
        >
          {scans.map((scan) => (
            <button
              key={scan.slug}
              type="button"
              role="menuitem"
              onClick={() => {
                setActiveScan(scan);
                setOpen(false);
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-hover"
            >
              {scan.audience}
            </button>
          ))}
          {scans.length === 0 && (
            <p className="px-3 py-2.5 text-sm text-muted-foreground">Geen scans beschikbaar.</p>
          )}
        </div>
      )}

      {activeScan && (
        <Modal onClose={() => setActiveScan(null)} ariaLabel={activeScan.title} maxWidthClassName="max-w-3xl">
          <ScanRunner scan={activeScan} />
        </Modal>
      )}
    </div>
  );
}
