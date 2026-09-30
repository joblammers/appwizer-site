import Link from "next/link";
import { QuickscanModalButton } from "@/components/QuickscanModalButton";
import type { Scan } from "@/lib/quickscan/types";

/**
 * Herbruikt op elke publieke pagina (zie src/app/(site)/layout.tsx), met
 * thema-tokens (bg-background, text-foreground, enz.) zodat licht/donker/
 * systeem ook hier werkt. "Doe de Quickscan" is hier een categorie-label
 * (niet zelf klikbaar) met daaronder elke beschikbare scan als losse regel,
 * die in een lightbox opent — net als op de homepage zelf.
 */
export function SiteFooter({ scans }: { scans: Scan[] }) {
  return (
    <div
      className="border-t border-border bg-background px-6 pt-16 pb-8"
      style={{ fontFamily: "var(--font-ibm-plex-sans), Arial, sans-serif" }}
    >
      <div className="mx-auto grid max-w-300 grid-cols-2 gap-10 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- extern WordPress-logo, geen lokaal domein om te registreren */}
            <img
              src="https://appwizer.com/wp-content/uploads/2023/04/Logo_Appwizer.png"
              alt="AppWizer"
              className="block h-6 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-55 text-[13.5px] leading-[1.6] text-muted-foreground">
            Automatisering van administratieve processen voor finance &amp; controllers
            in het MKB.
          </p>
        </div>

        <div>
          <div className="mb-4 text-[13px] font-bold tracking-[0.04em] text-muted-foreground">
            NAVIGATIE
          </div>
          <ul className="space-y-3">
            <li>
              <Link
                href="/#werkwijze"
                className="text-[14px] text-muted-foreground no-underline hover:text-appwizer-orange"
              >
                Werkwijze
              </Link>
            </li>
            <li>
              <Link
                href="/#software"
                className="text-[14px] text-muted-foreground no-underline hover:text-appwizer-orange"
              >
                Applicaties
              </Link>
            </li>
            <li>
              <span className="text-[14px] text-muted-foreground">Doe de Quickscan</span>
              {scans.length > 0 && (
                <ul className="mt-2 ml-3 space-y-2 border-l border-border pl-3">
                  {scans.map((scan) => (
                    <li key={scan.slug}>
                      <QuickscanModalButton
                        scan={scan}
                        label={scan.audience}
                        className="text-left text-[13px] text-muted-foreground hover:text-appwizer-orange"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-4 text-[13px] font-bold tracking-[0.04em] text-muted-foreground">
            JURIDISCH
          </div>
          <ul className="space-y-3">
            <li>
              <Link
                href="/privacyverklaring"
                className="text-[14px] text-muted-foreground no-underline hover:text-appwizer-orange"
              >
                Privacyverklaring
              </Link>
            </li>
            <li>
              <Link
                href="/algemene-voorwaarden"
                className="text-[14px] text-muted-foreground no-underline hover:text-appwizer-orange"
              >
                Algemene voorwaarden
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="mb-4 text-[13px] font-bold tracking-[0.04em] text-muted-foreground">
            BEDRIJFSGEGEVENS
          </div>
          <ul className="space-y-1.5 text-[14px] leading-[1.6] text-muted-foreground">
            <li className="font-semibold text-foreground">AppWizer B.V.</li>
            <li>Florence Nightingalelaan 18</li>
            <li>6721 BJ Bennekom</li>
            <li className="pt-1.5">KVK: 80625614</li>
            <li className="pt-1.5">
              <a
                href="mailto:info@appwizer.com"
                className="text-muted-foreground no-underline hover:text-appwizer-orange"
              >
                info@appwizer.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-300 border-t border-border pt-6 text-center">
        <span className="text-[13px] text-muted-foreground">
          © 2026 AppWizer B.V. Alle rechten voorbehouden.
        </span>
      </div>
    </div>
  );
}
