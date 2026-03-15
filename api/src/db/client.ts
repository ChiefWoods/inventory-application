import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config";
import * as schema from "./tables";

if (!config.databaseUrl) {
  throw new Error("Cannot initialize SQL client without DATABASE_URL.");
}

export const sql = postgres(config.databaseUrl);
export const db = drizzle({ client: sql, schema });

export async function closeDbPool(): Promise<void> {
  await sql.end({ timeout: 5 });
}
