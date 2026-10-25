export const SITE_URL = "https://appwizer.com";

/** Organisatie- en websitegegevens: identiek aan de footer (SiteFooter.tsx). */
export const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "AppWizer B.V.",
      alternateName: "AppWizer",
      url: SITE_URL,
      logo: `${SITE_URL}/img/logo-appwizer.png`,
      email: "support@appwizer.com",
      identifier: { "@type": "PropertyValue", propertyID: "KvK", value: "80625614" },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Florence Nightingalelaan 18",
        postalCode: "6721 BJ",
        addressLocality: "Bennekom",
        addressCountry: "NL",
      },
      description:
        "AppWizer analyseert en optimaliseert administratieve processen in NetSuite, Odoo, Exact Online en Twinfield, met AI om herhalend werk te automatiseren.",
      knowsAbout: [
        "Procesoptimalisatie",
        "Financiële administratie automatiseren",
        "NetSuite",
        "Odoo",
        "Exact Online",
        "Twinfield",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "AppWizer",
      inLanguage: "nl-NL",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};
