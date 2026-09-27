import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacyverklaring — appwizer",
  description: "Hoe appwizer omgaat met de gegevens die je invult bij de quickscan.",
};

export default function PrivacyverklaringPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-20">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacyverklaring
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">Laatst bijgewerkt: 14 september 2026</p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <div>
            <h2 className="font-semibold text-foreground">Wie we zijn</h2>
            <p className="mt-2">
              Deze quickscan is een dienst van appwizer.com. Voor vragen over deze
              verklaring of over je gegevens kun je mailen naar{" "}
              <a
                href="mailto:info@appwizer.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                info@appwizer.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Welke gegevens we verzamelen</h2>
            <p className="mt-2">Als je de quickscan invult, verzamelen we:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Je voornaam, zakelijk e-mailadres, organisatienaam en optioneel telefoonnummer</li>
              <li>Je antwoorden op de scorevragen en profielvragen (zoals sector en teamgrootte)</li>
              <li>De berekende score, per onderdeel en totaal</li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Waar we ze voor gebruiken</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Je score en verbeterrapport berekenen en per e-mail naar je toesturen</li>
              <li>
                Je een link geven waarmee je je uitslag later opnieuw kunt bekijken — deze
                link bevat je antwoorden gecodeerd in de link zelf, niet in een database
              </li>
              <li>
                Intern een melding sturen naar het appwizer-team zodat we, met jouw
                toestemming, contact kunnen opnemen over een intakegesprek
              </li>
              <li>
                Als je een intakegesprek boekt via de &ldquo;Boek een intakegesprek&rdquo;-knop,
                verloopt die boeking via Cal.com — zij verwerken dan de gegevens die je in
                die boeking invult, volgens hun eigen privacybeleid
              </li>
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Hoe lang we ze bewaren</h2>
            <p className="mt-2">
              Zodra je je contactgegevens invult, bewaren we die al — ook als je de
              scorevragen daarna niet afmaakt — zodat we trends over tijd kunnen zien en
              je met je toestemming kunnen opvolgen. Antwoorden op de scorevragen worden
              pas toegevoegd als je de scan afrondt. Je kunt op elk moment vragen om je
              gegevens te laten verwijderen via{" "}
              <a
                href="mailto:info@appwizer.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                info@appwizer.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Delen met derden</h2>
            <p className="mt-2">
              We verkopen je gegevens nooit aan derden. We gebruiken Resend om e-mails te
              versturen en Cal.com om intakegesprekken in te plannen — beide verwerken
              alleen de gegevens die nodig zijn om die specifieke dienst te leveren.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Cookies en lokale opslag</h2>
            <p className="mt-2">
              De enige lokale opslag die deze site gebruikt, is je voorkeur voor licht of
              donker thema — die blijft alleen in je eigen browser staan en wordt nergens
              naartoe verstuurd.
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-foreground">Jouw rechten</h2>
            <p className="mt-2">
              Je hebt het recht om je gegevens in te zien, te laten corrigeren of te laten
              verwijderen. Neem daarvoor contact op via{" "}
              <a
                href="mailto:info@appwizer.com"
                className="underline underline-offset-4 hover:text-foreground"
              >
                info@appwizer.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
