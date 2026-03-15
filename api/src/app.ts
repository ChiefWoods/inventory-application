import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { config } from "./config";
import { type CategoriesServiceContract, createCategoriesModule } from "./modules/categories";
import { type ItemsServiceContract, createItemsModule } from "./modules/items";

type AppOptions = {
  categoriesService: CategoriesServiceContract;
  itemsService: ItemsServiceContract;
  corsOrigin?: string;
};

export function createApp(options: AppOptions) {
  return new Elysia()
    .use(
      cors({
        origin: options.corsOrigin ?? config.corsOrigin,
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "x-admin-password"],
      }),
    )
    .get("/", () => ({ message: "Inventory API" }))
    .get("/health", () => ({
      ok: true,
      timestamp: new Date().toISOString(),
    }))
    .use(createCategoriesModule(options.categoriesService))
    .use(createItemsModule(options.itemsService));
}
