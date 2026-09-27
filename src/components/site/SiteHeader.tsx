import Link from "next/link";
import { CalBookingLink } from "@/components/CalBookingLink";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Zwevende navigatiebalk, herbruikt op elke pagina — óók /admin (zie
 * src/app/(site)/layout.tsx, dat nu de hele app omvat) — vandaar de ankers
 * naar /#werkwijze en /#software in plaats van kale hashes: die werken
 * alleen als je al op de homepage staat, maar navigeren er anders eerst
 * naartoe.
 *
 * Gebruikt de gewone thema-tokens (bg-background, text-foreground, enz.) in
 * plaats van de vaste kleuren van de rest van de homepage, zodat
 * licht/donker/systeem hier ook werkt — met de ThemeToggle ingebouwd in de
 * navbalk (geen losstaande variant meer nodig, want dit is nu de enige
 * schakelaar op elke pagina).
 */
export function SiteHeader() {
  return (
    <div
      className="fixed inset-x-4 top-4 z-50 mx-auto max-w-290 rounded-2xl border border-border bg-background/92 shadow-lg shadow-black/4 backdrop-blur-sm sm:inset-x-6"
      style={{ fontFamily: "var(--font-ibm-plex-sans), Arial, sans-serif" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3.5 px-5 py-3.5">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- extern WordPress-logo, geen lokaal domein om te registreren */}
          <img
            src="https://appwizer.com/wp-content/uploads/2023/04/Logo_Appwizer.png"
            alt="AppWizer"
            className="block h-[26px] w-auto"
          />
        </Link>
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/#werkwijze"
            className="text-[15px] font-medium text-muted-foreground no-underline hover:text-foreground"
          >
            Werkwijze
          </Link>
          <Link
            href="/#software"
            className="text-[15px] font-medium text-muted-foreground no-underline hover:text-foreground"
          >
            Applicaties
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <CalBookingLink
              label="Plan een gesprek"
              className="rounded-full bg-appwizer-orange px-5.5 py-2.5 text-[14.5px] font-semibold text-white transition hover:brightness-110"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
