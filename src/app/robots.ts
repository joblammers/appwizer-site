import type { MetadataRoute } from "next";

const SITE_URL = "https://appwizer.com";

/**
 * Preview-deployments krijgen al "noindex, nofollow" via de security-headers
 * in next.config.js — deze robots.txt is dus alleen relevant voor productie
 * en hoeft niet op VERCEL_ENV te controleren.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // AI-antwoordmachines en hun zoekbots expliciet toegestaan: de site wil in antwoorden voorkomen.
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-SearchBot",
          "Claude-User",
          "PerplexityBot",
          "Perplexity-User",
          "Google-Extended",
          "Applebot-Extended",
        ],
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
