import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "admin_session";

function sessionToken(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  return Boolean(expected) && password === expected;
}

export function createSessionToken(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD is niet gezet.");
  return sessionToken(password);
}

export function isValidSessionToken(token: string | undefined | null): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !token) return false;
  const expected = Buffer.from(sessionToken(password));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * Server Functions zijn ook als directe POST-aanroep bereikbaar, niet alleen
 * via de UI (zie Next.js-docs "Mutating Data"). proxy.ts weert onbevoegde
 * GET-navigatie naar /admin/*, maar elke server action controleert de sessie
 * hier nogmaals voordat hij iets wijzigt.
 */
export async function requireAdminSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSessionToken(token)) {
    throw new Error("Niet ingelogd.");
  }
}
