import { useEffect, useState } from "react";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import {
  AlertDialog,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategory, getCategory, listItems, updateCategory } from "@/lib/api";

type ActionData = {
  error?: string;
  intent?: "update" | "delete";
};

type CategoryDetailData = Awaited<ReturnType<typeof loader>>;

function parseId(params: { id?: string }): number {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) throw new Error("Invalid category id.");
  return id;
}

export async function loader({ params }: { params: { id?: string } }) {
  const id = parseId(params);
  const [category, items] = await Promise.all([getCategory(id), listItems({ categoryId: id })]);
  return { category, itemCount: items.length };
}

export async function action({ request, params }: { request: Request; params: { id?: string } }) {
  const id = parseId(params);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "update") as "update" | "delete";
  const adminPassword = String(formData.get("adminPassword") ?? "");

  if (!adminPassword) {
    return { error: "Admin password is required.", intent } satisfies ActionData;
  }

  try {
    if (intent === "delete") {
      await deleteCategory(id, adminPassword);
      return redirect("/categories");
    }

    await updateCategory(
      id,
      {
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? "") || undefined,
      },
      adminPassword,
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : intent === "delete"
            ? "Failed to delete category."
            : "Failed to save category.",
      intent,
    } satisfies ActionData;
  }

  return redirect(`/categories/${id}`);
}

export function CategoryDetailPage() {
  const { category, itemCount } = useLoaderData() as CategoryDetailData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (!saveAttempted) return;
    if (navigation.state !== "idle") return;

    if (actionData?.intent === "update" && actionData.error) {
      setSaveDialogOpen(true);
      return;
    }

    setSaveDialogOpen(false);
    setSaveAttempted(false);
  }, [actionData, navigation.state, saveAttempted]);

  return (
    <section className="space-y-4">
      <Button variant="ghost" asChild>
        <Link to="/categories">Back to categories</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>{itemCount} linked items</CardDescription>
        </CardHeader>
        <CardContent>
          <Form id="category-update-form" method="post" className="space-y-4">
            <input type="hidden" name="intent" value="update" />
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={category.name} required minLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={category.description ?? ""}
              />
            </div>
            <div className="flex items-center gap-3">
              <AlertDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button type="button" disabled={isSubmitting}>
                    {isSubmitting && saveAttempted ? "Saving..." : "Save changes"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm save changes?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter your admin password to update this category.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="saveAdminPassword">Admin password</Label>
                    <Input
                      id="saveAdminPassword"
                      type="password"
                      name="adminPassword"
                      form="category-update-form"
                      autoComplete="current-password"
                      required
                    />
                    {saveAttempted && actionData?.intent === "update" && actionData.error ? (
                      <p className="text-sm text-destructive">{actionData.error}</p>
                    ) : null}
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button
                        type="submit"
                        form="category-update-form"
                        onClick={() => {
                          setSaveAttempted(true);
                        }}
                      >
                        Confirm save
                      </Button>
                    </AlertDialogFooter>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">
                    Delete category
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this category?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This only succeeds if no items are still linked to the category.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Form method="post" className="space-y-3">
                    <input type="hidden" name="intent" value="delete" />
                    <Label htmlFor="deleteAdminPassword">Admin password</Label>
                    <Input id="deleteAdminPassword" type="password" name="adminPassword" required />
                    {actionData?.intent === "delete" && actionData.error ? (
                      <p className="text-sm text-destructive">{actionData.error}</p>
                    ) : null}
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <Button type="submit" variant="destructive">
                        Confirm delete
                      </Button>
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
