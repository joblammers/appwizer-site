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
│       └── scans/
│           ├── accountancy.ts       24 vragen + teksten, accountancyvariant
│           ├── mkb.ts               24 vragen + teksten, MKB-variant
│           ├── store.ts             getScans/saveScan/deleteScan — database met fallback
│           └── index.ts             Re-exports
├── components/
│   ├── ThemeToggle.tsx              Licht/donker/systeem, rechtsboven op elke pagina
│   ├── admin/
│   │   ├── ScanList.tsx             Scanoverzicht in /admin
│   │   └── ScanEditor.tsx           Volledige scan-editor (categorieën, vragen, niveaus, JSON)
│   └── quickscan/
│       ├── ScanRunner.tsx           Vraagflow, voortgang, fases
│       ├── LeadForm.tsx             Leadformulier met validatie
│       └── ScanResult.tsx           Uitslag: score, balken, niveau, CTA
└── app/
    ├── admin/
    │   ├── login/page.tsx           Wachtwoordformulier
    │   ├── actions.ts               Server actions: opslaan/aanmaken/verwijderen
    │   └── (protected)/             Lijst (page.tsx) + editor ([slug]/page.tsx)
    ├── quickscan/page.tsx           Keuzepagina met beide scans
    ├── quickscan/[slug]/page.tsx    /quickscan/mkb en /quickscan/administratiekantoor
    └── api/quickscan/lead/route.ts  Leadverwerking
```

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

5. `npm run dev` en ga naar `/quickscan`.

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
  bestaande scans worden bij de eerste admin-actie automatisch aangemaakt.

Zodra `DATABASE_URL` gezet is, lezen `/quickscan` én `/admin` uit de database
in plaats van uit de `.ts`-bestanden — die blijven dan alleen de
initiële/seed-inhoud. Beide routes zijn daarom dynamisch gerenderd (niet meer
statisch voorgerenderd): een wijziging in `/admin` is direct zichtbaar op
`/quickscan`, zonder redeploy.

Beveiliging: `src/proxy.ts` blokkeert onbevoegde navigatie naar `/admin/*`, en
elke server action in `src/app/admin/actions.ts` controleert de sessie
nogmaals zelf — Server Functions zijn ook als directe POST-aanroep bereikbaar,
niet alleen via de UI.

## Ontwerpkeuzes

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

- Elke vraag heeft exact vijf antwoorden met `points` 0 t/m 4, in oplopende
  volgorde.
- De som van alle `weight`-waarden moet 1 zijn.

Een derde scan toevoegen zonder admin-paneel: maak een nieuw bestand naar
hetzelfde model en voeg hem toe aan de array in `scans/index.ts`. De route, de
scorelogica en de uitslagpagina werken dan vanzelf. Mét admin-paneel kan dit
ook via "Dupliceer als nieuwe scan" op `/admin`.

## Wat er nog niet in zit

- **Pdf-rapport.** De uitslag is nu alleen een webpagina. Wil je hetzelfde
  rapport als pdf, dan is `@react-pdf/renderer` of een Puppeteer-render van de
  uitslagpagina de logische route.
- **De opvolgmails.** Het versturen van de vier berichten hoort thuis in je
  e-mailplatform; de API-route zet de lead met score en niveau door zodat je
  daarop kunt segmenteren.
- **Benchmark.** Leads zelf staan nog niet in een database — alleen de
  scaninhoud (vragen, categorieën, niveaus) kan optioneel in Postgres staan,
  zie [Admin-paneel](#admin-paneel-optioneel). Zodra leads ook worden
  opgeslagen (bijvoorbeeld in dezelfde database), kan de uitslagpagina tonen
  hoe iemand scoort ten opzichte van vergelijkbare organisaties.
# appwizer-site
