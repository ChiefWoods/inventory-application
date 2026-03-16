import { beforeEach, describe, expect, it, vi } from "vitest";
import { loader } from "@/routes/dashboard-page";
import { listCategories, listItems } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  listCategories: vi.fn(),
  listItems: vi.fn(),
}));

const mockedListCategories = vi.mocked(listCategories);
const mockedListItems = vi.mocked(listItems);

describe("dashboard-page loader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads categories and low-stock items", async () => {
    const categories = [{ id: 1, name: "Coffee Beans", itemCount: 2 }];
    const lowStockItems = [{ id: 10, name: "Kenya AA", quantity: 2, reorderLevel: 4 }];

    mockedListCategories.mockResolvedValue(categories as never);
    mockedListItems.mockResolvedValue(lowStockItems as never);

    const data = await loader();

    expect(mockedListCategories).toHaveBeenCalledTimes(1);
    expect(mockedListItems).toHaveBeenCalledWith({ lowStock: true });
    expect(data).toEqual({ categories, lowStockItems });
  });
});
