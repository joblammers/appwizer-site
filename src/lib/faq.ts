/**
 * Veelgestelde vragen: één bron voor de zichtbare FAQ-sectie op de homepage én
 * de FAQPage-structured data. Beide moeten exact dezelfde tekst tonen, anders
 * negeren zoekmachines en AI-antwoordmachines de markup. Antwoorden zijn
 * afgeleid van bestaande sitetekst; voeg geen claims toe (prijzen, doorlooptijden,
 * resultaten) die nergens anders op de site staan.
 */
export interface FaqItem {
  question: string;
  answer: string;
  /** Optioneel: deze zin uit `answer` wordt in de zichtbare tekst een link. De FAQPage-markup houdt de platte tekst. */
  link?: { phrase: string; href: string };
}

export const FAQ: FaqItem[] = [
  {
    question: "Wat doet AppWizer?",
    answer:
      "AppWizer analyseert en optimaliseert administratieve processen — zoals facturatie, boekhouding en salaris — in NetSuite, Odoo, Exact Online en Twinfield. We gebruiken AI om herhalend werk te automatiseren, zodat finance- en controllersteams in het MKB minder handwerk hebben.",
  },
  {
    question: "Moet ik overstappen op andere software?",
    answer:
      "Nee. We werken binnen de software die je al gebruikt: we configureren en automatiseren in je bestaande systemen, zonder migratie.",
  },
  {
    question: "Hoe werkt een traject bij AppWizer?",
    answer:
      "In vier stappen. 1) Quickscan en analyse: we brengen je processen in kaart en signaleren knelpunten. 2) Rapport en advies: een concreet rapport met knelpunten, verbeterplan, werkinstructies en alternatieven. 3) Implementatie binnen je bestaande software. 4) Continue optimalisatie, ook na de livegang.",
  },
  {
    question: "Wat is de quickscan?",
    answer:
      "De quickscan is een gratis online scan die in hoofdlijnen de knelpunten in je financiële proces boven tafel haalt. Je krijgt direct een uitslag met een score per onderdeel. Daarna volgt een diepgaande analyse van je processen. Er is een scan voor finance en controllers in het MKB, voor accountants- en administratiekantoren en voor huisartsen en praktijkmanagers.",
  },
  {
    question: "Voor wie is AppWizer bedoeld?",
    answer:
      "Voor finance en controllers in het MKB, voor accountants- en administratiekantoren en voor huisartsenpraktijken die hun administratie willen automatiseren.",
  },
  {
    question: "Met welke software werkt AppWizer?",
    answer:
      "Onze basis is NetSuite, Odoo, Exact Online en Twinfield. Daarnaast kennen we verschillende andere applicaties en werken we ermee samen, om tot een zo goed mogelijk geautomatiseerd proces te komen.",
  },
  {
    question: "Wat zijn de MCP-connectoren van AppWizer?",
    answer:
      "Met de MCP-connectoren koppel je je financiële systeem aan Claude, met alleen-lezen toegang tot onder meer je financiële gegevens, orders en openstaande posten. De connector voor Exact Online is beschikbaar; die voor Twinfield is in ontwikkeling. Aanmelden kan via de Financial MCP Hub.",
    link: { phrase: "Financial MCP Hub", href: "/mcp" },
  },
];
