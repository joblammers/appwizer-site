import type { Scan } from "@/lib/quickscan/types";
import type { ScanLeadStats } from "@/lib/quickscan/leads";
import { formatPercentage } from "@/lib/quickscan/scoring";
import { LeadTrendChart } from "./LeadTrendChart";

interface Props {
  scans: Scan[];
  stats: ScanLeadStats[];
}

/** Leads en trend per scan, laatste 30 dagen. Toont alleen complete, opgeslagen scans (zie leads.ts). */
export function LeadOverview({ scans, stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Leads per scan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alleen volledig ingevulde scans — laatste 30 dagen.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => {
          const scan = scans.find((s) => s.slug === stat.scanSlug);
          return (
            <div key={stat.scanSlug} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold text-foreground">
                  {scan?.title ?? stat.scanSlug}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {stat.totalLeads} {stat.totalLeads === 1 ? "lead" : "leads"} · gem.{" "}
                  {formatPercentage(stat.averagePercentage)}
                </span>
              </div>
              <div className="mt-3">
                <LeadTrendChart dailyCounts={stat.dailyCounts} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
