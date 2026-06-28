/**
 * @intelligence — the independent ✦ Intelligence Layer (doc 14, ADR-0010).
 * Provider selected from config; default Noop (no AI shipped). Callers depend on
 * the `intelligence` interface and ALWAYS check `.enabled` / `.capabilities`
 * before using a sub-capability.
 */
import { NoopIntelligenceService } from "./intelligence.noop";
import type { IntelligenceService } from "./intelligence.service";

export type {
  IntelligenceService,
  IntelligenceCapability,
  SemanticSearch,
  EmbeddingProvider,
  OcrProvider,
  MetadataExtractor,
  Recommender,
  Translator,
  AccessibilityAssistant,
  ImpactAnalytics,
  CuratorAssistant,
  AiProvenance,
  EntityRef,
  SearchHit,
} from "./intelligence.service";
export { NoopIntelligenceService } from "./intelligence.noop";

const PROVIDER = process.env.PLANET_B_INTELLIGENCE_PROVIDER ?? "noop";

function select(provider: string): IntelligenceService {
  switch (provider) {
    // case "openai": return new OpenAiIntelligenceService();   // later
    // case "local":  return new LocalIntelligenceService();    // later
    case "noop":
    default:
      return new NoopIntelligenceService();
  }
}

export const intelligence: IntelligenceService = select(PROVIDER);
