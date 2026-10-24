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
 * schakelaar op elke pagina). Op mobiel blijft de ThemeToggle weg (op
 * verzoek van Job) — ThemeToggle.tsx valt zonder opgeslagen voorkeur toch al
 * terug op "systeem", dus dat blijft het effectieve gedrag. Logo wordt op
 * mobiel vervangen door het compactere icoon (dezelfde afbeelding als de
 * favicon) in plaats van de volledige wordmark. De CTA-knop wordt op mobiel
 * ook ingekort ("Gesprek" i.p.v. "Plan een gesprek", met minder padding) en
 * de balk zelf iets smaller (minder gap/padding) — anders past de balk niet
 * op één regel op een smalle telefoon.
 */
export function SiteHeader() {
  return (
    <div
      className="fixed inset-x-4 top-4 z-50 mx-auto max-w-290 rounded-2xl border border-border bg-background/92 shadow-lg shadow-black/4 backdrop-blur-sm sm:inset-x-6"
      style={{ fontFamily: "var(--font-ibm-plex-sans), Arial, sans-serif" }}
    >
      <div className="flex flex-nowrap items-center justify-between gap-2 px-3.5 py-3 sm:gap-3.5 sm:px-5 sm:py-3.5">
        <Link href="/" className="flex shrink-0 items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- lokaal logo */}
          <img
            src="/img/logo-appwizer.png"
            alt="AppWizer"
            className="hidden h-[26px] w-auto sm:block"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- lokaal icoon (favicon), compactere versie van het logo voor mobiel */}
          <img
            src="/img/appwizer-icon.png"
            alt="AppWizer"
            className="block h-7 w-7 sm:hidden"
          />
        </Link>
        <div className="flex min-w-0 flex-nowrap items-center gap-2 sm:gap-6">
          <Link
            href="/#werkwijze"
            className="truncate text-[13px] font-medium text-muted-foreground no-underline hover:text-foreground sm:text-[15px]"
          >
            Werkwijze
          </Link>
          <Link
            href="/#software"
            className="truncate text-[13px] font-medium text-muted-foreground no-underline hover:text-foreground sm:text-[15px]"
          >
            Applicaties
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            <div className="hidden sm:block">
              <CalBookingLink
                label="Plan een gesprek"
                className="rounded-full bg-appwizer-orange px-5.5 py-2.5 text-[14.5px] font-semibold text-white transition hover:brightness-110"
              />
            </div>
            <div className="sm:hidden">
              <CalBookingLink
                label="Gesprek"
                className="rounded-full bg-appwizer-orange px-3.5 py-2 text-[13px] font-semibold text-white transition hover:brightness-110"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
