import { ApiError } from "../api/client";

const SHOW_TECHNICAL =
  import.meta.env.DEV && import.meta.env.VITE_SHOW_API_ERRORS === "true";

/**
 * Messages génériques pour les visiteurs (pas de détails serveur / SQL / HTTP).
 * Pour voir le message réel en local : dans `.env.local` mettre VITE_SHOW_API_ERRORS=true
 */
export const PUBLIC_MSG_LISTINGS =
  "Impossible d'afficher les annonces pour le moment. Merci de reessayer plus tard.";

export const PUBLIC_MSG_LISTING_DETAIL =
  "Impossible d'afficher cette annonce pour le moment. Merci de reessayer plus tard.";

export const PUBLIC_MSG_CONTACT =
  "L'envoi du message n'a pas abouti. Merci de reessayer plus tard ou de nous ecrire a contact@groupeprolongation.com.";

function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/** Erreur chargement listes / accueil / liste filtrée */
export function publicListingsError(error: unknown): string {
  if (SHOW_TECHNICAL && error instanceof Error) {
    return error.message;
  }
  return PUBLIC_MSG_LISTINGS;
}

/** Erreur page détail : garde « Annonce introuvable » pour 404 (pas technique) */
export function publicListingDetailError(error: unknown): string {
  if (SHOW_TECHNICAL && error instanceof Error) {
    return error.message;
  }
  if (isApiError(error) && error.status === 404) {
    return "Annonce introuvable.";
  }
  return PUBLIC_MSG_LISTING_DETAIL;
}

/** Erreur formulaire contact */
export function publicContactError(error: unknown): string {
  if (SHOW_TECHNICAL && error instanceof Error) {
    return error.message;
  }
  return PUBLIC_MSG_CONTACT;
}
