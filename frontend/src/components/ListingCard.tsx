import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Listing } from "../types";

interface ListingCardProps {
  listing: Listing;
}

function isVideoMedia(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi|mkv|mpeg|mpg|wmv|flv|3gp|3g2)(\?.*)?$/i.test(url);
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [coverIndex, setCoverIndex] = useState(0);
  const cover = listing.images[coverIndex] || "";
  const isVideoCover = cover ? isVideoMedia(cover) : false;
  const [coverLoadError, setCoverLoadError] = useState(false);

  useEffect(() => {
    setCoverIndex(0);
    setCoverLoadError(false);
  }, [listing.id, listing.images.length]);

  function handleCoverError() {
    if (coverIndex < listing.images.length - 1) {
      setCoverIndex((current) => current + 1);
      return;
    }
    setCoverLoadError(true);
  }

  return (
    <article className="interactive-lift overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="group relative h-52 overflow-hidden">
        {cover && !coverLoadError ? (
          isVideoCover ? (
            <video
              src={cover}
              muted
              loop
              autoPlay
              playsInline
              preload="metadata"
              onError={handleCoverError}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <img
              src={cover}
              alt={listing.title}
              onError={handleCoverError}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-100 via-white to-accent-500/20" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-brand-800">
          {listing.categoryName}
        </span>
        {listing.images.length > 1 && (
          <span className="absolute right-3 top-3 rounded-lg bg-slate-900/75 px-2 py-1 text-xs font-semibold text-white">
            {listing.images.length} medias
          </span>
        )}
      </div>
      <div className="space-y-3 p-4">
        <h3 className="min-h-[3rem] font-heading text-lg font-bold leading-snug text-slate-900">
          {listing.title}
        </h3>
        <p className="text-xl font-bold text-brand-700">
          {listing.price.toLocaleString("fr-CA")} {listing.priceCurrency}
        </p>
        <div className="grid grid-cols-2 gap-y-2 text-sm text-slate-600">
          <p>Carburant: {listing.fuel || "N/A"}</p>
          <p>Transmission: {listing.transmission || "N/A"}</p>
          <p>Kilometrage: {listing.mileage ? `${listing.mileage.toLocaleString("fr-CA")} km` : "N/A"}</p>
          <p>Annee: {listing.year || "N/A"}</p>
          <p>Ville: {listing.city || listing.location || "N/A"}</p>
          <p>Statut: {listing.status || "N/A"}</p>
        </div>
        <Link
          to={`/annonces/${listing.id}`}
          className="btn-shine inline-flex rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Voir l'annonce
        </Link>
      </div>
    </article>
  );
}
