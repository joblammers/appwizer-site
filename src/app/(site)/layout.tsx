import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { getScans } from "@/lib/quickscan/scans";

// Niet statisch cachen: welke scans er zijn (voor de footer) kan via /admin
// wijzigen zonder redeploy.
export const dynamic = "force-dynamic";

/**
 * Gedeelde chrome voor de hele app (homepage, /[slug], privacy, voorwaarden
 * én /admin) — /admin's eigen layout voegt daarbovenop nog zijn
 * uitlogknop-balk toe, genest binnen deze chrome. De vaste top-padding
 * hieronder houdt de paginainhoud uit de weg van de zwevende SiteHeader.
 */
export default async function SiteLayout({ children }: { children: ReactNode }) {
  const scans = await getScans();
  const visibleScans = scans.filter((s) => s.visible !== false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="pt-28 sm:pt-32">{children}</div>
      <SiteFooter scans={visibleScans} />
    </div>
  );
}
