import type { Metadata } from "next";
import Link from "next/link";
import { BASE_OPEN_GRAPH, BASE_TWITTER } from "@/lib/seo";

const TITLE = "Algemene voorwaarden — AppWizer";
const DESCRIPTION = "De algemene voorwaarden van AppWizer B.V. voor onze diensten, zoals de quickscan en MCP-connectoren.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/algemene-voorwaarden" },
  openGraph: { ...BASE_OPEN_GRAPH, title: TITLE, description: DESCRIPTION, url: "/algemene-voorwaarden" },
  twitter: { ...BASE_TWITTER, title: TITLE, description: DESCRIPTION },
};

export default function AlgemeneVoorwaardenPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Algemene voorwaarden
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Laatst bijgewerkt: 24 oktober 2026</p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <div>
            <h2 className="font-semibold text-foreground">1. Wie we zijn</h2>
            <p className="mt-2">
              Deze voorwaarden gelden voor alle diensten van AppWizer B.V. — nu en in de
              toekomst — aangeboden via appwizer.com en de bijbehorende subdomeinen. Op dit
              moment gaat het onder meer om de quickscan en de MCP-connectoren voor Exact
              Online en Twinfield (op respectievelijk eol.appwizer.com en
              twf.appwizer.com). Voor vragen kun je mailen naar{" "}
              <a
                href="mailto:support@appwizer.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                support@appwizer.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">2. Toepasselijkheid</h2>
            <p className="mt-2">
              Deze voorwaarden zijn van toepassing op ieder gebruik van de website en onze
              diensten, en op elk intakegesprek dat daaruit voortvloeit. Door een dienst te
              gebruiken — zoals de quickscan in te vullen, een MCP-connector aan te vragen,
              of een intakegesprek te boeken — ga je akkoord met deze voorwaarden. Komt er
              een nieuwe dienst bij, dan vullen we deze voorwaarden aan met wat daarvoor
              specifiek geldt.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">3. De quickscan</h2>
            <p className="mt-2">
              De quickscan geeft een indicatieve inschatting van de volwassenheid van je
              administratieve processen, gebaseerd op de antwoorden die je zelf invult. De
              uitkomst — score, niveau en aanbevelingen — is bedoeld als startpunt voor een
              gesprek en is geen formeel advies. Er kunnen geen rechten aan de uitkomst
              worden ontleend.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">4. Intakegesprekken</h2>
            <p className="mt-2">
              Een intakegesprek boek je via Cal.com. Aan het boeken en voeren van een
              intakegesprek zijn op zichzelf geen kosten verbonden. Eventuele
              vervolgdienstverlening wordt altijd apart met je afgestemd, voordat we daarmee
              starten.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">5. MCP-connectoren</h2>
            <p className="mt-2">
              Een MCP-connector geeft Claude toegang tot jouw eigen Exact Online- of
              Twinfield-omgeving. Na aanmelding beoordelen en keuren we de koppeling goed;
              je kunt zelf de gebruikers aanwijzen die toegang krijgen. We kunnen de
              toegang pauzeren of intrekken, bijvoorbeeld op jouw verzoek, bij misbruik of
              bij een beveiligingsrisico. Je blijft zelf verantwoordelijk voor het beheer
              van je eigen Exact Online- of Twinfield-omgeving en voor wat gebruikers met
              de toegang doen die jij ze geeft.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">6. Gebruik van de website</h2>
            <p className="mt-2">
              Je gebruikt de website en onze diensten alleen voor je eigen organisatie en
              vult naar waarheid gegevens in. Misbruik — zoals het geautomatiseerd invullen
              van de scan, het delen van connector-toegang met onbevoegden, of het
              overnemen van de inhoud voor andere doeleinden — is niet toegestaan.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">7. Intellectueel eigendom</h2>
            <p className="mt-2">
              De vragen, teksten, scoremethodiek en vormgeving van de quickscan zijn
              eigendom van AppWizer B.V. Je mag je eigen uitslag bekijken en delen, maar de
              scan zelf niet kopiëren of hergebruiken zonder toestemming.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">8. Aansprakelijkheid</h2>
            <p className="mt-2">
              De quickscan wordt met zorg samengesteld, maar AppWizer B.V. garandeert niet
              dat de uitkomst volledig, juist of voor jouw situatie toereikend is. AppWizer
              B.V. is niet aansprakelijk voor beslissingen die je op basis van de
              scan-uitslag neemt, behalve in geval van opzet of grove nalatigheid. Hetzelfde
              geldt voor storingen, downtime of fouten in Exact Online, Twinfield of andere
              gekoppelde systemen van derden — die vallen buiten onze invloed en
              verantwoordelijkheid.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">9. Persoonsgegevens</h2>
            <p className="mt-2">
              Hoe we omgaan met de gegevens die je invult, staat beschreven in onze{" "}
              <Link
                href="/privacyverklaring"
                className="underline underline-offset-4 hover:text-foreground"
              >
                privacyverklaring
              </Link>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">10. Wijzigingen</h2>
            <p className="mt-2">
              We kunnen deze voorwaarden aanpassen. De datum bovenaan deze pagina laat zien
              wanneer dat voor het laatst is gebeurd. Bij belangrijke wijzigingen laten we
              dit weten via de website.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">11. Toepasselijk recht</h2>
            <p className="mt-2">
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen leggen we
              voor aan de bevoegde rechter in Nederland.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">12. Bedrijfsgegevens</h2>
            <p className="mt-2">
              AppWizer B.V.
              <br />
              Florence Nightingalelaan 18
              <br />
              6721 BJ Bennekom
              <br />
              KVK: 80625614
              <br />
              BTW: NL861740701B01
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
