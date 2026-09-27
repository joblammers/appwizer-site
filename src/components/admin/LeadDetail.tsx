import Link from "next/link";
import type { Scan } from "@/lib/quickscan/types";
import type { LeadDetail as LeadDetailData } from "@/lib/quickscan/leads";
import { findTier, formatPercentage, maxPointsForQuestion } from "@/lib/quickscan/scoring";
import { CategoryRadarChart } from "@/components/quickscan/CategoryRadarChart";
import { ScoreBadge } from "@/components/quickscan/ScoreBadge";
import { ScoreThermometer } from "@/components/quickscan/ScoreThermometer";

/** Rood (0%) via geel naar groen (100%) — zelfde schaal als op de resultaatpagina van de deelnemer. */
function ratingColor(fraction: number): string {
  const hue = Math.max(0, Math.min(1, fraction)) * 120;
  return `hsl(${hue} 70% 45%)`;
}

interface Props {
  scan: Scan;
  lead: LeadDetailData;
}

/**
 * De ingevulde scan van één deelnemer ("entered scan") — niet te verwarren
 * met /admin/[slug], dat het scan-sjabloon bewerkt. Hergebruikt dezelfde
 * radar-chart en rood-groen antwoorddrill-down als de resultaatpagina van de
 * deelnemer, maar dan met de opgeslagen data van deze ene inzending.
 */
export function LeadDetail({ scan, lead }: Props) {
  const categories = lead.categoryScores;

  const sections = new Map<string, typeof scan.profileQuestions>();
  for (const q of scan.profileQuestions) {
    if (q.section === "contact") continue;
    const key = q.section || "Profiel";
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(q);
  }

  const profileSection = sections.size > 0 && (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-foreground">Profiel</h2>
      <div className="mt-4 space-y-6">
        {Array.from(sections.entries()).map(([section, questions]) => (
          <div key={section}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section}
            </h3>
            <dl className="mt-2 space-y-2">
              {questions.map((q) => {
                const value = lead.profile[q.id];
                const display = Array.isArray(value) ? value.join(", ") : value;
                return (
                  <div key={q.id} className="text-sm">
                    <dt className="text-muted-foreground">{q.text}</dt>
                    <dd className="text-foreground">{display || "—"}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );

  const header = (
    <>
      <Link
        href="/admin"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Terug naar overzicht
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{lead.company}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {scan.title} · gestart op{" "}
            {new Date(lead.createdAt).toLocaleDateString("nl-NL", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p className="text-foreground">{lead.firstName}</p>
          <p>{lead.email}</p>
          {lead.phone && <p>{lead.phone}</p>}
        </div>
      </div>
    </>
  );

  // Contactgegevens zijn er al (vandaar deze pagina), maar de scorevragen
  // zijn nog niet af — geen score, radar-chart of antwoorddrill-down om te
  // tonen, dus alleen wat er al wél is: contact + eventueel profiel-antwoorden.
  if (!lead.completed || lead.percentage === null || categories.length === 0) {
    return (
      <div>
        {header}
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-6 text-center sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Nog niet afgerond
          </p>
          <p className="mt-2 text-muted-foreground">
            Deze deelnemer heeft de contactgegevens ingevuld, maar de scan nog niet
            afgemaakt.
          </p>
        </div>
        {profileSection}
      </div>
    );
  }

  const lowestCategory = categories.reduce((min, c) =>
    c.percentage < min.percentage ? c : min,
  );
  const tier = findTier(scan, lead.percentage);
  const lowestCategoryText = scan.categories.find(
    (c) => c.code === lowestCategory.code,
  )?.lowScoreText;

  return (
    <div>
      {header}

      <div className="mt-6 rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
        <ScoreThermometer fraction={lead.percentage} label="Totaalscore" />
        <p className="mt-4 text-xl font-semibold text-appwizer-orange">{tier.level}</p>
        <p className="mt-1 text-muted-foreground">{tier.headline}</p>
      </div>

      <h2 className="mt-10 text-xl font-semibold text-foreground">Score per onderdeel</h2>
      <CategoryRadarChart
        categories={categories}
        lowestCode={lowestCategory.code}
        className="mx-auto mt-6 w-full max-w-xl"
        large
      />

      <ul className="mt-8 space-y-3">
        {categories.map((category) => {
          const questions = scan.questions.filter((q) => q.category === category.code);
          const categoryIcon = scan.categories.find((c) => c.code === category.code)?.icon;
          return (
            <li key={category.code}>
              <details className="group rounded-lg border border-border bg-surface open:pb-2">
                <summary className="cursor-pointer list-none px-4 py-3 sm:px-5">
                  <span className="sr-only">Toon of verberg de gegeven antwoorden</span>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-foreground">
                          {categoryIcon && <span className="mr-1.5">{categoryIcon}</span>}
                          {category.name}
                        </span>
                        <ScoreBadge fraction={category.percentage} />
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
                      (o) => o.points === lead.answers[question.id],
                    );
                    const fraction = chosen ? chosen.points / maxPointsForQuestion(question) : 0;
                    return (
                      <li key={question.id}>
                        <p className="text-sm text-foreground">{question.text}</p>
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

      <div className="mt-12 rounded-xl border border-appwizer-blue/40 bg-appwizer-blue/5 p-6">
        <h3 className="font-semibold text-foreground">
          Laagst scorende onderdeel: {lowestCategory.name}
        </h3>
        <p className="mt-3 text-muted-foreground">{lowestCategoryText}</p>
      </div>

      {profileSection}
    </div>
  );
}
