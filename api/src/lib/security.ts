import { config } from "../config";

export function isAdminAuthorized(headerValue: string | undefined): boolean {
  if (!config.adminSecret) return false;
  if (!headerValue) return false;
  return headerValue === config.adminSecret;
}
