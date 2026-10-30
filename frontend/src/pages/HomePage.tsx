import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  GlobeAmericasIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchListings } from "../api/client";
import ListingCard from "../components/ListingCard";
import { useSeo } from "../hooks/useSeo";
import { Listing } from "../types";

interface HomeShowcaseItem {
  id: string;
  title: string;
  image: string;
  description: string;
}

const topShowcaseItems: HomeShowcaseItem[] = [
  { id: "europe", title: "Europe", image: "/home/transport/europe.jpg", description: "Un reseau ouvert sur l'international" },
  { id: "canada", title: "Canada", image: "/home/transport/canada.jpg", description: "Notre point d'ancrage nord-americain" },
  { id: "afrique", title: "Afrique", image: "/home/transport/afrique.jpg", description: "Au plus pres de vos destinations" },
];

const bottomShowcaseItems: HomeShowcaseItem[] = [
  { id: "entrepot", title: "Entrepot", image: "/home/transport/entrepot.jpg", description: "Une logistique organisee" },
  { id: "chargement-contenaire", title: "Chargement conteneur", image: "/home/transport/chargement-contenaire.jpg", description: "Vos marchandises prennent la route" },
  { id: "document-export", title: "Documents d'export", image: "/home/transport/document-export.jpg", description: "Les formalites, bien accompagnees" },
];

function ShowcaseImageCard({ item, index }: { item: HomeShowcaseItem; index: number }) {
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => setHasLoadError(false), [item.image]);

  return (
    <article className="showcase-card" style={{ animationDelay: `${index * 90}ms` }}>
      {!hasLoadError ? (
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          onError={() => setHasLoadError(true)}
          className="showcase-image"
        />
      ) : (
        <div className="showcase-image flex items-center justify-center bg-gradient-to-br from-brand-100 via-white to-accent-500/20">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-700">{item.title}</span>
        </div>
      )}
      <div className="showcase-shade" />
      <div className="showcase-copy">
        <span className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" /> Groupe Prolongation
        </span>
        <h3 className="font-heading text-xl font-bold text-white sm:text-2xl">{item.title}</h3>
        <p className="mt-1 max-w-[28ch] text-sm text-white/75">{item.description}</p>
      </div>
      <span className="showcase-arrow" aria-hidden="true"><ArrowUpRightIcon className="h-5 w-5" /></span>
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
      "Groupe Prolongation vous connecte aux annonces automobiles et aux services d'import-export entre le Canada, l'Europe et l'Afrique.",
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
      .catch((apiError: Error) => {
        if (isMounted) setError(apiError.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page space-y-20 pb-8 sm:space-y-24">
      <section className="hero-shell">
        <div className="hero-grain" aria-hidden="true" />
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="hero-eyebrow"><SparklesIcon className="h-4 w-4" /> Mobilite, commerce & logistique</p>
            <h1 className="hero-title">
              L'automobile,
              <span> sans frontieres.</span>
            </h1>
            <p className="hero-description">
              Trouvez la bonne annonce et avancez sereinement dans vos projets entre le Canada,
              l'Europe et l'Afrique.
            </p>
            <div className="hero-actions">
              <Link to="/annonces" className="hero-primary-action">
                <MagnifyingGlassIcon className="h-5 w-5" /> Explorer les annonces
                <ArrowRightIcon className="ml-1 h-4 w-4" />
              </Link>
              <a href="#reseau-logistique" className="hero-secondary-action">
                Decouvrir nos services <ArrowUpRightIcon className="h-4 w-4" />
              </a>
            </div>
            <div className="hero-proof-row">
              <span><ShieldCheckIcon className="h-4 w-4" /> Annonces detaillees</span>
              <span><GlobeAmericasIcon className="h-4 w-4" /> Canada · Europe · Afrique</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Reseau logistique international">
            <div className="hero-image-wrap">
              <img
                src="/home/transport/entrepot.jpg"
                alt="Plateforme logistique et transport international"
                className="hero-image"
                fetchPriority="high"
              />
              <div className="hero-image-gradient" />
              <div className="hero-route-card">
                <span className="route-card-label">Un reseau connecte</span>
                <div className="route-line">
                  <span className="route-point"><span className="route-dot" /> Canada</span>
                  <span className="route-dash" aria-hidden="true" />
                  <span className="route-plane"><ArrowUpRightIcon className="h-4 w-4" /></span>
                  <span className="route-dash" aria-hidden="true" />
                  <span className="route-point"><span className="route-dot route-dot-africa" /> Afrique</span>
                </div>
              </div>
            </div>
            <div className="hero-float-badge"><span className="hero-live-dot" /> Des opportunites, partout</div>
            <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
            <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
          </div>
        </div>
        <div className="hero-bottomline">
          <span>GROUPE PROLONGATION</span>
          <span>Connecter les marches. Simplifier vos projets.</span>
        </div>
      </section>

      <section className="service-section" id="reseau-logistique">
        <div className="section-intro">
          <div>
            <p className="section-kicker">Au-dela de l'annonce</p>
            <h2 className="section-title">Un reseau qui vous rapproche.</h2>
          </div>
          <p className="section-description">
            Des premieres recherches aux points de service, decouvrez l'ecosysteme Groupe Prolongation.
          </p>
        </div>

        <div className="showcase-grid showcase-grid-top">
          {topShowcaseItems.map((item, index) => <ShowcaseImageCard key={item.id} item={item} index={index} />)}
        </div>
        <div className="showcase-grid showcase-grid-bottom">
          {bottomShowcaseItems.map((item, index) => <ShowcaseImageCard key={item.id} item={item} index={index + 3} />)}
        </div>
      </section>

      <section className="recent-section">
        <div className="section-intro recent-intro">
          <div>
            <p className="section-kicker">Selection du moment</p>
            <h2 className="section-title">Annonces recentes</h2>
            <p className="mt-2 text-sm text-slate-600">Les dernieres opportunites publiees sur la plateforme.</p>
          </div>
          <Link to="/annonces" className="section-link">
            Tout le catalogue <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        {isLoading && (
          <div className="loading-surface" role="status">
            <span className="loading-dot" /> Chargement des annonces...
          </div>
        )}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            Impossible de charger les annonces: {error}
          </div>
        )}
        {!isLoading && !error && recentListings.length === 0 && (
          <div className="loading-surface">Aucune annonce recente pour le moment.</div>
        )}
        {!isLoading && !error && recentListings.length > 0 && (
          <div className="stagger-in grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {recentListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        )}
      </section>

      <section className="closing-cta">
        <div className="closing-cta-orb" aria-hidden="true" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200">Votre prochaine etape</p>
            <h2 className="mt-2 max-w-2xl font-heading text-2xl font-bold text-white sm:text-3xl">
              Le bon vehicule peut vous emmener loin.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Parcourez les annonces et trouvez celle qui correspond a votre projet.
            </p>
          </div>
          <Link to="/annonces" className="hero-primary-action closing-cta-action">
            Voir les annonces <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
