import path from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db } from "./client";

export async function ensureSchema(): Promise<void> {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const migrationsFolder = path.resolve(currentDir, "../../drizzle");

  await migrate(db, { migrationsFolder });
}
