import { beforeEach, describe, expect, test } from "bun:test";
import { createApp } from "../src/app";
import { CategoriesService } from "../src/modules/categories/service";
import { ItemsService } from "../src/modules/items/service";
import { createTestDb } from "./db";

const integrationTest = process.env.TEST_DATABASE_URL ? test : test.skip;

async function json(response: Response): Promise<unknown> {
  return await response.json();
}

describe("App integration", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "integration-secret";
  });

  integrationTest("full category and item flow", async () => {
    const testDb = await createTestDb();
    const categoriesService = new CategoriesService(testDb.db);
    const itemsService = new ItemsService(testDb.db);
    const app = createApp({
      categoriesService,
      itemsService,
      corsOrigin: "*",
    });

    const createCategoryResponse = await app.handle(
      new Request("http://localhost/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Coffee Beans",
          description: "Freshly roasted beans",
        }),
      }),
    );
    const createCategoryPayload = (await json(createCategoryResponse)) as {
      data: { id: number };
    };

    expect(createCategoryResponse.status).toBe(201);

    const createItemResponse = await app.handle(
      new Request("http://localhost/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: createCategoryPayload.data.id,
          name: "Ethiopia Guji",
          sku: "ETH-GUJI",
          priceCents: 1900,
          quantity: 2,
          reorderLevel: 5,
        }),
      }),
    );
    const createItemPayload = (await json(createItemResponse)) as {
      data: { id: number };
    };

    expect(createItemResponse.status).toBe(201);

    const lowStockResponse = await app.handle(
      new Request("http://localhost/items?lowStock=true", {
        method: "GET",
      }),
    );
    const lowStockPayload = (await json(lowStockResponse)) as {
      data: Array<{ sku: string }>;
    };

    expect(lowStockResponse.status).toBe(200);
    expect(lowStockPayload.data.map((item) => item.sku)).toContain("ETH-GUJI");

    const unauthorizedPatchResponse = await app.handle(
      new Request(`http://localhost/items/${createItemPayload.data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: 9 }),
      }),
    );

    expect(unauthorizedPatchResponse.status).toBe(401);

    const authorizedPatchResponse = await app.handle(
      new Request(`http://localhost/items/${createItemPayload.data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": "integration-secret",
        },
        body: JSON.stringify({ quantity: 9 }),
      }),
    );
    const authorizedPatchPayload = (await json(authorizedPatchResponse)) as {
      data: { quantity: number };
    };

    expect(authorizedPatchResponse.status).toBe(200);
    expect(authorizedPatchPayload.data.quantity).toBe(9);

    const categoryDeleteResponse = await app.handle(
      new Request(`http://localhost/categories/${createCategoryPayload.data.id}`, {
        method: "DELETE",
        headers: { "x-admin-password": "integration-secret" },
      }),
    );
    const categoryDeletePayload = (await json(categoryDeleteResponse)) as {
      error: string;
    };

    // Category delete fails due to FK restriction while item exists.
    expect(categoryDeleteResponse.status).toBe(409);
    expect(categoryDeletePayload.error).toBe("Cannot delete category while it still has items.");

    await testDb.close();
  });
});
