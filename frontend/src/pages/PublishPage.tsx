import { ChangeEvent, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";
import {
  ApiError,
  createListing,
  fetchListingById,
  fetchAdminSession,
  fetchCategories,
  updateListing,
  uploadListingFiles,
} from "../api/client";
import { useSeo } from "../hooks/useSeo";
import { Category, NewListingPayload } from "../types";

const fuels = ["Essence", "Diesel", "Hybride", "Electrique", "GPL"];
const transmissions = ["Automatique", "Manuelle", "Semi-automatique"];
const statuses = ["Disponible", "Reserve", "Vendu"];
const itemStates = ["Neuf", "Occasion", "Bon etat", "A reparer"];
const MAX_MEDIA_ITEMS = 20;
const allowedUploadMimes = new Set([
  "image/jpeg",
  "image/pjpeg",
  "image/jfif",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
  "video/mpeg",
]);
const allowedUploadExtensions = new Set([
  "jpg",
  "jpeg",
  "jfif",
  "png",
  "webp",
  "gif",
  "avif",
  "bmp",
  "heic",
  "heif",
  "tif",
  "tiff",
  "ico",
  "mp4",
  "webm",
  "ogv",
  "ogg",
  "mov",
  "mpeg",
  "mpg",
]);
const fuelCategoryKeys = new Set(["automobile", "voiture", "voitures", "berline", "camionnette", "suv"]);
const transmissionCategoryKeys = new Set(["automobile"]);
const colorCategoryKeys = new Set(["automobile", "voiture", "voitures", "berline", "camionnette", "suv"]);
const mileageYearCategoryKeys = new Set([
  "automobile",
  "voiture",
  "voitures",
  "berline",
  "camionnette",
  "suv",
  "moto",
]);

interface CategoryAttributeRules {
  fuel: boolean;
  transmission: boolean;
  colors: boolean;
  mileageYear: boolean;
}

interface PublishFormValues {
  title: string;
  description: string;
  price: number;
  categoryId: string;
  fuel: string;
  transmission: string;
  interiorColor: string;
  exteriorColor: string;
  delivery: boolean;
  exportAvailable: boolean;
  status: string;
  mileage?: number;
  year?: number;
  negotiable: boolean;
  phone: string;
  city: string;
  itemState: string;
}

function normalizeCategoryKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getCategoryAttributeRules(category: Category | undefined): CategoryAttributeRules {
  if (!category) {
    return { fuel: false, transmission: false, colors: false, mileageYear: false };
  }

  const key = normalizeCategoryKey(category.slug || category.name);

  return {
    fuel: fuelCategoryKeys.has(key),
    transmission: transmissionCategoryKeys.has(key),
    colors: colorCategoryKeys.has(key),
    mileageYear: mileageYearCategoryKeys.has(key),
  };
}

function getAttributeHint(rules: CategoryAttributeRules): string {
  const labels: string[] = [];
  if (rules.fuel) labels.push("Carburant");
  if (rules.transmission) labels.push("Transmission");
  if (rules.colors) labels.push("Couleur interieur", "Couleur exterieur");
  if (rules.mileageYear) labels.push("Kilometrage", "Annee");
  if (labels.length === 0) return "Aucun attribut vehicule specifique pour cette categorie.";
  return `Attributs actifs pour cette categorie: ${labels.join(", ")}.`;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|ogv|mov|mpeg|mpg)(\?.*)?$/i.test(url);
}

function isAllowedLocalUploadFile(file: File): boolean {
  if (allowedUploadMimes.has(file.type)) {
    return true;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return allowedUploadExtensions.has(extension);
}

function mergeUniqueUrls(current: string[], incoming: string[]): string[] {
  const merged = [...current];
  incoming.forEach((entry) => {
    if (entry && !merged.includes(entry)) {
      merged.push(entry);
    }
  });
  return merged;
}

export default function PublishPage() {
  const { id } = useParams();
  const parsedListingId = id ? Number(id) : null;
  const isEditMode =
    parsedListingId !== null && Number.isInteger(parsedListingId) && parsedListingId > 0;

  const [categories, setCategories] = useState<Category[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);
  const [hasLoadedExisting, setHasLoadedExisting] = useState(false);
  const [manualMediaUrl, setManualMediaUrl] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaLoadErrors, setMediaLoadErrors] = useState<Record<string, boolean>>({});
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PublishFormValues>({
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      categoryId: "",
      fuel: "",
      transmission: "",
      interiorColor: "",
      exteriorColor: "",
      delivery: false,
      exportAvailable: false,
      status: "Disponible",
      mileage: undefined,
      year: undefined,
      negotiable: false,
      phone: "",
      city: "",
      itemState: "",
    },
  });

  const selectedCategoryId = Number(watch("categoryId") || 0);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
  const categoryRules = getCategoryAttributeRules(selectedCategory);
  const showFuel = categoryRules.fuel;
  const showTransmission = categoryRules.transmission;
  const showColors = categoryRules.colors;
  const showMileageYear = categoryRules.mileageYear;

  useSeo({
    title: isEditMode ? "Modifier une annonce" : "Publier une annonce",
    description: isEditMode
      ? "Modifiez rapidement une annonce existante sur Groupe Prolongation."
      : "Publiez rapidement une annonce automobile sur Groupe Prolongation.",
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    fetchAdminSession()
      .then((session) => {
        setIsAuthenticated(session.authenticated);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => setIsCheckingAuth(false));
  }, []);

  useEffect(() => {
    if (!showFuel) {
      setValue("fuel", "");
    }
    if (!showTransmission) {
      setValue("transmission", "");
    }
    if (!showColors) {
      setValue("interiorColor", "");
      setValue("exteriorColor", "");
    }
    if (!showMileageYear) {
      setValue("mileage", undefined);
      setValue("year", undefined);
    }
  }, [setValue, showColors, showFuel, showMileageYear, showTransmission]);

  useEffect(() => {
    setMediaLoadErrors({});
  }, [mediaUrls]);

  useEffect(() => {
    if (!isEditMode || !parsedListingId || isCheckingAuth || !isAuthenticated) {
      return;
    }

    setIsLoadingExisting(true);
    setHasLoadedExisting(false);
    setServerError(null);
    setIsSuccess(false);

    fetchListingById(parsedListingId)
      .then((listing) => {
        reset({
          title: listing.title,
          description: listing.description,
          price: listing.price,
          categoryId: String(listing.categoryId),
          fuel: listing.fuel || "",
          transmission: listing.transmission || "",
          interiorColor: listing.interiorColor || "",
          exteriorColor: listing.exteriorColor || "",
          delivery: Boolean(listing.delivery),
          exportAvailable: Boolean(listing.exportAvailable),
          status: listing.status || "Disponible",
          mileage: listing.mileage ?? undefined,
          year: listing.year ?? undefined,
          negotiable: Boolean(listing.negotiable),
          phone: listing.phone || "",
          city: listing.city || listing.location || "",
          itemState: listing.itemState || "",
        });
        setManualMediaUrl("");
        setMediaUrls(listing.images || []);
        setMediaLoadErrors({});
        setHasLoadedExisting(true);
      })
      .catch((apiError) => {
        const message =
          apiError instanceof Error
            ? apiError.message
            : "Impossible de charger l'annonce a modifier.";
        setServerError(message);
        setHasLoadedExisting(false);
      })
      .finally(() => {
        setIsLoadingExisting(false);
      });
  }, [isAuthenticated, isCheckingAuth, isEditMode, parsedListingId, reset]);

  const onSubmit: SubmitHandler<PublishFormValues> = async (data) => {
    if (!isAuthenticated) {
      setServerError("Connexion admin requise pour gerer une annonce.");
      return;
    }

    if (mediaUrls.length === 0) {
      setServerError("Ajoute au moins un media (image ou video).");
      return;
    }

    setServerError(null);
    setIsSuccess(false);

    const mileage =
      typeof data.mileage === "number" && Number.isFinite(data.mileage)
        ? data.mileage
        : undefined;
    const year =
      typeof data.year === "number" && Number.isFinite(data.year) ? data.year : undefined;

    const payload: NewListingPayload = {
      title: data.title,
      description: data.description,
      price: Number(data.price),
      categoryId: Number(data.categoryId),
      priceCurrency: "CAD",
      fuel: showFuel ? data.fuel || undefined : undefined,
      transmission: showTransmission ? data.transmission || undefined : undefined,
      interiorColor: showColors ? data.interiorColor || undefined : undefined,
      exteriorColor: showColors ? data.exteriorColor || undefined : undefined,
      delivery: Boolean(data.delivery),
      exportAvailable: Boolean(data.exportAvailable),
      status: data.status || "Disponible",
      mileage: showMileageYear ? mileage : undefined,
      year: showMileageYear ? year : undefined,
      negotiable: Boolean(data.negotiable),
      phone: data.phone || undefined,
      city: data.city || undefined,
      itemState: data.itemState || undefined,
      location: data.city || undefined,
      imageUrl: mediaUrls[0],
      mediaUrls,
    };

    try {
      const saved = isEditMode && parsedListingId
        ? await updateListing(parsedListingId, payload)
        : await createListing(payload);

      setIsSuccess(true);

      if (isEditMode) {
        reset({
          title: saved.title,
          description: saved.description,
          price: saved.price,
          categoryId: String(saved.categoryId),
          fuel: saved.fuel || "",
          transmission: saved.transmission || "",
          interiorColor: saved.interiorColor || "",
          exteriorColor: saved.exteriorColor || "",
          delivery: Boolean(saved.delivery),
          exportAvailable: Boolean(saved.exportAvailable),
          status: saved.status || "Disponible",
          mileage: saved.mileage ?? undefined,
          year: saved.year ?? undefined,
          negotiable: Boolean(saved.negotiable),
          phone: saved.phone || "",
          city: saved.city || saved.location || "",
          itemState: saved.itemState || "",
        });
        setMediaUrls(saved.images || []);
      } else {
        reset({
          title: "",
          description: "",
          price: 0,
          categoryId: "",
          fuel: "",
          transmission: "",
          interiorColor: "",
          exteriorColor: "",
          delivery: false,
          exportAvailable: false,
          status: "Disponible",
          mileage: undefined,
          year: undefined,
          negotiable: false,
          phone: "",
          city: "",
          itemState: "",
        });
        setMediaUrls([]);
      }

      setManualMediaUrl("");
      setMediaLoadErrors({});
    } catch (apiError) {
      const message =
        apiError instanceof Error
          ? apiError.message
          : isEditMode
            ? "La modification de l'annonce a echoue."
            : "La creation de l'annonce a echoue.";
      setServerError(message);
    }
  };

  async function handleMediaUpload(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;
    setUploadFeedback(null);

    const supportedFiles = selectedFiles.filter((file) => isAllowedLocalUploadFile(file));
    const rejectedFiles = selectedFiles.filter((file) => !isAllowedLocalUploadFile(file));
    const warnings: string[] = [];

    if (rejectedFiles.length > 0) {
      warnings.push(
        "Certains fichiers locaux ne sont pas compatibles web et ont ete ignores (formats acceptes: JPG, JPEG, JFIF, PNG, WEBP, GIF, AVIF, BMP, HEIC, HEIF, TIFF, ICO, MP4, WEBM, OGG, MOV, MPEG).",
      );
    }

    if (supportedFiles.length === 0) {
      const message = warnings.join(" ");
      setServerError(message);
      setUploadFeedback(message);
      event.target.value = "";
      return;
    }

    const remainingSlots = MAX_MEDIA_ITEMS - mediaUrls.length;
    if (remainingSlots <= 0) {
      setServerError(`Limite atteinte: ${MAX_MEDIA_ITEMS} medias maximum par annonce.`);
      event.target.value = "";
      return;
    }

    const filesToUpload = supportedFiles.slice(0, remainingSlots);
    if (supportedFiles.length > remainingSlots) {
      warnings.push(`Seulement ${remainingSlots} media(s) ont ete charges (max ${MAX_MEDIA_ITEMS}).`);
    }

    setServerError(warnings.length > 0 ? warnings.join(" ") : null);

    setIsUploadingMedia(true);
    try {
      const uploadedUrls = await uploadListingFiles(filesToUpload);
      setMediaUrls((current) =>
        mergeUniqueUrls(current, uploadedUrls).slice(0, MAX_MEDIA_ITEMS),
      );
      setUploadFeedback(`${uploadedUrls.length} media charge(s) avec succes.`);
    } catch (apiError) {
      let message = apiError instanceof Error ? apiError.message : "L'upload des medias a echoue.";
      if (apiError instanceof ApiError) {
        message = `${apiError.message} (HTTP ${apiError.status})`;
        if (apiError.status === 401) {
          message += " Connecte-toi d'abord sur /admin.";
        }
        if (apiError.status === 404 || apiError.status === 405) {
          message += " Verifie api/.htaccess (POST /api/uploads).";
        }
      }
      setServerError(message);
      setUploadFeedback(message);
    } finally {
      setIsUploadingMedia(false);
      event.target.value = "";
    }
  }

  function handleAddManualUrl() {
    const raw = manualMediaUrl.trim();
    if (!raw) return;

    if (mediaUrls.length >= MAX_MEDIA_ITEMS) {
      setServerError(`Limite atteinte: ${MAX_MEDIA_ITEMS} medias maximum par annonce.`);
      return;
    }

    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setServerError("Utilise une URL http:// ou https:// valide.");
        return;
      }

      setServerError(null);
      setMediaUrls((current) =>
        mergeUniqueUrls(current, [raw]).slice(0, MAX_MEDIA_ITEMS),
      );
      setManualMediaUrl("");
    } catch {
      if (/^[a-zA-Z]:\\/.test(raw)) {
        setServerError(
          "Chemin local detecte. Utilise le bouton 'Choisir des fichiers' pour envoyer un fichier local.",
        );
      } else {
        setServerError("Veuillez saisir une URL media valide.");
      }
    }
  }

  function handleRemoveMedia(index: number) {
    setMediaUrls((current) => current.filter((_, idx) => idx !== index));
    setMediaLoadErrors({});
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 page-enter">
      <section>
        <h1 className="font-heading text-3xl font-bold text-slate-900">
          {isEditMode ? "Modifier une annonce" : "Publier une annonce"}
        </h1>
        <p className="mt-1 text-slate-600">
          {isEditMode
            ? "Mettez a jour les informations de l'annonce puis enregistrez."
            : "Remplissez les informations principales pour publier votre annonce."}
        </p>
      </section>

      {isSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {isEditMode
            ? "L'annonce a ete mise a jour avec succes."
            : "Votre annonce a ete publiee avec succes."}
        </div>
      )}

      {serverError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {serverError}
        </div>
      )}

      {!isCheckingAuth && !isAuthenticated && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          Cette page est reservee a l administration.
          <Link to="/admin" className="ml-2 font-semibold underline">
            Se connecter
          </Link>
        </div>
      )}

      {isCheckingAuth && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Verification de la session admin...
        </div>
      )}

      {!isCheckingAuth && isAuthenticated && id !== undefined && !isEditMode && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Identifiant d'annonce invalide.
        </div>
      )}

      {!isCheckingAuth && isAuthenticated && isEditMode && isLoadingExisting && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Chargement de l'annonce a modifier...
        </div>
      )}

      {!isCheckingAuth &&
        isAuthenticated &&
        (!id || isEditMode) &&
        !isLoadingExisting &&
        (!isEditMode || hasLoadedExisting) && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Titre *</label>
            <input
              {...register("title", {
                required: "Le titre est obligatoire.",
                minLength: { value: 3, message: "Minimum 3 caracteres." },
              })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              placeholder="Ex: Toyota Corolla 2020 tres propre"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Description *</label>
            <textarea
              rows={5}
              {...register("description", {
                required: "La description est obligatoire.",
                minLength: { value: 20, message: "Minimum 20 caracteres." },
              })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              placeholder="Precisez l'etat, les options et l'historique..."
            />
            {errors.description && (
              <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Prix (CAD) *</label>
              <input
                type="number"
                min="0"
                {...register("price", {
                  required: "Le prix est obligatoire.",
                  valueAsNumber: true,
                  min: { value: 0, message: "Le prix ne peut pas etre negatif." },
                })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              />
              {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Categorie *</label>
              <select
                {...register("categoryId", { required: "La categorie est obligatoire." })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                defaultValue=""
              >
                <option value="" disabled>
                  Selectionner
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.parentId ? `- ${category.name}` : category.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-rose-600">{errors.categoryId.message}</p>
              )}
              {selectedCategory && (
                <p className="mt-2 text-xs text-slate-600">{getAttributeHint(categoryRules)}</p>
              )}
            </div>
          </div>

          {(showFuel || showTransmission) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {showFuel && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Carburant *</label>
                  <select
                    {...register("fuel", {
                      validate: (value) =>
                        !showFuel || value.trim() !== "" || "Le carburant est obligatoire pour cette categorie.",
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                    defaultValue=""
                  >
                    <option value="">Selectionner</option>
                    {fuels.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                  {errors.fuel && <p className="mt-1 text-xs text-rose-600">{errors.fuel.message}</p>}
                </div>
              )}

              {showTransmission && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Transmission *</label>
                  <select
                    {...register("transmission", {
                      validate: (value) =>
                        !showTransmission ||
                        value.trim() !== "" ||
                        "La transmission est obligatoire pour cette categorie.",
                    })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                    defaultValue=""
                  >
                    <option value="">Selectionner</option>
                    {transmissions.map((entry) => (
                      <option key={entry} value={entry}>
                        {entry}
                      </option>
                    ))}
                  </select>
                  {errors.transmission && (
                    <p className="mt-1 text-xs text-rose-600">{errors.transmission.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {showColors && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Couleur interieur *</label>
                <input
                  {...register("interiorColor", {
                    validate: (value) =>
                      !showColors ||
                      value.trim() !== "" ||
                      "La couleur interieur est obligatoire pour cette categorie.",
                  })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                  placeholder="Ex: Noir"
                />
                {errors.interiorColor && (
                  <p className="mt-1 text-xs text-rose-600">{errors.interiorColor.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Couleur exterieur *</label>
                <input
                  {...register("exteriorColor", {
                    validate: (value) =>
                      !showColors ||
                      value.trim() !== "" ||
                      "La couleur exterieur est obligatoire pour cette categorie.",
                  })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                  placeholder="Ex: Blanc"
                />
                {errors.exteriorColor && (
                  <p className="mt-1 text-xs text-rose-600">{errors.exteriorColor.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Statut</label>
              <select
                {...register("status")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
              >
                {statuses.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Etat</label>
              <select
                {...register("itemState")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                defaultValue=""
              >
                <option value="">Selectionner</option>
                {itemStates.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Telephone *</label>
              <input
                {...register("phone", {
                  required: "Le telephone est obligatoire.",
                  minLength: { value: 8, message: "Telephone trop court." },
                })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                placeholder="+1 514 000 0000"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Ville *</label>
              <input
                {...register("city", {
                  required: "La ville est obligatoire.",
                })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                placeholder="Ex: Montreal"
              />
              {errors.city && <p className="mt-1 text-xs text-rose-600">{errors.city.message}</p>}
            </div>
          </div>

          {showMileageYear && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Kilometrage(km) *</label>
                <input
                  type="number"
                  min="0"
                  {...register("mileage", {
                    valueAsNumber: true,
                    validate: (value) => {
                      if (!showMileageYear) return true;
                      if (value === undefined || Number.isNaN(value)) {
                        return "Le kilometrage est obligatoire pour cette categorie.";
                      }
                      if (value < 0) {
                        return "Le kilometrage doit etre positif.";
                      }
                      return true;
                    },
                  })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                  placeholder="Ex: 45000"
                />
                {errors.mileage && (
                  <p className="mt-1 text-xs text-rose-600">{errors.mileage.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Annee *</label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 1}
                  {...register("year", {
                    valueAsNumber: true,
                    validate: (value) => {
                      if (!showMileageYear) return true;
                      const maxYear = new Date().getFullYear() + 1;
                      if (value === undefined || Number.isNaN(value)) {
                        return "L'annee est obligatoire pour cette categorie.";
                      }
                      if (value < 1950 || value > maxYear) {
                        return `L'annee doit etre comprise entre 1950 et ${maxYear}.`;
                      }
                      return true;
                    },
                  })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                  placeholder="Ex: 2021"
                />
                {errors.year && <p className="mt-1 text-xs text-rose-600">{errors.year.message}</p>}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Options</label>
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" {...register("delivery")} className="h-4 w-4 rounded border-slate-300" />
                Livraison
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  {...register("exportAvailable")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Export disponible
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  {...register("negotiable")}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Negociable
              </label>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                URL media (image/video)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualMediaUrl}
                  onChange={(event) => setManualMediaUrl(event.target.value)}
                  placeholder="https://... (image ou video)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-brand-300 focus:ring"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  className="rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
                >
                  Ajouter URL
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Upload de fichiers (images et videos)
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.jfif,.png,.webp,.gif,.avif,.bmp,.heic,.heif,.tif,.tiff,.ico,.mp4,.webm,.ogv,.ogg,.mov,.mpeg,.mpg,image/jpeg,image/jfif,image/png,image/webp,image/gif,image/avif,image/bmp,image/heic,image/heif,image/tiff,image/x-icon,image/vnd.microsoft.icon,video/mp4,video/webm,video/ogg,video/quicktime,video/mpeg"
                multiple
                onChange={handleMediaUpload}
                className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-100 file:px-3 file:py-2 file:font-semibold file:text-brand-800 hover:file:bg-brand-200"
              />
              <p className="mt-2 text-xs text-slate-600">
                Maximum {MAX_MEDIA_ITEMS} medias par annonce (photos et videos).
              </p>
              {isUploadingMedia && <p className="mt-1 text-xs text-slate-600">Upload en cours...</p>}
              {uploadFeedback && (
                <p
                  className={`mt-1 text-xs ${
                    uploadFeedback.includes("succes") ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {uploadFeedback}
                </p>
              )}
            </div>

            {mediaUrls.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mediaUrls.map((url, index) => {
                  const mediaKey = `${url}-${index}`;
                  const isVideo = isVideoUrl(url);
                  const hasLoadError = Boolean(mediaLoadErrors[mediaKey]);

                  return (
                  <div key={mediaKey} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="h-36 bg-slate-100">
                      {!hasLoadError ? (
                        isVideo ? (
                          <video
                            src={url}
                            controls
                            onError={() =>
                              setMediaLoadErrors((current) => ({ ...current, [mediaKey]: true }))
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`Media ${index + 1}`}
                            onError={() =>
                              setMediaLoadErrors((current) => ({ ...current, [mediaKey]: true }))
                            }
                            className="h-full w-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
                          <p className="text-xs font-semibold text-slate-700">Media non affichable ici</p>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-brand-700 underline"
                          >
                            Ouvrir le fichier
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-2">
                      <span className="text-xs text-slate-600">
                        {isVideo ? "Video" : "Media"} {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia(index)}
                        className="rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isAuthenticated || isUploadingMedia}
            className="rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting
              ? isEditMode
                ? "Mise a jour en cours..."
                : "Publication en cours..."
              : isEditMode
                ? "Enregistrer les modifications"
                : "Publier l'annonce"}
          </button>
        </form>
      )}
    </div>
  );
}
