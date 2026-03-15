import { Pool, type QueryResultRow } from "pg";
import { config } from "../config";

if (!config.databaseUrl) {
  throw new Error("Cannot initialize SQL client without DATABASE_URL.");
}

export const db = new Pool({
  connectionString: config.databaseUrl,
});

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await db.query<T>(text, params);
  return result.rows;
}

export async function closeDbPool(): Promise<void> {
  await db.end();
}
