"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Scan } from "@/lib/quickscan/types";
import type { LeadRow } from "@/lib/quickscan/leads";
import { formatPercentage } from "@/lib/quickscan/scoring";

interface Props {
  scans: Scan[];
  leads: LeadRow[];
}

type CompletedFilter = "all" | "completed" | "incomplete";
type SortKey = "completed" | "scan" | "score";
type SortDir = "asc" | "desc";

function CompletedMark({ completed }: { completed: boolean }) {
  return completed ? (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:bg-green-500/15 dark:text-green-400"
      title="Scan afgerond"
      aria-label="Scan afgerond"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3 w-3">
        <path
          d="M4 10.5 8 14.5 16 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-appwizer-orange/10 text-appwizer-orange"
      title="Nog niet afgerond"
      aria-label="Nog niet afgerond"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-2.5 w-2.5">
        <circle cx={10} cy={10} r={4} fill="currentColor" />
      </svg>
    </span>
  );
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="py-2 pr-4 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {label}
        <span aria-hidden="true" className={active ? "opacity-100" : "opacity-30"}>
          {active && dir === "desc" ? "▼" : "▲"}
        </span>
      </button>
    </th>
  );
}

/**
 * Interactieve leadtabel: filters op Voltooid en Scan, en sortering op
 * Voltooid/Scan/Totaalscore. Losstaand client-component zodat LeadOverview
 * (en de pagina eromheen) server-side kan blijven — alleen de tabel zelf
 * heeft state nodig.
 */
export function LeadTable({ scans, leads }: Props) {
  const [completedFilter, setCompletedFilter] = useState<CompletedFilter>("all");
  const [scanFilter, setScanFilter] = useState<string>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir } | null>(null);

  const maxCategoryCount = Math.max(0, ...scans.map((s) => s.categories.length));
  const categoryColumns = Array.from({ length: maxCategoryCount }, (_, i) => i);

  const scanTitle = useMemo(() => {
    const byScan = new Map(scans.map((s) => [s.slug, s.title]));
    return (slug: string) => byScan.get(slug) ?? slug;
  }, [scans]);

  function toggleSort(key: SortKey) {
    setSort((prev) => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
  }

  const visibleLeads = useMemo(() => {
    let rows = leads;
    if (completedFilter !== "all") {
      const wantCompleted = completedFilter === "completed";
      rows = rows.filter((l) => l.completed === wantCompleted);
    }
    if (scanFilter !== "all") {
      rows = rows.filter((l) => l.scanSlug === scanFilter);
    }

    if (sort) {
      const dir = sort.dir === "asc" ? 1 : -1;
      rows = [...rows].sort((a, b) => {
        if (sort.key === "completed") {
          return (Number(a.completed) - Number(b.completed)) * dir;
        }
        if (sort.key === "scan") {
          return scanTitle(a.scanSlug).localeCompare(scanTitle(b.scanSlug)) * dir;
        }
        // "score": null (nog niet afgerond) altijd achteraan, ongeacht richting.
        if (a.percentage === null && b.percentage === null) return 0;
        if (a.percentage === null) return 1;
        if (b.percentage === null) return -1;
        return (a.percentage - b.percentage) * dir;
      });
    }

    return rows;
  }, [leads, completedFilter, scanFilter, sort, scanTitle]);

  const selectClass =
    "rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus:border-appwizer-orange focus:outline-none";

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Voltooid
          <select
            className={selectClass}
            value={completedFilter}
            onChange={(e) => setCompletedFilter(e.target.value as CompletedFilter)}
          >
            <option value="all">Alle</option>
            <option value="completed">Voltooid</option>
            <option value="incomplete">Niet voltooid</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Scan
          <select
            className={selectClass}
            value={scanFilter}
            onChange={(e) => setScanFilter(e.target.value)}
          >
            <option value="all">Alle scans</option>
            {scans.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <SortHeader
              label="Voltooid"
              active={sort?.key === "completed"}
              dir={sort?.key === "completed" ? sort.dir : "asc"}
              onClick={() => toggleSort("completed")}
            />
            <SortHeader
              label="Scan"
              active={sort?.key === "scan"}
              dir={sort?.key === "scan" ? sort.dir : "asc"}
              onClick={() => toggleSort("scan")}
            />
            <th className="py-2 pr-4 font-medium">Bedrijf</th>
            <SortHeader
              label="Totaalscore"
              active={sort?.key === "score"}
              dir={sort?.key === "score" ? sort.dir : "asc"}
              onClick={() => toggleSort("score")}
            />
            {categoryColumns.map((i) => (
              <th key={i} className="py-2 pr-4 font-medium">
                Categorie {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleLeads.map((lead) => (
            <tr key={lead.id} className="border-b border-border last:border-0">
              <td className="py-2 pr-4">
                <CompletedMark completed={lead.completed} />
              </td>
              <td className="py-2 pr-4">
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  {scanTitle(lead.scanSlug)}
                </Link>
              </td>
              <td className="py-2 pr-4 text-foreground">{lead.company}</td>
              <td className="py-2 pr-4 tabular-nums text-foreground">
                {lead.percentage === null ? "—" : formatPercentage(lead.percentage)}
              </td>
              {categoryColumns.map((i) => {
                const score = lead.categoryScores[i];
                return (
                  <td key={i} className="py-2 pr-4 tabular-nums text-muted-foreground">
                    {score ? formatPercentage(score.percentage) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
          {visibleLeads.length === 0 && (
            <tr>
              <td
                colSpan={4 + categoryColumns.length}
                className="py-6 text-center text-muted-foreground"
              >
                Geen leads voor dit filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
