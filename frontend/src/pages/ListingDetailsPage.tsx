import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckBadgeIcon,
  FireIcon,
  MapPinIcon,
  PhoneIcon,
  TruckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchListingById } from "../api/client";
import { publicListingDetailError } from "../utils/publicErrorMessage";
import { useSeo } from "../hooks/useSeo";
import { Listing } from "../types";

function isVideoMedia(url: string): boolean {
  return /\.(mp4|webm|ogg|mov|avi|mkv|mpeg|mpg|wmv|flv|3gp|3g2)(\?.*)?$/i.test(url);
}

function getWhatsAppUrl(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const normalized = digits.startsWith("00") ? digits.slice(2) : digits;
  return normalized ? `https://wa.me/${normalized}` : null;
}

export default function ListingDetailsPage() {
  const { id } = useParams();
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [activeMediaLoadError, setActiveMediaLoadError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxLoadError, setLightboxLoadError] = useState(false);

  useSeo({
    title: listing ? listing.title : "Detail annonce",
    description:
      listing?.description.slice(0, 150) ||
      "Consultez les details complets de cette annonce sur Groupe Prolongation.",
    image: listing?.images[0],
  });

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    fetchListingById(Number(id))
      .then((item) => {
        setListing(item);
        setActiveMediaIndex(0);
        setIsLightboxOpen(false);
        setError(null);
      })
      .catch((apiError: unknown) => {
        setError(publicListingDetailError(apiError));
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  useEffect(() => {
    setActiveMediaLoadError(false);
  }, [activeMediaIndex, listing?.id]);

  useEffect(() => {
    setLightboxLoadError(false);
  }, [activeMediaIndex, listing?.id]);

  useEffect(() => {
    if (!isLightboxOpen || !listing) {
      return;
    }
    const mediaCount = listing.images.length;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        return;
      }

      if (mediaCount <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveMediaIndex((current) => (current - 1 + mediaCount) % mediaCount);
      }

      if (event.key === "ArrowRight") {
        setActiveMediaIndex((current) => (current + 1) % mediaCount);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, listing]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 page-enter">
        Chargement de l'annonce...
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 page-enter">
        {error ?? "Annonce introuvable."}
      </div>
    );
  }

  const activeMediaUrl = listing.images[activeMediaIndex] || listing.images[0] || "";
  const activeIsVideo = activeMediaUrl ? isVideoMedia(activeMediaUrl) : false;
  const mediaCount = listing.images.length;
  const whatsappUrl = getWhatsAppUrl(listing.phone);
  const callUrl = listing.phone ? `tel:${listing.phone.replace(/\s+/g, "")}` : null;

  function openLightbox(index: number) {
    setActiveMediaIndex(index);
    setLightboxLoadError(false);
    setIsLightboxOpen(true);
  }

  function goToPreviousMedia() {
    setActiveMediaIndex((current) => (current - 1 + mediaCount) % mediaCount);
  }

  function goToNextMedia() {
    setActiveMediaIndex((current) => (current + 1) % mediaCount);
  }

  return (
    <article className="space-y-6 page-enter">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <div className="group relative h-72 w-full bg-slate-100 sm:h-[26rem]">
          {activeMediaUrl && !activeMediaLoadError ? (
            activeIsVideo ? (
              <video
                src={activeMediaUrl}
                controls
                onError={() => setActiveMediaLoadError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={() => openLightbox(activeMediaIndex)}
                className="h-full w-full cursor-zoom-in"
              >
                <img
                  src={activeMediaUrl}
                  alt={listing.title}
                  onError={() => setActiveMediaLoadError(true)}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
              </button>
            )
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-brand-100 via-white to-accent-500/20" />
          )}
          {activeMediaUrl && (
            <button
              type="button"
              onClick={() => openLightbox(activeMediaIndex)}
              className="absolute bottom-3 right-3 rounded-lg bg-slate-900/75 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
            >
              Ouvrir en grand
            </button>
          )}
        </div>
        <div className="space-y-5 p-6">
          <div>
            <p className="text-sm font-semibold text-brand-700">{listing.categoryName}</p>
            <h1 className="font-heading text-3xl font-bold text-slate-900">{listing.title}</h1>
            <p className="mt-2 text-3xl font-bold text-brand-700">
              {listing.price.toLocaleString("fr-CA")} {listing.priceCurrency}
            </p>
            {listing.negotiable && (
              <p className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Prix negociable
              </p>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FireIcon className="h-5 w-5 text-brand-600" />
              Carburant: {listing.fuel || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Transmission: {listing.transmission || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Couleur interieur: {listing.interiorColor || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Couleur exterieur: {listing.exteriorColor || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <TruckIcon className="h-5 w-5 text-brand-600" />
              Kilometrage: {listing.mileage ? `${listing.mileage.toLocaleString("fr-CA")} km` : "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CalendarDaysIcon className="h-5 w-5 text-brand-600" />
              Annee: {listing.year || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPinIcon className="h-5 w-5 text-brand-600" />
              Ville: {listing.city || listing.location || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPinIcon className="h-5 w-5 text-brand-600" />
              Etat: {listing.itemState || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <PhoneIcon className="h-5 w-5 text-brand-600" />
              Telephone: {listing.phone || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Livraison: {listing.delivery === null ? "N/A" : listing.delivery ? "Oui" : "Non"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Export:{" "}
              {listing.exportAvailable === null ? "N/A" : listing.exportAvailable ? "Disponible" : "Non"}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <CheckBadgeIcon className="h-5 w-5 text-brand-600" />
              Statut: {listing.status || "N/A"}
            </div>
          </div>

          <section>
            <h2 className="font-heading text-xl font-semibold text-slate-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-slate-700">{listing.description}</p>
          </section>

          {listing.images.length > 1 && (
            <section>
              <h2 className="font-heading text-xl font-semibold text-slate-900">
                Galerie media ({listing.images.length})
              </h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listing.images.map((url, index) => {
                  const isVideo = isVideoMedia(url);
                  const isActive = index === activeMediaIndex;

                  return (
                    <button
                      key={`${url}-${index}`}
                      type="button"
                      onClick={() => openLightbox(index)}
                      className={`overflow-hidden rounded-xl border bg-white text-left transition ${
                        isActive
                          ? "border-brand-500 ring-2 ring-brand-200"
                          : "border-slate-200 hover:border-brand-300"
                      }`}
                    >
                      <div className="h-28 w-full bg-slate-100">
                        {isVideo ? (
                          <video
                            src={url}
                            muted
                            loop
                            autoPlay
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`${listing.title} media ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="px-2 py-1 text-xs text-slate-600">
                        {isVideo ? "Video" : "Photo"} {index + 1}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/contact?listing=${listing.id}&title=${encodeURIComponent(listing.title)}`}
              className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Contacter
            </Link>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                WhatsApp vendeur
              </a>
            )}
            {callUrl && (
              <a
                href={callUrl}
                className="rounded-xl border border-brand-300 bg-brand-50 px-5 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-100"
              >
                Appeler le vendeur
              </a>
            )}
            <Link
              to="/annonces"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Retour aux annonces
            </Link>
          </div>
        </div>
      </div>

      {isLightboxOpen && activeMediaUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 p-3 sm:p-6">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-3 top-3 rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="relative mx-auto flex h-full w-full max-w-6xl items-center justify-center">
            {listing.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPreviousMedia}
                  className="absolute left-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                  aria-label="Media precedent"
                >
                  <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNextMedia}
                  className="absolute right-2 z-10 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
                  aria-label="Media suivant"
                >
                  <ChevronRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            <div className="w-full overflow-hidden rounded-2xl border border-white/20 bg-black">
              {!lightboxLoadError ? (
                activeIsVideo ? (
                  <video
                    src={activeMediaUrl}
                    controls
                    autoPlay
                    onError={() => setLightboxLoadError(true)}
                    className="max-h-[80vh] w-full object-contain"
                  />
                ) : (
                  <img
                    src={activeMediaUrl}
                    alt={`${listing.title} media ${activeMediaIndex + 1}`}
                    onError={() => setLightboxLoadError(true)}
                    className="max-h-[80vh] w-full object-contain"
                  />
                )
              ) : (
                <div className="flex h-[60vh] items-center justify-center text-sm text-slate-200">
                  Impossible d afficher ce media.
                </div>
              )}
            </div>
          </div>

          <p className="mt-3 text-center text-sm text-white/90">
            Media {activeMediaIndex + 1} / {listing.images.length}
          </p>
        </div>
      )}
    </article>
  );
}
