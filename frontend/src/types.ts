export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
}

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  categoryName: string;
  fuel: string | null;
  transmission: string | null;
  interiorColor: string | null;
  exteriorColor: string | null;
  delivery: boolean | null;
  exportAvailable: boolean | null;
  status: string | null;
  mileage: number | null;
  year: number | null;
  negotiable: boolean | null;
  phone: string | null;
  city: string | null;
  itemState: string | null;
  priceCurrency: string;
  location: string | null;
  images: string[];
  createdAt: string;
}

export interface ListingFilters {
  categoryId?: number;
  q?: string;
  fuel?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}

export interface NewListingPayload {
  title: string;
  description: string;
  price: number;
  categoryId: number;
  fuel?: string;
  transmission?: string;
  interiorColor?: string;
  exteriorColor?: string;
  delivery?: boolean;
  exportAvailable?: boolean;
  status?: string;
  mileage?: number;
  year?: number;
  negotiable?: boolean;
  phone?: string;
  city?: string;
  itemState?: string;
  priceCurrency?: string;
  location?: string;
  imageUrl?: string;
  mediaUrls?: string[];
}

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}
