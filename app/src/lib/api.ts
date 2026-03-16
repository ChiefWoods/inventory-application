import { API_BASE_URL } from "./env";
import type {
  Category,
  CreateCategoryInput,
  CreateItemInput,
  Item,
  ItemFilters,
  UpdateCategoryInput,
  UpdateItemInput,
} from "./types";

type ApiError = {
  error: string;
};

type ApiEnvelope<T> = {
  data: T;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  adminPassword?: string;
};

function buildUrl(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(path, API_BASE_URL);
  if (!query) return url.toString();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === "") continue;
    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function requestJson<T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  options: RequestOptions = {},
): Promise<T> {
  const response = await fetch(buildUrl(path, query), {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.adminPassword ? { "x-admin-password": options.adminPassword } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiEnvelope<T> | ApiError;
  if (!response.ok || "error" in payload) {
    throw new Error("error" in payload ? payload.error : "Request failed.");
  }

  return payload.data;
}

export function listCategories(): Promise<Category[]> {
  return requestJson<Category[]>("/categories");
}

export function getCategory(id: number): Promise<Category> {
  return requestJson<Category>(`/categories/${id}`);
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return requestJson<Category>("/categories", undefined, {
    method: "POST",
    body: input,
  });
}

export function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  adminPassword: string,
): Promise<Category> {
  return requestJson<Category>(`/categories/${id}`, undefined, {
    method: "PATCH",
    body: input,
    adminPassword,
  });
}

export function deleteCategory(
  id: number,
  adminPassword: string,
): Promise<{ id: number; deleted: boolean }> {
  return requestJson<{ id: number; deleted: boolean }>(`/categories/${id}`, undefined, {
    method: "DELETE",
    adminPassword,
  });
}

export function listItems(filters: ItemFilters = {}): Promise<Item[]> {
  return requestJson<Item[]>("/items", {
    categoryId: filters.categoryId,
    q: filters.q,
    lowStock: filters.lowStock,
  });
}

export function getItem(id: number): Promise<Item> {
  return requestJson<Item>(`/items/${id}`);
}

export function createItem(input: CreateItemInput): Promise<Item> {
  return requestJson<Item>("/items", undefined, {
    method: "POST",
    body: input,
  });
}

export function updateItem(
  id: number,
  input: UpdateItemInput,
  adminPassword: string,
): Promise<Item> {
  return requestJson<Item>(`/items/${id}`, undefined, {
    method: "PATCH",
    body: input,
    adminPassword,
  });
}

export function deleteItem(
  id: number,
  adminPassword: string,
): Promise<{ id: number; deleted: boolean }> {
  return requestJson<{ id: number; deleted: boolean }>(`/items/${id}`, undefined, {
    method: "DELETE",
    adminPassword,
  });
}
