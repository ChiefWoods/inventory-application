import { beforeEach, describe, expect, test } from "bun:test";
import { CategoriesService } from "../src/modules/categories/service";
import { ItemsService } from "../src/modules/items/service";
import { createTestDb } from "./db";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

describe("ItemsService", () => {
  let categoriesService: CategoriesService;
  let itemsService: ItemsService;
  let categoryId: number;
  let close: () => Promise<void>;

  beforeEach(async () => {
    const testDb = await createTestDb();
    categoriesService = new CategoriesService(testDb.db);
    itemsService = new ItemsService(testDb.db);
    close = testDb.close;

    const category = await categoriesService.create({
      name: "Coffee Beans",
    });
    categoryId = category.id;
  });

  databaseTest("create + getById stores and loads item", async () => {
    const created = await itemsService.create({
      categoryId,
      name: "Ethiopia Yirgacheffe",
      sku: "ETH-YIR",
      description: "Floral and tea-like",
      priceCents: 1800,
      quantity: 12,
      reorderLevel: 4,
    });

    const found = await itemsService.getById(created.id);

    expect(found?.sku).toBe("ETH-YIR");
    expect(found?.categoryId).toBe(categoryId);
    expect(found?.name).toBe("Ethiopia Yirgacheffe");
    await close();
  });

  databaseTest("list supports q and lowStock filters", async () => {
    await itemsService.create({
      categoryId,
      name: "Kenya AA",
      sku: "KEN-AA",
      priceCents: 2200,
      quantity: 2,
      reorderLevel: 5,
    });

    await itemsService.create({
      categoryId,
      name: "Colombia Supremo",
      sku: "COL-SUP",
      priceCents: 2000,
      quantity: 10,
      reorderLevel: 3,
    });

    const byQuery = await itemsService.list({ q: "Kenya" });
    const lowStockOnly = await itemsService.list({ lowStock: true });

    expect(byQuery).toHaveLength(1);
    expect(byQuery[0].sku).toBe("KEN-AA");
    expect(lowStockOnly.map((item) => item.sku)).toContain("KEN-AA");
    expect(lowStockOnly.map((item) => item.sku)).not.toContain("COL-SUP");
    await close();
  });

  databaseTest("update and remove behave correctly", async () => {
    const created = await itemsService.create({
      categoryId,
      name: "Brazil Santos",
      sku: "BR-SANTOS",
      priceCents: 1600,
      quantity: 9,
      reorderLevel: 3,
    });

    const updated = await itemsService.update(created.id, {
      quantity: 1,
      reorderLevel: 2,
      isArchived: true,
    });
    const removed = await itemsService.remove(created.id);
    const afterDelete = await itemsService.getById(created.id);

    expect(updated?.quantity).toBe(1);
    expect(updated?.isArchived).toBe(true);
    expect(removed).toBe(true);
    expect(afterDelete).toBeNull();
    await close();
  });
});
