import { and, asc, eq, ilike, lte, or } from "drizzle-orm";
import type { drizzle } from "drizzle-orm/node-postgres";
import { categories, items } from "../../db/tables";

export type ItemInput = {
  categoryId: number;
  name: string;
  sku: string;
  description?: string;
  priceCents: number;
  quantity: number;
  reorderLevel: number;
  imageUrl?: string;
  isArchived?: boolean;
};

export type ItemPatch = Partial<ItemInput>;

export type ListItemsFilter = {
  categoryId?: number;
  q?: string;
  lowStock?: boolean;
};

export type Item = {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  sku: string;
  description: string | null;
  priceCents: number;
  quantity: number;
  reorderLevel: number;
  imageUrl: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export class ItemsService {
  constructor(private readonly db: ReturnType<typeof drizzle>) {}

  async list(filters: ListItemsFilter): Promise<Item[]> {
    const conditions = [];

    if (filters.categoryId !== undefined) {
      conditions.push(eq(items.categoryId, filters.categoryId));
    }

    if (filters.q) {
      const pattern = `%${filters.q}%`;
      conditions.push(or(ilike(items.name, pattern), ilike(items.sku, pattern)));
    }

    if (filters.lowStock) {
      conditions.push(lte(items.quantity, items.reorderLevel));
    }

    const rows = await this.db
      .select({
        id: items.id,
        categoryId: items.categoryId,
        categoryName: categories.name,
        name: items.name,
        sku: items.sku,
        description: items.description,
        priceCents: items.priceCents,
        quantity: items.quantity,
        reorderLevel: items.reorderLevel,
        imageUrl: items.imageUrl,
        isArchived: items.isArchived,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .innerJoin(categories, eq(categories.id, items.categoryId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(items.name));

    return rows;
  }

  async getById(id: number): Promise<Item | null> {
    const rows = await this.db
      .select({
        id: items.id,
        categoryId: items.categoryId,
        categoryName: categories.name,
        name: items.name,
        sku: items.sku,
        description: items.description,
        priceCents: items.priceCents,
        quantity: items.quantity,
        reorderLevel: items.reorderLevel,
        imageUrl: items.imageUrl,
        isArchived: items.isArchived,
        createdAt: items.createdAt,
        updatedAt: items.updatedAt,
      })
      .from(items)
      .innerJoin(categories, eq(categories.id, items.categoryId))
      .where(eq(items.id, id))
      .limit(1);

    if (!rows[0]) return null;
    return rows[0];
  }

  async create(input: ItemInput): Promise<Item> {
    const inserted = await this.db
      .insert(items)
      .values({
        categoryId: input.categoryId,
        name: input.name.trim(),
        sku: input.sku.trim().toUpperCase(),
        description: input.description?.trim() ?? null,
        priceCents: input.priceCents,
        quantity: input.quantity,
        reorderLevel: input.reorderLevel,
        imageUrl: input.imageUrl?.trim() ?? null,
        isArchived: input.isArchived ?? false,
      })
      .returning({ id: items.id });

    return (await this.getById(inserted[0].id)) as Item;
  }

  async update(id: number, patch: ItemPatch): Promise<Item | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated = await this.db
      .update(items)
      .set({
        categoryId: patch.categoryId ?? existing.categoryId,
        name: patch.name?.trim() ?? existing.name,
        sku: (patch.sku?.trim() ?? existing.sku).toUpperCase(),
        description: patch.description?.trim() ?? existing.description,
        priceCents: patch.priceCents ?? existing.priceCents,
        quantity: patch.quantity ?? existing.quantity,
        reorderLevel: patch.reorderLevel ?? existing.reorderLevel,
        imageUrl: patch.imageUrl?.trim() ?? existing.imageUrl,
        isArchived: patch.isArchived ?? existing.isArchived,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(items.id, id))
      .returning({ id: items.id });

    if (!updated[0]) return null;
    return await this.getById(updated[0].id);
  }

  async remove(id: number): Promise<boolean> {
    const rows = await this.db.delete(items).where(eq(items.id, id)).returning({ id: items.id });

    return rows.length > 0;
  }
}
