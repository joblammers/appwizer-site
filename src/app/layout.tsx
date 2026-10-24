import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { IBM_Plex_Sans, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { BASE_OPEN_GRAPH, BASE_TWITTER } from "@/lib/seo";
import "./globals.css";

/**
 * Alleen gebruikt door de homepage (marketing-ontwerp met een vaste,
 * altijd-lichte huisstijl) — via CSS-variabelen, zodat de rest van de app
 * (quiz, admin) gewoon de standaard sans-stack blijft gebruiken.
 */
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
});
/** Alleen voor de hero-carrousel-varianten (src/components/site/hero-slides/) — eigen typografie uit dat ontwerp, de rest van de site blijft bij Space Grotesk/IBM Plex Sans. */
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

const SITE_URL = "https://appwizer.com";
const DEFAULT_TITLE = "AppWizer — Automatisering van administratieve processen";
const DEFAULT_DESCRIPTION =
  "AppWizer analyseert en optimaliseert je administratieve processen in NetSuite, Odoo, Exact Online en Twinfield — en laat exact zien waar tijd en geld weglekt.";

/**
 * Fallback voor elke route die zelf geen metadata exporteert (bv. /admin).
 * Pagina's die wél eigen metadata zetten (homepage, quickscan-routes,
 * algemene-voorwaarden, enz.) overschrijven title/description/openGraph/
 * twitter volledig per key (geen deep-merge met deze parent) — vandaar
 * BASE_OPEN_GRAPH/BASE_TWITTER in lib/seo.ts, die elke pagina die zijn eigen
 * openGraph zet ook zelf meeneemt.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: { ...BASE_OPEN_GRAPH, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  twitter: { ...BASE_TWITTER, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
};

// Zet de .dark-klasse vóór hydratie, anders flitst de pagina eerst in het
// verkeerde thema. Alleen client-only opslag (localStorage/matchMedia) kan
// hier beslissen, dus dit moet als blocking inline script vóór React draaien.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var isDark =
      stored === "dark" ||
      (stored !== "light" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {}
})();
`;

// Cal.com's officiële element-click embed: elk element met data-cal-link
// opent de boekingspopup. Eén keer site-breed initialiseren, dan werkt het
// overal — zie src/components/CalBookingLink.tsx voor de knoppen zelf.
const calInitScript = `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "quickscan", {origin:"https://app.cal.com"});
Cal.config = Cal.config || {};
Cal.config.forwardQueryParams = true;
Cal.ns.quickscan("ui", {"styles":{"branding":{"brandColor":"#DF7D3C"}},"hideEventTypeDetails":false,"layout":"month_view"});
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="nl"
      className={`${ibmPlexSans.variable} ${spaceGrotesk.variable} ${plusJakartaSans.variable}`}
    >
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Script id="cal-embed-init" strategy="afterInteractive">
          {calInitScript}
        </Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
