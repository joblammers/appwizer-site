# Quickscan-module voor appwizer.com

Twee quickscans — één voor accountants- en administratiekantoren, één voor
middelgrote MKB-organisaties — als Next.js-module. Geen ScoreApp, geen externe
dienst. Een database is optioneel: zonder database werkt alles precies zoals
hieronder beschreven, met de scaninhoud vast in `src/lib/quickscan/scans/*.ts`;
mét database (zie [Admin-paneel](#admin-paneel-optioneel)) kun je diezelfde
inhoud via een webinterface bewerken.

Responsive vanaf ~375px breed, met een licht/donker/systeem-themaschakelaar
rechtsboven op elke pagina (`src/components/ThemeToggle.tsx`).

## Wat erin zit

```
src/
├── lib/
│   ├── db.ts                        Neon/Postgres-client (null als DATABASE_URL ontbreekt)
│   ├── admin/auth.ts                Wachtwoordcontrole + sessiecookie voor /admin
│   └── quickscan/
│       ├── types.ts                 Alle typen (Scan, Question, Tier, ScanResult)
│       ├── scoring.ts                Scorelogica — gedeeld door client en server
│       ├── validate.ts              Regels uit "Een scan aanpassen" als functie
│       ├── leads.ts                 saveLead() (alleen complete scans) + getLeadStatsByScan() voor /admin
│       ├── resultLink.ts            Antwoorden coderen in een URL — voor de link in de rapport-mail
│       └── scans/
│           ├── accountancy.ts       24 vragen + teksten, accountancyvariant
│           ├── mkb.ts               24 vragen + teksten, MKB-variant
│           ├── store.ts             getScans/saveScan/deleteScan — database met fallback
│           └── index.ts             Re-exports
├── components/
│   ├── ThemeToggle.tsx              Licht/donker/systeem, rechtsboven op elke pagina
│   ├── Modal.tsx                    Gedeelde popup (backdrop, Escape, sluitknop) — alleen nog voor de chart-zoom
│   ├── CalBookingLink.tsx           Knop die Cal.com's boekingspopup opent (element-click embed)
│   ├── admin/
│   │   ├── ScanList.tsx             Scanoverzicht in /admin
│   │   ├── ScanEditor.tsx           Volledige scan-editor (categorieën, vragen, niveaus, JSON)
│   │   ├── LeadOverview.tsx         Alle scans in één overzicht: lijngrafiek + tabel met scan/bedrijf/categorieën
│   │   └── LeadTrendChart.tsx       Eén lijn per scan, laatste 30 dagen (SVG, geen library)
│   └── quickscan/
│       ├── ScanRunner.tsx           Vraagflow, voortgang, fases, introscherm (tekst + optionele afbeelding)
│       ├── IntroContent.tsx         Lichte opmaak voor de intro: alinea's + opsommingslijsten
│       ├── LeadForm.tsx             Leadformulier met validatie
│       ├── ScanResult.tsx           Uitslag: score, spiderweb, balken met drill-down per vraag, niveau, CTA
│       └── CategoryRadarChart.tsx   Spiderweb-diagram van de score per categorie (SVG, geen library)
└── app/
    ├── admin/
    │   ├── login/page.tsx           Wachtwoordformulier
    │   ├── actions.ts               Server actions: opslaan/aanmaken/verwijderen
    │   └── (protected)/             Lijst (page.tsx) + editor ([slug]/page.tsx)
    ├── page.tsx                     Keuzepagina met beide scans, op "/"
    ├── [slug]/page.tsx              /mkb en /accountancy
    └── api/quickscan/lead/route.ts  Leadverwerking
```

De module draait op een eigen (sub)domein — bijvoorbeeld `quickscan.appwizer.com` —
zonder WordPress ervoor. `next.config.ts`'s `WORDPRESS_ORIGIN`-fallback is dus
optioneel: laat hem leeg als er geen bestaande site achter dit domein hoeft
door te schemeren.

## Installeren in een bestaand Next.js-project

1. Kopieer de map `src/` over je eigen `src/` heen (of pas de importpaden aan
   als je geen `src`-directory gebruikt).
2. Zorg dat het alias `@/*` naar `./src/*` wijst in `tsconfig.json`.
3. Voeg de merkkleuren toe aan `tailwind.config.ts`:

```ts
theme: {
  extend: {
    colors: {
      "appwizer-orange": "#DF7D3C",
      "appwizer-blue": "#5C94CD",
    },
  },
}
```

4. Zet de omgevingsvariabelen (allemaal optioneel — zonder deze werkt de scan,
   alleen komt de lead dan nergens aan en is er geen admin-paneel):

```
QUICKSCAN_WEBHOOK_URL=https://hooks.zapier.com/...
RESEND_API_KEY=re_...
QUICKSCAN_NOTIFY_EMAIL=job@appwizer.com
QUICKSCAN_FROM_EMAIL=scan@appwizer.com

# Admin-paneel — zie "Admin-paneel (optioneel)" hieronder
ADMIN_PASSWORD=
DATABASE_URL=
```

5. `npm run dev` en ga naar `/`.

## Admin-paneel (optioneel)

Op `/admin` kun je categorieën, vragen, profielvragen en niveaus per scan
bewerken via een webinterface, of een hele scan als JSON downloaden/uploaden —
zonder dat je de `.ts`-bestanden hoeft aan te passen of opnieuw te deployen.

Twee variabelen zijn er samen verantwoordelijk voor:

- **`ADMIN_PASSWORD`** — één gedeeld wachtwoord, geen gebruikersbeheer. Zonder
  deze variabele kun je niet inloggen op `/admin/login`.
- **`DATABASE_URL`** — een Neon/Postgres-connectiestring. Zonder deze
  variabele toont `/admin` de scans uit `src/lib/quickscan/scans/*.ts` wel,
  maar kan er niets worden opgeslagen (`saveScan`/`deleteScan` gooien dan een
  duidelijke fout). Op Vercel: koppel Neon via de Storage-tab, dan wordt deze
  automatisch gezet. De tabel (`quickscan_scans`) en de eerste seed vanuit de
  bestaande scans worden bij de eerste admin-actie automatisch aangemaakt —
  maar alleen als de tabel op dat moment leeg is. Stond er al een rij in
  (bijvoorbeeld van eerder handmatig testen), dan wint die en wordt de
  `.ts`-inhoud stilzwijgend overgeslagen; controleer na het instellen van
  `DATABASE_URL` dus even of de slugs in `/admin` overeenkomen met de
  `.ts`-bestanden.

Zodra `DATABASE_URL` gezet is, lezen `/` én `/admin` uit de database in
plaats van uit de `.ts`-bestanden — die blijven dan alleen de
initiële/seed-inhoud. Beide routes zijn daarom dynamisch gerenderd (niet meer
statisch voorgerenderd): een wijziging in `/admin` is direct zichtbaar op de
site, zonder redeploy.

Beveiliging: `src/proxy.ts` blokkeert onbevoegde navigatie naar `/admin/*`, en
elke server action in `src/app/admin/actions.ts` controleert de sessie
nogmaals zelf — Server Functions zijn ook als directe POST-aanroep bereikbaar,
niet alleen via de UI.

## Ontwerpkeuzes

**Categoriekolommen in /admin zijn positioneel, niet op naam.** `mkb` en
`accountancy` gebruiken toevallig dezelfde codes (A–F) voor inhoudelijk
andere categorieën — kolommen samenvoegen op code of naam zou twee losse
dingen door elkaar tonen. De tabel toont daarom "Categorie 1" t/m "Categorie
N" (N = het hoogste aantal categorieën van alle scans) en indexeert
`lead.categoryScores` op positie, wat wél consistent is: die array volgt de
volgorde van `scan.categories` op het moment van opslaan.

**Icoon per categorie is een los tekstveld (emoji), geen icon-library.** Eén
`icon?: string` op `Category`, getoond vóór de naam in de vraag-eyebrow en de
uitslaglijst. Geen dependency, geen iconenset om te onderhouden — de admin
plakt gewoon een emoji.

**Introtekst is platte tekst met een kleine parser, geen rich-text editor.**
Een lege regel breekt een alinea af; regels die met "- " beginnen worden een
lijst, ook meteen na een gewone regel (een inleidende zin gevolgd door
bullets, zonder lege regel ertussen) — dat laatste ging in de eerste versie
mis: bullets binnen hetzelfde blok als voorafgaande tekst werden dan één
platte zin met losse "- "-tekens. `IntroContent.tsx` verwerkt daarom regel
voor regel in plaats van per dubbele-newline-blok. De introafbeelding is een
losse URL (`Scan.introImage`), geen upload — past bij een module zonder
opslag voor bestanden.

**Vraagpunten zijn per vraag, niet één vast maximum voor de hele scan.**
`MAX_POINTS_PER_QUESTION` (altijd 4, want altijd vijf antwoorden) is vervangen
door `maxPointsForQuestion()`: het laatste antwoord van díé vraag, ongeacht
hoeveel antwoorden dat er zijn. Categoriemaxima zijn daarom de som van elke
vraag zijn eigen maximum, niet `aantal vragen × 4`. Dit maakt het mogelijk om
per vraag 2, 3 of 4 antwoorden te gebruiken én de punten per antwoord vrij te
wegen (het eerste antwoord blijft 0, de rest moet strikt oplopen) zonder de
bestaande vijf-antwoorden-vragen ongeldig te maken.

**Bedrijfsgegevens vooraf, niet pas na de scorevragen.** `ScanRunner`s
fasevolgorde is intro → contact → vragen → profiel → uitslag. Een
profielvraag met `section: "contact"` (bv. het type organisatie) wordt in
`LeadForm` mee gevraagd naast naam/e-mail/bedrijf/telefoon, vóórdat de
scorevragen beginnen; de rest van de profielvragen blijft ná de scorevragen
staan, gegroepeerd op hun (vrije) `section`-waarde als sectiekop — zo ontstaat
bijvoorbeeld een "Algemeen profiel"- en "Wat wil je bereiken"-sectie zonder
dat de datastructuur een aparte lijst per sectie nodig heeft. De echte
POST naar `/api/quickscan/lead` gebeurt nog steeds pas aan het eind (met alle
antwoorden erbij) — alleen het momentum waarop de bezoeker zijn gegevens
invult is naar voren gehaald.

**Cal.com's officiële element-click embed (`embed.js`), niet een eigen iframe.**
`Cal.ns.quickscan("ui", {...})` in de root layout zet `styles.branding.brandColor`
op het appwizer-oranje, zodat de geselecteerde datum in Cal's popup in het
merkkleur staat. `CalBookingLink.tsx` rendert bewust een `<button>` zonder
`href` als trigger — een `<a href target="_blank">` ernaast bleek niet
betrouwbaar te onderdrukken door Cal's click-handler: bij testen opende een
klik zowel de embed-popup als een los tabblad tegelijk. Een niet-navigerend
element is precies wat Cal.com zelf als trigger aanbeveelt. `Modal.tsx` wordt
nu alleen nog gebruikt voor de vergrootweergave van het spiderweb-diagram.

**Uitslag delen via een gecodeerde link, niet via een database-id.** De
rapport-mail linkt naar `/{slug}?r=<antwoorden, base64url>` — `resultLink.ts`
codeert en decodeert dit. Geen sessie, account of databaserij nodig om een
eerdere uitslag terug te zien; dat past bij een module die zonder database
moet blijven werken. `[slug]/page.tsx` decodeert dit server-side (via de
`searchParams`-prop, niet `useSearchParams()`) en geeft het door aan
`ScanRunner`, die dan direct de resultaatfase toont in plaats van bij de
intro te beginnen.

**Alleen complete scans belanden in `quickscan_leads`.** De lead-route is een
gewone POST-endpoint en dus ook direct aan te roepen buiten de UI om (zie de
waarschuwing bij Server Functions hierboven) — zonder deze check zou een
onvolledig of foutief verzoek de leadtabel vervuilen met rijen die voor een
benchmark onbruikbaar zijn. `isComplete` checkt dat elke vraag uit
`scan.questions` een antwoord heeft; de webhook en e-mails gaan wel altijd
door, dit raakt alleen het opslaan.

**Spiderweb náást de balken, niet in plaats van.** Een radar-diagram is prima
voor "welke vorm heeft dit profiel" in één oogopslag, maar slecht voor exacte
waarden en aslabels die op elkaar gaan lijken — dus blijft de balkenlijst
eronder staan als het nauwkeurige, screenreader-vriendelijke overzicht. Puur
SVG, geen chart-library: één statische diagram voor zes vaste categorieën
rechtvaardigt geen dependency. Elke categorie is bovendien een `<details>` met
de gestelde vragen, het gegeven antwoord en het percentage van die vraag
erin — een drill-down zonder extra React state, puur met het native
uitklapelement (chevron-icoon volgt de open/dicht-status via `group-open:`).
Het diagram zelf heeft een vergrootknop: dezelfde `CategoryRadarChart` met een
grotere `className` in een modal, waarbij de labels vanzelf meeschalen omdat
alles in de SVG relatief aan de viewBox is opgebouwd.

**Score wordt twee keer berekend.** De client rekent direct door voor een
onmiddellijke uitslag; de server rekent opnieuw door bij het opslaan van de
lead, omdat client-invoer geen betrouwbare bron is. Beide gebruiken dezelfde
functie in `scoring.ts`.

**Ongewogen score voor de deelnemer, gewogen score voor jou.** `percentage` is
punten gedeeld door maximum en dus eenvoudig uit te leggen.
`weightedPercentage` past de categoriewegingen toe en wordt alleen in de
leadnotificatie meegestuurd, voor het adviesgesprek.

**Niveaubepaling op afgerond percentage.** Een score is een veelvoud van 1/96,
dus 38 punten geeft 39,58%. Zonder afronding valt zo'n score tussen de banden
0–39% en 40–59% in. `findTier()` rondt daarom eerst af op hele procenten en
kiest dan de hoogste band waarvan de ondergrens is gehaald. Daardoor komen het
getoonde percentage en het niveau altijd overeen.

## Een scan aanpassen

Zonder database: alle inhoud staat in `src/lib/quickscan/scans/*.ts`. Een
vraag wijzigen, antwoorden herformuleren of een categorie hernoemen is een
tekstwijziging in dat bestand — geen componentwijziging. Let op twee dingen
(ook gecontroleerd in `src/lib/quickscan/validate.ts`, en dus ook afgedwongen
in het admin-paneel):

- Elke vraag heeft minstens twee antwoorden. Het eerste antwoord is altijd 0
  punten waard, de rest loopt strikt op — verder vrij te kiezen, dus niet per
  se in stappen van 1 (dat is de weging per antwoord).
- De som van alle `weight`-waarden moet 1 zijn.

Een derde scan toevoegen zonder admin-paneel: maak een nieuw bestand naar
hetzelfde model en voeg hem toe aan de array in `scans/index.ts`. De route, de
scorelogica en de uitslagpagina werken dan vanzelf. Mét admin-paneel kan dit
ook via "Dupliceer als nieuwe scan" op `/admin`.

## Wat er nog niet in zit

- **Pdf-rapport.** De uitslag is nu alleen een webpagina. Wil je hetzelfde
  rapport als pdf, dan is `@react-pdf/renderer` of een Puppeteer-render van de
  uitslagpagina de logische route.
- **De opvolgmails.** Er gaat nu één rapport-mail naar de deelnemer (met een
  link naar de uitslag, zie [Ontwerpkeuzes](#ontwerpkeuzes) hierboven) direct
  na inzending. De rest van een drip-campagne hoort thuis in je
  e-mailplatform; de API-route zet de lead met score en niveau door zodat je
  daarop kunt segmenteren.
- **Benchmark.** Complete leads (antwoorden + uitslag) staan sinds kort in
  `quickscan_leads` als `DATABASE_URL` gezet is (zie
  `src/lib/quickscan/leads.ts` — dezelfde database als de scaninhoud, zie
  [Admin-paneel](#admin-paneel-optioneel)). Er is alleen nog geen viewer voor
  die tabel en geen benchmarklogica: de uitslagpagina toont nog niet hoe
  iemand scoort ten opzichte van vergelijkbare organisaties, dat is de
  volgende stap zodra er genoeg leads binnen zijn.
