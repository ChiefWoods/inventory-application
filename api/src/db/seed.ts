import { eq } from "drizzle-orm";
import { assertRequiredConfig } from "../config";
import { closeDbPool, db } from "./client";
import { ensureSchema } from "./schema";
import { categories, coffeeSpecs, items, itemSuppliers, suppliers } from "./tables";

async function runSeed(): Promise<void> {
  assertRequiredConfig();
  await ensureSchema();

  const [beansCategory] = await db
    .insert(categories)
    .values({
      name: "Coffee Beans",
      slug: "coffee-beans",
      description: "Specialty whole beans for pour over and espresso.",
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: "Coffee Beans",
        description: "Specialty whole beans for pour over and espresso.",
        updatedAt: new Date().toISOString(),
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const [gearCategory] = await db
    .insert(categories)
    .values({
      name: "Brew Equipment",
      slug: "brew-equipment",
      description: "Brewers, kettles, scales, and grinders.",
    })
    .onConflictDoUpdate({
      target: categories.slug,
      set: {
        name: "Brew Equipment",
        description: "Brewers, kettles, scales, and grinders.",
        updatedAt: new Date().toISOString(),
      },
    })
    .returning({ id: categories.id, slug: categories.slug });

  const [ethiopia] = await db
    .insert(items)
    .values({
      categoryId: beansCategory.id,
      name: "Ethiopia Guji Natural 250g",
      sku: "BEAN-ETH-GUJI-250",
      description: "Blueberry, jasmine, cane sugar.",
      priceCents: 1800,
      quantity: 24,
      reorderLevel: 8,
      isArchived: false,
    })
    .onConflictDoUpdate({
      target: items.sku,
      set: {
        name: "Ethiopia Guji Natural 250g",
        description: "Blueberry, jasmine, cane sugar.",
        priceCents: 1800,
        quantity: 24,
        reorderLevel: 8,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning({ id: items.id, sku: items.sku });

  const [v60] = await db
    .insert(items)
    .values({
      categoryId: gearCategory.id,
      name: "V60 Plastic Dripper 02",
      sku: "GEAR-V60-02",
      description: "Lightweight dripper for daily brews.",
      priceCents: 1500,
      quantity: 40,
      reorderLevel: 10,
      isArchived: false,
    })
    .onConflictDoUpdate({
      target: items.sku,
      set: {
        name: "V60 Plastic Dripper 02",
        description: "Lightweight dripper for daily brews.",
        priceCents: 1500,
        quantity: 40,
        reorderLevel: 10,
        updatedAt: new Date().toISOString(),
      },
    })
    .returning({ id: items.id, sku: items.sku });

  await db
    .insert(coffeeSpecs)
    .values({
      itemId: ethiopia.id,
      originCountry: "Ethiopia",
      region: "Guji",
      producer: "Buku Cooperative",
      process: "Natural",
      roastLevel: "light",
      tastingNotes: "Blueberry, jasmine, cane sugar",
      altitudeMeters: 2100,
      variety: "Heirloom",
      harvestYear: 2025,
    })
    .onConflictDoUpdate({
      target: coffeeSpecs.itemId,
      set: {
        originCountry: "Ethiopia",
        region: "Guji",
        producer: "Buku Cooperative",
        process: "Natural",
        roastLevel: "light",
        tastingNotes: "Blueberry, jasmine, cane sugar",
        altitudeMeters: 2100,
        variety: "Heirloom",
        harvestYear: 2025,
        updatedAt: new Date().toISOString(),
      },
    });

  const [supplier] = await db
    .insert(suppliers)
    .values({
      name: "Highland Green Importers",
      contactEmail: "partners@highlandgreen.example",
      websiteUrl: "https://highlandgreen.example",
      notes: "Specialty coffee importer focused on East Africa.",
    })
    .onConflictDoUpdate({
      target: suppliers.name,
      set: {
        contactEmail: "partners@highlandgreen.example",
        websiteUrl: "https://highlandgreen.example",
        notes: "Specialty coffee importer focused on East Africa.",
        updatedAt: new Date().toISOString(),
      },
    })
    .returning({ id: suppliers.id });

  await db
    .insert(itemSuppliers)
    .values({
      itemId: ethiopia.id,
      supplierId: supplier.id,
      supplierSku: "HG-ETH-GUJI-NAT",
      leadTimeDays: 21,
    })
    .onConflictDoNothing();

  // Keep the seeded gear item linked to category to verify multi-category data quickly.
  await db.update(items).set({ categoryId: gearCategory.id }).where(eq(items.id, v60.id));
}

try {
  await runSeed();
  console.log("Database seed completed.");
} catch (error) {
  console.error("Database seed failed.", error);
  process.exit(1);
} finally {
  await closeDbPool();
}
