import { config } from "../config";

export function isAdminAuthorized(headerValue: string | undefined): boolean {
  const adminSecret = process.env.ADMIN_SECRET ?? config.adminSecret;
  if (!adminSecret) return false;
  if (!headerValue) return false;
  return headerValue === adminSecret;
}
