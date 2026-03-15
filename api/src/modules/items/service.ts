import { query } from "../../db/client";

type ItemRow = {
  id: string | number | bigint;
  category_id: string | number | bigint;
  category_name?: string;
  name: string;
  sku: string;
  description: string | null;
  price_cents: string | number | bigint;
  quantity: string | number | bigint;
  reorder_level: string | number | bigint;
  image_url: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

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

function toNumber(value: string | number | bigint): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  return Number(value);
}

function mapItem(row: ItemRow): Item {
  return {
    id: toNumber(row.id),
    categoryId: toNumber(row.category_id),
    categoryName: row.category_name,
    name: row.name,
    sku: row.sku,
    description: row.description,
    priceCents: toNumber(row.price_cents),
    quantity: toNumber(row.quantity),
    reorderLevel: toNumber(row.reorder_level),
    imageUrl: row.image_url,
    isArchived: row.is_archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ItemsService {
  async list(filters: ListItemsFilter): Promise<Item[]> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.categoryId !== undefined) {
      params.push(filters.categoryId);
      conditions.push(`i.category_id = $${params.length}`);
    }

    if (filters.q) {
      params.push(`%${filters.q}%`);
      const placeholder = `$${params.length}`;
      conditions.push(`(i.name ILIKE ${placeholder} OR i.sku ILIKE ${placeholder})`);
    }

    if (filters.lowStock) {
      conditions.push("i.quantity <= i.reorder_level");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query<ItemRow>(
      `
      SELECT
        i.id,
        i.category_id,
        c.name AS category_name,
        i.name,
        i.sku,
        i.description,
        i.price_cents,
        i.quantity,
        i.reorder_level,
        i.image_url,
        i.is_archived,
        i.created_at,
        i.updated_at
      FROM items i
      INNER JOIN categories c ON c.id = i.category_id
      ${whereClause}
      ORDER BY i.name ASC;
    `,
      params,
    );

    return rows.map(mapItem);
  }

  async getById(id: number): Promise<Item | null> {
    const rows = await query<ItemRow>(
      `
      SELECT
        i.id,
        i.category_id,
        c.name AS category_name,
        i.name,
        i.sku,
        i.description,
        i.price_cents,
        i.quantity,
        i.reorder_level,
        i.image_url,
        i.is_archived,
        i.created_at,
        i.updated_at
      FROM items i
      INNER JOIN categories c ON c.id = i.category_id
      WHERE i.id = $1
      LIMIT 1;
    `,
      [id],
    );

    if (!rows[0]) return null;
    return mapItem(rows[0]);
  }

  async create(input: ItemInput): Promise<Item> {
    const rows = await query<ItemRow>(
      `
      INSERT INTO items (
        category_id,
        name,
        sku,
        description,
        price_cents,
        quantity,
        reorder_level,
        image_url,
        is_archived
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING
        id,
        category_id,
        name,
        sku,
        description,
        price_cents,
        quantity,
        reorder_level,
        image_url,
        is_archived,
        created_at,
        updated_at;
    `,
      [
        input.categoryId,
        input.name.trim(),
        input.sku.trim().toUpperCase(),
        input.description?.trim() ?? null,
        input.priceCents,
        input.quantity,
        input.reorderLevel,
        input.imageUrl?.trim() ?? null,
        input.isArchived ?? false,
      ],
    );

    return mapItem(rows[0]);
  }

  async update(id: number, patch: ItemPatch): Promise<Item | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const rows = await query<ItemRow>(
      `
      UPDATE items
      SET
        category_id = $1,
        name = $2,
        sku = $3,
        description = $4,
        price_cents = $5,
        quantity = $6,
        reorder_level = $7,
        image_url = $8,
        is_archived = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING
        id,
        category_id,
        name,
        sku,
        description,
        price_cents,
        quantity,
        reorder_level,
        image_url,
        is_archived,
        created_at,
        updated_at;
    `,
      [
        patch.categoryId ?? existing.categoryId,
        patch.name?.trim() ?? existing.name,
        (patch.sku?.trim() ?? existing.sku).toUpperCase(),
        patch.description?.trim() ?? existing.description,
        patch.priceCents ?? existing.priceCents,
        patch.quantity ?? existing.quantity,
        patch.reorderLevel ?? existing.reorderLevel,
        patch.imageUrl?.trim() ?? existing.imageUrl,
        patch.isArchived ?? existing.isArchived,
        id,
      ],
    );

    const updated = rows[0];
    if (!updated) return null;
    return mapItem(updated);
  }

  async remove(id: number): Promise<boolean> {
    const rows = await query<{ id: string | number | bigint }>(
      `
      DELETE FROM items
      WHERE id = $1
      RETURNING id;
    `,
      [id],
    );
    return rows.length > 0;
  }
}
