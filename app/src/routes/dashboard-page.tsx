import { Link, useLoaderData } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listCategories, listItems } from "@/lib/api";
import { formatCurrencyFromCents } from "@/lib/format";

type DashboardData = Awaited<ReturnType<typeof loader>>;

export async function loader() {
  const [categories, lowStockItems] = await Promise.all([
    listCategories(),
    listItems({ lowStock: true }),
  ]);

  return { categories, lowStockItems };
}

export function DashboardPage() {
  const { categories, lowStockItems } = useLoaderData() as DashboardData;
  const totalItems = categories.reduce((acc, category) => acc + (category.itemCount ?? 0), 0);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total categories</CardDescription>
            <CardTitle className="text-3xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total tracked items</CardDescription>
            <CardTitle className="text-3xl">{totalItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Low stock alerts</CardDescription>
            <CardTitle className="text-3xl">{lowStockItems.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Low stock items</CardTitle>
            <CardDescription>Items at or below reorder threshold</CardDescription>
          </div>
          <Button asChild>
            <Link to="/items">Manage inventory</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <p className="text-muted-foreground">No low stock items. Great job.</p>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.categoryName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      Qty {item.quantity} / Reorder {item.reorderLevel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrencyFromCents(item.priceCents)}
                    </span>
                    <Button variant="outline" asChild>
                      <Link to={`/items/${item.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
