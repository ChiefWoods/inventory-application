import { query } from "./client";

export async function ensureSchema(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS items (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
      quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
      reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
      image_url TEXT,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`CREATE INDEX IF NOT EXISTS idx_items_category_id ON items (category_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_items_sku ON items (sku);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);`);
}
