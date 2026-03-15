import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "../config";

if (!config.databaseUrl) {
  throw new Error("Cannot initialize SQL client without DATABASE_URL.");
}

export const pool = new Pool({
  connectionString: config.databaseUrl,
});
export const db = drizzle({ client: pool });

export async function closeDbPool(): Promise<void> {
  await pool.end();
}
