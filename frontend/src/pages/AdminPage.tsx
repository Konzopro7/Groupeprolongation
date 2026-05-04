import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteListing,
  fetchAdminSession,
  fetchAdminStats,
  fetchListings,
  loginAdmin,
  logoutAdmin,
} from "../api/client";
import { useSeo } from "../hooks/useSeo";
import { AdminDashboardStats, Listing } from "../types";
import { formatPrice } from "../utils/price";

interface LoginFormState {
  username: string;
  password: string;
}

const initialForm: LoginFormState = {
  username: "",
  password: "",
};

function formatMonthLabel(month: string): string {
  const parts = month.split("-");
  if (parts.length !== 2) {
    return month;
  }

  const year = Number(parts[0]);
  const monthIndex = Number(parts[1]) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return month;
  }

  return new Date(year, monthIndex, 1).toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function toBarWidth(value: number, maxValue: number): string {
  if (maxValue <= 0) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, (value / maxValue) * 100))}%`;
}

export default function AdminPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [form, setForm] = useState<LoginFormState>(initialForm);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  useSeo({
    title: "Admin",
    description: "Espace de gestion des annonces Groupe Prolongation.",
  });

  const categoryMax = useMemo(() => {
    if (!stats || stats.byCategory.length === 0) {
      return 1;
    }
    return Math.max(...stats.byCategory.map((entry) => entry.total), 1);
  }, [stats]);

  const monthMax = useMemo(() => {
    if (!stats || stats.byMonth.length === 0) {
      return 1;
    }

    return Math.max(
      ...stats.byMonth.map((entry) => Math.max(entry.listingsCount, entry.contactsCount)),
      1,
    );
  }, [stats]);

  async function loadListings() {
    setIsLoading(true);
    try {
      const listings = await fetchListings({ limit: 100 });
      setItems(listings);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "Erreur de chargement des annonces.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadStats() {
    setIsStatsLoading(true);
    try {
      const dashboardStats = await fetchAdminStats();
      setStats(dashboardStats);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "Erreur de chargement du dashboard.";
      setError(message);
    } finally {
      setIsStatsLoading(false);
    }
  }

  async function loadAdminData() {
    setError(null);
    await Promise.allSettled([loadListings(), loadStats()]);
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const session = await fetchAdminSession();
        setIsAuthenticated(session.authenticated);
        setAdminUsername(session.username);

        if (session.authenticated) {
          await loadAdminData();
        } else {
          setIsLoading(false);
          setIsStatsLoading(false);
        }
      } catch {
        setIsLoading(false);
        setIsStatsLoading(false);
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecked(true);
      }
    }

    void bootstrap();
  }, []);

  async function handleDelete(id: number) {
    const confirmed = window.confirm("Supprimer cette annonce ?");
    if (!confirmed) return;

    try {
      await deleteListing(id);
      setItems((current) => current.filter((entry) => entry.id !== id));
      await loadStats();
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "La suppression a echoue.";
      setError(message);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmittingLogin(true);

    try {
      const session = await loginAdmin(form.username.trim(), form.password);
      setIsAuthenticated(session.authenticated);
      setAdminUsername(session.username);
      setForm(initialForm);
      await loadAdminData();
    } catch (apiError) {
      const message = apiError instanceof Error ? apiError.message : "Connexion impossible.";
      setError(message);
    } finally {
      setIsSubmittingLogin(false);
    }
  }

  async function handleLogout() {
    await logoutAdmin();
    setIsAuthenticated(false);
    setAdminUsername(null);
    setItems([]);
    setStats(null);
  }

  if (!isAuthChecked || ((isLoading || isStatsLoading) && isAuthenticated)) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 page-enter">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 page-enter">
        <section>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Admin V2</h1>
          <p className="mt-1 text-slate-600">Connecte-toi pour gerer les annonces de ton client.</p>
        </section>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleLogin}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Utilisateur</label>
            <input
              type="text"
              required
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Mot de passe</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingLogin}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmittingLogin ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Dashboard G4</h1>
          <p className="mt-1 text-slate-600">Connecte en tant que {adminUsername || "admin"}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/publier"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Ajouter une annonce
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Deconnexion
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {stats && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Annonces total</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totals.listings}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Disponibles</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.totals.available}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contacts recus</p>
              <p className="mt-2 text-3xl font-bold text-brand-700">{stats.totals.contacts}</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nouvelles annonces (30j)</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totals.listingsLast30Days}</p>
            </article>
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Valeur totale stock</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatPrice(stats.financial.totalValue, stats.financial.currency)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix moyen</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatPrice(stats.financial.avgPrice, stats.financial.currency)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix minimum</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatPrice(stats.financial.minPrice, stats.financial.currency)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix maximum</p>
              <p className="mt-2 text-xl font-bold text-slate-900">
                {formatPrice(stats.financial.maxPrice, stats.financial.currency)}
              </p>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="font-heading text-lg font-bold text-slate-900">Repartition par categorie</h2>
              <p className="mt-1 text-sm text-slate-600">Top categories les plus actives.</p>

              {stats.byCategory.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">Aucune donnee disponible.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {stats.byCategory.map((entry) => (
                    <div key={entry.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{entry.categoryName}</span>
                        <span className="text-slate-500">{entry.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-600"
                          style={{ width: toBarWidth(entry.total, categoryMax) }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
              <h2 className="font-heading text-lg font-bold text-slate-900">Activite sur 6 mois</h2>
              <p className="mt-1 text-sm text-slate-600">Annonces publiees et messages contact.</p>

              {stats.byMonth.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600">Aucune donnee disponible.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {stats.byMonth.map((entry) => (
                    <div key={entry.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{formatMonthLabel(entry.month)}</span>
                        <span className="text-slate-500">
                          {entry.listingsCount} annonces • {entry.contactsCount} contacts
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-brand-600"
                            style={{ width: toBarWidth(entry.listingsCount, monthMax) }}
                          />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: toBarWidth(entry.contactsCount, monthMax) }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}

      {isStatsLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Chargement du dashboard G4...
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Titre</th>
                <th className="px-4 py-3 font-semibold">Prix</th>
                <th className="px-4 py-3 font-semibold">Categorie</th>
                <th className="px-4 py-3 font-semibold">Lieu</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((listing) => (
                <tr key={listing.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{listing.title}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatPrice(listing.price, listing.priceCurrency)}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{listing.categoryName}</td>
                  <td className="px-4 py-3 text-slate-700">{listing.location || "N/A"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/annonces/${listing.id}`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Voir
                      </Link>
                      <Link
                        to={`/publier/${listing.id}`}
                        className="rounded-lg border border-brand-300 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(listing.id)}
                        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-600">
                    Aucune annonce disponible.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
