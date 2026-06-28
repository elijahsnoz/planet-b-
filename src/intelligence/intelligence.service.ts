/**
 * IntelligenceService — the independent ✦ Intelligence Layer's single seam
 * (doc 14, ADR-0010). It sits BESIDE the application, never inside a domain.
 *
 * Nothing AI ships yet: the default is Noop. The design exists so semantic
 * search, embeddings, OCR, metadata extraction, recommendations, translation,
 * accessibility, impact analytics, exploration, and a curator assistant can be
 * added later WITHOUT restructuring the platform. Domains depend only on these
 * interfaces; an AI SDK is never imported into a domain. Results are written
 * back as ordinary records/edges/embeddings, flagged with AI provenance so they
 * never silently overwrite verified human records (Principle VI). Pure types.
 */
import type { Result } from "@shared/index";

/** Marks data that an AI produced, so curators can review/trust it. */
export interface AiProvenance {
  source: "ai";
  model: string;
  generatedAt: string;
  confidence?: number;
  reviewedBy?: string | null;
}

export interface EntityRef {
  entityType: string;
  entityId: string;
}

export interface SearchHit extends EntityRef {
  score: number;
  snippet?: string;
}

export interface SemanticSearch {
  indexDocument(ref: EntityRef, text: string, locale?: string): Promise<Result<void>>;
  query(text: string, opts?: { limit?: number; locale?: string }): Promise<Result<SearchHit[]>>;
}

export interface EmbeddingProvider {
  readonly model: string;
  readonly dims: number;
  embed(texts: string[]): Promise<Result<number[][]>>;
}

/** Aligns with the OcrProvider defined in doc 05 (certificate claim flow). */
export interface OcrProvider {
  recognize(image: Uint8Array, mime: string): Promise<Result<{ text: string; confidence: number }>>;
}

export interface MetadataExtractor {
  /** Suggest tags/alt-text/captions for a media asset (never auto-applied). */
  describe(media: Uint8Array, mime: string): Promise<Result<{ tags: string[]; altText?: string; caption?: string }>>;
}

export interface Recommender {
  relatedTo(ref: EntityRef, opts?: { limit?: number }): Promise<Result<SearchHit[]>>;
}

export interface Translator {
  /** Produces overlay translations for the `translations` table (ADR-0006). */
  translate(text: string, to: string, from?: string): Promise<Result<string>>;
}

export interface AccessibilityAssistant {
  describeImage(media: Uint8Array, mime: string): Promise<Result<{ altText: string } & Partial<AiProvenance>>>;
}

export interface ImpactAnalytics {
  summarize(chapterId?: string): Promise<Result<Record<string, number>>>;
}

export interface CuratorAssistant {
  /** Read-only assistance bounded by the caller's RBAC scope. */
  ask(prompt: string, context?: EntityRef[]): Promise<Result<string>>;
}

/** The umbrella service; sub-capabilities may be absent (capability flags). */
export interface IntelligenceService {
  readonly provider: string;
  readonly enabled: boolean;
  readonly capabilities: Readonly<Record<IntelligenceCapability, boolean>>;
  readonly search?: SemanticSearch;
  readonly embeddings?: EmbeddingProvider;
  readonly ocr?: OcrProvider;
  readonly metadata?: MetadataExtractor;
  readonly recommender?: Recommender;
  readonly translator?: Translator;
  readonly accessibility?: AccessibilityAssistant;
  readonly impact?: ImpactAnalytics;
  readonly curator?: CuratorAssistant;
}

export type IntelligenceCapability =
  | "search"
  | "embeddings"
  | "ocr"
  | "metadata"
  | "recommender"
  | "translator"
  | "accessibility"
  | "impact"
  | "curator";

export const ALL_CAPABILITIES: readonly IntelligenceCapability[] = [
  "search",
  "embeddings",
  "ocr",
  "metadata",
  "recommender",
  "translator",
  "accessibility",
  "impact",
  "curator",
];
