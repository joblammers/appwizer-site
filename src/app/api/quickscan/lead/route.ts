import { NextResponse } from "next/server";
import { getScan } from "@/lib/quickscan/scans";
import { scoreScan, formatPercentage } from "@/lib/quickscan/scoring";
import { saveLead } from "@/lib/quickscan/leads";
import { buildResultUrl } from "@/lib/quickscan/resultLink";
import type { LeadPayload } from "@/lib/quickscan/types";

/**
 * Ontvangt een ingevulde quickscan, rekent de score server-side opnieuw door
 * (de client is geen betrouwbare bron) en zet de lead door: naar een webhook
 * (HubSpot, Zapier of Make), naar de eigen mailbox, naar de deelnemer zelf
 * (met een link naar de uitslag), en — als DATABASE_URL is gezet — naar de
 * quickscan_leads-tabel (zie src/lib/quickscan/leads.ts).
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

  const answers = payload.answers ?? {};
  const isComplete = scan.questions.every((q) => answers[q.id] !== undefined);

  const result = scoreScan(scan, answers);
  const resultUrl = buildResultUrl(new URL(request.url).origin, scan.slug, answers);
  const lowestCategoryAdvice =
    scan.categories.find((c) => c.code === result.lowestCategory.code)
      ?.lowScoreText ?? "";

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
    tierHeadline: result.tier.headline,
    tierBody: result.tier.body,
    tierSteps: result.tier.steps,
    lowestCategory: result.lowestCategory.name,
    lowestCategoryAdvice,
    categoryScores: result.categories.map((c) => ({
      category: c.name,
      score: formatPercentage(c.percentage),
    })),
    profile: payload.profile ?? {},
    answers,
    resultUrl,
  };

  await Promise.allSettled([
    forwardToWebhook(lead),
    notifyByEmail(lead),
    sendResultEmail(lead),
    // Alleen volledig ingevulde scans opslaan — een los API-verzoek met een
    // gedeeltelijke antwoordenset (of een bug in de client) mag de
    // leadtabel niet vervuilen met onbruikbare rijen.
    isComplete
      ? saveLead({
          scanSlug: scan.slug,
          firstName: lead.firstName,
          email: lead.email,
          company: lead.company,
          phone: lead.phone,
          result,
          profile: payload.profile ?? {},
          answers,
        })
      : Promise.resolve(),
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
  tierHeadline: string;
  tierBody: string;
  tierSteps: string[];
  lowestCategory: string;
  lowestCategoryAdvice: string;
  categoryScores: { category: string; score: string }[];
  profile: Record<string, unknown>;
  answers: Record<string, unknown>;
  /** Link die dezelfde uitslag toont zonder de scan opnieuw in te vullen. */
  resultUrl: string;
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
        <p><a href="${lead.resultUrl}">Bekijk de uitslag zoals de deelnemer die ziet</a></p>
        <pre>${JSON.stringify(lead.profile, null, 2)}</pre>
      `,
    }),
  });
}

/** Rapport-mail naar de deelnemer zelf: score per categorie, aanbeveling en een link naar de uitslag. */
async function sendResultEmail(lead: Lead) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const categoryRows = lead.categoryScores
    .map(
      (c) => `
        <tr>
          <td style="padding:6px 12px 6px 0; color:#334155;">${c.category}</td>
          <td style="padding:6px 0; text-align:right; font-weight:600; color:#0f172a;">${c.score}</td>
        </tr>`,
    )
    .join("");

  const stepsList = lead.tierSteps
    .map((step) => `<li style="margin-bottom:4px;">${step}</li>`)
    .join("");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.QUICKSCAN_FROM_EMAIL ?? "scan@appwizer.com",
      to: lead.email,
      subject: `Je quickscan-uitslag: ${lead.score} — ${lead.tier}`,
      html: `
        <p>Hoi ${lead.firstName},</p>
        <p>Bedankt voor het invullen van de quickscan. Je score is
        <strong>${lead.score}</strong> — <strong>${lead.tier}</strong>.</p>
        <p style="color:#334155;">${lead.tierHeadline}</p>

        <h3 style="margin-top:24px; margin-bottom:8px;">Je score per onderdeel</h3>
        <table cellpadding="0" cellspacing="0" style="width:100%; max-width:420px; border-collapse:collapse;">
          ${categoryRows}
        </table>

        <h3 style="margin-top:24px; margin-bottom:8px;">Wat dit betekent</h3>
        <p style="color:#334155;">${lead.tierBody}</p>

        <h3 style="margin-top:24px; margin-bottom:8px;">De drie stappen die nu het meeste opleveren</h3>
        <ol style="color:#334155; padding-left:20px;">${stepsList}</ol>

        <h3 style="margin-top:24px; margin-bottom:8px;">Waar je het meeste laat liggen: ${lead.lowestCategory}</h3>
        <p style="color:#334155;">${lead.lowestCategoryAdvice}</p>

        <p style="margin-top:28px;">
          <a href="${lead.resultUrl}" style="display:inline-block; background:#DF7D3C; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Bekijk je volledige uitslag
          </a>
        </p>
      `,
    }),
  });
}
