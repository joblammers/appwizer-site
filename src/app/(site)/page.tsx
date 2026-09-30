import type { Metadata } from "next";
import Link from "next/link";
import { QuickscanModalButton } from "@/components/QuickscanModalButton";
import { QuickscanDropdown } from "@/components/site/QuickscanDropdown";
import { HeroThermometerDemo } from "@/components/site/HeroThermometerDemo";
import { SystemsGrid } from "@/components/site/SystemsGrid";
import { WorkflowSteps } from "@/components/site/WorkflowSteps";
import { getScan, getScans } from "@/lib/quickscan/scans";
import { getCategoryAverages } from "@/lib/quickscan/leads";
import { getAllCases } from "@/lib/cases";

export const metadata: Metadata = {
  title: "AppWizer — Automatisering van administratieve processen",
  description:
    "AppWizer analyseert en optimaliseert je administratieve processen in NetSuite, Odoo, Exact Online en Twinfield — en laat exact zien waar tijd en geld weglekt.",
};

// Niet statisch cachen: de quickscan-inhoud in de popup kan via /admin
// wijzigen zonder redeploy.
export const dynamic = "force-dynamic";

const TOOLS = ["NetSuite", "Odoo", "Exact Online", "Twinfield", "Simplicate", "Zenvoices"];

const STEPS = [
  {
    n: "01",
    title: "Quickscan & analyse",
    body: "We brengen je huidige facturatie-, boekhoud- en salarisprocessen in kaart en signaleren knelpunten.",
  },
  {
    n: "02",
    title: "Rapport & advies",
    body: "Je ontvangt een concreet rapport met knelpunten, werkinstructies en optimalisatie-alternatieven.",
  },
  {
    n: "03",
    title: "Implementatie",
    body: "We richten de automatisering in binnen je bestaande software — geen migratie, wel resultaat.",
  },
  {
    n: "04",
    title: "Continue optimalisatie",
    body: "We monitoren de processen en ondersteunen je team, zodat de besparing behouden blijft en verder groeit.",
  },
];

const SYSTEMS = [
  {
    name: "NetSuite",
    body: "Geautomatiseerde financiele workflows en factuurverwerking binnen je bestaande NetSuite-omgeving.",
  },
  {
    name: "Odoo",
    body: "Gekoppelde modules en automatische goedkeuringsflows tussen inkoop, verkoop en boekhouding.",
  },
  {
    name: "Exact Online",
    body: "Automatische matching en boeking van facturen en bankmutaties.",
  },
  {
    name: "Twinfield",
    body: "Gestandaardiseerde verwerking van verkoop- en inkoopfacturen met minder handwerk.",
  },
  {
    name: "Simplicate",
    body: "Koppeling van urenregistratie en facturatie zonder dubbele invoer.",
  },
  {
    name: "Zenvoices",
    body: "Automatische factuurherkenning direct doorgezet naar je boekhoudpakket.",
  },
];

const heading = "font-[family-name:var(--font-space-grotesk)]";

/**
 * Homepage-body — header en footer zitten in (site)/layout.tsx en gelden
 * voor elke publieke pagina; dit bestand is alleen de content ertussen
 * (hero, werkwijze, systemen, slot-cta). Gebruikt de gewone thema-tokens
 * (bg-background, text-foreground, bg-surface, enz.) zodat licht/donker/
 * systeem hier ook werkt — de #software-sectie blijft bewust een vaste
 * donkere accentband (net als een merkfoto: hij hoort niet om te klappen
 * naar wit, en wit-op-navy is sowieso in beide standen goed leesbaar).
 * Eigen fonts via next/font (Space Grotesk voor koppen, IBM Plex Sans voor
 * de rest — zie layout.tsx in de app-root).
 *
 * "Doe de Quickscan" opent de scan in een lightbox (QuickscanModalButton) —
 * zoals de Cal.com-popup, maar dan de ScanRunner zelf in een Modal in plaats
 * van weg te navigeren naar /mkb. De eindconversie is QuickscanDropdown: een
 * knop met keuzemenu (alle zichtbare scans), die de gekozen scan in diezelfde
 * soort lightbox opent — vervangt de eerdere Cal.com-boekingsknop hier.
 */
export default async function HomePage() {
  const scan = await getScan("mkb");
  const peerScores = scan ? await getCategoryAverages(scan.slug) : {};
  const cases = await getAllCases();
  const allScans = await getScans();
  const visibleScans = allScans.filter((s) => s.visible !== false);

  return (
    <div
      className="bg-background text-foreground"
      style={{ fontFamily: "var(--font-ibm-plex-sans), Arial, sans-serif" }}
    >
      <div
        className="mx-auto grid max-w-[1200px] items-center gap-[60px] px-6 pt-8 pb-20 sm:pt-12"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))" }}
      >
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-appwizer-blue/10 px-3.5 py-1.75 text-[13px] font-semibold text-appwizer-blue">
            Voor finance &amp; controllers in het MKB
          </div>
          <h1
            className={`m-0 mb-[22px] text-[clamp(32px,5vw,52px)] leading-[1.12] font-bold tracking-[-0.02em] ${heading}`}
          >
            Wij optimaliseren herhalende taken door ze zoveel mogelijk te automatiseren.
          </h1>
          <p className="m-0 mb-[34px] max-w-[520px] text-lg leading-[1.6] text-muted-foreground">
            AppWizer analyseert en optimaliseert je administratieve processen in NetSuite,
            Odoo, Exact Online, Twinfield — en laat exact zien waar tijd en geld weglekt.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {scan ? (
              <QuickscanModalButton
                scan={scan}
                label="Doe de Quickscan"
                peerScores={peerScores}
                className="rounded-xl bg-appwizer-orange px-7 py-3.75 text-base font-semibold text-white shadow-[0_10px_24px_-8px_rgba(223,125,60,0.45)] transition hover:brightness-110"
              />
            ) : (
              <Link
                href="/mkb"
                className="rounded-xl bg-appwizer-orange px-7 py-3.75 text-base font-semibold text-white no-underline shadow-[0_10px_24px_-8px_rgba(223,125,60,0.45)]"
              >
                Doe de Quickscan
              </Link>
            )}
          </div>
        </div>

        <HeroThermometerDemo />
      </div>

      <div className="border-t border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-5 px-6 py-7">
          <span className="text-[13px] font-semibold tracking-[0.02em] text-muted-foreground">
            WIJ OPTIMALISEREN PROCESSEN IN
          </span>
          <div className="flex flex-wrap items-center gap-8">
            {TOOLS.map((tool) => (
              <span key={tool} className={`text-base font-semibold text-foreground ${heading}`}>
                {tool}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div id="werkwijze" className="mx-auto max-w-[1200px] px-6 py-[clamp(56px,10vw,100px)]">
        <div className="mx-auto mb-14 max-w-[600px] text-center">
          <div className="mb-3 text-[13px] font-bold tracking-[0.06em] text-appwizer-orange">
            ONZE WERKWIJZE
          </div>
          <h2 className={`m-0 text-[clamp(26px,4vw,34px)] font-bold tracking-[-0.02em] ${heading}`}>
            Van knelpunt naar automatisering in vier stappen
          </h2>
        </div>
        <WorkflowSteps steps={STEPS} />
      </div>

      <div id="software" className="bg-[#16324A] px-6 py-[clamp(56px,10vw,100px)]">
        <div className="mx-auto max-w-[1200px]">
          <div className="mx-auto mb-14 max-w-[600px] text-center">
            <div className="mb-3 text-[13px] font-bold tracking-[0.06em] text-[#F3C6A2]">
              PER SYSTEEM
            </div>
            <h2
              className={`m-0 text-[clamp(26px,4vw,34px)] font-bold tracking-[-0.02em] text-white ${heading}`}
            >
              Procesoptimalisatie binnen jouw software
            </h2>
            <p className="mt-3.5 text-base text-[#B7CBDD]">
              We werken met de tools die je al gebruikt — geen migratie nodig.
            </p>
          </div>
          <SystemsGrid systems={SYSTEMS} cases={cases} />
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-6 py-[clamp(56px,10vw,100px)] text-center">
        <h2 className={`m-0 mb-[18px] text-[clamp(26px,4vw,36px)] font-bold tracking-[-0.02em] ${heading}`}>
          Wil je weten wat automatisering jou oplevert?
        </h2>
        <p className="mx-auto mb-8 max-w-[520px] text-[17px] text-muted-foreground">
          Doe de gratis quickscan en ontvang direct een indicatie van je tijd- en
          kostenbesparing.
        </p>
        <QuickscanDropdown
          scans={visibleScans}
          label="Doe de Quickcheck"
          className="inline-flex items-center rounded-xl bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
        />
      </div>
    </div>
  );
}
