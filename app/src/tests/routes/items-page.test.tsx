import { beforeEach, describe, expect, it, vi } from "vitest";
import { action, loader } from "@/routes/items-page";
import { createItem, listCategories, listItems } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createItem: vi.fn(),
  listCategories: vi.fn(),
  listItems: vi.fn(),
}));

const mockedCreateItem = vi.mocked(createItem);
const mockedListCategories = vi.mocked(listCategories);
const mockedListItems = vi.mocked(listItems);

describe("items-page loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses query params and calls listItems with filters", async () => {
    const request = new Request("http://localhost/items?q=ethiopia&categoryId=3&lowStock=true");
    const categories = [{ id: 3, name: "Coffee Beans" }];
    const items = [{ id: 99, name: "Ethiopia Guji" }];

    mockedListCategories.mockResolvedValue(categories as never);
    mockedListItems.mockResolvedValue(items as never);

    const data = await loader({ request });

    expect(mockedListItems).toHaveBeenCalledWith({
      q: "ethiopia",
      categoryId: 3,
      lowStock: true,
    });
    expect(data).toEqual({
      categories,
      items,
      filters: { q: "ethiopia", categoryId: "3", lowStock: true },
    });
  });
});

describe("items-page action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates item and redirects with created status", async () => {
    mockedCreateItem.mockResolvedValue({ id: 1 } as never);

    const body = new URLSearchParams({
      categoryId: "2",
      name: "Ethiopia Guji",
      sku: "ETH-GUJI",
      description: "Floral",
      priceCents: "1800",
      quantity: "5",
      reorderLevel: "2",
      imageUrl: "https://example.com/item.jpg",
      isArchived: "on",
    });

    const result = await action({
      request: new Request("http://localhost/items", { method: "POST", body }),
    });

    expect(mockedCreateItem).toHaveBeenCalledWith({
      categoryId: 2,
      name: "Ethiopia Guji",
      sku: "ETH-GUJI",
      description: "Floral",
      priceCents: 1800,
      quantity: 5,
      reorderLevel: 2,
      imageUrl: "https://example.com/item.jpg",
      isArchived: true,
    });

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/items?status=created");
  });

  it("returns error payload when create fails", async () => {
    mockedCreateItem.mockRejectedValue(new Error("Category does not exist."));

    const body = new URLSearchParams({
      categoryId: "2",
      name: "Bad item",
      sku: "BAD-01",
      priceCents: "1000",
      quantity: "1",
      reorderLevel: "1",
    });

    const result = await action({
      request: new Request("http://localhost/items", { method: "POST", body }),
    });

    expect(result).toEqual({ error: "Category does not exist." });
  });
});
