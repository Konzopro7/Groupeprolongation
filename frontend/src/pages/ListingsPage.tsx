import { useEffect, useState } from "react";
import { fetchCategories, fetchListings } from "../api/client";
import FilterBar, { ListingFilterFormValues } from "../components/FilterBar";
import ListingCard from "../components/ListingCard";
import { useSeo } from "../hooks/useSeo";
import { Category, Listing, ListingFilters } from "../types";

const initialFormState: ListingFilterFormValues = {
  q: "",
  categoryId: "",
  fuel: "",
  minPrice: "",
  maxPrice: "",
};

export default function ListingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [formValues, setFormValues] = useState<ListingFilterFormValues>(initialFormState);

  useSeo({
    title: "Annonces",
    description: "Parcourez toutes les annonces automobiles sur Groupe Prolongation.",
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetchListings(filters)
      .then((items) => {
        setListings(items);
        setError(null);
      })
      .catch((apiError: Error) => {
        setError(apiError.message);
      })
      .finally(() => setIsLoading(false));
  }, [filters]);

  return (
    <div className="space-y-6 page-enter">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Annonces</h1>
        <p className="mt-1 text-slate-600">Recherchez facilement selon vos criteres.</p>
        <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {isLoading ? "Chargement..." : `${listings.length} resultat${listings.length > 1 ? "s" : ""}`}
        </div>
      </section>

      <FilterBar
        categories={categories}
        values={formValues}
        onChange={setFormValues}
        onApply={setFilters}
        onReset={() => {
          setFormValues(initialFormState);
          setFilters({});
        }}
      />

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Chargement des annonces...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Une erreur est survenue: {error}
        </div>
      )}

      {!isLoading && !error && listings.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">
          Aucune annonce ne correspond aux filtres selectionnes.
        </div>
      )}

      {!isLoading && !error && listings.length > 0 && (
        <div className="stagger-in grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
