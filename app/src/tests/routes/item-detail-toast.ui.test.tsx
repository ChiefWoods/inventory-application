import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ItemDetailPage } from "@/routes/item-detail-page";

let loaderData: unknown;
let actionData: unknown;
let searchParams: URLSearchParams;
const navigateMock = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    Form: ({ children, ...props }: React.ComponentProps<"form">) => (
      <form {...props}>{children}</form>
    ),
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useLoaderData: () => loaderData,
    useActionData: () => actionData,
    useSearchParams: () => [searchParams],
    useNavigate: () => navigateMock,
    useNavigation: () => ({ state: "idle" }),
  };
});

describe("ItemDetailPage toast/status behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loaderData = {
      item: {
        id: 1,
        categoryId: 1,
        categoryName: "Coffee Beans",
        name: "Guji Lot",
        sku: "GUJI-001",
        description: null,
        imageUrl: null,
        priceCents: 1200,
        quantity: 15,
        reorderLevel: 10,
        isArchived: false,
        createdAt: "2026-03-16T00:00:00.000Z",
        updatedAt: "2026-03-16T00:00:00.000Z",
      },
      categories: [{ id: 1, name: "Coffee Beans" }],
    };
    actionData = undefined;
    searchParams = new URLSearchParams("status=updated");
  });

  it("shows update success toast and cleans up status query", () => {
    render(<ItemDetailPage />);

    expect(toast.success).toHaveBeenCalledWith("Item updated successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });
  });
});
