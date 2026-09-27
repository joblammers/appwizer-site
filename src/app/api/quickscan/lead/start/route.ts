import { NextResponse } from "next/server";
import { getScan } from "@/lib/quickscan/scans";
import { startLead } from "@/lib/quickscan/leads";
import type { LeadStartPayload } from "@/lib/quickscan/types";

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

  const scan = await getScan(payload.scanSlug);
  if (!scan) {
    return NextResponse.json({ error: "Onbekende scan" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  const leadId = await startLead({
    scanSlug: scan.slug,
    firstName: (payload.firstName ?? "").trim().slice(0, 80),
    email,
    company: (payload.company ?? "").trim().slice(0, 120),
    phone: (payload.phone ?? "").trim().slice(0, 40) || undefined,
    profile: payload.profile ?? {},
  });

  return NextResponse.json({ ok: true, leadId });
}
