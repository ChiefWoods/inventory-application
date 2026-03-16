export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
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

export type ItemFilters = {
  categoryId?: number;
  q?: string;
  lowStock?: boolean;
};

export type CreateCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type CreateItemInput = {
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

export type UpdateItemInput = Partial<CreateItemInput>;
