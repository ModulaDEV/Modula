/**
 * Gateway error taxonomy.
 *
 * Each error class carries an HTTP status, a stable code (used by
 * frontends to surface user-facing messages), and an optional cause.
 * Hono's onError handler maps these to JSON responses uniformly.
 */

export class GatewayError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
  }

  toJSON() {
    return { error: { code: this.code, message: this.message } };
  }
}

// -------- 4xx — caller errors --------

export class BadRequest extends GatewayError {
  constructor(message: string, cause?: unknown) {
    super("bad_request", 400, message, cause);
  }
}

export class PaymentRequired extends GatewayError {
  constructor(message: string, cause?: unknown) {
    super("payment_required", 402, message, cause);
  }
}

export class NotFound extends GatewayError {
  constructor(resource: string) {
    super("not_found", 404, `${resource} not found`);
  }
}

// -------- 5xx — gateway-side --------

export class UpstreamError extends GatewayError {
  constructor(target: string, cause?: unknown) {
    super("upstream_error", 502, `upstream ${target} failed`, cause);
  }
}

export class ConfigError extends GatewayError {
  constructor(message: string) {
    super("config_error", 500, message);
  }
}

// -------- helpers --------

export function isGatewayError(e: unknown): e is GatewayError {
  return e instanceof GatewayError;
}
