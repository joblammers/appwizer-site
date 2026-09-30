"use client";

import { useMemo, useState, useTransition } from "react";
import { normalizeDomain, type ClientCase } from "@/lib/cases";
import { deleteCaseAction, saveCaseAction } from "@/app/(site)/admin/case-actions";

interface Props {
  cases: ClientCase[];
}

type FormValues = Omit<ClientCase, "id">;

const EMPTY_FORM: FormValues = {
  client: "",
  location: "",
  period: "",
  duration: "",
  sector: "",
  descriptionNl: "",
  descriptionEn: "",
  applications: [],
  domain: "",
};

export function CaseList({ cases }: Props) {
  const [adding, setAdding] = useState(false);
  const [clientFilter, setClientFilter] = useState("");
  const [applicationFilter, setApplicationFilter] = useState("");

  const applications = useMemo(
    () => Array.from(new Set(cases.flatMap((c) => c.applications))).sort((a, b) => a.localeCompare(b)),
    [cases],
  );

  const filtered = cases.filter((c) => {
    const matchesClient = c.client.toLowerCase().includes(clientFilter.trim().toLowerCase());
    const matchesApplication = !applicationFilter || c.applications.includes(applicationFilter);
    return matchesClient && matchesApplication;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm">
          <span className="mb-1 block font-medium text-foreground">Zoek op klant</span>
          <input
            type="text"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            placeholder="Bv. Kruitbosch"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-appwizer-orange focus:outline-none"
          />
        </label>
        <label className="block flex-1 text-sm">
          <span className="mb-1 block font-medium text-foreground">Filter op applicatie</span>
          <select
            value={applicationFilter}
            onChange={(e) => setApplicationFilter(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-appwizer-orange focus:outline-none"
          >
            <option value="">Alle applicaties</option>
            {applications.map((app) => (
              <option key={app} value={app}>
                {app}
              </option>
            ))}
          </select>
        </label>
      </div>

      {adding ? (
        <div className="rounded-xl border border-border bg-surface p-5">
          <CaseForm
            id={null}
            initial={EMPTY_FORM}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange"
        >
          + Nieuwe klantcase
        </button>
      )}

      {filtered.map((c) => (
        <CaseRow key={c.id} clientCase={c} />
      ))}
      {filtered.length === 0 && !adding && (
        <p className="text-muted-foreground">
          {cases.length === 0 ? "Nog geen klantcases." : "Geen klantcases die aan het filter voldoen."}
        </p>
      )}
    </div>
  );
}

function CaseRow({ clientCase }: { clientCase: ClientCase }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(`Klantcase "${clientCase.client}" definitief verwijderen?`)) return;
    startTransition(async () => {
      await deleteCaseAction(clientCase.id);
    });
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <CaseForm
          id={clientCase.id}
          initial={clientCase}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-appwizer-blue">
            {clientCase.sector}
          </p>
          <p className="text-lg font-semibold text-foreground">{clientCase.client}</p>
          <p className="text-sm text-muted-foreground">
            {clientCase.location} · {clientCase.period} · {clientCase.duration}
          </p>
          {clientCase.applications.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {clientCase.applications.join(", ")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange"
          >
            Bewerken
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:border-appwizer-orange hover:text-appwizer-orange disabled:opacity-60"
          >
            Verwijderen
          </button>
        </div>
      </div>
    </div>
  );
}

function CaseForm({
  id,
  initial,
  onDone,
  onCancel,
}: {
  id: number | null;
  initial: FormValues;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [applicationsText, setApplicationsText] = useState(initial.applications.join(", "));
  const [errors, setErrors] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function field<K extends keyof FormValues>(key: K) {
    return {
      value: values[key] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues((v) => ({ ...v, [key]: e.target.value })),
    };
  }

  function submit() {
    setErrors([]);
    const applications = applicationsText
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await saveCaseAction(id, {
        ...values,
        applications,
        domain: normalizeDomain(values.domain),
      });
      if (!result.ok) {
        setErrors(result.errors);
        return;
      }
      onDone();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <LabeledInput label="Klant" {...field("client")} />
        <LabeledInput label="Plaats" {...field("location")} />
        <LabeledInput label="Periode" {...field("period")} placeholder="2026 – heden" />
        <LabeledInput label="Duur" {...field("duration")} placeholder="Lopend" />
        <LabeledInput label="Sector" {...field("sector")} />
        <LabeledInput
          label="Applicaties (komma-gescheiden)"
          value={applicationsText}
          onChange={(e) => setApplicationsText(e.target.value)}
          placeholder="Oracle NetSuite, SuiteScript"
        />
        <LabeledInput
          label="Domein (voor logo)"
          {...field("domain")}
          placeholder="optiver.com"
        />
      </div>
      <LabeledTextarea label="Beschrijving (NL)" {...field("descriptionNl")} />
      <LabeledTextarea label="Beschrijving (EN)" {...field("descriptionEn")} />

      {errors.length > 0 && (
        <p role="alert" className="text-sm text-appwizer-orange">
          {errors.join(" ")}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={isPending}
          className="rounded-lg bg-appwizer-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Bezig…" : "Opslaan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Annuleren
        </button>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-appwizer-orange focus:outline-none"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">{label}</span>
      <textarea
        {...props}
        rows={2}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-appwizer-orange focus:outline-none"
      />
    </label>
  );
}
