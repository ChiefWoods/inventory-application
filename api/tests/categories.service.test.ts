import { beforeEach, describe, expect, test } from "bun:test";
import { CategoriesService } from "../src/modules/categories/service";
import { ItemsService } from "../src/modules/items/service";
import { createTestDb } from "./db";

const databaseTest = process.env.TEST_DATABASE_URL ? test : test.skip;

describe("CategoriesService", () => {
  let categoriesService: CategoriesService;
  let itemsService: ItemsService;
  let close: () => Promise<void>;

  beforeEach(async () => {
    const testDb = await createTestDb();
    categoriesService = new CategoriesService(testDb.db);
    itemsService = new ItemsService(testDb.db);
    close = testDb.close;
  });

  databaseTest("create + getById returns normalized category", async () => {
    const created = await categoriesService.create({
      name: "Single Origin Beans",
      description: "Light roasts",
    });

    const found = await categoriesService.getById(created.id);

    expect(created.slug).toBe("single-origin-beans");
    expect(found?.name).toBe("Single Origin Beans");
    expect(found?.description).toBe("Light roasts");
    await close();
  });

  databaseTest("list includes item counts", async () => {
    const category = await categoriesService.create({
      name: "Brew Gear",
    });

    await itemsService.create({
      categoryId: category.id,
      name: "V60 Dripper",
      sku: "V60-01",
      priceCents: 3500,
      quantity: 5,
      reorderLevel: 2,
    });

    const categories = await categoriesService.list();
    const brewGear = categories.find((c) => c.id === category.id);

    expect(brewGear?.itemCount).toBe(1);
    await close();
  });

  databaseTest("update changes name/slug and remove deletes record", async () => {
    const category = await categoriesService.create({
      name: "Filters",
    });

    const updated = await categoriesService.update(category.id, {
      name: "Paper Filters",
      description: "Brewing paper filters",
    });

    expect(updated?.slug).toBe("paper-filters");

    const deleted = await categoriesService.remove(category.id);
    const afterDelete = await categoriesService.getById(category.id);

    expect(deleted).toBe(true);
    expect(afterDelete).toBeNull();
    await close();
  });
});
