/**
 * HTTP error helpers for the read API.
 *
 * Throw these from a route handler; the global onError below maps
 * them to a structured JSON body and the right status code. Anything
 * that escapes (uncaught) becomes 500.
 */
import type { Context } from "hono";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const NotFound   = (msg: string): ApiError => new ApiError(404, "not_found",   msg);
export const BadRequest = (msg: string): ApiError => new ApiError(400, "bad_request", msg);

export function jsonError(c: Context, err: unknown): Response {
  if (err instanceof ApiError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status as 400 | 404);
  }
  const message = err instanceof Error ? err.message : String(err);
  return c.json({ error: { code: "internal", message } }, 500);
}
