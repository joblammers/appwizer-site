import type { Answers } from "./types";

/**
 * Codeert antwoorden compact in een URL-parameter, zodat de link in de
 * rapport-mail direct de uitslag toont — zonder database, account of opnieuw
 * de scan invullen. Puur cijfers (vraag-id -> punten), dus geen tekens die
 * in btoa/atob problemen geven.
 */
function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const remainder = padded.length % 4;
  return remainder ? padded + "=".repeat(4 - remainder) : padded;
}

export function encodeAnswers(answers: Answers): string {
  return toBase64Url(btoa(JSON.stringify(answers)));
}

export function decodeAnswers(encoded: string): Answers | null {
  try {
    const parsed: unknown = JSON.parse(atob(fromBase64Url(encoded)));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Answers;
    }
    return null;
  } catch {
    return null;
  }
}

export function buildResultUrl(origin: string, scanSlug: string, answers: Answers): string {
  return `${origin}/${scanSlug}?r=${encodeAnswers(answers)}`;
}
