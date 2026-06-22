"use client";

import type { RecommendationResponse, Symptom, UserContext } from "@otcora/core";
import { AlertTriangle, Check, FileText, Loader2, Pill, Search, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export function SymptomConsole() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Symptom[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selected, setSelected] = useState<Symptom[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [result, setResult] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<UserContext["ageGroup"]>("adult");
  const [pregnant, setPregnant] = useState(false);
  const [allergyText, setAllergyText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIds = useMemo(() => new Set(selected.map((symptom) => symptom.id)), [selected]);

  useEffect(() => {
    let cancelled = false;
    setLoadingSuggestions(true);
    fetch(`/api/symptoms?q=${encodeURIComponent(query)}`)
      .then((response) => response.json())
      .then((payload: { symptoms: Symptom[] }) => {
        if (!cancelled) {
          setSuggestions(payload.symptoms.filter((symptom) => !selectedIds.has(symptom.id)));
          setActiveIndex(0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSuggestions(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, selectedIds]);

  function addSymptom(symptom: Symptom) {
    setSelected((current) => current.some((item) => item.id === symptom.id) ? current : [...current, symptom]);
    setQuery("");
    setSuggestionsOpen(false);
  }

  function removeSymptom(symptomId: string) {
    setSelected((current) => current.filter((symptom) => symptom.id !== symptomId));
  }

  async function submit() {
    if (selected.length === 0) {
      setError("Choose at least one symptom to see options.");
      return;
    }

    setError(null);
    setLoadingResults(true);
    const allergies = allergyText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const context: UserContext = { pregnant };
    if (ageGroup) {
      context.ageGroup = ageGroup;
    }
    if (allergies.length > 0) {
      context.allergies = allergies;
    }

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptomIds: selected.map((symptom) => symptom.id), context })
      });
      if (!response.ok) {
        throw new Error("Unable to fetch recommendations.");
      }
      setResult((await response.json()) as RecommendationResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setLoadingResults(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, Math.max(suggestions.length - 1, 0)));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" && suggestions[activeIndex]) {
      event.preventDefault();
      addSymptom(suggestions[activeIndex]);
    }
  }

  return (
    <section className="rounded-md border border-line bg-white p-4 shadow-soft sm:p-6" aria-label="Symptom recommendation tool">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-trust">Start here</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal text-ink">What are you feeling?</h2>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-md bg-clinical text-trust">
          <Search aria-hidden="true" size={22} />
        </span>
      </div>

      <div className="mt-5">
        <label htmlFor="symptom-search" className="text-sm font-medium text-ink">
          Search symptoms
        </label>
        <div className="relative mt-2">
          <input
            ref={inputRef}
            id="symptom-search"
            role="combobox"
            aria-expanded={suggestionsOpen && suggestions.length > 0}
            aria-controls="symptom-options"
            aria-activedescendant={suggestions[activeIndex] ? `symptom-${suggestions[activeIndex].id}` : undefined}
            value={query}
            onFocus={() => setSuggestionsOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSuggestionsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type cough, fever, acidity..."
            className="h-12 w-full rounded-md border border-line bg-surface px-4 pr-11 text-base text-ink outline-none ring-trust/20 transition focus:border-trust focus:ring-4"
          />
          {loadingSuggestions ? (
            <Loader2 aria-hidden="true" className="absolute right-3 top-3.5 animate-spin text-trust" size={20} />
          ) : (
            <Search aria-hidden="true" className="absolute right-3 top-3.5 text-muted" size={20} />
          )}
          {suggestionsOpen ? (
            <div
              id="symptom-options"
              role="listbox"
              className="absolute z-10 mt-2 max-h-72 w-full overflow-auto rounded-md border border-line bg-white p-1 shadow-soft"
            >
              {suggestions.length > 0 ? suggestions.map((symptom, index) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  id={`symptom-${symptom.id}`}
                  key={symptom.id}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addSymptom(symptom)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm ${index === activeIndex ? "bg-clinical text-ink" : "text-muted hover:bg-surface"}`}
                >
                  <span>
                    <span className="block font-semibold text-ink">{symptom.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">{symptom.aliases.slice(0, 3).join(", ")}</span>
                  </span>
                  {index === activeIndex ? <Check aria-hidden="true" size={17} className="text-care" /> : null}
                </button>
              )) : (
                <div className="px-3 py-4 text-sm text-muted">No matching symptoms yet.</div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {selected.map((symptom) => (
          <span key={symptom.id} className="inline-flex items-center gap-2 rounded-md bg-clinical px-3 py-2 text-sm font-medium text-trust">
            {symptom.label}
            <button type="button" onClick={() => removeSymptom(symptom.id)} aria-label={`Remove ${symptom.label}`}>
              <X aria-hidden="true" size={15} />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-medium text-ink">
          Age group
          <select
            value={ageGroup}
            onChange={(event) => setAgeGroup(event.target.value as UserContext["ageGroup"])}
            className="mt-2 h-11 w-full rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-trust"
          >
            <option value="adult">Adult</option>
            <option value="child">Child</option>
            <option value="older-adult">Older adult</option>
          </select>
        </label>
        <label className="text-sm font-medium text-ink sm:col-span-2">
          Allergies
          <input
            value={allergyText}
            onChange={(event) => setAllergyText(event.target.value)}
            placeholder="Example: paracetamol, cetirizine"
            className="mt-2 h-11 w-full rounded-md border border-line bg-surface px-3 text-sm outline-none focus:border-trust"
          />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-md border border-line bg-surface p-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={pregnant}
          onChange={(event) => setPregnant(event.target.checked)}
          className="h-4 w-4 accent-trust"
        />
        Pregnant or checking for someone pregnant
      </label>

      {error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loadingResults}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-trust px-5 text-base font-semibold text-white transition hover:bg-ink disabled:cursor-wait disabled:opacity-70"
      >
        {loadingResults ? <Loader2 aria-hidden="true" className="animate-spin" size={19} /> : <Pill aria-hidden="true" size={19} />}
        Show medicine options
      </button>

      {result ? <RecommendationPanel result={result} /> : null}
    </section>
  );
}

function RecommendationPanel({ result }: { result: RecommendationResponse }) {
  return (
    <div className="mt-6 space-y-4">
      {result.seekCare.length > 0 ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-saffron">
            <AlertTriangle aria-hidden="true" size={18} />
            Check these before self-care
          </h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-900">
            {result.seekCare.map((item) => (
              <li key={item.title}>
                <strong>{item.title}:</strong> {item.description}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CompositionSection
        title="OTC compositions"
        icon={<ShieldCheck aria-hidden="true" size={18} />}
        groups={result.otcGroups}
        tone="otc"
        empty="No OTC matches yet. Try another symptom or ask a pharmacist."
      />
      <CompositionSection
        title="Prescription compositions"
        icon={<FileText aria-hidden="true" size={18} />}
        groups={result.prescriptionGroups}
        tone="rx"
        empty="No prescription matches for this symptom set."
      />
      <MedicineSection
        title="Avoid or review first"
        icon={<AlertTriangle aria-hidden="true" size={18} />}
        items={result.avoid}
        tone="avoid"
        empty="No avoid flags based on the details entered."
      />

      <p className="rounded-md border border-line bg-surface p-3 text-xs leading-5 text-muted">{result.disclaimer}</p>
    </div>
  );
}

type RecommendationItem = RecommendationResponse["otc"][number];
type CompositionGroup = RecommendationResponse["otcGroups"][number];

function CompositionSection({
  title,
  icon,
  groups,
  tone,
  empty
}: {
  title: string;
  icon: React.ReactNode;
  groups: CompositionGroup[];
  tone: "otc" | "rx";
  empty: string;
}) {
  const toneClass = {
    otc: "border-emerald-200 bg-emerald-50 text-care",
    rx: "border-amber-200 bg-amber-50 text-saffron"
  }[tone];

  return (
    <section className="rounded-md border border-line bg-white p-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
        <span className={`grid h-8 w-8 place-items-center rounded-md border ${toneClass}`}>{icon}</span>
        {title}
      </h3>
      {groups.length > 0 ? (
        <div className="mt-4 space-y-3">
          {groups.map((group) => (
            <article key={group.id} className="rounded-md border border-line bg-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-ink">{group.title}</p>
                  {group.subtitle ? <p className="mt-1 text-sm leading-5 text-muted">{group.subtitle}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-muted">
                    {group.forms.slice(0, 4).map((form) => (
                      <span key={form} className="rounded-md border border-line bg-white px-2 py-1">{form}</span>
                    ))}
                    {group.strengths.slice(0, 3).map((strength) => (
                      <span key={strength} className="rounded-md border border-line bg-white px-2 py-1">{strength}</span>
                    ))}
                  </div>
                </div>
                <span className="w-fit rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {group.totalProducts} products
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
                {group.reasons.slice(0, 2).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                {group.cautions.slice(0, 2).map((caution) => (
                  <li key={caution} className="text-saffron">{caution}</li>
                ))}
              </ul>

              <div className="mt-4 divide-y divide-line rounded-md border border-line bg-white">
                {group.products.map((item) => (
                  <Link
                    key={item.medicine.id}
                    href={`/medicines/${item.medicine.id}`}
                    className="flex flex-col gap-1 px-3 py-3 transition hover:bg-clinical sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink">{item.medicine.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{item.medicine.manufacturer ?? item.medicine.form ?? "Medicine"}</span>
                    </span>
                    <span className="text-xs font-medium text-muted">{item.medicine.price ? `₹${item.medicine.price}` : item.medicine.prescriptionStatus}</span>
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-surface p-3 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}

function MedicineSection({
  title,
  icon,
  items,
  tone,
  empty
}: {
  title: string;
  icon: React.ReactNode;
  items: RecommendationItem[];
  tone: "avoid";
  empty: string;
}) {
  const toneClass = "border-red-200 bg-red-50 text-danger";

  return (
    <section className="rounded-md border border-line bg-white p-4">
      <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
        <span className={`grid h-8 w-8 place-items-center rounded-md border ${toneClass}`}>{icon}</span>
        {title}
      </h3>
      {items.length > 0 ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.medicine.id} className="rounded-md border border-line bg-surface p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Link href={`/medicines/${item.medicine.id}`} className="text-base font-semibold text-ink hover:text-trust">
                    {item.medicine.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">{item.medicine.composition ?? item.medicine.genericName ?? item.medicine.form ?? "Medicine"}</p>
                </div>
                <span className="w-fit rounded-md border border-line bg-white px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted">
                  {item.medicine.prescriptionStatus}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm leading-6 text-muted">
                {item.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
                {item.cautions.slice(0, 2).map((caution) => (
                  <li key={caution} className="text-saffron">{caution}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-surface p-3 text-sm text-muted">{empty}</p>
      )}
    </section>
  );
}
