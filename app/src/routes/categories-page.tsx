import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createCategory, listCategories } from "@/lib/api";

type ActionData = {
  error?: string;
};

type CategoriesData = Awaited<ReturnType<typeof loader>>;

export async function loader() {
  const categories = await listCategories();
  return { categories };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");

  try {
    await createCategory({
      name,
      description: description || undefined,
    });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create category.",
    } satisfies ActionData;
  }

  return redirect("/categories");
}

export function CategoriesPage() {
  const { categories } = useLoaderData() as CategoriesData;
  const actionData = useActionData() as ActionData | undefined;
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_1.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>New category</CardTitle>
          <CardDescription>Create a category for grouped inventory management.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                name="name"
                placeholder="Coffee Beans"
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                name="description"
                placeholder="Specialty whole beans for pour-over and espresso."
              />
            </div>
            {actionData?.error ? (
              <p className="text-sm text-destructive">{actionData.error}</p>
            ) : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create category"}
            </Button>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All categories</CardTitle>
          <CardDescription>{categories.length} total categories</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.itemCount ?? 0}</TableCell>
                  <TableCell className="max-w-[28ch] truncate text-muted-foreground">
                    {category.description ?? "No description"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" asChild>
                      <Link to={`/categories/${category.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
