import { NextResponse } from "next/server";
import { getScan } from "@/lib/quickscan/scans";
import { scoreScan, formatPercentage } from "@/lib/quickscan/scoring";
import { saveLead } from "@/lib/quickscan/leads";
import { buildResultUrl } from "@/lib/quickscan/resultLink";
import type { LeadPayload } from "@/lib/quickscan/types";
import { cleanString, sanitizeAnswers, sanitizeProfile } from "@/lib/quickscan/input";
import { escapeHtml as e } from "@/lib/escapeHtml";
import { clientIp, rateLimit } from "@/lib/rateLimit";

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

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  }

  // Elke inzending verstuurt mails vanaf ons domein: begrens per IP.
  if (!(await rateLimit(`lead:ip:${clientIp(request)}`, 10, 3600))) {
    return NextResponse.json({ error: "Te veel pogingen, probeer het later opnieuw" }, { status: 429 });
  }

  const scan = await getScan(cleanString(payload.scanSlug, 100));
  if (!scan) {
    return NextResponse.json({ error: "Onbekende scan" }, { status: 400 });
  }

  if (payload.consent !== true) {
    return NextResponse.json({ error: "Toestemming ontbreekt" }, { status: 400 });
  }

  const email = cleanString(payload.email, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
  }

  // Ook de ontvanger van de rapport-mail begrenzen, zodat niemand met een
  // vreemd adres als bestemming mails kan laten sturen.
  if (!(await rateLimit(`lead:email:${email.toLowerCase()}`, 5, 86400))) {
    return NextResponse.json({ error: "Te veel pogingen, probeer het later opnieuw" }, { status: 429 });
  }

  const answers = sanitizeAnswers(scan, payload.answers, true);
  const profile = sanitizeProfile(payload.profile);
  if (!answers || !profile) {
    return NextResponse.json({ error: "Ongeldige antwoorden" }, { status: 400 });
  }
  const isComplete = scan.questions.every((q) => answers[q.id] !== undefined);

  const result = scoreScan(scan, answers);
  const resultUrl = buildResultUrl(new URL(request.url).origin, scan.slug, answers);
  const lowestCategoryAdvice =
    scan.categories.find((c) => c.code === result.lowestCategory.code)
      ?.lowScoreText ?? "";

  const lead: Lead = {
    receivedAt: new Date().toISOString(),
    scan: scan.slug,
    firstName: cleanString(payload.firstName, 80),
    email,
    company: cleanString(payload.company, 120),
    phone: cleanString(payload.phone, 40) || undefined,
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
    profile,
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
          leadId: Number.isSafeInteger(payload.leadId) ? payload.leadId : undefined,
          scanSlug: scan.slug,
          firstName: lead.firstName,
          email: lead.email,
          company: lead.company,
          phone: lead.phone,
          result,
          profile,
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
    .map((c) => `<tr><td>${e(c.category)}</td><td>${e(c.score)}</td></tr>`)
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
        <h2>${e(lead.company)}</h2>
        <p>${e(lead.firstName)} — ${e(lead.email)}${lead.phone ? ` — ${e(lead.phone)}` : ""}</p>
        <p><strong>${e(lead.score)}</strong> (gewogen ${e(lead.weightedScore)}) — ${e(lead.tier)}</p>
        <p>Grootste verbeterpotentie: ${e(lead.lowestCategory)}</p>
        <table border="1" cellpadding="6" cellspacing="0">${rows}</table>
        <p><a href="${e(lead.resultUrl)}">Bekijk de uitslag zoals de deelnemer die ziet</a></p>
        <pre>${e(JSON.stringify(lead.profile, null, 2))}</pre>
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
          <td style="padding:6px 12px 6px 0; color:#334155;">${e(c.category)}</td>
          <td style="padding:6px 0; text-align:right; font-weight:600; color:#0f172a;">${e(c.score)}</td>
        </tr>`,
    )
    .join("");

  const stepsList = lead.tierSteps
    .map((step) => `<li style="margin-bottom:4px;">${e(step)}</li>`)
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
        <p>Hoi ${e(lead.firstName)},</p>
        <p>Bedankt voor het invullen van de quickscan. Je score is
        <strong>${e(lead.score)}</strong> — <strong>${e(lead.tier)}</strong>.</p>
        <p style="color:#334155;">${e(lead.tierHeadline)}</p>

        <h3 style="margin-top:24px; margin-bottom:8px;">Je score per onderdeel</h3>
        <table cellpadding="0" cellspacing="0" style="width:100%; max-width:420px; border-collapse:collapse;">
          ${categoryRows}
        </table>

        <h3 style="margin-top:24px; margin-bottom:8px;">Wat dit betekent</h3>
        <p style="color:#334155;">${e(lead.tierBody)}</p>

        <h3 style="margin-top:24px; margin-bottom:8px;">De drie stappen die nu het meeste opleveren</h3>
        <ol style="color:#334155; padding-left:20px;">${stepsList}</ol>

        <h3 style="margin-top:24px; margin-bottom:8px;">Waar je het meeste laat liggen: ${e(lead.lowestCategory)}</h3>
        <p style="color:#334155;">${e(lead.lowestCategoryAdvice)}</p>

        <p style="margin-top:28px;">
          <a href="${e(lead.resultUrl)}" style="display:inline-block; background:#DF7D3C; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600;">
            Bekijk je volledige uitslag
          </a>
        </p>
      `,
    }),
  });
}
