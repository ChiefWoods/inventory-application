import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/tables";

type TestDbContext = {
  db: ReturnType<typeof drizzle>;
  reset: () => Promise<void>;
  close: () => Promise<void>;
};

async function executeSqlFile(
  pool: { query: (sql: string) => Promise<unknown> },
  filePath: string,
): Promise<void> {
  const sql = await readFile(filePath, "utf-8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }
}

export async function createTestDb(): Promise<TestDbContext> {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing TEST_DATABASE_URL for database-backed tests.");
  }

  const pool = new Pool({ connectionString: databaseUrl });

  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  const migrationDir = path.resolve(currentDir, "../drizzle");
  const migrationFiles = (await readdir(migrationDir))
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const reset = async (): Promise<void> => {
    await pool.query("DROP TABLE IF EXISTS item_suppliers CASCADE;");
    await pool.query("DROP TABLE IF EXISTS coffee_specs CASCADE;");
    await pool.query("DROP TABLE IF EXISTS suppliers CASCADE;");
    await pool.query("DROP TABLE IF EXISTS items CASCADE;");
    await pool.query("DROP TABLE IF EXISTS categories CASCADE;");
    for (const fileName of migrationFiles) {
      await executeSqlFile(pool, path.join(migrationDir, fileName));
    }
  };
  await reset();

  return {
    db: drizzle({ client: pool, schema }),
    reset,
    close: async () => {
      await pool.end();
    },
  };
}
