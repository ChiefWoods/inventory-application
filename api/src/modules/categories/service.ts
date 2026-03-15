import { asc, count, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { categories, items } from "../../db/tables";
import { slugify } from "../../lib/slug";

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

export class CategoriesService {
  async list(): Promise<Category[]> {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
        itemCount: count(items.id),
      })
      .from(categories)
      .leftJoin(items, eq(items.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(asc(categories.name));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      itemCount: row.itemCount,
    }));
  }

  async getById(id: number): Promise<Category | null> {
    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return rows[0];
  }

  async create(input: CategoryInput): Promise<Category> {
    const slug = slugify(input.name);
    const rows = await db
      .insert(categories)
      .values({
        name: input.name.trim(),
        slug,
        description: input.description?.trim() ?? null,
      })
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    return rows[0];
  }

  async update(id: number, patch: CategoryPatch): Promise<Category | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const nextName = patch.name?.trim() ?? existing.name;
    const nextDescription = patch.description?.trim() ?? existing.description;
    const nextSlug = slugify(nextName);

    const rows = await db
      .update(categories)
      .set({
        name: nextName,
        slug: nextSlug,
        description: nextDescription,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(categories.id, id))
      .returning({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt,
      });

    return rows[0] ?? null;
  }

  async remove(id: number): Promise<boolean> {
    const rows = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning({ id: categories.id });

    return rows.length > 0;
  }
}
