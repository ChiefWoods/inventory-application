import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/db/tables";

type TestDbContext = {
  db: ReturnType<typeof drizzle>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
};

async function executeSqlFile(
  sqlClient: { unsafe: (sql: string) => Promise<unknown> },
  filePath: string,
): Promise<void> {
  const sql = await readFile(filePath, "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sqlClient.unsafe(statement);
  }
}

export async function createTestDb(): Promise<TestDbContext> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL for database-backed tests.");
  }

  const sqlClient = postgres(databaseUrl, { max: 1 });

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const migrationDir = path.resolve(currentDir, "../drizzle");
  const migrationFiles = (await readdir(migrationDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const reset = async (): Promise<void> => {
    await sqlClient.unsafe("DROP TABLE IF EXISTS item_suppliers CASCADE;");
    await sqlClient.unsafe("DROP TABLE IF EXISTS coffee_specs CASCADE;");
    await sqlClient.unsafe("DROP TABLE IF EXISTS suppliers CASCADE;");
    await sqlClient.unsafe("DROP TABLE IF EXISTS items CASCADE;");
    await sqlClient.unsafe("DROP TABLE IF EXISTS categories CASCADE;");
    for (const fileName of migrationFiles) {
      await executeSqlFile(sqlClient, path.join(migrationDir, fileName));
    }
  };
  await reset();

  return {
    db: drizzle({ client: sqlClient, schema }),
    reset,
    close: async () => {
      await sqlClient.end({ timeout: 5 });
    },
  };
}
