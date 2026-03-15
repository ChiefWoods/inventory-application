import { query } from "../../db/client";
import { slugify } from "../../lib/slug";

type CategoryRow = {
  id: string | number | bigint;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  item_count?: string | number | bigint;
};

export type CategoryInput = {
  name: string;
  description?: string;
};

export type CategoryPatch = {
  name?: string;
  description?: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
};

function toNumber(value: string | number | bigint | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (!value) return 0;
  return Number(value);
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: toNumber(row.id),
    name: row.name,
    slug: row.slug,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    itemCount: row.item_count !== undefined ? toNumber(row.item_count) : undefined,
  };
}

export class CategoriesService {
  async list(): Promise<Category[]> {
    const rows = await query<CategoryRow>(
      `
      SELECT
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at,
        c.updated_at,
        COUNT(i.id)::BIGINT AS item_count
      FROM categories c
      LEFT JOIN items i ON i.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC;
    `,
    );

    return rows.map(mapCategory);
  }

  async getById(id: number): Promise<Category | null> {
    const rows = await query<CategoryRow>(
      `
      SELECT id, name, slug, description, created_at, updated_at
      FROM categories
      WHERE id = $1
      LIMIT 1;
    `,
      [id],
    );

    if (!rows[0]) return null;
    return mapCategory(rows[0]);
  }

  async create(input: CategoryInput): Promise<Category> {
    const slug = slugify(input.name);
    const rows = await query<CategoryRow>(
      `
      INSERT INTO categories (name, slug, description)
      VALUES ($1, $2, $3)
      RETURNING id, name, slug, description, created_at, updated_at;
    `,
      [input.name.trim(), slug, input.description?.trim() ?? null],
    );

    return mapCategory(rows[0]);
  }

  async update(id: number, patch: CategoryPatch): Promise<Category | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const nextName = patch.name?.trim() ?? existing.name;
    const nextDescription = patch.description?.trim() ?? existing.description;
    const nextSlug = slugify(nextName);

    const rows = await query<CategoryRow>(
      `
      UPDATE categories
      SET
        name = $1,
        slug = $2,
        description = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id, name, slug, description, created_at, updated_at;
    `,
      [nextName, nextSlug, nextDescription, id],
    );

    return rows[0] ? mapCategory(rows[0]) : null;
  }

  async remove(id: number): Promise<boolean> {
    const rows = await query<{ id: string | number | bigint }>(
      `
      DELETE FROM categories
      WHERE id = $1
      RETURNING id;
    `,
      [id],
    );

    return rows.length > 0;
  }
}
