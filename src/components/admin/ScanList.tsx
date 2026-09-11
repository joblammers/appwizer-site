"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Scan } from "@/lib/quickscan/types";
import { createScanAction, deleteScanAction } from "@/app/admin/actions";

interface Props {
  scans: Scan[];
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ScanList({ scans }: Props) {
  return (
    <div className="space-y-4">
      {scans.map((scan) => (
        <ScanRow key={scan.slug} scan={scan} />
      ))}
      {scans.length === 0 && (
        <p className="text-muted-foreground">Nog geen scans.</p>
      )}
    </div>
  );
}

function ScanRow({ scan }: { scan: Scan }) {
  const [duplicating, setDuplicating] = useState(false);
  const [newSlug, setNewSlug] = useState(`${scan.slug}-kopie`);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function duplicate() {
    setError(null);
    const slug = slugify(newSlug);
    if (!slug) {
      setError("Vul een geldige slug in.");
      return;
    }
    startTransition(async () => {
      const clone: Scan = { ...scan, slug, title: `${scan.title} (kopie)` };
      const result = await createScanAction(clone);
      if (result && !result.ok) setError(result.errors.join(" "));
    });
  }

  function remove() {
    if (!window.confirm(`Scan "${scan.title}" definitief verwijderen?`)) return;
    startTransition(async () => {
      await deleteScanAction(scan.slug);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
            {scan.audience}
          </p>
          <Link
            href={`/admin/${scan.slug}`}
            className="text-lg font-semibold text-foreground hover:text-appwizer-orange"
          >
            {scan.title}
          </Link>
          <p className="text-sm text-muted-foreground">
            /{scan.slug} · {scan.questions.length} vragen ·{" "}
            {scan.categories.length} categorieën
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <Link
            href={`/admin/${scan.slug}`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange"
          >
            Bewerken
          </Link>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-appwizer-orange hover:text-appwizer-orange disabled:opacity-60"
          >
            Verwijderen
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        {duplicating ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-appwizer-orange focus:outline-none sm:max-w-xs"
              placeholder="nieuwe-slug"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={duplicate}
                disabled={isPending}
                className="rounded-lg bg-appwizer-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "Bezig…" : "Aanmaken"}
              </button>
              <button
                type="button"
                onClick={() => setDuplicating(false)}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Annuleren
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDuplicating(true)}
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Dupliceer als nieuwe scan
          </button>
        )}
        {error && (
          <p role="alert" className="mt-2 text-sm text-appwizer-orange">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
