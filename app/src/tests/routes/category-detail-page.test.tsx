import { beforeEach, describe, expect, it, vi } from "vitest";
import { action, loader } from "@/routes/category-detail-page";
import { deleteCategory, getCategory, listItems, updateCategory } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  deleteCategory: vi.fn(),
  getCategory: vi.fn(),
  listItems: vi.fn(),
  updateCategory: vi.fn(),
}));

const mockedDeleteCategory = vi.mocked(deleteCategory);
const mockedGetCategory = vi.mocked(getCategory);
const mockedListItems = vi.mocked(listItems);
const mockedUpdateCategory = vi.mocked(updateCategory);

describe("category-detail loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads category and related items count", async () => {
    mockedGetCategory.mockResolvedValue({ id: 1, name: "Coffee Beans" } as never);
    mockedListItems.mockResolvedValue([{ id: 3 }, { id: 4 }] as never);

    const data = await loader({ params: { id: "1" } });

    expect(mockedGetCategory).toHaveBeenCalledWith(1);
    expect(mockedListItems).toHaveBeenCalledWith({ categoryId: 1 });
    expect(data).toEqual({
      category: { id: 1, name: "Coffee Beans" },
      itemCount: 2,
    });
  });
});

describe("category-detail action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns required error when admin password missing", async () => {
    const body = new URLSearchParams({
      intent: "update",
      name: "Coffee Beans",
    });

    const result = await action({
      params: { id: "5" },
      request: new Request("http://localhost/categories/5", { method: "POST", body }),
    });

    expect(result).toEqual({ error: "Admin password is required.", intent: "update" });
  });

  it("updates category and redirects with updated status", async () => {
    mockedUpdateCategory.mockResolvedValue({ id: 5 } as never);

    const body = new URLSearchParams({
      intent: "update",
      adminPassword: "secret",
      name: "Filter Coffee",
      description: "All filter coffee products",
    });

    const result = await action({
      params: { id: "5" },
      request: new Request("http://localhost/categories/5", { method: "POST", body }),
    });

    expect(mockedUpdateCategory).toHaveBeenCalledWith(
      5,
      { name: "Filter Coffee", description: "All filter coffee products" },
      "secret",
    );
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/categories/5?status=updated");
  });

  it("deletes category and redirects with deleted status", async () => {
    mockedDeleteCategory.mockResolvedValue({ id: 5, deleted: true } as never);

    const body = new URLSearchParams({
      intent: "delete",
      adminPassword: "secret",
    });

    const result = await action({
      params: { id: "5" },
      request: new Request("http://localhost/categories/5", { method: "POST", body }),
    });

    expect(mockedDeleteCategory).toHaveBeenCalledWith(5, "secret");
    expect((result as Response).headers.get("Location")).toBe("/categories?status=deleted");
  });
});
