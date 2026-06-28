/**
 * DomainError hierarchy — a small, stable taxonomy every domain shares.
 *
 * Codes map cleanly to HTTP at the API edge (see each domain's api adapter) and to
 * human messages in the admin. Keep this list short; new categories are rare.
 */

export type DomainErrorCode =
  | "NOT_FOUND"
  | "VALIDATION"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNAVAILABLE"
  | "INTERNAL";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;
  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

/** A requested record does not exist (or is archived and not visible). */
export class NotFoundError extends DomainError {
  constructor(message = "Not found.", details?: unknown) {
    super("NOT_FOUND", message, details);
  }
}

/** Input failed validation (zod issues, bad enum, etc.). */
export class ValidationError extends DomainError {
  constructor(message = "Invalid input.", details?: unknown) {
    super("VALIDATION", message, details);
  }
}

/** The operation conflicts with current state (duplicate, still-referenced, etc.). */
export class ConflictError extends DomainError {
  constructor(message = "Conflict.", details?: unknown) {
    super("CONFLICT", message, details);
  }
}

/** The actor lacks permission for this action (RBAC / per-record scope). */
export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden.", details?: unknown) {
    super("FORBIDDEN", message, details);
  }
}

/** A capability is intentionally not enabled yet (e.g. blockchain, intelligence). */
export class UnavailableError extends DomainError {
  constructor(message = "Capability not available.", details?: unknown) {
    super("UNAVAILABLE", message, details);
  }
}

/** Map a DomainErrorCode to an HTTP status for API handlers. */
export function httpStatusFor(code: DomainErrorCode): number {
  switch (code) {
    case "NOT_FOUND":
      return 404;
    case "VALIDATION":
      return 422;
    case "CONFLICT":
      return 409;
    case "FORBIDDEN":
      return 403;
    case "UNAVAILABLE":
      return 503;
    case "INTERNAL":
    default:
      return 500;
  }
}
