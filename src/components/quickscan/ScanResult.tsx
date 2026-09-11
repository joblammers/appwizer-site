"use client";

import { useState } from "react";
import type { Answers, Scan, ScanResult } from "@/lib/quickscan/types";
import { formatPercentage, MAX_POINTS_PER_QUESTION } from "@/lib/quickscan/scoring";
import { Modal } from "@/components/Modal";
import { CalBookingLink } from "@/components/CalBookingLink";
import { CategoryRadarChart } from "./CategoryRadarChart";

/** Rood (0%) via geel naar groen (100%), zelfde toon/verzadiging voor een consistente gradient. */
function ratingColor(fraction: number): string {
  const hue = Math.max(0, Math.min(1, fraction)) * 120;
  return `hsl(${hue} 70% 45%)`;
}

interface Props {
  scan: Scan;
  result: ScanResult;
  answers: Answers;
}

export function ScanResultView({ scan, result, answers }: Props) {
  const { tier, categories, lowestCategory } = result;
  const lowestCategoryText = scan.categories.find(
    (c) => c.code === lowestCategory.code,
  )?.lowScoreText;

  const [zoomed, setZoomed] = useState(false);

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
        <CalBookingLink
          label="Boek een intakegesprek"
          className="mt-6 inline-block w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 sm:w-auto"
        />
      </div>

      <h2 className="mt-10 text-xl font-semibold text-foreground sm:mt-14">
        Je score per onderdeel
      </h2>
      <div className="relative mt-6">
        <CategoryRadarChart
          categories={categories}
          lowestCode={lowestCategory.code}
          onClick={() => setZoomed(true)}
          className="mx-auto w-full max-w-xl"
          large
        />
        <button
          type="button"
          onClick={() => setZoomed(true)}
          aria-label="Vergroot het diagram"
          className="absolute right-0 top-0 rounded-full border border-border bg-surface p-2 text-muted-foreground transition hover:border-appwizer-orange hover:text-foreground"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4">
            <circle
              cx="8.5"
              cy="8.5"
              r="5.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            />
            <path
              d="M12.5 12.5 17 17"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
            <path
              d="M8.5 6v5M6 8.5h5"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {zoomed && (
        <Modal
          onClose={() => setZoomed(false)}
          ariaLabel="Vergroot spiderweb-diagram"
          maxWidthClassName="max-w-xl"
        >
          <CategoryRadarChart
            categories={categories}
            lowestCode={lowestCategory.code}
            className="mx-auto w-full max-w-none"
            large
          />
        </Modal>
      )}

      <ul className="mt-8 space-y-3">
        {categories.map((category) => {
          const questions = scan.questions.filter(
            (q) => q.category === category.code,
          );
          return (
            <li key={category.code}>
              <details className="group rounded-lg border border-border bg-surface open:pb-2">
                <summary className="cursor-pointer list-none px-4 py-3 sm:px-5">
                  <span className="sr-only">Toon of verberg de gegeven antwoorden</span>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
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
                          style={{
                            width: `${Math.round(category.percentage * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
                    >
                      <path
                        d="M5 7.5 10 12.5 15 7.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </summary>

                <ul className="mt-1 space-y-3 border-t border-border px-4 pt-3 sm:px-5">
                  {questions.map((question) => {
                    const chosen = question.options.find(
                      (o) => o.points === answers[question.id],
                    );
                    const fraction = chosen
                      ? chosen.points / MAX_POINTS_PER_QUESTION
                      : 0;
                    return (
                      <li key={question.id}>
                        <p className="text-sm text-foreground">
                          {question.text}
                        </p>
                        <div className="mt-1 flex items-baseline justify-between gap-3">
                          <p className="text-sm text-muted-foreground">
                            {chosen ? chosen.label : "Niet beantwoord"}
                          </p>
                          {chosen && (
                            <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                              {formatPercentage(fraction)}
                            </span>
                          )}
                        </div>
                        {chosen && (
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${fraction * 100}%`,
                                backgroundColor: ratingColor(fraction),
                              }}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </details>
            </li>
          );
        })}
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
        <CalBookingLink
          label="Boek een intakegesprek"
          className="mt-6 inline-block w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 sm:w-auto"
        />
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Je rapport is onderweg naar je mailbox.
      </p>
    </section>
  );
}
