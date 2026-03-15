import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const categories = pgTable(
  "categories",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("categories_name_unique").on(table.name),
    uniqueIndex("categories_slug_unique").on(table.slug),
    index("idx_categories_slug").on(table.slug),
  ],
);

export const items = pgTable(
  "items",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    categoryId: bigint("category_id", { mode: "number" })
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    sku: text("sku").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull(),
    quantity: integer("quantity").notNull().default(0),
    reorderLevel: integer("reorder_level").notNull().default(0),
    imageUrl: text("image_url"),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("items_sku_unique").on(table.sku),
    index("idx_items_category_id").on(table.categoryId),
    index("idx_items_sku").on(table.sku),
    check("items_price_cents_non_negative", sql`${table.priceCents} >= 0`),
    check("items_quantity_non_negative", sql`${table.quantity} >= 0`),
    check("items_reorder_level_non_negative", sql`${table.reorderLevel} >= 0`),
  ],
);

export const coffeeSpecs = pgTable(
  "coffee_specs",
  {
    itemId: bigint("item_id", { mode: "number" })
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    originCountry: text("origin_country").notNull(),
    region: text("region"),
    producer: text("producer"),
    process: text("process"),
    roastLevel: text("roast_level").notNull(),
    tastingNotes: text("tasting_notes"),
    altitudeMeters: integer("altitude_meters"),
    variety: text("variety"),
    harvestYear: integer("harvest_year"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.itemId], name: "coffee_specs_item_id_pk" }),
    check(
      "coffee_specs_roast_level_check",
      sql`${table.roastLevel} IN ('light', 'medium-light', 'medium', 'medium-dark', 'dark', 'espresso')`,
    ),
    check(
      "coffee_specs_harvest_year_check",
      sql`${table.harvestYear} IS NULL OR (${table.harvestYear} >= 1900 AND ${table.harvestYear} <= 2100)`,
    ),
    check(
      "coffee_specs_altitude_meters_check",
      sql`${table.altitudeMeters} IS NULL OR ${table.altitudeMeters} >= 0`,
    ),
  ],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: bigint("id", { mode: "number" }).generatedAlwaysAsIdentity().primaryKey(),
    name: text("name").notNull(),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    websiteUrl: text("website_url"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("suppliers_name_unique").on(table.name),
    index("idx_suppliers_name").on(table.name),
  ],
);

export const itemSuppliers = pgTable(
  "item_suppliers",
  {
    itemId: bigint("item_id", { mode: "number" })
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    supplierId: bigint("supplier_id", { mode: "number" })
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    supplierSku: text("supplier_sku"),
    leadTimeDays: integer("lead_time_days"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.itemId, table.supplierId],
      name: "item_suppliers_item_id_supplier_id_pk",
    }),
    index("idx_item_suppliers_item_id").on(table.itemId),
    index("idx_item_suppliers_supplier_id").on(table.supplierId),
    check(
      "item_suppliers_lead_time_days_check",
      sql`${table.leadTimeDays} IS NULL OR ${table.leadTimeDays} >= 0`,
    ),
  ],
);
