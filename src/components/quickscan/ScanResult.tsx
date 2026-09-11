"use client";

import Script from "next/script";
import type { Scan, ScanResult } from "@/lib/quickscan/types";
import { formatPercentage } from "@/lib/quickscan/scoring";
import { CategoryRadarChart } from "./CategoryRadarChart";

interface Props {
  scan: Scan;
  result: ScanResult;
}

/**
 * Zelfde Cal.com-embed als de "Boek een intake"-knop op appwizer.com: een
 * element met data-cal-link opent de boekingsmodal via dit script. De
 * a-tag eromheen (in de JSX) is puur een fallback als het script niet laadt.
 */
const CAL_EMBED_INIT = `
(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return; } p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");
Cal("init", "quickscan", {origin:"https://cal.com"});
Cal.ns.quickscan("ui", {"styles":{"branding":{"brandColor":"#DF7D3C"}},"hideEventTypeDetails":false,"layout":"month_view"});
`;

export function ScanResultView({ scan, result }: Props) {
  const { tier, categories, lowestCategory } = result;
  const lowestCategoryText = scan.categories.find(
    (c) => c.code === lowestCategory.code,
  )?.lowScoreText;

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
          Jouw score
        </p>
        <p className="mt-2 text-5xl font-bold text-foreground sm:text-6xl">
          {formatPercentage(result.percentage)}
        </p>
        <p className="mt-4 text-xl font-semibold text-appwizer-orange">
          {tier.level}
        </p>
        <p className="mt-1 text-muted-foreground">{tier.headline}</p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-foreground sm:mt-14">
        Je score per onderdeel
      </h2>
      <div className="mt-6">
        <CategoryRadarChart categories={categories} lowestCode={lowestCategory.code} />
      </div>
      <ul className="mt-8 space-y-5">
        {categories.map((category) => (
          <li key={category.code}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-foreground">
                {category.name}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {formatPercentage(category.percentage)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className={[
                  "h-full rounded-full transition-all duration-500",
                  category.code === lowestCategory.code
                    ? "bg-appwizer-orange"
                    : "bg-appwizer-blue",
                ].join(" ")}
                style={{ width: `${Math.round(category.percentage * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-10 space-y-4 text-muted-foreground sm:mt-14">
        <p>{tier.body}</p>

        <h3 className="pt-4 font-semibold text-foreground">
          Dit herken je waarschijnlijk
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          {tier.recognise.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <h3 className="pt-4 font-semibold text-foreground">
          De drie stappen die nu het meeste opleveren
        </h3>
        <ol className="list-decimal space-y-1 pl-5">
          {tier.steps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </div>

      <div className="mt-12 rounded-xl border border-appwizer-blue/40 bg-appwizer-blue/5 p-6">
        <h3 className="font-semibold text-foreground">
          Waar je het meeste laat liggen: {lowestCategory.name}
        </h3>
        <p className="mt-3 text-muted-foreground">{lowestCategoryText}</p>
      </div>

      <div className="mt-12 rounded-xl bg-surface p-6 text-center sm:p-8">
        <p className="text-lg text-foreground">
          Wil je weten wat dit voor jouw {scan.subject} in uren en euro&apos;s
          betekent?
        </p>
        <p className="mt-2 text-muted-foreground">
          Plan een gesprek van dertig minuten. We lopen je scan langs en benoemen
          concreet welke drie stappen bij jou het meeste opleveren.
        </p>
        <a
          href="https://cal.com/appwizer/quickscan"
          target="_blank"
          rel="noopener noreferrer"
          data-cal-link="appwizer/quickscan"
          data-cal-namespace="quickscan"
          data-cal-config='{"layout":"month_view"}'
          className="mt-6 inline-block w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 sm:w-auto"
        >
          Plan een intakegesprek
        </a>
        <Script id="cal-embed-quickscan" strategy="afterInteractive">
          {CAL_EMBED_INIT}
        </Script>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Je rapport is onderweg naar je mailbox.
      </p>
    </section>
  );
}
