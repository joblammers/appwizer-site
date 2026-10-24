import { CalBookingLink } from "@/components/CalBookingLink";

const jakarta = "font-[family-name:var(--font-plus-jakarta)]";

const PILLARS = [
  { label: "Slimmer", text: "Lost uitzonderingen zelf op." },
  { label: "Leert mee", text: "Handelt steeds meer zelfstandig af." },
  { label: "Breidt uit", text: "Stap voor stap naar nieuwe processen." },
];

/**
 * Slide 2/3 — "2 · Optimalisatie met AI" uit Job's Claude Design-canvas.
 * Kleurenschema overgenomen van de bestaande #software-sectie op de homepage
 * (navy #16324A + oranje/zand-accent #F3C6A2 i.p.v. het ontwerp's eigen
 * blauwtint #0B1424/#8EA5FF), op verzoek van Job — zelfde donkere band als
 * "Procesoptimalisatie binnen jouw software" verderop op de pagina.
 * Geen eigen nav-balk (SiteHeader dekt dat al); "Bekijk hoe wij AI inzetten"
 * wijst naar #werkwijze op deze pagina. "Plan een gesprek" gebruikt dezelfde
 * CalBookingLink (Cal.com-embed) als de knop in SiteHeader, i.p.v. een anker
 * naar #gesprek — direct de boekingspopup openen past beter bij de intentie
 * van die knoptekst dan naar de pagina-CTA scrollen. De kaart toont nu puur
 * een illustratie (door Job aangeleverd, public/img/appwizer-ai-werkwijze-animatie.svg, een geanimeerde SVG die via <img> gewoon afspeelt)
 * zonder eigen titel erboven, i.p.v. de eerdere
 * 4-stappenlijst met AI-doet/wij-doen-kolommen.
 */
export function HeroSlideAI() {
  return (
    <div className={`flex h-full w-full flex-col bg-[#16324A] text-[#F2F5FB] ${jakarta}`}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col items-center gap-10 px-6 py-12 lg:flex-row lg:gap-16 lg:py-0">
        <div className="flex flex-1 flex-col items-start gap-6">
          <div className="rounded-full bg-[#1F4A66] px-4 py-2 text-sm font-semibold text-[#F3C6A2]">
            Zo werkt AppWizer: AI-first
          </div>
          <h1 className="m-0 text-[clamp(30px,4.2vw,52px)] leading-[1.1] font-extrabold tracking-[-0.03em] text-white">
            Wij zetten AI in om ons
            <br />
            werk te automatiseren.
          </h1>
          <p className="m-0 max-w-[580px] text-lg leading-[1.55] text-[#B7CBDD]">
            Jij wilt dat je administratie sneller en met minder handwerk loopt. Daarom zetten
            wij slimme automatisering in, met AI als hulpmiddel. Zo houden wij tijd over voor
            denkwerk en advies, en heb jij sneller resultaat.
          </p>
          <div className="grid max-w-[620px] grid-cols-1 gap-4 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.label} className="border-t-2 border-[#F3C6A2] pt-3.5">
                <div className="text-lg font-bold text-white">{pillar.label}</div>
                <div className="mt-1 text-[15px] leading-[1.45] text-[#B7CBDD]">{pillar.text}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#werkwijze"
              className="rounded-full bg-appwizer-orange px-8 py-4 text-lg font-bold text-white no-underline transition hover:brightness-110"
            >
              Bekijk hoe wij AI inzetten
            </a>
            <CalBookingLink
              label="Plan een gesprek"
              className="px-6 py-4 text-lg font-semibold text-white"
            />
          </div>
        </div>

        <div className="hidden w-full max-w-[480px] flex-none rounded-3xl border border-[#234159] bg-[#1C3C56] px-7 py-7 lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- vast illustratiebestand, geen externe bron */}
          <img
            src="/img/appwizer-ai-werkwijze-animatie.svg"
            alt="Documenten gaan via AI naar je boekhoudsoftware, uitzonderingen worden opgelost en het systeem leert mee"
            className="w-full rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
