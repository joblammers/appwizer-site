import { NextResponse } from "next/server";
import { getScan } from "@/lib/quickscan/scans";
import { startLead } from "@/lib/quickscan/leads";
import type { LeadStartPayload } from "@/lib/quickscan/types";
import { cleanString, sanitizeProfile } from "@/lib/quickscan/input";
import { clientIp, rateLimit } from "@/lib/rateLimit";

/**
 * Legt de contactgegevens vast zodra de deelnemer ze invult, vóór de
 * scorevragen — zo blijft een afgebroken scan zichtbaar in /admin
 * (completed=false) in plaats van spoorloos te verdwijnen. Geen
 * webhook/e-mail hier: die horen bij een echte, afgeronde inzending.
 */
export async function POST(request: Request) {
  let payload: LeadStartPayload;

  try {
    payload = (await request.json()) as LeadStartPayload;
  } catch {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  if (!(await rateLimit(`start:ip:${clientIp(request)}`, 30, 3600))) {
    return NextResponse.json({ error: "Te veel pogingen, probeer het later opnieuw" }, { status: 429 });
  }

  const scan = await getScan(cleanString(payload.scanSlug, 100));
  if (!scan) {
    return NextResponse.json({ error: "Onbekende scan" }, { status: 400 });
  }

  const email = cleanString(payload.email, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  const profile = sanitizeProfile(payload.profile);
  if (!profile) {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const leadId = await startLead({
    scanSlug: scan.slug,
    firstName: cleanString(payload.firstName, 80),
    email,
    company: cleanString(payload.company, 120),
    phone: cleanString(payload.phone, 40) || undefined,
    profile,
  });

  return NextResponse.json({ ok: true, leadId });
}
