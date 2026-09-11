"use client";

import { useMemo, useState } from "react";
import type {
  Answers,
  LeadPayload,
  ProfileAnswers,
  Scan,
} from "@/lib/quickscan/types";
import { scoreScan } from "@/lib/quickscan/scoring";
import { LeadForm } from "./LeadForm";
import { ScanResultView } from "./ScanResult";

type Phase = "intro" | "questions" | "profile" | "lead" | "result";

interface Props {
  scan: Scan;
}

export function ScanRunner({ scan }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [profile, setProfile] = useState<ProfileAnswers>({});

  const total = scan.questions.length + scan.profileQuestions.length;
  const answered =
    Object.keys(answers).length + Object.keys(profile).length;
  const progress = Math.round((answered / total) * 100);

  const result = useMemo(() => scoreScan(scan, answers), [scan, answers]);

  function chooseAnswer(questionId: number, points: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: points }));
    // Korte vertraging zodat de selectie zichtbaar is voordat we doorschuiven.
    window.setTimeout(() => {
      if (index + 1 < scan.questions.length) {
        setIndex(index + 1);
      } else {
        setPhase("profile");
        setIndex(0);
      }
    }, 180);
  }

  function setProfileAnswer(id: string, value: string | string[]) {
    setProfile((prev) => ({ ...prev, [id]: value }));
  }

  function nextProfile() {
    if (index + 1 < scan.profileQuestions.length) {
      setIndex(index + 1);
    } else {
      setPhase("lead");
    }
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
    return (
      <section className="mx-auto max-w-2xl px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-orange">
          {scan.audience}
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          {scan.title}
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">{scan.intro}</p>
        <button
          type="button"
          onClick={() => setPhase("questions")}
          className="mt-10 w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-appwizer-orange focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
        >
          Start de scan
        </button>
        <p className="mt-4 text-sm text-muted-foreground">
          24 vragen · ongeveer 6 minuten · je uitslag zie je direct
        </p>
      </section>
    );
  }

  if (phase === "result") {
    return <ScanResultView scan={scan} result={result} />;
  }

  return (
    <section className="mx-auto max-w-2xl px-4 pt-16 pb-10 sm:px-6 sm:pt-16 sm:pb-12">
      <ProgressBar value={phase === "lead" ? 100 : progress} />

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
          index={index}
          profile={profile}
          onAnswer={setProfileAnswer}
          onNext={nextProfile}
          onBack={back}
        />
      )}

      {phase === "lead" && (
        <LeadForm
          onSubmit={async (lead) => {
            const payload: LeadPayload = {
              ...lead,
              scanSlug: scan.slug,
              answers,
              profile,
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
            setPhase("result");
          }}
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
  index,
  profile,
  onAnswer,
  onNext,
  onBack,
}: {
  scan: Scan;
  index: number;
  profile: ProfileAnswers;
  onAnswer: (id: string, value: string | string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const question = scan.profileQuestions[index];
  const value = profile[question.id];

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
        Nog een paar vragen over je {scan.subject}
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
          {index + 1 < scan.profileQuestions.length ? "Volgende" : "Naar mijn uitslag"}
        </button>
      </div>
    </div>
  );
}
