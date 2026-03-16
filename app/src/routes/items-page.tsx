import { useEffect, useRef, useState } from "react";
import {
  Form,
  Link,
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createItem, listCategories, listItems } from "@/lib/api";
import { formatCurrencyFromCents } from "@/lib/format";

type ItemsData = Awaited<ReturnType<typeof loader>>;
type ActionData = {
  error?: string;
};

function toOptionalString(value: FormDataEntryValue | null): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? undefined;
  const categoryIdValue = url.searchParams.get("categoryId");
  const categoryId = categoryIdValue ? Number(categoryIdValue) : undefined;
  const lowStock = url.searchParams.get("lowStock") === "true";

  const [categories, items] = await Promise.all([
    listCategories(),
    listItems({
      q,
      categoryId: Number.isFinite(categoryId) ? categoryId : undefined,
      lowStock,
    }),
  ]);

  return {
    categories,
    items,
    filters: { q: q ?? "", categoryId: categoryIdValue ?? "", lowStock },
  };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();

  try {
    await createItem({
      categoryId: Number(formData.get("categoryId")),
      name: String(formData.get("name") ?? ""),
      sku: String(formData.get("sku") ?? ""),
      description: toOptionalString(formData.get("description")),
      priceCents: Number(formData.get("priceCents")),
      quantity: Number(formData.get("quantity")),
      reorderLevel: Number(formData.get("reorderLevel")),
      imageUrl: toOptionalString(formData.get("imageUrl")),
      isArchived: formData.get("isArchived") === "on",
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create item.",
    } satisfies ActionData;
  }

  return redirect("/items?status=created");
}

export function ItemsPage() {
  const { categories, items, filters } = useLoaderData() as ItemsData;
  const actionData = useActionData() as ActionData | undefined;
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const filterDebounceRef = useRef<number | null>(null);
  const filterFormRef = useRef<HTMLFormElement>(null);
  const createFormRef = useRef<HTMLFormElement>(null);
  const createAttemptedRef = useRef(false);
  const lowStockHiddenRef = useRef<HTMLInputElement>(null);
  const [filterCategoryId, setFilterCategoryId] = useState(filters.categoryId || "__all__");
  const [createCategoryId, setCreateCategoryId] = useState(
    categories[0] ? String(categories[0].id) : "",
  );
  const [lowStockChecked, setLowStockChecked] = useState(filters.lowStock);
  const [createArchivedChecked, setCreateArchivedChecked] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  const onFilterChange = (event: React.FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const target = event.target as HTMLInputElement | HTMLSelectElement;

    if (target.name === "q") {
      if (filterDebounceRef.current) {
        window.clearTimeout(filterDebounceRef.current);
      }
      filterDebounceRef.current = window.setTimeout(() => {
        submit(form, { replace: true });
      }, 250);
      return;
    }

    submit(form, { replace: true });
  };

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) return;

    if (status === "deleted") {
      toast.success("Item deleted successfully.");
    } else if (status === "created") {
      toast.success("Item created successfully.");
    } else {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("status");
    const search = nextParams.toString();
    navigate({ search: search ? `?${search}` : "" }, { replace: true });
  }, [navigate, searchParams]);

  useEffect(() => {
    if (navigation.state !== "idle") return;
    if (!createAttemptedRef.current) return;
    if (actionData?.error) return;

    createFormRef.current?.reset();
    setCreateArchivedChecked(false);
    setCreateCategoryId(categories[0] ? String(categories[0].id) : "");
    createAttemptedRef.current = false;
  }, [actionData, categories, navigation.state]);

  return (
    <section className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search inventory</CardTitle>
          <CardDescription>Filter by name, SKU, category, and low stock state.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form
            ref={filterFormRef}
            method="get"
            onChange={onFilterChange}
            className="grid gap-3 md:grid-cols-3"
          >
            <Input
              name="q"
              placeholder="Search by name or SKU"
              defaultValue={filters.q}
              className="h-10"
            />
            <input
              type="hidden"
              name="categoryId"
              value={filterCategoryId === "__all__" ? "" : filterCategoryId}
            />
            <Select
              value={filterCategoryId}
              onValueChange={(nextValue) => {
                setFilterCategoryId(nextValue);
                if (filterFormRef.current) {
                  submit(filterFormRef.current, { replace: true });
                }
              }}
            >
              <SelectTrigger className="h-10 w-full data-[size=default]:h-10">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 text-sm">
              <input
                ref={lowStockHiddenRef}
                type="hidden"
                name="lowStock"
                value={lowStockChecked ? "true" : "false"}
              />
              <Checkbox
                checked={lowStockChecked}
                onCheckedChange={(checked) => {
                  const nextChecked = checked === true;
                  setLowStockChecked(nextChecked);
                  if (lowStockHiddenRef.current) {
                    lowStockHiddenRef.current.value = nextChecked ? "true" : "false";
                  }
                  if (filterFormRef.current) {
                    submit(filterFormRef.current, { replace: true });
                  }
                }}
              />
              Low stock only
            </label>
          </Form>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>{items.length} matching inventory records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const lowStock = item.quantity <= item.reorderLevel;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.categoryName}</TableCell>
                      <TableCell>{formatCurrencyFromCents(item.priceCents)}</TableCell>
                      <TableCell>
                        {item.quantity} / {item.reorderLevel}
                      </TableCell>
                      <TableCell>
                        {item.isArchived ? (
                          <Badge variant="secondary">Archived</Badge>
                        ) : lowStock ? (
                          <Badge variant="destructive">Low stock</Badge>
                        ) : (
                          <Badge>Healthy</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" asChild>
                          <Link to={`/items/${item.id}`}>Manage</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New item</CardTitle>
            <CardDescription>Create a new inventory record.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form
              ref={createFormRef}
              method="post"
              className="space-y-3"
              onSubmit={() => {
                createAttemptedRef.current = true;
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <input type="hidden" id="categoryId" name="categoryId" value={createCategoryId} />
                <Select value={createCategoryId} onValueChange={setCreateCategoryId}>
                  <SelectTrigger className="h-10 w-full data-[size=default]:h-10">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" required minLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priceCents">Price (cents)</Label>
                <Input id="priceCents" name="priceCents" type="number" min={0} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" min={0} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder level</Label>
                  <Input id="reorderLevel" name="reorderLevel" type="number" min={0} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input id="imageUrl" name="imageUrl" type="url" />
              </div>
              <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
                <input
                  type="hidden"
                  name="isArchived"
                  value={createArchivedChecked ? "on" : "off"}
                />
                <Checkbox
                  checked={createArchivedChecked}
                  onCheckedChange={(checked) => {
                    setCreateArchivedChecked(checked === true);
                  }}
                />
                Create as archived
              </label>
              {actionData?.error ? (
                <p className="text-sm text-destructive">{actionData.error}</p>
              ) : null}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Saving..." : "Create item"}
              </Button>
            </Form>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
