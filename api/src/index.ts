import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { assertRequiredConfig, config } from "./config";
import { closeDbPool } from "./db/client";
import { ensureSchema } from "./db/schema";
import { categoriesModule } from "./modules/categories";
import { itemsModule } from "./modules/items";

assertRequiredConfig();
await ensureSchema();

const app = new Elysia()
  .use(
    cors({
      origin: config.corsOrigin,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-admin-password"],
    }),
  )
  .get("/", () => ({ message: "Inventory API" }))
  .get("/health", () => ({
    ok: true,
    timestamp: new Date().toISOString(),
  }))
  .use(categoriesModule)
  .use(itemsModule)
  .listen(config.port);

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
