/**
 * NoopIntelligenceService — the DEFAULT. No AI is enabled; every capability is
 * off. The app behaves exactly as if the Intelligence Layer did not exist. Real
 * providers (OpenAI/Anthropic/local model/pgvector/external vector DB) slot in
 * behind the same interface later, selected by config (doc 14, ADR-0010).
 */
import {
  ALL_CAPABILITIES,
  type IntelligenceCapability,
  type IntelligenceService,
} from "./intelligence.service";

function noCapabilities(): Readonly<Record<IntelligenceCapability, boolean>> {
  return Object.freeze(
    Object.fromEntries(ALL_CAPABILITIES.map((c) => [c, false])) as Record<
      IntelligenceCapability,
      boolean
    >
  );
}

export class NoopIntelligenceService implements IntelligenceService {
  readonly provider = "noop";
  readonly enabled = false;
  readonly capabilities = noCapabilities();
  // All sub-capabilities intentionally undefined — callers must check before use.
}
