import { ArrowPathIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { FormEvent } from "react";
import { Category, ListingFilters } from "../types";

export interface ListingFilterFormValues {
  q: string;
  categoryId: string;
  fuel: string;
  minPrice: string;
  maxPrice: string;
}

interface FilterBarProps {
  categories: Category[];
  onApply: (filters: ListingFilters) => void;
  onReset: () => void;
  values: ListingFilterFormValues;
  onChange: (next: ListingFilterFormValues) => void;
}

const fuels = ["", "Essence", "Diesel", "Hybride", "Electrique", "GPL"];

export default function FilterBar({
  categories,
  onApply,
  onReset,
  values,
  onChange,
}: FilterBarProps) {
  const activeFilterCount = [
    values.q.trim(),
    values.categoryId,
    values.fuel,
    values.minPrice.trim(),
    values.maxPrice.trim(),
  ].filter(Boolean).length;

  function updateField(field: keyof ListingFilterFormValues, value: string) {
    onChange({ ...values, [field]: value });
  }

  function parseOptionalNumber(input: string): number | undefined {
    if (!input.trim()) return undefined;
    const parsed = Number(input);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onApply({
      q: values.q.trim() || undefined,
      fuel: values.fuel || undefined,
      categoryId: values.categoryId ? Number(values.categoryId) : undefined,
      minPrice: parseOptionalNumber(values.minPrice),
      maxPrice: parseOptionalNumber(values.maxPrice),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="interactive-lift rounded-2xl border border-slate-200 bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FunnelIcon className="h-4 w-4 text-brand-700" />
          Filtrage intelligent
        </p>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
          {activeFilterCount} filtre{activeFilterCount > 1 ? "s" : ""} actif{activeFilterCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <input
          value={values.q}
          onChange={(event) => updateField("q", event.target.value)}
          placeholder="Recherche (titre, description)"
          className="field-focus rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        />
        <select
          value={values.categoryId}
          onChange={(event) => updateField("categoryId", event.target.value)}
          className="field-focus rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        >
          <option value="">Toutes categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `- ${category.name}` : category.name}
            </option>
          ))}
        </select>
        <select
          value={values.fuel}
          onChange={(event) => updateField("fuel", event.target.value)}
          className="field-focus rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        >
          {fuels.map((fuel) => (
            <option key={fuel || "all"} value={fuel}>
              {fuel ? `Carburant: ${fuel}` : "Tous carburants"}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={values.minPrice}
          onChange={(event) => updateField("minPrice", event.target.value)}
          placeholder="Prix min"
          className="field-focus rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        />
        <input
          type="number"
          min="0"
          value={values.maxPrice}
          onChange={(event) => updateField("maxPrice", event.target.value)}
          placeholder="Prix max"
          className="field-focus rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn-shine rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Filtrer
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowPathIcon className="h-4 w-4" />
          Reinitialiser
        </button>
      </div>
    </form>
  );
}
