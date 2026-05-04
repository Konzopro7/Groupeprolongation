import {
  AdminDashboardStats,
  Category,
  ContactPayload,
  Listing,
  ListingFilters,
  NewListingPayload,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const USE_MOCK = import.meta.env.VITE_ENABLE_MOCK === "true";

const MOCK_CATEGORIES_KEY = "gp_mock_categories_v2";
const MOCK_LISTINGS_KEY = "gp_mock_listings_v2";
const MOCK_CONTACTS_KEY = "gp_mock_contacts_v2";
const MOCK_ADMIN_SESSION_KEY = "gp_mock_admin_session_v2";
const MAX_MEDIA_ITEMS = 20;

function normalizeApiBaseUrl(base: string): string {
  const trimmed = String(base || "").trim();
  if (!trimmed) {
    return "/api";
  }
  return trimmed.replace(/\/+$/, "");
}

function getDefaultApiBaseUrl(): string {
  const baseUrl = String(import.meta.env.BASE_URL || "/").trim();
  if (baseUrl !== "/" && baseUrl !== "") {
    return `${baseUrl.replace(/\/+$/, "")}/api`;
  }
  return "/api";
}

const RESOLVED_API_BASE_URL = normalizeApiBaseUrl(API_BASE_URL || getDefaultApiBaseUrl());

function toCanonicalMediaReference(value: string): string {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return "";
  }

  // Un chemin local Windows (C:\...) n'est pas affichable depuis le navigateur.
  if (/^[a-zA-Z]:[\\/]/.test(trimmed)) {
    return "";
  }

  if (/^(?:https?:|data:|blob:)/i.test(trimmed)) {
    if (/^https?:/i.test(trimmed)) {
      try {
        const parsed = new URL(trimmed);
        if (/\/api\/(?:uploads|media)\//.test(parsed.pathname)) {
          const normalizedPath = parsed.pathname.replace("/api/uploads/", "/api/media/");
          return `${normalizedPath}${parsed.search}${parsed.hash}`;
        }
        return parsed.toString();
      } catch {
        return "";
      }
    }
    return trimmed;
  }

  // Rejette les schemas non supportes (ex: ftp:, file:, c:).
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    return "";
  }

  if (trimmed.startsWith("//")) {
    const protocol = typeof window !== "undefined" ? window.location.protocol : "https:";
    return `${protocol}${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("/api/uploads/")) {
      return trimmed.replace("/api/uploads/", "/api/media/");
    }
    return trimmed;
  }

  if (trimmed.startsWith("api/")) {
    const withSlash = `/${trimmed}`;
    if (withSlash.startsWith("/api/uploads/")) {
      return withSlash.replace("/api/uploads/", "/api/media/");
    }
    return withSlash;
  }

  return trimmed;
}

function normalizeMediaArray(values: unknown[]): string[] {
  const normalized = values
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => toCanonicalMediaReference(entry))
    .filter((entry) => entry !== "");

  return Array.from(new Set(normalized)).slice(0, MAX_MEDIA_ITEMS);
}

interface AdminSessionResponse {
  authenticated: boolean;
  username: string | null;
}

export class ApiError extends Error {
  status: number;
  details?: Record<string, string>;

  constructor(message: string, status: number, details?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ApiResponse<T> = {
  data: T;
};

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBooleanOrNull(value: unknown): boolean | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  const normalized = String(value).toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return null;
}

function mapListing(raw: Record<string, unknown>): Listing {
  let images: string[] = [];
  if (Array.isArray(raw.images)) {
    images = normalizeMediaArray(raw.images);
  }

  const city = (raw.city as string | null) ?? null;
  const legacyLocation = (raw.location as string | null) ?? null;

  return {
    id: Number(raw.id),
    title: String(raw.title ?? ""),
    description: String(raw.description ?? ""),
    price: Number(raw.price ?? 0),
    categoryId: Number(raw.category_id ?? 0),
    categoryName: String(raw.category_name ?? ""),
    fuel: (raw.fuel as string | null) ?? null,
    transmission: (raw.transmission as string | null) ?? null,
    interiorColor: (raw.interior_color as string | null) ?? null,
    exteriorColor: (raw.exterior_color as string | null) ?? null,
    delivery: toBooleanOrNull(raw.delivery),
    exportAvailable: toBooleanOrNull(raw.export_available),
    status: (raw.status as string | null) ?? null,
    mileage: toNumberOrNull(raw.mileage),
    year: toNumberOrNull(raw.year),
    negotiable: toBooleanOrNull(raw.negotiable),
    phone: (raw.phone as string | null) ?? null,
    city,
    itemState: (raw.item_state as string | null) ?? null,
    priceCurrency: String(raw.price_currency ?? "XAF"),
    location: city || legacyLocation,
    images,
    createdAt: String(raw.created_at ?? ""),
  };
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSeedCategories(): Category[] {
  return [
    { id: 1, name: "Automobile", slug: "automobile", parentId: null },
    { id: 2, name: "Accessoires", slug: "accessoires", parentId: 1 },
    { id: 3, name: "Berline", slug: "berline", parentId: 1 },
    { id: 4, name: "Camionnette", slug: "camionnette", parentId: 1 },
    { id: 5, name: "Pieces", slug: "pieces-auto", parentId: 1 },
    { id: 6, name: "SUV", slug: "suv", parentId: 1 },
    { id: 7, name: "Voitures", slug: "voiture", parentId: 1 },
    { id: 8, name: "Autres", slug: "autre", parentId: null },
    { id: 9, name: "Bicyclette", slug: "bicyclette", parentId: null },
    { id: 10, name: "Electromenagers", slug: "electromenagers", parentId: null },
    { id: 11, name: "Cuisine", slug: "cuisine", parentId: 10 },
    { id: 12, name: "Entretien", slug: "entretien", parentId: 10 },
    { id: 13, name: "Moto", slug: "moto", parentId: null },
    { id: 14, name: "Usagers", slug: "usagers", parentId: null },
    { id: 15, name: "Vetements", slug: "vetements", parentId: null },
  ];
}

function sortCategories(categories: Category[]): Category[] {
  const byId = new Map<number, Category>();
  categories.forEach((entry) => byId.set(entry.id, entry));

  const roots = categories
    .filter((entry) => entry.parentId === null)
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
  const childrenByParent = new Map<number, Category[]>();
  categories
    .filter((entry) => entry.parentId !== null)
    .forEach((entry) => {
      const parentId = entry.parentId as number;
      const current = childrenByParent.get(parentId) || [];
      current.push(entry);
      childrenByParent.set(parentId, current);
    });

  childrenByParent.forEach((list) => list.sort((a, b) => a.name.localeCompare(b.name, "fr")));

  const ordered: Category[] = [];
  roots.forEach((root) => {
    ordered.push(root);
    const children = childrenByParent.get(root.id) || [];
    children.forEach((child) => {
      if (byId.has(child.id)) {
        ordered.push(child);
      }
    });
  });

  return ordered;
}

function getSeedListings(categories: Category[]): Listing[] {
  return [
    {
      id: 1,
      title: "Toyota Corolla SE 2022",
      description:
        "Vehicule en excellent etat, entretien regulier, pneus hiver inclus, aucune reparation a prevoir.",
      price: 24800,
      categoryId: 7,
      categoryName: categories.find((c) => c.id === 7)?.name || "Voitures",
      fuel: "Essence",
      transmission: "Automatique",
      interiorColor: "Noir",
      exteriorColor: "Blanc",
      delivery: true,
      exportAvailable: false,
      status: "Disponible",
      mileage: 36000,
      year: 2022,
      negotiable: true,
      phone: "+1 514 555 1240",
      city: "Montreal",
      itemState: "Occasion",
      priceCurrency: "XAF",
      location: "Montreal",
      images: ["https://images.unsplash.com/photo-1549921296-3a6b0e8dd1e0?auto=format&fit=crop&w=1200&q=80"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      title: "Nissan Rogue 2021 SUV",
      description:
        "SUV tres propre, interieur impeccable, traction integrale, ideal pour famille et route d hiver.",
      price: 31900,
      categoryId: 6,
      categoryName: categories.find((c) => c.id === 6)?.name || "SUV",
      fuel: "Essence",
      transmission: "Automatique",
      interiorColor: "Gris",
      exteriorColor: "Noir",
      delivery: false,
      exportAvailable: true,
      status: "Disponible",
      mileage: 49000,
      year: 2021,
      negotiable: false,
      phone: "+1 438 555 7788",
      city: "Laval",
      itemState: "Occasion",
      priceCurrency: "XAF",
      location: "Laval",
      images: ["https://images.unsplash.com/photo-1494905998402-395d579af36f?auto=format&fit=crop&w=1200&q=80"],
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      title: "Yamaha MT-07 2020",
      description:
        "Moto performante et fiable, entretien fait en concession, tenue de route excellente, aucun accident.",
      price: 9200,
      categoryId: 13,
      categoryName: categories.find((c) => c.id === 13)?.name || "Moto",
      fuel: "Essence",
      transmission: "Manuelle",
      interiorColor: null,
      exteriorColor: null,
      delivery: false,
      exportAvailable: false,
      status: "Disponible",
      mileage: 18000,
      year: 2020,
      negotiable: true,
      phone: "+1 450 555 3344",
      city: "Quebec",
      itemState: "Bon etat",
      priceCurrency: "XAF",
      location: "Quebec",
      images: ["https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80"],
      createdAt: new Date().toISOString(),
    },
  ];
}

function ensureMockData() {
  const categories = readStorage<Category[]>(MOCK_CATEGORIES_KEY, []);
  if (categories.length === 0) {
    const seededCategories = getSeedCategories();
    writeStorage(MOCK_CATEGORIES_KEY, seededCategories);
    writeStorage(MOCK_LISTINGS_KEY, getSeedListings(seededCategories));
  }
}

function getMockCategories(): Category[] {
  ensureMockData();
  return readStorage<Category[]>(MOCK_CATEGORIES_KEY, []);
}

function getMockListings(): Listing[] {
  ensureMockData();
  return readStorage<Listing[]>(MOCK_LISTINGS_KEY, []);
}

function saveMockListings(listings: Listing[]) {
  writeStorage(MOCK_LISTINGS_KEY, listings);
}

function getMockAdminSession(): AdminSessionResponse {
  return readStorage<AdminSessionResponse>(MOCK_ADMIN_SESSION_KEY, {
    authenticated: false,
    username: null,
  });
}

function setMockAdminSession(session: AdminSessionResponse) {
  writeStorage(MOCK_ADMIN_SESSION_KEY, session);
}

function filterMockListings(listings: Listing[], filters: ListingFilters): Listing[] {
  return listings
    .filter((item) => {
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.fuel && item.fuel !== filters.fuel) return false;
      if (filters.minPrice !== undefined && item.price < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && item.price > filters.maxPrice) return false;
      if (filters.q) {
        const term = filters.q.toLowerCase();
        const haystack = `${item.title} ${item.description} ${item.city || ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, filters.limit ?? 100);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  const isFormData = init.body instanceof FormData;
  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  const response = await fetch(`${RESOLVED_API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const rawText = await response.text();
  let payload: unknown = {};
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: string; details?: Record<string, string> };
    throw new ApiError(
      errorPayload.error || "Une erreur est survenue cote serveur.",
      response.status,
      errorPayload.details,
    );
  }

  return payload as T;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

async function filesToDataUrls(files: File[]): Promise<string[]> {
  return Promise.all(files.map((file) => fileToDataUrl(file)));
}

function extractUploadedUrls(response: ApiResponse<{ urls?: string[]; url?: string }>): string[] {
  if (Array.isArray(response.data.urls) && response.data.urls.length > 0) {
    return normalizeMediaArray(response.data.urls);
  }

  if (typeof response.data.url === "string" && response.data.url.trim() !== "") {
    const normalized = toCanonicalMediaReference(response.data.url);
    return normalized ? [normalized] : [];
  }

  return [];
}

function isRetriableUploadError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 405);
}

function createMediaFormData(files: File[]): FormData {
  const formData = new FormData();
  files.forEach((file) => formData.append("media[]", file));
  return formData;
}

function createSingleMediaFormData(file: File): FormData {
  const formData = new FormData();
  formData.append("file", file);
  return formData;
}

async function uploadViaJsonFallback(files: File[], endpoint: string): Promise<string[]> {
  const dataUrls = await filesToDataUrls(files);
  const payloadFiles = files.map((file, index) => ({
    name: file.name,
    data_url: dataUrls[index] || "",
  }));

  const response = await request<ApiResponse<{ urls?: string[]; url?: string }>>(endpoint, {
    method: "POST",
    body: JSON.stringify({ files: payloadFiles }),
  });

  return extractUploadedUrls(response);
}

export async function fetchCategories(): Promise<Category[]> {
  if (USE_MOCK) {
    return sortCategories(getMockCategories());
  }

  const response = await request<ApiResponse<Array<Record<string, unknown>>>>("/categories");
  const categories = response.data.map((raw) => ({
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    slug: String(raw.slug ?? ""),
    parentId:
      raw.parent_id === null || raw.parent_id === undefined || raw.parent_id === ""
        ? null
        : Number(raw.parent_id),
  }));
  return sortCategories(categories);
}

export async function fetchListings(filters: ListingFilters = {}): Promise<Listing[]> {
  if (USE_MOCK) {
    return filterMockListings(getMockListings(), filters);
  }

  const params = new URLSearchParams();
  if (filters.categoryId) params.set("category_id", String(filters.categoryId));
  if (filters.q) params.set("q", filters.q);
  if (filters.fuel) params.set("fuel", filters.fuel);
  if (filters.minPrice !== undefined) params.set("min_price", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("max_price", String(filters.maxPrice));
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));

  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await request<ApiResponse<Array<Record<string, unknown>>>>(`/listings${query}`);
  return response.data.map(mapListing);
}

export async function fetchListingById(id: number): Promise<Listing> {
  if (USE_MOCK) {
    const listing = getMockListings().find((item) => item.id === id);
    if (!listing) {
      throw new ApiError("Annonce introuvable.", 404);
    }
    return listing;
  }

  const response = await request<ApiResponse<Record<string, unknown>>>(`/listings/${id}`);
  return mapListing(response.data);
}

export async function createListing(payload: NewListingPayload): Promise<Listing> {
  const normalizedMediaUrls = normalizeMediaArray(payload.mediaUrls ?? []);
  const normalizedImageUrl = toCanonicalMediaReference(payload.imageUrl ?? "");
  const finalMediaUrls =
    normalizedMediaUrls.length > 0
      ? normalizedMediaUrls
      : normalizedImageUrl
        ? [normalizedImageUrl]
        : [];

  if (USE_MOCK) {
    const session = getMockAdminSession();
    if (!session.authenticated) {
      throw new ApiError("Authentification admin requise.", 401);
    }

    const listings = getMockListings();
    const categories = getMockCategories();
    const id = listings.length > 0 ? Math.max(...listings.map((item) => item.id)) + 1 : 1;
    const category = categories.find((item) => item.id === payload.categoryId);

    const created: Listing = {
      id,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      categoryId: payload.categoryId,
      categoryName: category?.name || "Categorie",
      fuel: payload.fuel || null,
      transmission: payload.transmission || null,
      interiorColor: payload.interiorColor || null,
      exteriorColor: payload.exteriorColor || null,
      delivery: payload.delivery ?? null,
      exportAvailable: payload.exportAvailable ?? null,
      status: payload.status || "Disponible",
      mileage: payload.mileage ?? null,
      year: payload.year ?? null,
      negotiable: payload.negotiable ?? null,
      phone: payload.phone || null,
      city: payload.city || null,
      itemState: payload.itemState || null,
      priceCurrency: payload.priceCurrency || "XAF",
      location: payload.city || payload.location || null,
      images: finalMediaUrls,
      createdAt: new Date().toISOString(),
    };

    saveMockListings([created, ...listings]);
    return created;
  }

  const response = await request<ApiResponse<Record<string, unknown>>>("/listings", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      price: payload.price,
      category_id: payload.categoryId,
      fuel: payload.fuel,
      transmission: payload.transmission,
      interior_color: payload.interiorColor,
      exterior_color: payload.exteriorColor,
      delivery: payload.delivery,
      export_available: payload.exportAvailable,
      status: payload.status,
      mileage: payload.mileage,
      year: payload.year,
      negotiable: payload.negotiable,
      phone: payload.phone,
      city: payload.city,
      item_state: payload.itemState,
      price_currency: payload.priceCurrency || "XAF",
      location: payload.location || payload.city,
      images: finalMediaUrls.length > 0 ? finalMediaUrls : undefined,
      image_url: finalMediaUrls[0],
    }),
  });

  return mapListing(response.data);
}

export async function updateListing(id: number, payload: NewListingPayload): Promise<Listing> {
  const normalizedMediaUrls = normalizeMediaArray(payload.mediaUrls ?? []);
  const normalizedImageUrl = toCanonicalMediaReference(payload.imageUrl ?? "");
  const finalMediaUrls =
    normalizedMediaUrls.length > 0
      ? normalizedMediaUrls
      : normalizedImageUrl
        ? [normalizedImageUrl]
        : [];

  if (USE_MOCK) {
    const session = getMockAdminSession();
    if (!session.authenticated) {
      throw new ApiError("Authentification admin requise.", 401);
    }

    const listings = getMockListings();
    const categories = getMockCategories();
    const index = listings.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new ApiError("Annonce introuvable.", 404);
    }

    const category = categories.find((item) => item.id === payload.categoryId);
    const current = listings[index];
    const updated: Listing = {
      ...current,
      title: payload.title,
      description: payload.description,
      price: payload.price,
      categoryId: payload.categoryId,
      categoryName: category?.name || current.categoryName,
      fuel: payload.fuel || null,
      transmission: payload.transmission || null,
      interiorColor: payload.interiorColor || null,
      exteriorColor: payload.exteriorColor || null,
      delivery: payload.delivery ?? null,
      exportAvailable: payload.exportAvailable ?? null,
      status: payload.status || "Disponible",
      mileage: payload.mileage ?? null,
      year: payload.year ?? null,
      negotiable: payload.negotiable ?? null,
      phone: payload.phone || null,
      city: payload.city || null,
      itemState: payload.itemState || null,
      priceCurrency: payload.priceCurrency || current.priceCurrency || "XAF",
      location: payload.city || payload.location || null,
      images: finalMediaUrls,
    };

    const next = [...listings];
    next[index] = updated;
    saveMockListings(next);
    return updated;
  }

  const response = await request<ApiResponse<Record<string, unknown>>>(`/listings/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      price: payload.price,
      category_id: payload.categoryId,
      fuel: payload.fuel,
      transmission: payload.transmission,
      interior_color: payload.interiorColor,
      exterior_color: payload.exteriorColor,
      delivery: payload.delivery,
      export_available: payload.exportAvailable,
      status: payload.status,
      mileage: payload.mileage,
      year: payload.year,
      negotiable: payload.negotiable,
      phone: payload.phone,
      city: payload.city,
      item_state: payload.itemState,
      price_currency: payload.priceCurrency || "XAF",
      location: payload.location || payload.city,
      images: finalMediaUrls.length > 0 ? finalMediaUrls : undefined,
      image_url: finalMediaUrls[0],
    }),
  });

  return mapListing(response.data);
}

export async function deleteListing(id: number): Promise<void> {
  if (USE_MOCK) {
    const session = getMockAdminSession();
    if (!session.authenticated) {
      throw new ApiError("Authentification admin requise.", 401);
    }

    const listings = getMockListings();
    saveMockListings(listings.filter((item) => item.id !== id));
    return;
  }

  await request<ApiResponse<{ success: boolean }>>(`/listings/${id}`, {
    method: "DELETE",
  });
}

export async function uploadListingFiles(files: File[]): Promise<string[]> {
  if (files.length === 0) {
    return [];
  }

  if (USE_MOCK) {
    const session = getMockAdminSession();
    if (!session.authenticated) {
      throw new ApiError("Authentification admin requise.", 401);
    }

    return filesToDataUrls(files);
  }

  let lastError: unknown = null;
  const multipartEndpoints = [
    "/files",
    "/media-store",
    "/upload-media",
    "/uploads",
    "/index.php?route=files",
    "/index.php?route=media-store",
    "/index.php?route=upload-media",
    "/index.php?route=uploads",
    "/index.php?r=files",
    "/index.php?r=media-store",
    "/index.php?r=upload-media",
    "/index.php?r=uploads",
    "/index.php?__route=files",
    "/index.php?__route=media-store",
    "/index.php?__route=upload-media",
    "/index.php?__route=uploads",
  ];

  for (const endpoint of multipartEndpoints) {
    try {
      const response = await request<ApiResponse<{ urls?: string[]; url?: string }>>(endpoint, {
        method: "POST",
        body: createMediaFormData(files),
      });
      return extractUploadedUrls(response);
    } catch (error) {
      if (!isRetriableUploadError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  // Fallback plus tolerant: upload 1 fichier a la fois avec un champ simple `file`.
  const singleFileUrls: string[] = [];
  let singleFileModeWorked = false;
  for (const file of files) {
    let uploadedForThisFile = false;
    for (const endpoint of multipartEndpoints) {
      try {
        const response = await request<ApiResponse<{ urls?: string[]; url?: string }>>(endpoint, {
          method: "POST",
          body: createSingleMediaFormData(file),
        });
        const urls = extractUploadedUrls(response);
        if (urls.length > 0) {
          singleFileUrls.push(...urls);
          singleFileModeWorked = true;
          uploadedForThisFile = true;
          break;
        }
      } catch (error) {
        if (!isRetriableUploadError(error)) {
          throw error;
        }
        lastError = error;
      }
    }

    if (!uploadedForThisFile) {
      singleFileModeWorked = false;
      break;
    }
  }

  if (singleFileModeWorked && singleFileUrls.length > 0) {
    return normalizeMediaArray(singleFileUrls);
  }

  const jsonEndpoints = [
    "/files-json",
    "/media-store-json",
    "/upload-media-json",
    "/index.php?route=files-json",
    "/index.php?route=media-store-json",
    "/index.php?route=upload-media-json",
    "/index.php?r=files-json",
    "/index.php?r=media-store-json",
    "/index.php?r=upload-media-json",
    "/index.php?__route=files-json",
    "/index.php?__route=media-store-json",
    "/index.php?__route=upload-media-json",
  ];

  for (const endpoint of jsonEndpoints) {
    try {
      return await uploadViaJsonFallback(files, endpoint);
    } catch (error) {
      if (!isRetriableUploadError(error)) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("Upload media impossible.", 500);
}

export async function uploadListingImage(file: File): Promise<string> {
  const urls = await uploadListingFiles([file]);
  if (urls.length === 0) {
    throw new ApiError("Aucun media upload valide.", 422);
  }
  return urls[0];
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
  if (USE_MOCK) {
    const current = readStorage<Array<ContactPayload & { created_at: string }>>(MOCK_CONTACTS_KEY, []);
    writeStorage(MOCK_CONTACTS_KEY, [...current, { ...payload, created_at: new Date().toISOString() }]);
    return;
  }

  await request<ApiResponse<{ success: boolean }>>("/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function toMonthKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getLastMonths(count: number): string[] {
  const months: string[] = [];
  const now = new Date();
  now.setDate(1);
  for (let index = count - 1; index >= 0; index -= 1) {
    const copy = new Date(now);
    copy.setMonth(now.getMonth() - index);
    const month = String(copy.getMonth() + 1).padStart(2, "0");
    months.push(`${copy.getFullYear()}-${month}`);
  }
  return months;
}

function buildMockAdminStats(): AdminDashboardStats {
  const listings = getMockListings();
  const categories = getMockCategories();
  const contacts = readStorage<Array<{ created_at?: string }>>(MOCK_CONTACTS_KEY, []);

  const now = Date.now();
  const days30 = 30 * 24 * 60 * 60 * 1000;
  const listingsLast30Days = listings.filter((entry) => {
    const created = new Date(entry.createdAt).getTime();
    return Number.isFinite(created) && now - created <= days30;
  }).length;

  const contactsLast30Days = contacts.filter((entry) => {
    const raw = typeof entry === "object" && entry && "created_at" in entry
      ? String((entry as { created_at?: string }).created_at || "")
      : "";
    const created = new Date(raw).getTime();
    return Number.isFinite(created) && now - created <= days30;
  }).length;

  const byCategory = categories
    .map((category) => ({
      categoryId: category.id,
      categoryName: category.name,
      total: listings.filter((entry) => entry.categoryId === category.id).length,
    }))
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const monthKeys = getLastMonths(6);
  const listingsMap = new Map<string, number>();
  const contactsMap = new Map<string, number>();

  listings.forEach((entry) => {
    const key = toMonthKey(entry.createdAt);
    if (!key) return;
    listingsMap.set(key, (listingsMap.get(key) || 0) + 1);
  });

  contacts.forEach((entry) => {
    const key = toMonthKey(String((entry as { created_at?: string }).created_at || ""));
    if (!key) return;
    contactsMap.set(key, (contactsMap.get(key) || 0) + 1);
  });

  const byMonth = monthKeys.map((month) => ({
    month,
    listingsCount: listingsMap.get(month) || 0,
    contactsCount: contactsMap.get(month) || 0,
  }));

  const prices = listings.map((entry) => Number(entry.price)).filter((value) => Number.isFinite(value));
  const totalValue = prices.reduce((sum, value) => sum + value, 0);

  return {
    totals: {
      listings: listings.length,
      categories: categories.length,
      contacts: contacts.length,
      available: listings.filter((entry) => (entry.status || "").toLowerCase() === "disponible").length,
      reserved: listings.filter((entry) => (entry.status || "").toLowerCase() === "reserve").length,
      sold: listings.filter((entry) => (entry.status || "").toLowerCase() === "vendu").length,
      listingsLast30Days,
      contactsLast30Days,
    },
    financial: {
      totalValue,
      avgPrice: prices.length > 0 ? totalValue / prices.length : 0,
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
      currency: "XAF",
    },
    byCategory,
    byMonth,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function toStatNumber(value: unknown): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function mapAdminStats(raw: Record<string, unknown>): AdminDashboardStats {
  const totalsRaw = toRecord(raw.totals);
  const financialRaw = toRecord(raw.financial);

  const byCategoryRaw = Array.isArray(raw.byCategory)
    ? raw.byCategory
    : Array.isArray(raw.by_category)
      ? raw.by_category
      : [];

  const byMonthRaw = Array.isArray(raw.byMonth)
    ? raw.byMonth
    : Array.isArray(raw.by_month)
      ? raw.by_month
      : [];

  return {
    totals: {
      listings: toStatNumber(totalsRaw.listings),
      categories: toStatNumber(totalsRaw.categories),
      contacts: toStatNumber(totalsRaw.contacts),
      available: toStatNumber(totalsRaw.available),
      reserved: toStatNumber(totalsRaw.reserved),
      sold: toStatNumber(totalsRaw.sold),
      listingsLast30Days: toStatNumber(totalsRaw.listingsLast30Days ?? totalsRaw.listings_last_30_days),
      contactsLast30Days: toStatNumber(totalsRaw.contactsLast30Days ?? totalsRaw.contacts_last_30_days),
    },
    financial: {
      totalValue: toStatNumber(financialRaw.totalValue ?? financialRaw.total_value),
      avgPrice: toStatNumber(financialRaw.avgPrice ?? financialRaw.avg_price),
      minPrice: toStatNumber(financialRaw.minPrice ?? financialRaw.min_price),
      maxPrice: toStatNumber(financialRaw.maxPrice ?? financialRaw.max_price),
      currency: String(financialRaw.currency ?? "XAF"),
    },
    byCategory: byCategoryRaw.map((entry) => {
      const row = toRecord(entry);
      return {
        categoryId: toStatNumber(row.categoryId ?? row.category_id),
        categoryName: String(row.categoryName ?? row.category_name ?? "Categorie"),
        total: toStatNumber(row.total),
      };
    }),
    byMonth: byMonthRaw.map((entry) => {
      const row = toRecord(entry);
      return {
        month: String(row.month ?? ""),
        listingsCount: toStatNumber(row.listingsCount ?? row.listings_count),
        contactsCount: toStatNumber(row.contactsCount ?? row.contacts_count),
      };
    }),
  };
}

export async function fetchAdminStats(): Promise<AdminDashboardStats> {
  if (USE_MOCK) {
    const session = getMockAdminSession();
    if (!session.authenticated) {
      throw new ApiError("Authentification admin requise.", 401);
    }
    return buildMockAdminStats();
  }

  const response = await request<ApiResponse<Record<string, unknown>>>("/stats");
  return mapAdminStats(response.data);
}

export async function fetchAdminSession(): Promise<AdminSessionResponse> {
  if (USE_MOCK) {
    return getMockAdminSession();
  }

  const response = await request<ApiResponse<AdminSessionResponse>>("/auth/me");
  return response.data;
}

export async function loginAdmin(username: string, password: string): Promise<AdminSessionResponse> {
  if (USE_MOCK) {
    if (username === "admin" && password === "admin123") {
      const session = { authenticated: true, username: "admin" };
      setMockAdminSession(session);
      return session;
    }
    throw new ApiError("Identifiants invalides.", 401);
  }

  const response = await request<ApiResponse<AdminSessionResponse>>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  return response.data;
}

export async function logoutAdmin(): Promise<void> {
  if (USE_MOCK) {
    setMockAdminSession({ authenticated: false, username: null });
    return;
  }

  await request<ApiResponse<{ success: boolean }>>("/auth/logout", {
    method: "POST",
  });
}
