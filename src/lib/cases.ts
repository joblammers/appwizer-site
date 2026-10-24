import { isDatabaseConfigured, sql } from "./db";

export interface ClientCase {
  id: number;
  client: string;
  location: string;
  period: string;
  duration: string;
  sector: string;
  descriptionNl: string;
  descriptionEn: string;
  /** Vrije tekst uit het cv, bv. "Oracle NetSuite, SuiteScript" — matching op systeemnaam gebeurt met een contains-check, niet exact. */
  applications: string[];
  /** Kaal domein (bv. "optiver.com") voor het ophalen van het klantlogo via een logo-service; leeg = initialen-badge. */
  domain: string;
  /** "client" = echte klantcase (Klantcases-popup per systeem); "ai" = AI-optimalisatieproject (eigen homepage-sectie, nooit in de systeem-popups). */
  category: "client" | "ai";
}

/** Haalt een geplakte URL terug naar een kaal domein ("https://www.kruitbosch.nl/" -> "kruitbosch.nl") — mensen plakken nu eenmaal de hele adresbalk, niet alleen het domein. */
export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  }
}

/**
 * Vaste startset klantcases (uit Job's cv) — zelfde "seed als tabel leeg is"-
 * patroon als scans/store.ts, zodat een nieuwe database automatisch gevuld
 * is en latere handmatige toevoegingen via de database nooit overschreven
 * worden.
 */
const DEFAULT_CASES: Omit<ClientCase, "id">[] = [
  {
    client: "Kruitbosch",
    location: "Emmen",
    period: "2026 – heden",
    duration: "Lopend",
    sector: "Groothandel / internationaal",
    descriptionNl:
      "Ondersteuning met het team richting de go-live van Oracle NetSuite.",
    descriptionEn: "Supporting the team towards the Oracle NetSuite go-live.",
    applications: ["Oracle NetSuite"],
    domain: "",
    category: "client",
  },
  {
    client: "Corlido Group",
    location: "Emmen",
    period: "2025 – heden",
    duration: "Lopend",
    sector: "Groothandel / internationaal",
    descriptionNl:
      "Optimalisatie van interne processen en ondersteuning bij de internationale uitrol voor lokale dochters. Opzet van een rapportagepakket voor marge-, kosten- en omzetanalyse.",
    descriptionEn:
      "Optimising internal processes and supporting the international rollout to local subsidiaries. Built a reporting pack for margin, cost and revenue analysis.",
    applications: ["Oracle NetSuite"],
    domain: "",
    category: "client",
  },
  {
    client: "Optiver",
    location: "Amsterdam",
    period: "2025",
    duration: "2 maanden",
    sector: "Financiële markten",
    descriptionNl:
      "Vervangende support op SuiteScript-ondersteuning tijdens vakantieperiodes voor een internationale market maker.",
    descriptionEn:
      "Holiday cover for team support and SuiteScript development at an international market making firm.",
    applications: ["Oracle NetSuite", "SuiteScript"],
    domain: "optiver.com",
    category: "client",
  },
  {
    client: "Huisartsenzorg Twente",
    location: "Hengelo",
    period: "2024 – heden",
    duration: "Lopend",
    sector: "Zorg",
    descriptionNl:
      "Optimalisatie van de administratieve processen in Twinfield en Basecone, met imports en rapportages vanuit externe applicaties.",
    descriptionEn:
      "Optimising administrative processes in Twinfield and Basecone, including imports and reporting from external applications.",
    applications: ["Twinfield", "Basecone"],
    domain: "",
    category: "client",
  },
  {
    client: "Eqeep",
    location: "Utrecht",
    period: "2024 – heden",
    duration: "Lopend",
    sector: "Consultancy",
    descriptionNl:
      "Procesoptimalisatie in NetSuite. Ontwikkeling van een autorisatiemodule, geautomatiseerde memoriaalboekingen en verkoopfacturen met tijdsheets bijlage (SuiteScript).",
    descriptionEn:
      "Process optimisation in NetSuite. Developed an approval module, automated journal postings and sales invoices with timesheets attached (SuiteScript).",
    applications: ["Oracle NetSuite", "SuiteScript"],
    domain: "",
    category: "client",
  },
  {
    client: "De Projectgroep",
    location: "Utrecht",
    period: "2024 – 2025",
    duration: "2 maanden",
    sector: "Projectmanagement / consultancy",
    descriptionNl: "Datamigratie van Oracle NetSuite naar AFAS.",
    descriptionEn: "Data migration from Oracle NetSuite to AFAS.",
    applications: ["Oracle NetSuite", "AFAS"],
    domain: "",
    category: "client",
  },
  {
    client: "Optiver",
    location: "Amsterdam",
    period: "2023 – 2024",
    duration: "8 maanden",
    sector: "Financiële markten",
    descriptionNl:
      "Opstellen van een financieel handboek en diensten en verantwoordelijkheden van het interne supportteam. Actualisatie van technische documentatie en procesbeschrijvingen.",
    descriptionEn:
      "Wrote a finance handbook defining the services and responsibilities of the internal support team. Updated technical documentation and business processes.",
    applications: ["Oracle NetSuite"],
    domain: "optiver.com",
    category: "client",
  },
  {
    client: "VIP Calculus",
    location: "Andelst",
    period: "2023 – 2024",
    duration: "14 maanden",
    sector: "Zorg (huisartsen)",
    descriptionNl:
      "Optimalisatie van de interne administratieve processen voor huisartsenondersteuningsorganisatie VIPLive.",
    descriptionEn:
      "Optimising internal administrative processes for GP support organisation VIPLive.",
    applications: [],
    domain: "",
    category: "client",
  },
  {
    client: "Impact Institute",
    location: "Amsterdam",
    period: "2023 – 2024",
    duration: "10 maanden",
    sector: "Scale-up / impactmeting",
    descriptionNl:
      "Vernieuwing van het financiële applicatielandschap voor een internationale scale-up.",
    descriptionEn: "Renewed the financial application landscape for an international scale-up.",
    applications: [],
    domain: "",
    category: "client",
  },
  {
    client: "Steltix",
    location: "Utrecht",
    period: "2023",
    duration: "2 maanden",
    sector: "Consultancy",
    descriptionNl:
      "Hands-on ondersteuning in Oracle NetSuite voor een internationaal adviesbureau.",
    descriptionEn: "Hands-on Oracle NetSuite support for an international consultancy firm.",
    applications: ["Oracle NetSuite"],
    domain: "",
    category: "client",
  },
  {
    client: "MN Services",
    location: "Den Haag",
    period: "2022 – 2023",
    duration: "7 maanden",
    sector: "Pensioen / financiële dienstverlening",
    descriptionNl:
      "Migratie van CODA Financials naar de cloud. Functionele en technische ontwerpen voor het omzetten van on-premises koppelingen (CSV, SQL, XML) naar de CODA Cloud API op AWS, inclusief test- en beheerhandleidingen.",
    descriptionEn:
      "Migrated CODA Financials to the cloud. Functional and technical specifications to convert on-premises interfaces (CSV, SQL, XML) to the CODA Cloud API on AWS, including test and run manuals.",
    applications: ["CODA Financials", "CODA Cloud API", "AWS"],
    domain: "",
    category: "client",
  },
  {
    client: "Ewals Cargo Care",
    location: "Tegelen",
    period: "2022",
    duration: "6 maanden",
    sector: "Logistiek",
    descriptionNl:
      "Training en ondersteuning bij de internationale NetSuite-implementatie: purchase-to-pay, order-to-cash, bankreconciliatie en factuurmatching.",
    descriptionEn:
      "Training and support for the international NetSuite implementation: purchase-to-pay, order-to-cash, bank reconciliation and invoice matching.",
    applications: ["Oracle NetSuite"],
    domain: "ewals.com",
    category: "client",
  },
  {
    client: "Van Oers Accounting / VO Accountants",
    location: "Breda / Delft",
    period: "2022",
    duration: "8 maanden",
    sector: "Accountancy",
    descriptionNl:
      "Klanten van accountantskantoren helpen hun administratie te stroomlijnen met geïntegreerde applicaties voor factuurscanning en -verwerking, kassakoppelingen en managementrapportages.",
    descriptionEn:
      "Helping accountancy clients streamline their administration with integrated applications for invoice scanning and processing, POS integrations and management reporting.",
    applications: [],
    domain: "",
    category: "client",
  },
  {
    client: "Crack",
    location: "Papendrecht",
    period: "2020 – heden",
    duration: "Lopend",
    sector: "Telematica",
    descriptionNl:
      "Training en ondersteuning bij de internationale NetSuite-implementatie: magazijn, contracten, abonnementsfacturatie, bankreconciliatie en factuurmatching. Nu maandelijkse support op abonnementsfacturatie.",
    descriptionEn:
      "Training and support for the international NetSuite implementation: warehouse, contracts, subscription billing, bank reconciliation and invoice matching. Ongoing monthly subscription billing support.",
    applications: ["Oracle NetSuite (SuiteBilling)"],
    domain: "",
    category: "client",
  },
  {
    client: "Human Business Support",
    location: "Etten-Leur",
    period: "2020",
    duration: "4 maanden",
    sector: "Zorg (contractering)",
    descriptionNl:
      "Procesanalyse en requirements voor een zorgcontracteringsorganisatie. Implementatie van de boekhouding en de uren- en onkostenregistratie.",
    descriptionEn:
      "Process mapping and requirements for a healthcare contracting organisation. Implemented the accounting and time & expense applications.",
    applications: [],
    domain: "",
    category: "client",
  },
  {
    client: "Van Oers Accounting",
    location: "Roosendaal",
    period: "2019",
    duration: "6 maanden",
    sector: "Accountancy / franchise",
    descriptionNl:
      "Procesanalyse en NetSuite-implementatie voor twee entiteiten van een internationale fastfood-keten. Inkoopfacturen per restaurant geregistreerd en één verzamelfactuur per restaurant, met alle inkoopfacturen als bijlage.",
    descriptionEn:
      "Process mapping and NetSuite implementation for two entities of a global fast-food chain. Purchase invoices registered per restaurant, with one consolidated sales invoice per restaurant including all purchase invoices.",
    applications: ["Oracle NetSuite"],
    domain: "",
    category: "client",
  },
  {
    client: "Clafis",
    location: "Heerenveen",
    period: "2018",
    duration: "8 maanden",
    sector: "Technisch advies (450 fte)",
    descriptionNl:
      "Procesanalyse en requirements voor de vervanging van legacy-applicaties. Selectie en presentatie van alternatieven, gevolgd door projectleiding, implementatie en datamigratie.",
    descriptionEn:
      "Process analysis and requirements to replace legacy applications. Selected and presented alternatives, followed by project management, implementation and data migration.",
    applications: ["Oracle NetSuite", "Simplicate"],
    domain: "",
    category: "client",
  },
  {
    client: "KplusV",
    location: "Arnhem",
    period: "2019",
    duration: "4 maanden",
    sector: "Consultancy (125 fte)",
    descriptionNl:
      "Ondersteuning van de financiële afdeling bij de migratie naar Exact Online en urenregistratie in Simplicate.",
    descriptionEn:
      "Supported the finance department in migrating to Exact Online and Simplicate time registration.",
    applications: ["Exact Online", "Simplicate"],
    domain: "",
    category: "client",
  },
  {
    client: "Entropia",
    location: "Brugge / Moordrecht",
    period: "2019",
    duration: "6 maanden",
    sector: "Telecom",
    descriptionNl:
      "Implementatie van Exact Online met magazijnen in België en Nederland, inclusief abonnementsfacturatie van geleasede apparatuur.",
    descriptionEn:
      "Implemented Exact Online with warehouses in Belgium and the Netherlands, including subscription billing of leased equipment.",
    applications: ["Exact Online"],
    domain: "",
    category: "client",
  },
  {
    client: "Van Oers Accounting",
    location: "Roosendaal",
    period: "2019 – 2020",
    duration: "6 maanden",
    sector: "Accountancy / franchise",
    descriptionNl:
      "NetSuite-implementatie voor de Nederlandse divisie van een internationale fastfood-keten: marketinguitgaven, centrale inkoop en facturatie aan franchisenemers. Daarnaast begeleiding bij de opzet van een centraal outsourcingteam.",
    descriptionEn:
      "NetSuite implementation for the Dutch division of a global fast-food chain: marketing spend, central purchasing and invoicing to franchisees. Also coached the firm in setting up a central outsourcing team.",
    applications: ["Oracle NetSuite (SuiteBilling)"],
    domain: "",
    category: "client",
  },
  {
    client: "De Nieuwe Zorg (DNZ)",
    location: "Apeldoorn",
    period: "2020",
    duration: "6 maanden",
    sector: "Zorg",
    descriptionNl:
      "Procesanalyse en implementatie van een centrale boekhouding en urenregistratie voor 100 zelfstandigen, inclusief facturatie. Power BI-rapportage die facturen, geschreven uren en ontbrekende uren combineert.",
    descriptionEn:
      "Process analysis and implementation of central accounting and time tracking for 100 sole traders, including invoicing. Built a Power BI report combining invoices, logged hours and missing hours.",
    applications: ["Power BI"],
    domain: "",
    category: "client",
  },
  {
    client: "Inseego",
    location: "Remote (AU/NZ/UK/DE/IE/NL/SA)",
    period: "2020 – 2022",
    duration: "2 jaar",
    sector: "Telecom / IoT",
    descriptionNl:
      "Ondersteuning bij de internationale NetSuite-uitrol voor het Benelux-team: order-to-cash met verkooporders, magazijnafhandeling, abonnementsfacturatie van geserialiseerde artikelen, incasso's en bankreconciliatie.",
    descriptionEn:
      "Supported the international NetSuite rollout for the Benelux team: order-to-cash including sales orders, fulfilment, subscription billing of serialised items, direct debits and bank reconciliation.",
    applications: ["Oracle NetSuite (SuiteBilling)"],
    domain: "inseego.com",
    category: "client",
  },
  {
    client: "Vereenvoudigd inkoopproces",
    location: "Horeca",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl: "Vereenvoudiging van het inkoopproces bij een horecagelegenheid.",
    descriptionEn: "Simplified the purchasing process at a hospitality venue.",
    applications: [],
    domain: "",
    category: "ai",
  },
  {
    client: "Auditfiles verwerken",
    location: "Diverse klanten",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl:
      "Verwerking van auditfiles naar kant-en-klare boekingen in Twinfield, Exact Online en Moneybird.",
    descriptionEn:
      "Processed audit files into ready-to-book entries for Twinfield, Exact Online and Moneybird.",
    applications: [],
    domain: "",
    category: "ai",
  },
  {
    client: "Managementrapportage",
    location: "Diverse klanten",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl: "Synchronisatie van een rapportagedatabase voor Power BI en Microsoft Fabric.",
    descriptionEn: "Synchronised a reporting database for Power BI and Microsoft Fabric.",
    applications: [],
    domain: "",
    category: "ai",
  },
  {
    client: "NetSuite-optimalisatiescripts (Eqeep)",
    location: "Utrecht",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl: "Scripts voor OHW-boekingen in de projectadministratie bij Eqeep.",
    descriptionEn: "Scripts for WIP postings in project accounting at Eqeep.",
    applications: [],
    domain: "",
    category: "ai",
  },
  {
    client: "Automatische margebepaling (Corlido)",
    location: "Emmen",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl: "Automatische berekening van marges per order bij Corlido Group.",
    descriptionEn: "Automatic margin calculation per order at Corlido Group.",
    applications: [],
    domain: "",
    category: "ai",
  },
  {
    client: "Klantspecifieke pakbonnen (Kruitbosch)",
    location: "Zwolle",
    period: "2024",
    duration: "Project",
    sector: "AI-project",
    descriptionNl: "Gegenereerde pakbonnen op maat voor dropshipments bij Kruitbosch.",
    descriptionEn: "Generated custom packing slips for dropshipments at Kruitbosch.",
    applications: [],
    domain: "",
    category: "ai",
  },
];

let bootstrapped: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  if (!sql) return;
  if (!bootstrapped) {
    bootstrapped = (async () => {
      await sql`
        create table if not exists client_cases (
          id bigint generated always as identity primary key,
          client text not null,
          location text not null,
          period text not null,
          duration text not null,
          sector text not null,
          description_nl text not null,
          description_en text not null,
          applications jsonb not null default '[]'::jsonb,
          created_at timestamptz not null default now()
        )
      `;
      await sql`alter table client_cases add column if not exists domain text not null default ''`;
      await sql`alter table client_cases add column if not exists category text not null default 'client'`;
      /**
       * Voorkomt dubbele seed-rijen: zonder dit kunnen twee gelijktijdige
       * cold starts (elk met hun eigen in-memory `bootstrapped`-guard) allebei
       * "count = 0" zien vóórdat de ander klaar is met inserten, en zo de hele
       * seedset dubbel wegschrijven — precies wat er gebeurd is voordat deze
       * unique index en `on conflict do nothing` hier stonden. Kan de index
       * niet worden aangemaakt, dan bewijst dát zelf al dat er rijen bestaan
       * (dubbele (client, period)-combinaties) — dus dan óók niet seeden,
       * ongeacht wat de losse count-query zegt; anders crasht de insert
       * hieronder op een ontbrekend on-conflict-doel.
       */
      let indexReady = true;
      try {
        await sql`create unique index if not exists client_cases_client_period_idx on client_cases (client, period)`;
      } catch {
        indexReady = false;
      }
      const [{ count }] = (await sql`
        select count(*)::int as count from client_cases
      `) as { count: number }[];
      if (count > 0 || !indexReady) return;
      for (const c of DEFAULT_CASES) {
        await sql`
          insert into client_cases (
            client, location, period, duration, sector,
            description_nl, description_en, applications, domain, category
          ) values (
            ${c.client}, ${c.location}, ${c.period}, ${c.duration}, ${c.sector},
            ${c.descriptionNl}, ${c.descriptionEn}, ${JSON.stringify(c.applications)}::jsonb, ${c.domain}, ${c.category}
          )
          on conflict (client, period) do nothing
        `;
      }
    })();
  }
  return bootstrapped;
}

/** Eerste jaartal in de periode ("2026 – heden" -> 2026, "2019 – 2020" -> 2019) — voor sortering op recentheid, want "period" is vrije tekst, geen datumtype. */
function startYear(period: string): number {
  const match = period.match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

export async function getAllCases(): Promise<ClientCase[]> {
  if (!isDatabaseConfigured || !sql) return [];
  try {
    await bootstrap();
    const rows = (await sql`
      select id, client, location, period, duration, sector,
        description_nl, description_en, applications, domain, category
      from client_cases
    `) as {
      id: number;
      client: string;
      location: string;
      period: string;
      duration: string;
      sector: string;
      description_nl: string;
      description_en: string;
      applications: string[];
      domain: string;
      category: string;
    }[];
    return rows
      .map((row) => ({
        id: row.id,
        client: row.client,
        location: row.location,
        period: row.period,
        duration: row.duration,
        sector: row.sector,
        descriptionNl: row.description_nl,
        descriptionEn: row.description_en,
        applications: row.applications ?? [],
        domain: row.domain ?? "",
        category: row.category === "ai" ? ("ai" as const) : ("client" as const),
      }))
      .sort((a, b) => startYear(b.period) - startYear(a.period));
  } catch (error) {
    console.error("getAllCases failed:", error);
    return [];
  }
}

/**
 * Cases die een systeemnaam noemen — contains-check (case-insensitive), niet
 * exact: het cv zegt "Oracle NetSuite" of "Oracle NetSuite (SuiteBilling)",
 * de kaart heet gewoon "NetSuite".
 */
export async function getCasesByApplication(systemName: string): Promise<ClientCase[]> {
  const all = await getAllCases();
  const needle = systemName.toLowerCase();
  return all.filter((c) =>
    c.applications.some((app) => app.toLowerCase().includes(needle)),
  );
}

export async function createCase(input: Omit<ClientCase, "id">): Promise<void> {
  if (!isDatabaseConfigured || !sql) throw new Error("Geen database geconfigureerd.");
  await bootstrap();
  await sql`
    insert into client_cases (
      client, location, period, duration, sector,
      description_nl, description_en, applications, domain, category
    ) values (
      ${input.client}, ${input.location}, ${input.period}, ${input.duration}, ${input.sector},
      ${input.descriptionNl}, ${input.descriptionEn}, ${JSON.stringify(input.applications)}::jsonb, ${input.domain}, ${input.category}
    )
  `;
}

export async function updateCase(id: number, input: Omit<ClientCase, "id">): Promise<void> {
  if (!isDatabaseConfigured || !sql) throw new Error("Geen database geconfigureerd.");
  await bootstrap();
  await sql`
    update client_cases set
      client = ${input.client},
      location = ${input.location},
      period = ${input.period},
      duration = ${input.duration},
      sector = ${input.sector},
      description_nl = ${input.descriptionNl},
      description_en = ${input.descriptionEn},
      applications = ${JSON.stringify(input.applications)}::jsonb,
      domain = ${input.domain},
      category = ${input.category}
    where id = ${id}
  `;
}

export async function deleteCase(id: number): Promise<void> {
  if (!isDatabaseConfigured || !sql) throw new Error("Geen database geconfigureerd.");
  await bootstrap();
  await sql`delete from client_cases where id = ${id}`;
}
