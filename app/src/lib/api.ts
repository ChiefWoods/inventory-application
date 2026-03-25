import { treaty } from "@elysiajs/eden";
import type { InventoryApi } from "@inventory-application/api/app";
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

const client = treaty<InventoryApi>(API_BASE_URL);

function treatyErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "value" in error) {
    const value = (error as { value: unknown }).value;
    if (value && typeof value === "object" && "error" in value) {
      const msg = (value as { error: unknown }).error;
      if (typeof msg === "string") return msg;
    }
  }
  return "Request failed.";
}

/** JSON body is `{ data: T }` or `{ error: string }`; Treaty may union these on 200. */
function unwrapInventoryData<T>(result: { data: unknown; error: unknown }): T {
  if (result.error !== null && result.error !== undefined) {
    throw new Error(treatyErrorMessage(result.error));
  }
  const body = result.data;
  if (!body || typeof body !== "object") {
    throw new Error("Request failed.");
  }
  if ("error" in body && typeof (body as { error?: unknown }).error === "string") {
    throw new Error((body as { error: string }).error);
  }
  if (!("data" in body)) {
    throw new Error("Request failed.");
  }
  return (body as { data: T }).data;
}

export function listCategories(): Promise<Category[]> {
  return client.categories.get().then(unwrapInventoryData<Category[]>);
}

export function getCategory(id: number): Promise<Category> {
  return client
    .categories({ id })
    .get()
    .then(unwrapInventoryData<Category>);
}

export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return client.categories.post(input).then(unwrapInventoryData<Category>);
}

export function updateCategory(
  id: number,
  input: UpdateCategoryInput,
  adminPassword: string,
): Promise<Category> {
  return client
    .categories({ id })
    .patch(input, { headers: { "x-admin-password": adminPassword } })
    .then(unwrapInventoryData<Category>);
}

export function deleteCategory(
  id: number,
  adminPassword: string,
): Promise<{ id: number; deleted: boolean }> {
  return client
    .categories({ id })
    .delete({ headers: { "x-admin-password": adminPassword } })
    .then(unwrapInventoryData<{ id: number; deleted: boolean }>);
}

export function listItems(filters: ItemFilters = {}): Promise<Item[]> {
  const query: ItemFilters = {};
  if (filters.categoryId !== undefined) query.categoryId = filters.categoryId;
  if (filters.q !== undefined && filters.q !== "") query.q = filters.q;
  if (filters.lowStock !== undefined) query.lowStock = filters.lowStock;

  const hasQuery = Object.keys(query).length > 0;
  return client.items.get(hasQuery ? { query } : {}).then(unwrapInventoryData<Item[]>);
}

export function getItem(id: number): Promise<Item> {
  return client
    .items({ id })
    .get()
    .then(unwrapInventoryData<Item>);
}

export function createItem(input: CreateItemInput): Promise<Item> {
  return client.items.post(input).then(unwrapInventoryData<Item>);
}

export function updateItem(
  id: number,
  input: UpdateItemInput,
  adminPassword: string,
): Promise<Item> {
  return client
    .items({ id })
    .patch(input, { headers: { "x-admin-password": adminPassword } })
    .then(unwrapInventoryData<Item>);
}

export function deleteItem(
  id: number,
  adminPassword: string,
): Promise<{ id: number; deleted: boolean }> {
  return client
    .items({ id })
    .delete({ headers: { "x-admin-password": adminPassword } })
    .then(unwrapInventoryData<{ id: number; deleted: boolean }>);
}
