import type { MetadataRoute } from "next";
import { getScans } from "@/lib/quickscan/scans";

const SITE_URL = "https://appwizer.com";

const STATIC_ROUTES = ["", "/privacyverklaring", "/algemene-voorwaarden", "/mcp"];

/**
 * Admin, login en API-routes horen hier niet in — die staan al op
 * "noindex, nofollow" via de security-headers in next.config.js (alleen op
 * preview-deployments) en zijn sowieso niet bedoeld om gevonden te worden.
 * Onzichtbare scans (visible: false) laten we ook weg: die blijven direct
 * bereikbaar via hun URL, maar horen niet in de publieke lijst thuis — zie
 * het "visible"-veld in lib/quickscan/types.ts.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const scans = await getScans();
  const scanRoutes = scans.filter((s) => s.visible !== false).map((s) => `/${s.slug}`);

  return [...STATIC_ROUTES, ...scanRoutes].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));
}
