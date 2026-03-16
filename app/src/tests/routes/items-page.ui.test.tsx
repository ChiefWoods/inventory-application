import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ItemsPage } from "@/routes/items-page";

let loaderData: unknown;
let actionData: unknown;
let searchParams: URLSearchParams;
let navigationState: "idle" | "submitting";
const navigateMock = vi.fn();
const submitMock = vi.fn();

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
    useSubmit: () => submitMock,
  };
});

describe("ItemsPage UI behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    loaderData = {
      categories: [
        { id: 1, name: "Coffee Beans" },
        { id: 2, name: "Brew Equipment" },
      ],
      items: [],
      filters: { q: "", categoryId: "", lowStock: false },
    };
    actionData = undefined;
    searchParams = new URLSearchParams();
    navigationState = "idle";
  });

  it("shows created/deleted success toast and removes status query param", () => {
    searchParams = new URLSearchParams("status=created");
    render(<ItemsPage />);

    expect(toast.success).toHaveBeenCalledWith("Item created successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });

    vi.clearAllMocks();
    searchParams = new URLSearchParams("status=deleted");
    render(<ItemsPage />);

    expect(toast.success).toHaveBeenCalledWith("Item deleted successfully.");
    expect(navigateMock).toHaveBeenCalledWith({ search: "" }, { replace: true });
  });

  it("submits filter form with debounce when search changes", () => {
    vi.useFakeTimers();
    render(<ItemsPage />);

    const searchInput = screen.getByPlaceholderText("Search by name or SKU");
    fireEvent.change(searchInput, { target: { value: "ethiopia" } });

    expect(submitMock).not.toHaveBeenCalled();

    vi.advanceTimersByTime(250);

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(submitMock.mock.calls[0][0]).toBeInstanceOf(HTMLFormElement);
    expect(submitMock.mock.calls[0][1]).toEqual({ replace: true });
  });

  it("submits filter form immediately when low-stock checkbox changes", async () => {
    render(<ItemsPage />);
    const lowStockCheckbox = screen.getByRole("checkbox", { name: /low stock only/i });

    await userEvent.click(lowStockCheckbox);

    expect(submitMock).toHaveBeenCalled();
    const lastCall = submitMock.mock.calls.at(-1);
    expect(lastCall?.[1]).toEqual({ replace: true });
  });

  it("resets create form fields after successful submit cycle", async () => {
    const user = userEvent.setup();
    const view = render(<ItemsPage />);

    const nameInput = screen.getByLabelText("Name");
    const skuInput = screen.getByLabelText("SKU");
    const createButton = screen.getByRole("button", { name: /create item/i });
    const createForm = createButton.closest("form");

    expect(createForm).not.toBeNull();

    await user.type(nameInput, "Guji Lot");
    await user.type(skuInput, "GUJI-001");
    fireEvent.submit(createForm as HTMLFormElement);

    navigationState = "submitting";
    view.rerender(<ItemsPage />);
    navigationState = "idle";
    actionData = undefined;
    view.rerender(<ItemsPage />);

    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("SKU")).toHaveValue("");
  });
});
