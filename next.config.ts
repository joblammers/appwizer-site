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

const isProduction = process.env.VERCEL_ENV === "production";

const config: NextConfig = {
  async rewrites() {
    if (!WP_ORIGIN) return [];

    return {
      // Alleen paden waarvoor Next.js zelf géén route heeft, gaan naar
      // WordPress. Zodra je een pagina overzet naar Next.js, neemt die het
      // automatisch over — je hoeft hier niets te wijzigen.
      fallback: [
        {
          source: "/:path*",
          destination: `${WP_ORIGIN}/:path*`,
        },
      ],
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
