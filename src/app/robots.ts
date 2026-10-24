import type { MetadataRoute } from "next";

const SITE_URL = "https://appwizer.com";

/**
 * Preview-deployments krijgen al "noindex, nofollow" via de security-headers
 * in next.config.js — deze robots.txt is dus alleen relevant voor productie
 * en hoeft niet op VERCEL_ENV te controleren.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
