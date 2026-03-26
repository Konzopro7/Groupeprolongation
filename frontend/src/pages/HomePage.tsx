import { ArrowRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/client";
import { publicListingsError } from "../utils/publicErrorMessage";
import ListingCard from "../components/ListingCard";
import { useSeo } from "../hooks/useSeo";
import { Listing } from "../types";
import { companyContact } from "../config/company";

interface HomeShowcaseItem {
  id: string;
  title: string;
  image: string;
}

const topShowcaseItems: HomeShowcaseItem[] = [
  { id: "europe", title: "Europe", image: "/home/transport/europe.jpg" },
  { id: "canada", title: "Canada", image: "/home/transport/canada.jpg" },
  { id: "afrique", title: "Afrique", image: "/home/transport/afrique.jpg" },
];

const bottomShowcaseItems: HomeShowcaseItem[] = [
  { id: "entrepot", title: "Entrepot", image: "/home/transport/entrepot.jpg" },
  { id: "chargement-contenaire", title: "Chargement contenaire", image: "/home/transport/chargement-contenaire.jpg" },
  { id: "document-export", title: "Document export", image: "/home/transport/document-export.jpg" },
];

function ShowcaseImageCard({ item, imageHeight }: { item: HomeShowcaseItem; imageHeight: string }) {
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [item.image]);

  return (
    <article className="space-y-3 interactive-lift">
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft ${imageHeight}`}>
        {!hasLoadError ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            onError={() => setHasLoadError(true)}
            className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Ajoute {item.id}.jpg
            </p>
          </div>
        )}
      </div>
      <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-600">{item.title}</p>
    </article>
  );
}

export default function HomePage() {
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSeo({
    title: "Accueil",
    description:
      "Groupe Prolongation connecte annonces automobiles et services d import-export entre Canada, Europe et Afrique.",
  });

  useEffect(() => {
    let isMounted = true;

    fetchListings({ limit: 6 })
      .then((items) => {
        if (isMounted) {
          setRecentListings(items);
          setError(null);
        }
      })
      .catch((apiError: unknown) => {
        if (isMounted) {
          setError(publicListingsError(apiError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-16 pb-6 page-enter">
      <section className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 text-white shadow-elevate sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl animate-floatSoft" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-52 w-52 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-brand-500/20 px-4 py-1 text-sm font-semibold text-brand-100">
              Annonces et import-export automobiles
            </p>
            <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
              Trouvez le bon vehicule et exportez en toute confiance.
            </h1>
            <p className="max-w-xl text-base text-slate-200">
              Groupe Prolongation vous donne acces aux annonces publiees par notre client et vous
              accompagne pour vos operations d export entre le Canada, l Europe et l Afrique.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/annonces"
                className="btn-shine interactive-lift inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
                Explorer les annonces
              </Link>
              <Link
                to="/contact"
                className="interactive-lift inline-flex items-center gap-2 rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white/95 transition hover:bg-white/10"
              >
                Nous contacter
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="surface-glass rounded-2xl p-6">
              <p className="text-sm text-slate-200">Pourquoi choisir Groupe Prolongation</p>
              <div className="stagger-in mt-4 grid gap-4 sm:grid-cols-2">
                <div className="interactive-lift rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">International</p>
                  <p className="mt-1 text-sm text-slate-200">Couverture Canada, Europe et Afrique.</p>
                </div>
                <div className="interactive-lift rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">Accompagne</p>
                  <p className="mt-1 text-sm text-slate-200">Support sur les etapes d import-export.</p>
                </div>
                <div className="interactive-lift rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">Transparent</p>
                  <p className="mt-1 text-sm text-slate-200">Annonces detaillees et contact direct.</p>
                </div>
                <div className="interactive-lift rounded-xl bg-white/10 p-4">
                  <p className="text-2xl font-bold">Professionnel</p>
                  <p className="mt-1 text-sm text-slate-200">Processus simple pour publier et gerer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8 interactive-lift">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-700">
            Export et logistique
          </p>
          <h2 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
            Zones de service et parcours de vos expeditions
          </h2>
          <p className="mx-auto max-w-3xl text-sm text-slate-600">
            Remplace les images de cette section avec tes propres visuels pour presenter les destinations,
            l entrepot, le chargement et la documentation export.
          </p>
        </div>

        <div className="stagger-in grid gap-5 md:grid-cols-3">
          {topShowcaseItems.map((item) => (
            <ShowcaseImageCard key={item.id} item={item} imageHeight="h-64 sm:h-72" />
          ))}
        </div>

        <div className="stagger-in grid gap-5 md:grid-cols-3">
          {bottomShowcaseItems.map((item) => (
            <ShowcaseImageCard key={item.id} item={item} imageHeight="h-52 sm:h-56" />
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-3">
          <h2 className="font-heading text-2xl font-bold text-slate-900">Adresses et cartes des entrepots</h2>
          <p className="text-sm text-slate-600">
            Consultez les deux points logistiques et ouvrez directement l itineraire.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {companyContact.warehouses.map((warehouse) => (
            <article
              key={`${warehouse.label}-home-map`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft"
            >
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{warehouse.label}</p>
                <a
                  href={warehouse.mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm font-semibold text-brand-700 hover:underline"
                >
                  {warehouse.address}
                </a>
              </div>
              <div className="h-64">
                <iframe
                  src={warehouse.mapEmbedUrl}
                  title={`Carte ${warehouse.label} accueil`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-full w-full border-0"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900">Annonces recentes</h2>
            <p className="text-sm text-slate-600">Les derniers vehicules publies sur la plateforme.</p>
          </div>
          <Link
            to="/annonces"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 hover:text-brand-800"
          >
            Tout voir
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Chargement des annonces...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="stagger-in grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
