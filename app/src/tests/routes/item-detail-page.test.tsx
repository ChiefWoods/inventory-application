import { beforeEach, describe, expect, it, vi } from "vitest";
import { action, loader } from "@/routes/item-detail-page";
import { deleteItem, getItem, listCategories, updateItem } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  deleteItem: vi.fn(),
  getItem: vi.fn(),
  listCategories: vi.fn(),
  updateItem: vi.fn(),
}));

const mockedDeleteItem = vi.mocked(deleteItem);
const mockedGetItem = vi.mocked(getItem);
const mockedListCategories = vi.mocked(listCategories);
const mockedUpdateItem = vi.mocked(updateItem);

describe("item-detail loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads item and categories", async () => {
    mockedGetItem.mockResolvedValue({ id: 4, name: "Ethiopia Guji" } as never);
    mockedListCategories.mockResolvedValue([{ id: 1, name: "Coffee Beans" }] as never);

    const data = await loader({ params: { id: "4" } });

    expect(mockedGetItem).toHaveBeenCalledWith(4);
    expect(mockedListCategories).toHaveBeenCalledTimes(1);
    expect(data).toEqual({
      item: { id: 4, name: "Ethiopia Guji" },
      categories: [{ id: 1, name: "Coffee Beans" }],
    });
  });
});

describe("item-detail action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns required error when admin password missing", async () => {
    const body = new URLSearchParams({
      intent: "update",
      name: "Ethiopia Guji",
    });

    const result = await action({
      params: { id: "2" },
      request: new Request("http://localhost/items/2", { method: "POST", body }),
    });

    expect(result).toEqual({ error: "Admin password is required.", intent: "update" });
  });

  it("updates item and redirects with updated status", async () => {
    mockedUpdateItem.mockResolvedValue({ id: 2 } as never);

    const body = new URLSearchParams({
      intent: "update",
      adminPassword: "secret",
      categoryId: "3",
      name: "Kenya AA",
      sku: "KEN-AA",
      description: "Berry",
      priceCents: "2100",
      quantity: "7",
      reorderLevel: "3",
      imageUrl: "https://example.com/kenya.png",
      isArchived: "off",
    });

    const result = await action({
      params: { id: "2" },
      request: new Request("http://localhost/items/2", { method: "POST", body }),
    });

    expect(mockedUpdateItem).toHaveBeenCalledWith(
      2,
      {
        categoryId: 3,
        name: "Kenya AA",
        sku: "KEN-AA",
        description: "Berry",
        priceCents: 2100,
        quantity: 7,
        reorderLevel: 3,
        imageUrl: "https://example.com/kenya.png",
        isArchived: false,
      },
      "secret",
    );
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/items/2?status=updated");
  });

  it("deletes item and redirects with deleted status", async () => {
    mockedDeleteItem.mockResolvedValue({ id: 2, deleted: true } as never);

    const body = new URLSearchParams({
      intent: "delete",
      adminPassword: "secret",
    });

    const result = await action({
      params: { id: "2" },
      request: new Request("http://localhost/items/2", { method: "POST", body }),
    });

    expect(mockedDeleteItem).toHaveBeenCalledWith(2, "secret");
    expect((result as Response).headers.get("Location")).toBe("/items?status=deleted");
  });
});
