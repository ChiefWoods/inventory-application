export type ApiError = {
  error: string;
};

export function normalizeError(error: unknown): ApiError {
  if (error instanceof Error) {
    return { error: error.message };
  }

  return { error: "Unexpected server error." };
}
