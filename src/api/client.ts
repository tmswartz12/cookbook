import axios, { AxiosError } from "axios";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  ApiError,
  CloudinarySignResponse,
  Recipe,
  RecipeInput,
  RecipeListResponse,
  RecipeQuery,
  User,
} from "@shared/types";

const baseURL = import.meta.env.VITE_API_URL ?? "/api";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

/** Pull a friendly message out of an axios error. */
export function errorMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ApiError | undefined;
    if (data?.error) return data.error;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

// ---------- Reads ----------

export async function fetchMe(): Promise<User | null> {
  const { data } = await api.get<User | null>("/auth/me");
  return data;
}

function buildRecipeParams(q: RecipeQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (q.search) params.search = q.search;
  if (q.cook) params.cook = q.cook;
  if (q.tag) params.tag = q.tag;
  if (q.sort) params.sort = q.sort;
  if (q.page) params.page = String(q.page);
  if (q.limit) params.limit = String(q.limit);
  return params;
}

export async function fetchRecipes(q: RecipeQuery): Promise<RecipeListResponse> {
  const { data } = await api.get<RecipeListResponse>("/recipes", {
    params: buildRecipeParams(q),
  });
  // Defensive against a non-JSON response shape.
  if (!data || !Array.isArray(data.items)) {
    return { items: [], page: 1, limit: q.limit ?? 24, total: 0, hasMore: false };
  }
  return data;
}

export async function fetchRecipe(slug: string): Promise<Recipe> {
  const { data } = await api.get<Recipe>(`/recipes/${slug}`);
  return data;
}

export async function fetchTags(): Promise<string[]> {
  const { data } = await api.get<string[]>("/tags");
  // Defensive: never let a non-array response (e.g. an HTML fallback) crash the
  // UI's tags.filter()/.map().
  return Array.isArray(data) ? data : [];
}

// ---------- Query hooks ----------

export const recipeKeys = {
  all: ["recipes"] as const,
  list: (q: RecipeQuery) => ["recipes", "list", q] as const,
  detail: (slug: string) => ["recipes", "detail", slug] as const,
  tags: ["tags"] as const,
};

export function useRecipes(
  q: RecipeQuery,
  options?: Partial<UseQueryOptions<RecipeListResponse>>,
) {
  return useQuery({
    queryKey: recipeKeys.list(q),
    queryFn: () => fetchRecipes(q),
    ...options,
  });
}

/** Paginated gallery list — accumulates pages for "Load more". */
export function useInfiniteRecipes(q: Omit<RecipeQuery, "page">) {
  const limit = q.limit ?? 24;
  return useInfiniteQuery({
    queryKey: ["recipes", "infinite", q],
    queryFn: ({ pageParam }) => fetchRecipes({ ...q, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

export function useRecipe(slug: string) {
  return useQuery({
    queryKey: recipeKeys.detail(slug),
    queryFn: () => fetchRecipe(slug),
    enabled: Boolean(slug),
  });
}

export function useTags() {
  return useQuery({ queryKey: recipeKeys.tags, queryFn: fetchTags });
}

// ---------- Writes (editor only) ----------

export async function signUpload(): Promise<CloudinarySignResponse> {
  const { data } = await api.post<CloudinarySignResponse>("/uploads/sign");
  return data;
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecipeInput) => {
      const { data } = await api.post<Recipe>("/recipes", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      qc.invalidateQueries({ queryKey: recipeKeys.tags });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: RecipeInput }) => {
      const { data } = await api.patch<Recipe>(`/recipes/${id}`, input);
      return data;
    },
    onSuccess: (recipe) => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      qc.invalidateQueries({ queryKey: recipeKeys.tags });
      qc.invalidateQueries({ queryKey: recipeKeys.detail(recipe.slug) });
    },
  });
}

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/recipes/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recipeKeys.all });
      qc.invalidateQueries({ queryKey: recipeKeys.tags });
    },
  });
}

// ---------- Auth writes ----------

export async function postGoogleCredential(credential: string): Promise<User> {
  const { data } = await api.post<User>("/auth/google", { credential });
  return data;
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout");
}
