import "server-only";
import { VisitorService } from "@domains/contribution";
import { SupabaseVisitorRepository } from "./visitor.repository";
import { UuidV7Generator } from "./id";
import { SystemClock } from "./clock";

/**
 * Composition root — the outermost layer, where domain use-cases are wired to their
 * infrastructure adapters. This is the only module allowed to know both the domain
 * and the concrete adapters. The application asks it for a service; the domain never
 * imports it. To replace Supabase, change the adapter passed here — nothing else.
 */
let visitor: VisitorService | null = null;

export function visitorService(): VisitorService {
  if (!visitor) {
    visitor = new VisitorService(
      new SupabaseVisitorRepository(),
      new UuidV7Generator(),
      new SystemClock(),
    );
  }
  return visitor;
}
