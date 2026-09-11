"use client";

import { useState } from "react";
import type { ProfileQuestion } from "@/lib/quickscan/types";

export interface LeadFields {
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  consent: boolean;
}

interface Props {
  /** Vragen met section === "contact" — bv. het type organisatie, gevraagd samen met de contactgegevens. */
  extraQuestions: ProfileQuestion[];
  onSubmit: (lead: LeadFields, extraAnswers: Record<string, string>) => void;
}

export function LeadForm({ extraQuestions, onSubmit }: Props) {
  const [fields, setFields] = useState<LeadFields>({
    firstName: "",
    email: "",
    company: "",
    phone: "",
    consent: false,
  });
  const [extraAnswers, setExtraAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof LeadFields>(key: K, value: LeadFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!fields.firstName.trim()) return setError("Vul je voornaam in.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return setError("Vul een geldig e-mailadres in.");
    if (!fields.company.trim()) return setError("Vul de naam van je organisatie in.");
    for (const q of extraQuestions) {
      if (!extraAnswers[q.id]) return setError(`Beantwoord: "${q.text}"`);
    }
    if (!fields.consent) return setError("Zet een vinkje om je rapport te ontvangen.");

    setError(null);
    onSubmit(fields, extraAnswers);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-appwizer-orange focus:outline-none";

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
        Voordat je begint
      </h2>
      <p className="mt-3 text-muted-foreground">
        We sturen je score en verbeterrapport hierheen zodra je klaar bent.
      </p>

      <div className="mt-8 space-y-4">
        <input
          className={inputClass}
          placeholder="Voornaam"
          autoComplete="given-name"
          value={fields.firstName}
          onChange={(e) => update("firstName", e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Zakelijk e-mailadres"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={(e) => update("email", e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Organisatienaam"
          autoComplete="organization"
          value={fields.company}
          onChange={(e) => update("company", e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Telefoonnummer (optioneel)"
          type="tel"
          autoComplete="tel"
          value={fields.phone}
          onChange={(e) => update("phone", e.target.value)}
        />

        {extraQuestions.map((q) => (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium text-foreground">{q.text}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {q.options?.map((option) => {
                const isSelected = extraAnswers[q.id] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setExtraAnswers((prev) => ({ ...prev, [q.id]: option }))
                    }
                    aria-pressed={isSelected}
                    className={[
                      "rounded-lg border px-4 py-2.5 text-left text-sm transition",
                      isSelected
                        ? "border-appwizer-orange bg-appwizer-orange/10 text-foreground"
                        : "border-border bg-surface text-foreground hover:border-appwizer-blue hover:bg-surface-hover",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <label className="flex items-start gap-3 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={fields.consent}
            onChange={(e) => update("consent", e.target.checked)}
            className="mt-1 h-4 w-4 accent-appwizer-orange"
          />
          <span>
            Ja, stuur mij mijn rapport en de verdiepende inzichten per e-mail. Zie de{" "}
            <a
              href="https://appwizer.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              privacyverklaring
            </a>
            .
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-appwizer-orange">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        className="mt-8 w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110"
      >
        Start de scan
      </button>
    </div>
  );
}
