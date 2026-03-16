import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { CategoriesPage } from "@/routes/categories-page";
import { CategoryDetailPage } from "@/routes/category-detail-page";

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

describe("category toast/status behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loaderData = { categories: [] };
    actionData = undefined;
    searchParams = new URLSearchParams();
  });

  it("shows created/deleted category toast on categories page", () => {
    searchParams = new URLSearchParams("status=created");
    render(<CategoriesPage />);

    expect(toast.success).toHaveBeenCalledWith("Category created successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });

    vi.clearAllMocks();
    searchParams = new URLSearchParams("status=deleted");
    render(<CategoriesPage />);

    expect(toast.success).toHaveBeenCalledWith("Category deleted successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });
  });

  it("shows updated category toast on category detail page", () => {
    loaderData = {
      category: { id: 1, name: "Coffee Beans", description: null },
      itemCount: 0,
    };
    searchParams = new URLSearchParams("status=updated");

    render(<CategoryDetailPage />);

    expect(toast.success).toHaveBeenCalledWith("Category updated successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });
  });
});
