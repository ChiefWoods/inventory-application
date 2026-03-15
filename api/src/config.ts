const PORT = 3000;

function parsePort(value: string | undefined): number {
  if (!value) return PORT;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : PORT;
}

export const config = {
  port: parsePort(process.env.PORT),
  databaseUrl: process.env.DATABASE_URL,
  adminSecret: process.env.ADMIN_SECRET,
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};

export function assertRequiredConfig(): void {
  if (!config.databaseUrl) {
    throw new Error("Missing DATABASE_URL environment variable.");
  }

  if (!config.adminSecret) {
    throw new Error("Missing ADMIN_SECRET environment variable.");
  }
}
