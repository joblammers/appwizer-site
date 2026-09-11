import type { Scan } from "@/lib/quickscan/types";
import type { LeadRow, ScanLeadStats } from "@/lib/quickscan/leads";
import { formatPercentage } from "@/lib/quickscan/scoring";
import { LeadTrendChart } from "./LeadTrendChart";

interface Props {
  scans: Scan[];
  stats: ScanLeadStats[];
  leads: LeadRow[];
}

/** Vaste volgorde, nooit gecycled — genoeg voor het aantal scans dat dit paneel realistisch beheert. */
const SERIES_COLORS = ["#DF7D3C", "#5C94CD", "#8B5CF6", "#0D9488"];

/**
 * Eén overzicht voor alle scans samen: een lijn per scan in dezelfde grafiek
 * (in plaats van losse kaarten), en één tabel met alle leads — scannaam als
 * eerste kolom, dan bedrijf, totaalscore en de score per categorie
 * (positioneel: "Categorie 1" is bij elke scan de eerste categorie uit dat
 * scanschema — de namen zelf verschillen per scan, dus een gedeelde
 * kolomnaam op tekst zou categorieën met een andere betekenis samenvoegen).
 */
export function LeadOverview({ scans, stats, leads }: Props) {
  if (stats.length === 0) return null;

  const series = stats.map((stat, i) => {
    const scan = scans.find((s) => s.slug === stat.scanSlug);
    return {
      scanSlug: stat.scanSlug,
      label: scan?.title ?? stat.scanSlug,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      dailyCounts: stat.dailyCounts,
      totalLeads: stat.totalLeads,
      averagePercentage: stat.averagePercentage,
    };
  });

  const maxCategoryCount = Math.max(0, ...scans.map((s) => s.categories.length));
  const categoryColumns = Array.from({ length: maxCategoryCount }, (_, i) => i);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Leads per scan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alleen volledig ingevulde scans — laatste 30 dagen.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <LeadTrendChart series={series} />
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {series.map((s) => (
            <li key={s.scanSlug} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-foreground">{s.label}</span>
              <span className="text-muted-foreground">
                {s.totalLeads} {s.totalLeads === 1 ? "lead" : "leads"} · gem.{" "}
                {formatPercentage(s.averagePercentage)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {leads.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface p-5">
          <table className="w-full min-w-max text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">Scan</th>
                <th className="py-2 pr-4 font-medium">Bedrijf</th>
                <th className="py-2 pr-4 font-medium">Totaalscore</th>
                {categoryColumns.map((i) => (
                  <th key={i} className="py-2 pr-4 font-medium">
                    Categorie {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const scan = scans.find((s) => s.slug === lead.scanSlug);
                return (
                  <tr key={lead.id} className="border-b border-border last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">
                      {scan?.title ?? lead.scanSlug}
                    </td>
                    <td className="py-2 pr-4 text-foreground">{lead.company}</td>
                    <td className="py-2 pr-4 tabular-nums text-foreground">
                      {formatPercentage(lead.percentage)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
