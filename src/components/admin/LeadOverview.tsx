import type { Scan } from "@/lib/quickscan/types";
import type { LeadRow, ScanLeadStats } from "@/lib/quickscan/leads";
import { ScanScoreChart } from "./ScanScoreChart";
import { LeadTable } from "./LeadTable";

interface Props {
  scans: Scan[];
  stats: ScanLeadStats[];
  leads: LeadRow[];
}

/** Vaste volgorde, nooit gecycled — genoeg voor het aantal scans dat dit paneel realistisch beheert. */
const SERIES_COLORS = ["#DF7D3C", "#5C94CD", "#8B5CF6", "#0D9488"];

/**
 * Eén overzicht voor alle scans samen: één staafdiagram dat de gemiddelde
 * totaalscore per scan vergelijkt (in plaats van losse kaarten of een
 * dagelijkse trendlijn — met doorgaans maar een handvol leads per scan is
 * "welke scan scoort hoger" een magnitude-vraag, geen tijdreeks), en één
 * tabel met alle leads — scannaam als eerste kolom, dan bedrijf, totaalscore
 * en de score per categorie (positioneel: "Categorie 1" is bij elke scan de
 * eerste categorie uit dat scanschema — de namen zelf verschillen per scan,
 * dus een gedeelde kolomnaam op tekst zou categorieën met een andere
 * betekenis samenvoegen). De scannaam linkt naar de ingevulde scan van díe
 * ene lead (/admin/leads/[id]) — niet naar het scan-sjabloon; dat blijft
 * bewerkbaar via de "Bewerken"-knop verderop in de scanlijst.
 *
 * Sinds de contactgegevens al vóór de scorevragen worden opgeslagen (zie
 * startLead() in leads.ts), kan een lead nog "in behandeling" zijn — de
 * eerste kolom "Voltooid" maakt dat onderscheid meteen zichtbaar, zonder dat
 * een afgehaakte deelnemer stilzwijgend uit de tabel valt. De tabel zelf
 * (met filters op Voltooid/Scan en sortering) zit in LeadTable.tsx — een
 * losstaand client-component, zodat deze server-component blijft.
 */
export function LeadOverview({ scans, stats, leads }: Props) {
  if (stats.length === 0) return null;

  const bars = stats.map((stat, i) => {
    const scan = scans.find((s) => s.slug === stat.scanSlug);
    return {
      scanSlug: stat.scanSlug,
      label: scan?.title ?? stat.scanSlug,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      totalLeads: stat.totalLeads,
      averagePercentage: stat.averagePercentage,
    };
  });

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Leads per scan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Alleen volledig ingevulde scans — laatste 30 dagen.
      </p>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <ScanScoreChart bars={bars} />
      </div>

      {leads.length > 0 && <LeadTable scans={scans} leads={leads} />}
    </div>
  );
}
