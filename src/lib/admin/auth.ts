import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Inloggen verloopt via Clerk; wie er binnenmag bepaalt ADMIN_EMAILS
 * (komma-gescheiden lijst). Clerk bewijst alleen wie iemand is — zonder
 * deze allowlist zou elk Clerk-account (bv. via zelf aanmelden) admin zijn.
 * Ontbreekt ADMIN_EMAILS, dan heeft niemand toegang (fail closed).
 */
export function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** E-mailadres van de ingelogde admin, of null bij geen sessie / geen toegang. Alleen geverifieerde adressen tellen. */
export async function getAdminEmail(): Promise<string | null> {
  const allowed = allowedAdminEmails();
  if (allowed.length === 0) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const verified = user.emailAddresses
    .filter((address) => address.verification?.status === "verified")
    .map((address) => address.emailAddress.toLowerCase());
  return verified.find((email) => allowed.includes(email)) ?? null;
}

/**
 * Server Functions zijn ook als directe POST-aanroep bereikbaar, niet alleen
 * via de UI (zie Next.js-docs "Mutating Data"). proxy.ts weert niet-ingelogde
 * navigatie naar /admin/*, maar elke server action controleert hier nogmaals
 * sessie én allowlist voordat hij iets wijzigt.
 */
export async function requireAdminSession(): Promise<void> {
  if (!(await getAdminEmail())) {
    throw new Error("Niet ingelogd of geen toegang.");
  }
}
