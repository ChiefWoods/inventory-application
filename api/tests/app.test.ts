import { beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import type { Category, CategoryInput, CategoryPatch } from "../src/modules/categories/service";
import type { Item, ItemInput, ItemPatch, ListItemsFilter } from "../src/modules/items/service";

async function getJson(response: Response): Promise<unknown> {
  return await response.json();
}

describe("API app", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "test-secret";
  });

  test("GET /health returns ok payload", async () => {
    const app = createApp({
      categoriesService: {
        list: async () => [],
        getById: async () => null,
        create: async () => {
          throw new Error("unused");
        },
        update: async () => null,
        remove: async () => false,
      },
      itemsService: {
        list: async () => [],
        getById: async () => null,
        create: async () => {
          throw new Error("unused");
        },
        update: async () => null,
        remove: async () => false,
      },
      corsOrigin: "*",
    });

    const response = await app.handle(new Request("http://localhost/health"));
    const payload = (await getJson(response)) as { ok: boolean; timestamp: string };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(typeof payload.timestamp).toBe("string");
  });

  test("PATCH /categories/:id requires admin password", async () => {
    const categoriesService = {
      list: async (): Promise<Category[]> => [],
      getById: async (): Promise<Category | null> => null,
      create: async (_input: CategoryInput): Promise<Category> => {
        throw new Error("unused");
      },
      update: async (_id: number, _patch: CategoryPatch): Promise<Category | null> => {
        return null;
      },
      remove: async (_id: number): Promise<boolean> => false,
    };

    const app = createApp({
      categoriesService,
      itemsService: {
        list: async (): Promise<Item[]> => [],
        getById: async (): Promise<Item | null> => null,
        create: async (_input: ItemInput): Promise<Item> => {
          throw new Error("unused");
        },
        update: async (_id: number, _patch: ItemPatch): Promise<Item | null> => null,
        remove: async (_id: number): Promise<boolean> => false,
      },
      corsOrigin: "*",
    });

    const response = await app.handle(
      new Request("http://localhost/categories/1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Espresso Beans" }),
      }),
    );

    const payload = (await getJson(response)) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toContain("Admin password");
  });

  test("PATCH /categories/:id updates when admin password is provided", async () => {
    const updatedCategory: Category = {
      id: 1,
      name: "Espresso Beans",
      slug: "espresso-beans",
      description: "Dark roast",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const categoriesService = {
      list: async (): Promise<Category[]> => [],
      getById: async (): Promise<Category | null> => updatedCategory,
      create: async (_input: CategoryInput): Promise<Category> => updatedCategory,
      update: async (_id: number, _patch: CategoryPatch): Promise<Category | null> =>
        updatedCategory,
      remove: async (_id: number): Promise<boolean> => true,
    };

    const app = createApp({
      categoriesService,
      itemsService: {
        list: async (_filter: ListItemsFilter): Promise<Item[]> => [],
        getById: async (): Promise<Item | null> => null,
        create: async (_input: ItemInput): Promise<Item> => {
          throw new Error("unused");
        },
        update: async (_id: number, _patch: ItemPatch): Promise<Item | null> => null,
        remove: async (_id: number): Promise<boolean> => false,
      },
      corsOrigin: "*",
    });

    const response = await app.handle(
      new Request("http://localhost/categories/1", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": "test-secret",
        },
        body: JSON.stringify({ name: "Espresso Beans" }),
      }),
    );

    const payload = (await getJson(response)) as { data: Category };

    expect(response.status).toBe(200);
    expect(payload.data.name).toBe("Espresso Beans");
  });

  test("DELETE /items/:id requires admin password", async () => {
    const app = createApp({
      categoriesService: {
        list: async (): Promise<Category[]> => [],
        getById: async (): Promise<Category | null> => null,
        create: async (_input: CategoryInput): Promise<Category> => {
          throw new Error("unused");
        },
        update: async (_id: number, _patch: CategoryPatch): Promise<Category | null> => null,
        remove: async (_id: number): Promise<boolean> => false,
      },
      itemsService: {
        list: async (_filter: ListItemsFilter): Promise<Item[]> => [],
        getById: async (): Promise<Item | null> => null,
        create: async (_input: ItemInput): Promise<Item> => {
          throw new Error("unused");
        },
        update: async (_id: number, _patch: ItemPatch): Promise<Item | null> => null,
        remove: async (_id: number): Promise<boolean> => true,
      },
      corsOrigin: "*",
    });

    const response = await app.handle(
      new Request("http://localhost/items/1", {
        method: "DELETE",
      }),
    );
    const payload = (await getJson(response)) as { error: string };

    expect(response.status).toBe(401);
    expect(payload.error).toContain("Admin password");
  });
});
