import { QuickscanModalButton } from "@/components/QuickscanModalButton";
import type { Scan } from "@/lib/quickscan/types";

const jakarta = "font-[family-name:var(--font-plus-jakarta)]";

/**
 * Slide 3/3 — "3 · Huisartsen (FinOptima)" uit Job's Claude Design-canvas.
 * Het ontwerp had hier een eigen finoptima-logo + nav-balk; die is net als bij
 * de andere twee slides weggelaten (SiteHeader dekt de navigatie al), maar
 * het kleine "finoptima"-merkje blijft wél staan in de hero-inhoud zelf, om
 * duidelijk te maken dat dit over het zusterproduct gaat. De foto-placeholder
 * uit het ontwerp ("plaats hier de foto van de huisarts") is ingevuld met een
 * van de drie Dutch-GP-stockfoto's die al in public/img staan. CTA "Start de
 * nulmeting" opent de bestaande /huisarts-quickscan — functioneel het
 * dichtstbijzijnde equivalent van FinOptima's eigen nulmeting, die nog niet
 * bestaat (dat hele FinOptima-traject is eerder deze sessie bewust uitgesteld).
 * Het "finoptima"-merkje gebruikt het echte logo (public/img/finoptima-icon.png,
 * door Job aangeleverd) i.p.v. de eerdere gekleurde placeholder-vierkant.
 * "Meer weten" linkt naar finoptima.nl zelf (nieuw tabblad) i.p.v. een anker
 * op deze pagina — dat is immers het zusterproduct, niet AppWizer's eigen
 * werkwijze-sectie. Het regeltje boven het finoptima-merkje (in
 * appwizer-orange, net als de eyebrow-badges op de andere twee hero-slides)
 * maakt expliciet dat dit een branchespecifieke AppWizer-oplossing voor
 * huisartsenpraktijken is — zonder die context oogt de slide als een los,
 * ongerelateerd merk tussen de twee algemene MKB-hero's in.
 */
export function HeroSlideHuisartsen({ scan }: { scan: Scan | null }) {
  return (
    <div className={`flex h-full w-full flex-col overflow-hidden bg-[#19212D] text-[#F2F5F9] ${jakarta}`}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-6 px-6 py-12 lg:py-0 lg:pr-14 lg:pl-0">
          <div className="text-sm font-bold tracking-[0.04em] text-appwizer-orange">
            Een branchespecifieke oplossing van AppWizer, voor huisartsenpraktijken
          </div>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- vast logo-bestand, geen externe bron */}
            <img src="/img/finoptima-icon.png" alt="" className="h-6 w-auto" />
            <div className="text-lg font-bold tracking-[-0.02em] text-white">finoptima</div>
          </div>
          <div className="self-start rounded-full bg-[#1E3A33] px-4 py-2 text-sm font-semibold text-[#7FE3B3]">
            Het Praktijkbalans Programma
          </div>
          <h1 className="m-0 text-[clamp(30px,4.2vw,52px)] leading-[1.08] font-extrabold tracking-[-0.03em] text-white">
            Stop met administreren, begin weer met arts zijn.
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-[1.55] text-[#C5CEDC]">
            U werd huisarts om mensen te helpen, niet om avonden te verdoen aan declaraties,
            bankafschriften en facturen. Wij optimaliseren uw complete financiële workflow.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {scan ? (
              <QuickscanModalButton
                scan={scan}
                label="Start de nulmeting"
                className="rounded-full bg-[#2FBF7F] px-8 py-4 text-lg font-bold text-[#0F1620] transition hover:brightness-110"
              />
            ) : (
              <a
                href="#werkwijze"
                className="rounded-full bg-[#2FBF7F] px-8 py-4 text-lg font-bold text-[#0F1620] no-underline transition hover:brightness-110"
              >
                Start de nulmeting
              </a>
            )}
            <a
              href="https://www.finoptima.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-4 text-lg font-semibold text-white no-underline"
            >
              Meer weten
            </a>
          </div>
          <div className="mt-2 flex flex-wrap gap-10">
            <div className="max-w-[190px]">
              <div className="text-3xl font-extrabold tracking-[-0.02em] text-[#5FD9A0]">
                4-5 uur
              </div>
              <div className="mt-1 text-sm leading-[1.45] text-[#B5C0D2]">
                per week besteedt een huisarts gemiddeld aan financiële administratie
              </div>
            </div>
            <div className="max-w-[190px]">
              <div className="text-3xl font-extrabold tracking-[-0.02em] text-[#5FD9A0]">
                ½ tot 2 dagen
              </div>
              <div className="mt-1 text-sm leading-[1.45] text-[#B5C0D2]">
                per maand krijgt u direct terug
              </div>
            </div>
          </div>
        </div>

        <div className="relative hidden w-[520px] flex-none lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element -- vast icoonbestand, geen externe bron */}
          <img
            src="/img/a-photograph-of-a-dutch-general-practit.jpg"
            alt=""
            className="h-full w-full rounded-tl-[32px] object-cover"
          />
          <div className="absolute inset-0 rounded-tl-[32px] bg-gradient-to-r from-[#19212D]/70 via-[#19212D]/10 to-transparent" />
          <div className="absolute bottom-8 left-8 max-w-[320px] rounded-2xl bg-white px-5 py-4 text-[#19212D] shadow-[0_16px_40px_rgba(0,0,0,0.3)]">
            <div className="text-[15px] font-bold">Specialisten in huisartsenpraktijken</div>
            <div className="mt-1.5 text-sm leading-[1.4] text-[#3F4B5E]">
              Implementatie zonder verstoring van uw praktijk. Van analyse tot doorlopende
              ondersteuning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
