import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.development" });

export default defineConfig({
  schema: "./src/db/tables.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
