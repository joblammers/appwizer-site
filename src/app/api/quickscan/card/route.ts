import {
  MAX_AMOUNT,
  MAX_HOURS,
  MAX_PROCESS_LENGTH,
  buildResultCardSvg,
} from "@/lib/quickscan/resultCard";

/**
 * Statische SVG van de quickscan-resultaatkaart, voor de resultaatpagina en
 * de mail: /api/quickscan/card?percentage=45&hours=12&amount=2936&process=...
 * Zelfde parameters geven altijd dezelfde SVG, dus lang cachebaar. De
 * parameters komen van buiten: alles wordt gevalideerd, `process` wordt
 * ingekort en XML-geëscaped (zie lib/quickscan/resultCard.ts).
 */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
};

function bad(message: string): Response {
  return new Response(message, {
    status: 400,
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Strikt getal: geen lege string, geen "abc", geen Infinity/NaN. */
function parseNumber(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;

  const percentage = parseNumber(params.get("percentage"));
  const hours = parseNumber(params.get("hours"));
  const amount = parseNumber(params.get("amount"));
  const process = (params.get("process") ?? "").trim();

  if (percentage === null) return bad("percentage ontbreekt of is geen getal");
  if (hours === null || hours < 0 || hours > MAX_HOURS) {
    return bad(`hours moet een getal van 0 tot ${MAX_HOURS} zijn`);
  }
  if (amount === null || amount < 0 || amount > MAX_AMOUNT) {
    return bad(`amount moet een getal van 0 tot ${MAX_AMOUNT} zijn`);
  }
  if (!process) return bad("process ontbreekt");
  if (Array.from(process).length > MAX_PROCESS_LENGTH) {
    return bad(`process mag maximaal ${MAX_PROCESS_LENGTH} tekens zijn`);
  }

  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const svg = buildResultCardSvg({ percentage, hours, amount, process }, theme);

  return new Response(svg, {
    headers: {
      ...SECURITY_HEADERS,
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
