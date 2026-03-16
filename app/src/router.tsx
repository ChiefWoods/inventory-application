import { createBrowserRouter } from "react-router";
import {
  action as categoryAction,
  CategoryDetailPage,
  loader as categoryLoader,
} from "./routes/category-detail-page";
import {
  action as categoriesAction,
  CategoriesPage,
  loader as categoriesLoader,
} from "./routes/categories-page";
import { DashboardPage, loader as dashboardLoader } from "./routes/dashboard-page";
import {
  action as itemAction,
  ItemDetailPage,
  loader as itemLoader,
} from "./routes/item-detail-page";
import { action as itemsAction, ItemsPage, loader as itemsLoader } from "./routes/items-page";
import { NotFoundPage } from "./routes/not-found-page";
import { RootLayout } from "./routes/root-layout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        loader: dashboardLoader,
        element: <DashboardPage />,
      },
      {
        path: "categories",
        loader: categoriesLoader,
        action: categoriesAction,
        element: <CategoriesPage />,
      },
      {
        path: "categories/:id",
        loader: categoryLoader,
        action: categoryAction,
        element: <CategoryDetailPage />,
      },
      {
        path: "items",
        loader: itemsLoader,
        action: itemsAction,
        element: <ItemsPage />,
      },
      {
        path: "items/:id",
        loader: itemLoader,
        action: itemAction,
        element: <ItemDetailPage />,
      },
    ],
  },
]);
