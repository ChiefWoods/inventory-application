import { beforeEach, describe, expect, it, vi } from "vitest";
import { action, loader } from "@/routes/categories-page";
import { createCategory, listCategories } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  createCategory: vi.fn(),
  listCategories: vi.fn(),
}));

const mockedCreateCategory = vi.mocked(createCategory);
const mockedListCategories = vi.mocked(listCategories);

describe("categories-page loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads category list", async () => {
    const categories = [{ id: 1, name: "Coffee Beans" }];
    mockedListCategories.mockResolvedValue(categories as never);

    const data = await loader();

    expect(mockedListCategories).toHaveBeenCalledTimes(1);
    expect(data).toEqual({ categories });
  });
});

describe("categories-page action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates category and redirects with created status", async () => {
    mockedCreateCategory.mockResolvedValue({ id: 3 } as never);

    const body = new URLSearchParams({
      name: "Brew Equipment",
      description: "Tools and brewers",
    });

    const result = await action({
      request: new Request("http://localhost/categories", { method: "POST", body }),
    });

    expect(mockedCreateCategory).toHaveBeenCalledWith({
      name: "Brew Equipment",
      description: "Tools and brewers",
    });
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).headers.get("Location")).toBe("/categories?status=created");
  });

  it("returns error payload when create fails", async () => {
    mockedCreateCategory.mockRejectedValue(new Error("Category already exists."));

    const body = new URLSearchParams({
      name: "Coffee Beans",
      description: "Duplicate",
    });

    const result = await action({
      request: new Request("http://localhost/categories", { method: "POST", body }),
    });

    expect(result).toEqual({ error: "Category already exists." });
  });
});
