"use client";

import { useState } from "react";

export interface LeadFields {
  firstName: string;
  email: string;
  company: string;
  phone?: string;
  consent: boolean;
}

interface Props {
  onSubmit: (lead: LeadFields) => Promise<void>;
}

export function LeadForm({ onSubmit }: Props) {
  const [fields, setFields] = useState<LeadFields>({
    firstName: "",
    email: "",
    company: "",
    phone: "",
    consent: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof LeadFields>(key: K, value: LeadFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!fields.firstName.trim()) return setError("Vul je voornaam in.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      return setError("Vul een geldig e-mailadres in.");
    if (!fields.company.trim()) return setError("Vul de naam van je organisatie in.");
    if (!fields.consent) return setError("Zet een vinkje om je rapport te ontvangen.");

    setError(null);
    setBusy(true);
    await onSubmit(fields);
    setBusy(false);
  }

  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-appwizer-orange focus:outline-none";

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
        Je scan is klaar
      </h2>
      <p className="mt-3 text-muted-foreground">
        Vul je gegevens in om je score en je persoonlijke verbeterrapport te bekijken.
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
        disabled={busy}
        className="mt-8 w-full rounded-lg bg-appwizer-orange px-8 py-4 text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {busy ? "Moment…" : "Bekijk mijn uitslag"}
      </button>
    </div>
  );
}
