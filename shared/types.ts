export type Role = "editor" | "viewer";

export interface CloudImage {
  url: string; // cloudinary secure_url
  publicId: string; // for deletion / transforms
  width: number;
  height: number;
}

/** Credit for whoever recommended a recipe — name shown, links to IG if given. */
export interface RecommendedBy {
  name: string;
  instagram?: string; // handle without the leading @, e.g. "jamieoliver"
}

export interface Recipe {
  _id: string;
  title: string;
  slug: string; // unique, derived from title
  description?: string; // one-line teaser
  dateCooked: string; // ISO date
  heroImage?: CloudImage;
  gallery: CloudImage[]; // optional extra shots
  ingredients: string[]; // one line each
  steps: string[]; // one line each
  tags: string[]; // lowercased, e.g. ["pasta","weeknight"]
  cuisine?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  rating?: number; // 1–5, the cooks' own rating
  makeAgain: boolean; // the fun "would we make this again?" flag
  notes?: string; // personal commentary, tweaks, "add more garlic"
  sourceUrl?: string; // if adapted from somewhere
  recommendedBy?: RecommendedBy; // who recommended it (creditable IG)
  cookedFor: string[]; // names of the people we cooked this for
  createdBy: string; // editor email
  createdAt: string;
  updatedAt: string;
}

export interface User {
  email: string;
  role: Role;
}

/** Shape of GET /api/recipes */
export interface RecipeListResponse {
  items: Recipe[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export type RecipeSort = "newest" | "oldest" | "rating" | "title";

export interface RecipeQuery {
  search?: string;
  tag?: string;
  sort?: RecipeSort;
  page?: number;
  limit?: number;
}

/** Payload the editor form sends on create/update. */
export interface RecipeInput {
  title: string;
  description?: string;
  dateCooked: string;
  heroImage?: CloudImage;
  gallery?: CloudImage[];
  ingredients?: string[];
  steps?: string[];
  tags?: string[];
  cuisine?: string;
  prepMinutes?: number;
  cookMinutes?: number;
  servings?: number;
  rating?: number;
  makeAgain?: boolean;
  notes?: string;
  sourceUrl?: string;
  recommendedBy?: RecommendedBy;
  cookedFor?: string[];
}

/** Response from POST /api/uploads/sign — params for a direct Cloudinary upload. */
export interface CloudinarySignResponse {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}

/** Consistent API error shape. */
export interface ApiError {
  error: string;
  fields?: Record<string, string>;
}
