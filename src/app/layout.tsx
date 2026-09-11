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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl">
      <body>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
