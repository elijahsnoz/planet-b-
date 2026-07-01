import type { Clock } from "@domains/contribution";

/** System clock adapter behind the Clock port (so use-cases stay testable/pure). */
export class SystemClock implements Clock {
  now(): string {
    return new Date().toISOString();
  }
}
