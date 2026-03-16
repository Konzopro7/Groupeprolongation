import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteListing,
  fetchAdminSession,
  fetchListings,
  loginAdmin,
  logoutAdmin,
} from "../api/client";
import { useSeo } from "../hooks/useSeo";
import { Listing } from "../types";

interface LoginFormState {
  username: string;
  password: string;
}

const initialForm: LoginFormState = {
  username: "",
  password: "",
};

export default function AdminPage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  async function loadListings() {
    setIsLoading(true);
    try {
      const listings = await fetchListings({ limit: 100 });
      setItems(listings);
      setError(null);
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "Erreur de chargement des annonces.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      try {
        const session = await fetchAdminSession();
        setIsAuthenticated(session.authenticated);
        setAdminUsername(session.username);
        if (session.authenticated) {
          await loadListings();
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
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
    } catch (apiError) {
      const message =
        apiError instanceof Error ? apiError.message : "La suppression a echoue.";
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
      await loadListings();
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
  }

  if (!isAuthChecked || (isLoading && isAuthenticated)) {
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
          <p className="mt-1 text-slate-600">
            Connecte-toi pour publier et gerer les annonces de ton client.
          </p>
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
          <h1 className="font-heading text-3xl font-bold text-slate-900">Admin V2</h1>
          <p className="mt-1 text-slate-600">
            Connecte en tant que {adminUsername || "admin"}.
          </p>
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
                    {listing.price.toLocaleString("fr-CA")} $
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
