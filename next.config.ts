import type { NextConfig } from "next";

/**
 * Herkomst van de bestaande WordPress-site.
 *
 * Zet dit op een hostnaam die NIET appwizer.com is — bijvoorbeeld
 * wp.appwizer.com — zodat Vercel het verkeer kan doorzetten zonder in een lus
 * terecht te komen. Blijft de variabele leeg, dan wordt er niets doorgezet en
 * draait alleen de Next.js-app.
 */
const WP_ORIGIN = process.env.WORDPRESS_ORIGIN;

/**
 * Productie-URL's van de losse exact-online-mcp/twinfield-mcp-projecten
 * (voorheen alleen bereikbaar via het losse mcp-hub-project op
 * mcp.appwizer.com). Leeg = geen van de /mcp/*-rewrites hieronder wordt
 * geregistreerd, zodat lokale dev zonder deze vars gewoon blijft werken.
 */
const EXACT_MCP_URL = process.env.EXACT_MCP_URL;
const TWINFIELD_MCP_URL = process.env.TWINFIELD_MCP_URL;

const isProduction = process.env.VERCEL_ENV === "production";

const config: NextConfig = {
  async rewrites() {
    const beforeFiles: { source: string; destination: string; has?: { type: "host"; value: string }[] }[] = [];

    // Nieuw, pad-gebaseerd, host-onafhankelijk: de kaarten op /mcp linken niet
    // hierheen (die zijn voor JSON-RPC/OAuth-verkeer, geen menselijke
    // navigatie), maar dit is wel het pad dat Claude's MCP-client straks kan
    // gebruiken via appwizer.com zelf.
    if (EXACT_MCP_URL) {
      beforeFiles.push({ source: "/mcp/exact/:path*", destination: `${EXACT_MCP_URL}/exact/:path*` });
    }
    if (TWINFIELD_MCP_URL) {
      beforeFiles.push({ source: "/mcp/twinfield/:path*", destination: `${TWINFIELD_MCP_URL}/twinfield/:path*` });
    }

    // Backward-compat, uitsluitend voor Host: mcp.appwizer.com (het oude
    // mcp-hub-domein). Elke bestemming is een VOLLEDIGE externe URL, nooit
    // een intern pad — Next.js herevalueert een al-gepasseerde rewrite-regel
    // nooit opnieuw, dus een regel die naar een eigen intern pad verwijst in
    // de veronderstelling dat een latere regel 'm alsnog oppakt werkt niet
    // (precies de bug die mcp-hub's huidige /mcp- en /c/:slug/mcp-aliassen
    // vandaag al breekt).
    const mcpHost = [{ type: "host" as const, value: "mcp.appwizer.com" }];
    if (EXACT_MCP_URL) {
      beforeFiles.push({ source: "/exact/:path*", has: mcpHost, destination: `${EXACT_MCP_URL}/exact/:path*` });
      beforeFiles.push({ source: "/mcp/:path*", has: mcpHost, destination: `${EXACT_MCP_URL}/exact/mcp/:path*` });
      beforeFiles.push({
        source: "/c/:slug/mcp/:path*",
        has: mcpHost,
        destination: `${EXACT_MCP_URL}/exact/c/:slug/mcp/:path*`,
      });
    }
    if (TWINFIELD_MCP_URL) {
      beforeFiles.push({ source: "/twinfield/:path*", has: mcpHost, destination: `${TWINFIELD_MCP_URL}/twinfield/:path*` });
    }
    beforeFiles.push({ source: "/", has: mcpHost, destination: "/mcp" });

    return {
      beforeFiles,
      // Alleen paden waarvoor Next.js zelf géén route heeft, gaan naar
      // WordPress. Zodra je een pagina overzet naar Next.js, neemt die het
      // automatisch over — je hoeft hier niets te wijzigen.
      fallback: WP_ORIGIN ? [{ source: "/:path*", destination: `${WP_ORIGIN}/:path*` }] : [],
    };
  },

  async redirects() {
    if (!WP_ORIGIN) return [];

    // Beheer van WordPress gaat rechtstreeks naar de origin. Via de proxy
    // werken inlogcookies en interne redirects onbetrouwbaar.
    return [
      {
        source: "/wp-admin/:path*",
        destination: `${WP_ORIGIN}/wp-admin/:path*`,
        permanent: false,
      },
      {
        source: "/wp-login.php",
        destination: `${WP_ORIGIN}/wp-login.php`,
        permanent: false,
      },
    ];
  },

  async headers() {
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];

    // Preview-deployments mogen nooit in Google terechtkomen.
    if (!isProduction) {
      security.push({ key: "X-Robots-Tag", value: "noindex, nofollow" });
    }

    return [{ source: "/:path*", headers: security }];
  },
};

export default config;
