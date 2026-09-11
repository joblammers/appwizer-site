"use client";

import { useMemo, useState } from "react";
import type {
  Answers,
  LeadPayload,
  ProfileAnswers,
  ProfileQuestion,
  Scan,
} from "@/lib/quickscan/types";
import { scoreScan } from "@/lib/quickscan/scoring";
import { LeadForm, type LeadFields } from "./LeadForm";
import { ScanResultView } from "./ScanResult";
import { IntroContent } from "./IntroContent";

type Phase = "intro" | "contact" | "questions" | "profile" | "result";

interface Props {
  scan: Scan;
  /** Antwoorden uit een gedeelde resultaatlink (bv. uit de rapport-mail) — toont direct de uitslag. */
  initialAnswers?: Answers | null;
}

export function ScanRunner({ scan, initialAnswers }: Props) {
  const [phase, setPhase] = useState<Phase>(initialAnswers ? "result" : "intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers ?? {});
  const [profile, setProfile] = useState<ProfileAnswers>({});
  const [lead, setLead] = useState<LeadFields | null>(null);

  // "contact"-vragen (bv. type organisatie) horen bij de bedrijfsgegevens
  // vooraf; de rest blijft de profielfase ná de scorevragen.
  const contactQuestions = useMemo(
    () => scan.profileQuestions.filter((q) => q.section === "contact"),
    [scan.profileQuestions],
  );
  const laterProfileQuestions = useMemo(
    () => scan.profileQuestions.filter((q) => q.section !== "contact"),
    [scan.profileQuestions],
  );

  const total = scan.questions.length + laterProfileQuestions.length;
  const answered =
    Object.keys(answers).length +
    laterProfileQuestions.filter((q) => profile[q.id] !== undefined).length;
  const progress = Math.round((answered / total) * 100);

  const result = useMemo(() => scoreScan(scan, answers), [scan, answers]);

  function startQuestions(fields: LeadFields, extraAnswers: Record<string, string>) {
    setLead(fields);
    setProfile((prev) => ({ ...prev, ...extraAnswers }));
    setPhase("questions");
    setIndex(0);
  }

  function chooseAnswer(questionId: number, points: number) {
    // Bewust niet de functionele setState-vorm: we hebben de bijgewerkte
    // antwoorden direct nodig voor submitLead() hierna, en die loopt in een
    // setTimeout — daar zou de closure over de oude `answers` nog de net
    // gegeven laatste keuze missen.
    const updatedAnswers = { ...answers, [questionId]: points };
    setAnswers(updatedAnswers);
    // Korte vertraging zodat de selectie zichtbaar is voordat we doorschuiven.
    window.setTimeout(() => {
      if (index + 1 < scan.questions.length) {
        setIndex(index + 1);
      } else if (laterProfileQuestions.length > 0) {
        setPhase("profile");
        setIndex(0);
      } else {
        submitLead(updatedAnswers, profile);
      }
    }, 180);
  }

  function setProfileAnswer(id: string, value: string | string[]) {
    setProfile((prev) => ({ ...prev, [id]: value }));
  }

  function nextProfile() {
    if (index + 1 < laterProfileQuestions.length) {
      setIndex(index + 1);
    } else {
      submitLead(answers, profile);
    }
  }

  async function submitLead(finalAnswers: Answers, finalProfile: ProfileAnswers) {
    if (lead) {
      const payload: LeadPayload = {
        ...lead,
        scanSlug: scan.slug,
        answers: finalAnswers,
        profile: finalProfile,
      };
      try {
        await fetch("/api/quickscan/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // De uitslag tonen we hoe dan ook; een mislukte lead-registratie
        // mag de deelnemer nooit blokkeren.
      }
    }
    setPhase("result");
  }

  function back() {
    if (phase === "questions" && index > 0) setIndex(index - 1);
    else if (phase === "profile" && index > 0) setIndex(index - 1);
    else if (phase === "profile") {
      setPhase("questions");
      setIndex(scan.questions.length - 1);
    }
  }

  if (phase === "intro") {
    const introBody = (
      <>
        <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-orange">
          {scan.audience}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          {scan.title}
        </h1>
        <div className="mt-6">
          <IntroContent text={scan.intro} />
        </div>
        <button
          type="button"
          onClick={() => setPhase("contact")}
          className="mt-10 w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-appwizer-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Start de scan
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          24 vragen · ongeveer 6 minuten · je uitslag zie je direct
        </p>
      </>
    );

    if (scan.introImage) {
      return (
        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-8 text-center sm:flex-row sm:items-center sm:text-left">
            <img
              src={scan.introImage}
              alt=""
              className="mx-auto w-48 shrink-0 rounded-2xl object-cover sm:mx-0 sm:w-64"
            />
            <div>{introBody}</div>
          </div>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
        {introBody}
      </section>
    );
  }

  if (phase === "contact") {
    return (
      <section className="mx-auto max-w-2xl px-4 pt-16 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
        <LeadForm extraQuestions={contactQuestions} onSubmit={startQuestions} />
      </section>
    );
  }

  if (phase === "result") {
    return <ScanResultView scan={scan} result={result} answers={answers} />;
  }

  return (
    <section className="mx-auto max-w-2xl px-4 pt-16 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
      <ProgressBar value={progress} />

      {phase === "questions" && (
        <QuestionStep
          scan={scan}
          index={index}
          answers={answers}
          onChoose={chooseAnswer}
          onBack={back}
        />
      )}

      {phase === "profile" && (
        <ProfileStep
          scan={scan}
          questions={laterProfileQuestions}
          index={index}
          profile={profile}
          onAnswer={setProfileAnswer}
          onNext={nextProfile}
          onBack={back}
        />
      )}
    </section>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mb-8 sm:mb-10">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-appwizer-orange transition-all duration-300"
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs text-muted-foreground">{value}%</p>
    </div>
  );
}

function BackButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center gap-1.5 rounded-lg bg-appwizer-orange px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-appwizer-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span aria-hidden="true">←</span>
      Vorige vraag
    </button>
  );
}

function QuestionStep({
  scan,
  index,
  answers,
  onChoose,
  onBack,
}: {
  scan: Scan;
  index: number;
  answers: Answers;
  onChoose: (id: number, points: number) => void;
  onBack: () => void;
}) {
  const question = scan.questions[index];
  const category = scan.categories.find((c) => c.code === question.category);
  const selected = answers[question.id];

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
        {category?.icon && <span className="mr-1.5">{category.icon}</span>}
        {category?.name}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
        {index + 1}. {question.text}
      </h2>

      <ul className="mt-6 space-y-3 sm:mt-8">
        {question.options.map((option) => {
          const isSelected = selected === option.points;
          return (
            <li key={option.points}>
              <button
                type="button"
                onClick={() => onChoose(question.id, option.points)}
                aria-pressed={isSelected}
                className={[
                  "w-full rounded-lg border px-4 py-3.5 text-left text-base transition sm:px-5 sm:py-4",
                  isSelected
                    ? "border-appwizer-orange bg-appwizer-orange/10 text-foreground"
                    : "border-border bg-surface text-foreground hover:border-appwizer-blue hover:bg-surface-hover",
                ].join(" ")}
              >
                {option.label}
              </button>
            </li>
          );
        })}
      </ul>

      {index > 0 && <BackButton onClick={onBack} className="mt-8" />}
    </div>
  );
}

function ProfileStep({
  scan,
  questions,
  index,
  profile,
  onAnswer,
  onNext,
  onBack,
}: {
  scan: Scan;
  questions: ProfileQuestion[];
  index: number;
  profile: ProfileAnswers;
  onAnswer: (id: string, value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const question = questions[index];
  const value = profile[question.id];
  const eyebrow = question.section || `Nog een paar vragen over je ${scan.subject}`;

  function toggleMulti(option: string) {
    const current = Array.isArray(value) ? value : [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    onAnswer(question.id, next);
  }

  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">
        {question.text}
      </h2>

      {question.type === "text" ? (
        <textarea
          rows={4}
          maxLength={300}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onAnswer(question.id, e.target.value)}
          className="mt-6 w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-appwizer-orange focus:outline-none sm:mt-8"
          placeholder="Optioneel — in je eigen woorden"
        />
      ) : (
        <ul className="mt-6 space-y-3 sm:mt-8">
          {question.options?.map((option) => {
            const isSelected =
              question.type === "multi"
                ? Array.isArray(value) && value.includes(option)
                : value === option;
            return (
              <li key={option}>
                <button
                  type="button"
                  onClick={() =>
                    question.type === "multi"
                      ? toggleMulti(option)
                      : onAnswer(question.id, option)
                  }
                  aria-pressed={isSelected}
                  className={[
                    "w-full rounded-lg border px-4 py-3.5 text-left text-base transition sm:px-5 sm:py-4",
                    isSelected
                      ? "border-appwizer-orange bg-appwizer-orange/10 text-foreground"
                      : "border-border bg-surface text-foreground hover:border-appwizer-blue hover:bg-surface-hover",
                  ].join(" ")}
                >
                  {option}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-8 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
        <BackButton onClick={onBack} />
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-appwizer-orange px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {index + 1 < questions.length ? "Volgende" : "Naar mijn uitslag"}
        </button>
      </div>
    </div>
  );
}
