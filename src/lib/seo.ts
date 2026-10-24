/**
 * Next.js vervangt openGraph/twitter-objecten per route volledig (geen
 * deep-merge met de parent) — elke pagina die zijn eigen openGraph zet, zet
 * dus ook deze basisvelden mee, anders vallen siteName/locale/type/card weg
 * zodra die pagina wordt gedeeld.
 */
export const BASE_OPEN_GRAPH = {
  siteName: "AppWizer",
  locale: "nl_NL",
  type: "website" as const,
};

export const BASE_TWITTER = {
  card: "summary_large_image" as const,
};
