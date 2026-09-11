"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Category,
  ProfileQuestion,
  ProfileQuestionType,
  Question,
  Scan,
  Tier,
} from "@/lib/quickscan/types";
import { validateScan } from "@/lib/quickscan/validate";
import { deleteScanAction, saveScanAction } from "@/app/admin/actions";

interface Props {
  scan: Scan;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-appwizer-orange focus:outline-none";
const labelClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const cardClass = "rounded-xl border border-border bg-surface p-5";
const buttonSecondary =
  "rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:border-appwizer-orange";
const buttonGhost =
  "text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground";

function nextId(items: { id: number }[]): number {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

export function ScanEditor({ scan: initialScan }: Props) {
  const router = useRouter();
  const previousSlug = useRef(initialScan.slug).current;
  const [scan, setScan] = useState<Scan>(initialScan);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showJson, setShowJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const liveErrors = useMemo(() => validateScan(scan), [scan]);

  function update<K extends keyof Scan>(key: K, value: Scan[K]) {
    setScan((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function save() {
    setSaved(false);
    const checked = validateScan(scan);
    if (checked.length > 0) {
      setErrors(checked);
      return;
    }
    startTransition(async () => {
      const result = await saveScanAction(scan, previousSlug);
      if (result.ok) {
        setErrors([]);
        setSaved(true);
        if (scan.slug !== previousSlug) router.replace(`/admin/${scan.slug}`);
        router.refresh();
      } else {
        setErrors(result.errors);
      }
    });
  }

  function remove() {
    if (!window.confirm(`Scan "${scan.title}" definitief verwijderen?`)) return;
    startTransition(async () => {
      await deleteScanAction(previousSlug);
    });
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(scan, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scan.slug || "scan"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Scan;
        setScan(parsed);
        setErrors([]);
        setSaved(false);
      } catch {
        setErrors(["Kon het JSON-bestand niet lezen — is het geldig JSON?"]);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">
          {initialScan.title}
        </h1>
        <button type="button" onClick={remove} className={buttonGhost}>
          Verwijderen
        </button>
      </div>

      <section className={cardClass}>
        <h2 className="font-semibold text-foreground">Basisgegevens</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Slug">
            <input
              className={inputClass}
              value={scan.slug}
              onChange={(e) => update("slug", e.target.value)}
            />
          </Field>
          <Field label="Doelgroep (audience)">
            <input
              className={inputClass}
              value={scan.audience}
              onChange={(e) => update("audience", e.target.value)}
            />
          </Field>
          <Field label="Titel">
            <input
              className={inputClass}
              value={scan.title}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <Field label="Subtitel">
            <input
              className={inputClass}
              value={scan.subtitle}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </Field>
          <Field label="Onderwerp (subject, bv. 'organisatie')">
            <input
              className={inputClass}
              value={scan.subject}
              onChange={(e) => update("subject", e.target.value)}
            />
          </Field>
          <Field label="Introafbeelding (URL, optioneel)">
            <input
              className={inputClass}
              value={scan.introImage ?? ""}
              placeholder="https://..."
              onChange={(e) => update("introImage", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Intro" className="mt-4">
          <textarea
            rows={5}
            className={inputClass}
            value={scan.intro}
            onChange={(e) => update("intro", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Lege regel = nieuwe alinea. Regels die beginnen met &quot;- &quot;
            worden een opsommingslijst.
          </p>
        </Field>
      </section>

      <CategoriesSection
        categories={scan.categories}
        onChange={(categories) => update("categories", categories)}
      />

      <QuestionsSection
        questions={scan.questions}
        categories={scan.categories}
        onChange={(questions) => update("questions", questions)}
      />

      <ProfileQuestionsSection
        profileQuestions={scan.profileQuestions}
        onChange={(profileQuestions) => update("profileQuestions", profileQuestions)}
      />

      <TiersSection tiers={scan.tiers} onChange={(tiers) => update("tiers", tiers)} />

      <section className={cardClass}>
        <button
          type="button"
          onClick={() => setShowJson((v) => !v)}
          className="font-semibold text-foreground"
        >
          {showJson ? "▾" : "▸"} Geavanceerd — JSON importeren/exporteren
        </button>
        {showJson && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Handig voor bulkbewerking of een back-up: exporteer de volledige
              scan als JSON-bestand, bewerk het extern, en importeer het
              daarna weer. Dit vervangt alle velden hierboven.
            </p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportJson} className={buttonSecondary}>
                Downloaden als JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={buttonSecondary}
              >
                JSON-bestand uploaden
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importJson(file);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        )}
      </section>

      {liveErrors.length > 0 && (
        <div className="rounded-lg border border-appwizer-orange/40 bg-appwizer-orange/5 p-4">
          <p className="text-sm font-semibold text-foreground">
            Nog op te lossen voor opslaan kan:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {liveErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-appwizer-orange/40 bg-appwizer-orange/5 p-4">
          <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-4 flex items-center gap-4 rounded-xl border border-border bg-surface/95 p-4 backdrop-blur">
        <button
          type="button"
          onClick={save}
          disabled={isPending || liveErrors.length > 0}
          className="rounded-lg bg-appwizer-orange px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {isPending ? "Opslaan…" : "Opslaan"}
        </button>
        {saved && <span className="text-sm text-muted-foreground">Opgeslagen.</span>}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["block", className].filter(Boolean).join(" ")}>
      <span className={labelClass}>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function IconButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-appwizer-orange hover:text-appwizer-orange"
    >
      {children}
    </button>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2">
          <input
            className={inputClass}
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              onChange(next);
            }}
          />
          <IconButton onClick={() => onChange(items.filter((_, i) => i !== index))}>
            Verwijder
          </IconButton>
        </div>
      ))}
      <IconButton onClick={() => onChange([...items, ""])}>+ Regel toevoegen</IconButton>
    </div>
  );
}

function CategoriesSection({
  categories,
  onChange,
}: {
  categories: Category[];
  onChange: (categories: Category[]) => void;
}) {
  const weightSum = categories.reduce((sum, c) => sum + c.weight, 0);

  function updateAt(index: number, patch: Partial<Category>) {
    const next = [...categories];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...categories,
      { code: `categorie-${categories.length + 1}`, name: "", weight: 0, lowScoreText: "", icon: "" },
    ]);
  }

  return (
    <section className={cardClass}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Categorieën</h2>
        <span
          className={
            Math.abs(weightSum - 1) > 0.001
              ? "text-sm font-medium text-appwizer-orange"
              : "text-sm text-muted-foreground"
          }
        >
          Som wegingen: {weightSum.toFixed(2)} (moet 1 zijn)
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {categories.map((category, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-[80px_1fr_2fr_120px_auto] sm:items-end">
              <Field label="Icoon">
                <input
                  className={inputClass}
                  value={category.icon ?? ""}
                  placeholder="📥"
                  onChange={(e) => updateAt(index, { icon: e.target.value })}
                />
              </Field>
              <Field label="Code">
                <input
                  className={inputClass}
                  value={category.code}
                  onChange={(e) => updateAt(index, { code: e.target.value })}
                />
              </Field>
              <Field label="Naam">
                <input
                  className={inputClass}
                  value={category.name}
                  onChange={(e) => updateAt(index, { name: e.target.value })}
                />
              </Field>
              <Field label="Weging">
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  className={inputClass}
                  value={category.weight}
                  onChange={(e) => updateAt(index, { weight: Number(e.target.value) })}
                />
              </Field>
              <IconButton onClick={() => onChange(categories.filter((_, i) => i !== index))}>
                Verwijder
              </IconButton>
            </div>
            <Field label="Tekst bij laagste score" className="mt-3">
              <textarea
                rows={2}
                className={inputClass}
                value={category.lowScoreText}
                onChange={(e) => updateAt(index, { lowScoreText: e.target.value })}
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <IconButton onClick={add}>+ Categorie toevoegen</IconButton>
      </div>
    </section>
  );
}

function QuestionsSection({
  questions,
  categories,
  onChange,
}: {
  questions: Question[];
  categories: Category[];
  onChange: (questions: Question[]) => void;
}) {
  function updateAt(index: number, patch: Partial<Question>) {
    const next = [...questions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function updateOptionLabel(qIndex: number, oIndex: number, label: string) {
    const question = questions[qIndex];
    const options = [...question.options];
    options[oIndex] = { ...options[oIndex], label };
    updateAt(qIndex, { options });
  }

  function updateOptionPoints(qIndex: number, oIndex: number, points: number) {
    const question = questions[qIndex];
    const options = [...question.options];
    options[oIndex] = { ...options[oIndex], points };
    updateAt(qIndex, { options });
  }

  function addOption(qIndex: number) {
    const question = questions[qIndex];
    const maxPoints = Math.max(0, ...question.options.map((o) => o.points));
    updateAt(qIndex, {
      options: [...question.options, { points: maxPoints + 1, label: "" }],
    });
  }

  function removeOption(qIndex: number, oIndex: number) {
    const question = questions[qIndex];
    if (question.options.length <= 2) return;
    updateAt(qIndex, { options: question.options.filter((_, i) => i !== oIndex) });
  }

  function add() {
    onChange([
      ...questions,
      {
        id: nextId(questions),
        category: categories[0]?.code ?? "",
        text: "",
        options: [0, 1, 2, 3].map((points) => ({ points, label: "" })),
      },
    ]);
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold text-foreground">
        Vragen ({questions.length})
      </h2>

      <div className="mt-4 space-y-4">
        {questions.map((question, qIndex) => (
          <details key={question.id} className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {question.id}. {question.text || "(geen tekst)"}
            </summary>

            <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr]">
              <Field label="Vraagtekst">
                <input
                  className={inputClass}
                  value={question.text}
                  onChange={(e) => updateAt(qIndex, { text: e.target.value })}
                />
              </Field>
              <Field label="Categorie">
                <select
                  className={inputClass}
                  value={question.category}
                  onChange={(e) => updateAt(qIndex, { category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name || c.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-3 space-y-2">
              <span className={labelClass}>
                Antwoorden — punten lopen op vanaf 0, hoger = beter
              </span>
              {question.options.map((option, oIndex) => (
                <div key={oIndex} className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={oIndex === 0}
                    className={`${inputClass} w-16 shrink-0 tabular-nums disabled:opacity-60`}
                    value={option.points}
                    onChange={(e) =>
                      updateOptionPoints(qIndex, oIndex, Number(e.target.value))
                    }
                  />
                  <input
                    className={inputClass}
                    value={option.label}
                    onChange={(e) => updateOptionLabel(qIndex, oIndex, e.target.value)}
                  />
                  <IconButton
                    onClick={() => removeOption(qIndex, oIndex)}
                  >
                    Verwijder
                  </IconButton>
                </div>
              ))}
              <IconButton onClick={() => addOption(qIndex)}>+ Antwoord toevoegen</IconButton>
            </div>

            <div className="mt-3">
              <IconButton onClick={() => onChange(questions.filter((_, i) => i !== qIndex))}>
                Vraag verwijderen
              </IconButton>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4">
        <IconButton onClick={add}>+ Vraag toevoegen</IconButton>
      </div>
    </section>
  );
}

function ProfileQuestionsSection({
  profileQuestions,
  onChange,
}: {
  profileQuestions: ProfileQuestion[];
  onChange: (profileQuestions: ProfileQuestion[]) => void;
}) {
  function updateAt(index: number, patch: Partial<ProfileQuestion>) {
    const next = [...profileQuestions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...profileQuestions,
      { id: `profiel-${profileQuestions.length + 1}`, text: "", type: "single", options: [] },
    ]);
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold text-foreground">
        Profielvragen ({profileQuestions.length})
      </h2>

      <div className="mt-4 space-y-4">
        {profileQuestions.map((question, index) => (
          <div key={index} className="rounded-lg border border-border p-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_140px]">
              <Field label="Id">
                <input
                  className={inputClass}
                  value={question.id}
                  onChange={(e) => updateAt(index, { id: e.target.value })}
                />
              </Field>
              <Field label="Vraagtekst">
                <input
                  className={inputClass}
                  value={question.text}
                  onChange={(e) => updateAt(index, { text: e.target.value })}
                />
              </Field>
              <Field label="Type">
                <select
                  className={inputClass}
                  value={question.type}
                  onChange={(e) =>
                    updateAt(index, { type: e.target.value as ProfileQuestionType })
                  }
                >
                  <option value="single">Eén antwoord</option>
                  <option value="multi">Meerdere antwoorden</option>
                  <option value="text">Vrije tekst</option>
                </select>
              </Field>
            </div>

            <Field label="Sectie" className="mt-3">
              <input
                className={inputClass}
                value={question.section ?? ""}
                placeholder='"contact" = bij bedrijfsgegevens vooraf, of een vrije sectienaam voor een kop later (bv. "Algemeen profiel")'
                onChange={(e) => updateAt(index, { section: e.target.value })}
              />
            </Field>

            {question.type !== "text" && (
              <Field label="Opties" className="mt-3">
                <StringListEditor
                  items={question.options ?? []}
                  onChange={(options) => updateAt(index, { options })}
                />
              </Field>
            )}

            <div className="mt-3">
              <IconButton
                onClick={() => onChange(profileQuestions.filter((_, i) => i !== index))}
              >
                Verwijderen
              </IconButton>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <IconButton onClick={add}>+ Profielvraag toevoegen</IconButton>
      </div>
    </section>
  );
}

function TiersSection({
  tiers,
  onChange,
}: {
  tiers: Tier[];
  onChange: (tiers: Tier[]) => void;
}) {
  function updateAt(index: number, patch: Partial<Tier>) {
    const next = [...tiers];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  }

  function add() {
    onChange([
      ...tiers,
      { min: 0, max: 1, level: "", headline: "", body: "", recognise: [], steps: [] },
    ]);
  }

  return (
    <section className={cardClass}>
      <h2 className="font-semibold text-foreground">Niveaus (tiers)</h2>

      <div className="mt-4 space-y-4">
        {tiers.map((tier, index) => (
          <details key={index} className="rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium text-foreground">
              {tier.level || "(naamloos niveau)"}
            </summary>

            <div className="mt-4 grid gap-3 sm:grid-cols-[100px_100px_1fr]">
              <Field label="Min (0–1)">
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={tier.min}
                  onChange={(e) => updateAt(index, { min: Number(e.target.value) })}
                />
              </Field>
              <Field label="Max (0–1)">
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={tier.max}
                  onChange={(e) => updateAt(index, { max: Number(e.target.value) })}
                />
              </Field>
              <Field label="Niveaunaam">
                <input
                  className={inputClass}
                  value={tier.level}
                  onChange={(e) => updateAt(index, { level: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Headline" className="mt-3">
              <input
                className={inputClass}
                value={tier.headline}
                onChange={(e) => updateAt(index, { headline: e.target.value })}
              />
            </Field>

            <Field label="Uitleg (body)" className="mt-3">
              <textarea
                rows={3}
                className={inputClass}
                value={tier.body}
                onChange={(e) => updateAt(index, { body: e.target.value })}
              />
            </Field>

            <Field label="Dit herken je waarschijnlijk" className="mt-3">
              <StringListEditor
                items={tier.recognise}
                onChange={(recognise) => updateAt(index, { recognise })}
              />
            </Field>

            <Field label="Drie stappen" className="mt-3">
              <StringListEditor
                items={tier.steps}
                onChange={(steps) => updateAt(index, { steps })}
              />
            </Field>

            <div className="mt-3">
              <IconButton onClick={() => onChange(tiers.filter((_, i) => i !== index))}>
                Niveau verwijderen
              </IconButton>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-4">
        <IconButton onClick={add}>+ Niveau toevoegen</IconButton>
      </div>
    </section>
  );
}
