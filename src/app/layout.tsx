import type { Metadata } from "next";
import Script from "next/script";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "appwizer",
  description: "Quickscan administratieve processen — appwizer.com",
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
    <html lang="nl">
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <Script id="cal-embed-init" strategy="afterInteractive">
          {calInitScript}
        </Script>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
