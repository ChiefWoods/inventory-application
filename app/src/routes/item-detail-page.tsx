import { ArrowLeft } from "lucide-react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { formatCurrencyFromCents, formatDate } from "@/lib/format";
import { deleteItem, getItem, listCategories, updateItem } from "@/lib/api";

type ActionData = {
  error?: string;
};

type ItemDetailData = Awaited<ReturnType<typeof loader>>;

function parseId(params: { id?: string }): number {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid item id.");
  return id;
}

function toOptionalString(value: FormDataEntryValue | null): string | undefined {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : undefined;
}

export async function loader({ params }: { params: { id?: string } }) {
  const id = parseId(params);
  const [item, categories] = await Promise.all([getItem(id), listCategories()]);
  return { item, categories };
}

export async function action({ request, params }: { request: Request; params: { id?: string } }) {
  const id = parseId(params);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "update");
  const adminPassword = String(formData.get("adminPassword") ?? "");

  if (!adminPassword) {
    return { error: "Admin password is required." } satisfies ActionData;
  }

  try {
    if (intent === "delete") {
      await deleteItem(id, adminPassword);
      return redirect("/items");
    }

    await updateItem(
      id,
      {
        categoryId: Number(formData.get("categoryId")),
        name: String(formData.get("name") ?? ""),
        sku: String(formData.get("sku") ?? ""),
        description: toOptionalString(formData.get("description")),
        priceCents: Number(formData.get("priceCents")),
        quantity: Number(formData.get("quantity")),
        reorderLevel: Number(formData.get("reorderLevel")),
        imageUrl: toOptionalString(formData.get("imageUrl")),
        isArchived: formData.get("isArchived") === "on",
      },
      adminPassword,
    );
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update item.",
    } satisfies ActionData;
  }

  return redirect(`/items/${id}`);
}

export function ItemDetailPage() {
  const { item, categories } = useLoaderData() as ItemDetailData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const [isArchivedChecked, setIsArchivedChecked] = useState(item.isArchived);
  const [selectedCategoryId, setSelectedCategoryId] = useState(String(item.categoryId));
  const isSubmitting = navigation.state === "submitting";

  return (
    <section className="space-y-4">
      <Button variant="ghost" asChild>
        <Link to="/items">
          <ArrowLeft />
          Back to items
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>
            SKU {item.sku} - Last updated {formatDate(item.updatedAt)} -{" "}
            {formatCurrencyFromCents(item.priceCents)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="update" />
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <input type="hidden" id="categoryId" name="categoryId" value={selectedCategoryId} />
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={item.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" name="sku" defaultValue={item.sku} required />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="priceCents">Price (cents)</Label>
                <Input
                  id="priceCents"
                  name="priceCents"
                  type="number"
                  min={0}
                  defaultValue={item.priceCents}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min={0}
                  defaultValue={item.quantity}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder level</Label>
                <Input
                  id="reorderLevel"
                  name="reorderLevel"
                  type="number"
                  min={0}
                  defaultValue={item.reorderLevel}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={item.description ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" name="imageUrl" type="url" defaultValue={item.imageUrl ?? ""} />
            </div>
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm">
              <input type="hidden" name="isArchived" value={isArchivedChecked ? "on" : "off"} />
              <Checkbox
                checked={isArchivedChecked}
                onCheckedChange={(checked) => {
                  setIsArchivedChecked(checked === true);
                }}
              />
              Archived
            </label>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin password</Label>
              <Input id="adminPassword" type="password" name="adminPassword" required />
            </div>
            {actionData?.error ? (
              <p className="text-sm text-destructive">{actionData.error}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete item
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently removes the item from your inventory.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="intent" value="delete" />
                    <Label htmlFor="deleteAdminPassword">Admin password</Label>
                    <Input id="deleteAdminPassword" type="password" name="adminPassword" required />
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="submit" variant="destructive">
                          Confirm delete
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </Form>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
