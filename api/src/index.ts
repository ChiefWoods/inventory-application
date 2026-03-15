import { assertRequiredConfig, config } from "./config";
import { createApp } from "./app";
import { closeDbPool, db } from "./db/client";
import { ensureSchema } from "./db/schema";
import { CategoriesService } from "./modules/categories/service";
import { ItemsService } from "./modules/items/service";

assertRequiredConfig();
await ensureSchema();

const app = createApp({
  categoriesService: new CategoriesService(db),
  itemsService: new ItemsService(db),
}).listen(config.port);

console.log(`API running at ${app.server?.hostname}:${app.server?.port}`);

let isShuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    await closeDbPool();
    console.log("Postgres pool closed.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to close Postgres pool cleanly.", error);
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
