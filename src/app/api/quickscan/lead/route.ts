import { NextResponse } from "next/server";
import { getScan } from "@/lib/quickscan/scans";
import { scoreScan, formatPercentage } from "@/lib/quickscan/scoring";
import { saveLead } from "@/lib/quickscan/leads";
import type { LeadPayload } from "@/lib/quickscan/types";

/**
 * Ontvangt een ingevulde quickscan, rekent de score server-side opnieuw door
 * (de client is geen betrouwbare bron) en zet de lead door: naar een webhook
 * (HubSpot, Zapier of Make), naar de eigen mailbox, en — als DATABASE_URL is
 * gezet — naar de quickscan_leads-tabel (zie src/lib/quickscan/leads.ts).
 */
export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  const scan = await getScan(payload.scanSlug);
  if (!scan) {
    return NextResponse.json({ error: "Onbekende scan" }, { status: 400 });
  }

  if (!payload.consent) {
    return NextResponse.json({ error: "Toestemming ontbreekt" }, { status: 400 });
  }

  const email = (payload.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  const result = scoreScan(scan, payload.answers ?? {});

  const lead: Lead = {
    receivedAt: new Date().toISOString(),
    scan: scan.slug,
    firstName: (payload.firstName ?? "").trim().slice(0, 80),
    email,
    company: (payload.company ?? "").trim().slice(0, 120),
    phone: (payload.phone ?? "").trim().slice(0, 40) || undefined,
    score: formatPercentage(result.percentage),
    weightedScore: formatPercentage(result.weightedPercentage),
    tier: result.tier.level,
    lowestCategory: result.lowestCategory.name,
    categoryScores: result.categories.map((c) => ({
      category: c.name,
      score: formatPercentage(c.percentage),
    })),
    profile: payload.profile ?? {},
    answers: payload.answers ?? {},
  };

  await Promise.allSettled([
    forwardToWebhook(lead),
    notifyByEmail(lead),
    saveLead({
      scanSlug: scan.slug,
      firstName: lead.firstName,
      email: lead.email,
      company: lead.company,
      phone: lead.phone,
      result,
      profile: payload.profile ?? {},
      answers: payload.answers ?? {},
    }),
  ]);

  return NextResponse.json({
    ok: true,
    score: result.percentage,
    tier: result.tier.level,
  });
}

interface Lead {
  receivedAt: string;
  scan: string;
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  score: string;
  weightedScore: string;
  tier: string;
  lowestCategory: string;
  categoryScores: { category: string; score: string }[];
  profile: Record<string, unknown>;
  answers: Record<string, unknown>;
}

/** Zet de lead door naar HubSpot, Zapier of Make. */
async function forwardToWebhook(lead: Lead) {
  const url = process.env.QUICKSCAN_WEBHOOK_URL;
  if (!url) return;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });
}

/** Interne notificatie via Resend. */
async function notifyByEmail(lead: Lead) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.QUICKSCAN_NOTIFY_EMAIL;
  if (!apiKey || !to) return;

  const rows = lead.categoryScores
    .map((c) => `<tr><td>${c.category}</td><td>${c.score}</td></tr>`)
    .join("");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.QUICKSCAN_FROM_EMAIL ?? "scan@appwizer.com",
      to,
      subject: `Quickscan ${lead.scan}: ${lead.company} — ${lead.score}`,
      html: `
        <h2>${lead.company}</h2>
        <p>${lead.firstName} — ${lead.email}${lead.phone ? ` — ${lead.phone}` : ""}</p>
        <p><strong>${lead.score}</strong> (gewogen ${lead.weightedScore}) — ${lead.tier}</p>
        <p>Grootste verbeterpotentie: ${lead.lowestCategory}</p>
        <table border="1" cellpadding="6" cellspacing="0">${rows}</table>
        <pre>${JSON.stringify(lead.profile, null, 2)}</pre>
      `,
    }),
  });
}
