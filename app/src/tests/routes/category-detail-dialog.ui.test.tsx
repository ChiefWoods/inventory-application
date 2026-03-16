import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CategoryDetailPage } from "@/routes/category-detail-page";

let loaderData: unknown;
let actionData: unknown;
let searchParams: URLSearchParams;
let navigationState: "idle" | "submitting";
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
    useNavigation: () => ({ state: navigationState }),
  };
});

describe("CategoryDetailPage dialog persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loaderData = {
      category: { id: 1, name: "Coffee Beans", description: "Nice beans" },
      itemCount: 2,
    };
    actionData = undefined;
    searchParams = new URLSearchParams();
    navigationState = "idle";
  });

  it("keeps delete dialog open when delete fails", async () => {
    const user = userEvent.setup();
    const view = render(<CategoryDetailPage />);

    await user.click(screen.getByRole("button", { name: /delete category/i }));
    expect(screen.getByText("Delete this category?")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Admin password"), "wrong-password");
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    actionData = { intent: "delete", error: "Admin password is incorrect." };
    view.rerender(<CategoryDetailPage />);

    expect(screen.getByText("Delete this category?")).toBeInTheDocument();
    expect(screen.getByText("Admin password is incorrect.")).toBeInTheDocument();
  });

  // Save dialog behavior is covered by action tests and manual QA; delete path
  // is the most regression-prone because it used to close on failed auth.
});
