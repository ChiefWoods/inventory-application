import { t } from "elysia";

export const itemIdParams = t.Object({
  id: t.Numeric({ minimum: 1 }),
});

export const listItemsQuery = t.Object({
  categoryId: t.Optional(t.Numeric({ minimum: 1 })),
  q: t.Optional(t.String({ minLength: 1, maxLength: 120 })),
  lowStock: t.Optional(t.BooleanString()),
});

export const createItemBody = t.Object({
  categoryId: t.Numeric({ minimum: 1 }),
  name: t.String({ minLength: 2, maxLength: 140 }),
  sku: t.String({ minLength: 2, maxLength: 50 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
  priceCents: t.Integer({ minimum: 0 }),
  quantity: t.Integer({ minimum: 0 }),
  reorderLevel: t.Integer({ minimum: 0 }),
  imageUrl: t.Optional(t.String({ format: "uri", maxLength: 2000 })),
  isArchived: t.Optional(t.Boolean()),
});

export const updateItemBody = t.Object({
  categoryId: t.Optional(t.Numeric({ minimum: 1 })),
  name: t.Optional(t.String({ minLength: 2, maxLength: 140 })),
  sku: t.Optional(t.String({ minLength: 2, maxLength: 50 })),
  description: t.Optional(t.String({ maxLength: 2000 })),
  priceCents: t.Optional(t.Integer({ minimum: 0 })),
  quantity: t.Optional(t.Integer({ minimum: 0 })),
  reorderLevel: t.Optional(t.Integer({ minimum: 0 })),
  imageUrl: t.Optional(t.String({ format: "uri", maxLength: 2000 })),
  isArchived: t.Optional(t.Boolean()),
});
