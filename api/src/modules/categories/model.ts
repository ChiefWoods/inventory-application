import { t } from "elysia";

export const categoryIdParams = t.Object({
  id: t.Numeric({ minimum: 1 }),
});

export const createCategoryBody = t.Object({
  name: t.String({ minLength: 2, maxLength: 120 }),
  description: t.Optional(t.String({ maxLength: 2000 })),
});

export const updateCategoryBody = t.Object({
  name: t.Optional(t.String({ minLength: 2, maxLength: 120 })),
  description: t.Optional(t.String({ maxLength: 2000 })),
});
