/**
 * Planet B — domain models (single source of truth for types).
 *
 * Mirrors docs/10-database-schema.md and the data/genesis/*.json seed.
 * Framework-agnostic: no React/Next/ORM imports. The app, CMS adapters, and
 * certificate/verify services all consume these types.
 *
 * Principles encoded here (docs/00-PRINCIPLES.md):
 *  - II  Genesis is sacred → Chapter.isGenesis + immutable; soft-delete only (archivedAt).
 *  - III Contribution not attendance → Certificate is per contribution role.
 *  - IV  No one invisible → ConsentStatus gates publication, not hierarchy.
 *  - V   Founding Council is history → FoundingCouncilMember.
 *  - VI  Accuracy over completeness → `Verifiable` + `Pending`.
 *  - VII Blockchain-ready, not now → Certificate.verificationHash (now) + soulboundRef (later, nullable).
 */

// ── shared ──────────────────────────────────────────────────────────────────
export type UUID = string;
export type Slug = string;
export type ISODate = string; // "YYYY-MM-DD" or full ISO timestamp
export type Locale = "en" | (string & {});

export type ConsentStatus = "granted" | "pending" | "withheld";

/** Every record carries provenance + soft-delete; the archive never hard-deletes. */
export interface Timestamps {
  createdAt?: ISODate;
  updatedAt?: ISODate;
  /** Soft-delete marker. Genesis Chapter records must never be deleted. */
  archivedAt?: ISODate | null;
}

/** Records assert whether each fact is confirmed from the catalogue/plates. */
export interface Verifiable {
  verified: boolean;
}

/** A record (or sub-record) intentionally left blank until verified (Principle VI). */
export interface Pending {
  status: "INTENTIONALLY_INCOMPLETE" | "reserved";
  reason?: string;
}

// ── media ────────────────────────────────────────────────────────────────────
export type MediaKind = "image" | "video" | "audio" | "pdf" | "doc";

export interface Media extends Timestamps {
  id: string;
  kind: MediaKind;
  /** storage key under archive/source (master) or derivatives (regenerable). */
  storageKey: string;
  sha256?: string;
  bytes?: number;
  mime?: string;
  width?: number;
  height?: number;
  durationS?: number;
  /** Mandatory for accessibility + archive integrity. */
  altText?: string;
  caption?: string;
  credit?: string; // e.g. "Photo: Benjamin Oladapo"
  source?: string; // "catalogue" | "Edge Media" | "NTA" | ...
  license?: string;
  captionsVttKey?: string;
  isMaster?: boolean;
}

// ── chapter ──────────────────────────────────────────────────────────────────
export type ChapterStatus = "genesis" | "active" | "planned";
export type PartnerRole = "sponsor" | "host" | "media" | "partner" | "community-partner" | "publisher" | "affiliated";

export interface ChapterPartner {
  organization: Slug;
  role: PartnerRole;
  sortOrder?: number;
}

export interface YorubaProverb {
  yoruba: string;
  english: string;
}

export interface Chapter extends Timestamps, Verifiable {
  slug: Slug;
  name: string;
  city: string;
  country: string;
  status: ChapterStatus;
  /** Principle II — the genesis flag; with `immutable`, the cornerstone is protected. */
  isGenesis: boolean;
  immutable?: boolean;
  movement: string; // "Because There Is No Planet B"
  theme?: string;
  eventName?: string;
  openedOn: ISODate;
  venue: string;
  summary?: string;
  yorubaProverbs?: YorubaProverb[];
  partners?: ChapterPartner[];
  heroMedia?: string;
}

// ── organization ─────────────────────────────────────────────────────────────
export type OrganizationType =
  | "embassy" | "gallery" | "foundation" | "ngo" | "company" | "govt" | "media";

export interface Organization extends Timestamps, Verifiable {
  slug: Slug;
  name: string;
  type: OrganizationType;
  role?: string;
  about?: string;
  website?: string;
  logoMedia?: string;
  established?: string;
}

// ── person (the profile model) ───────────────────────────────────────────────
export type FoundingCouncilCategory =
  | "founding_artist" | "gallery_leadership" | "embassy_representative"
  | "organizer" | "curator" | "key_collaborator";

/**
 * Roles are open-ended strings so a person's standing can grow without a schema
 * change (e.g. Elijah Snoz: Artist → Storyteller → Founding Narrator →
 * Creative Technologist → Future Founder). New roles append to the same record.
 */
export interface Person extends Timestamps, Verifiable {
  slug: Slug;
  fullName: string;
  displayName?: string;
  honorific?: string;
  primaryRole?: string;
  roles: string[];
  shortBio?: string;
  bio?: string;
  /** Artwork slugs (artists). */
  artworks?: Slug[];
  /** Organization slugs. */
  organizations?: Slug[];
  portraitMedia?: string;
  /** Founding Council categories this person belongs to (Principle V). */
  foundingCouncil?: FoundingCouncilCategory[];
  /** Profile is designed to evolve in place (no migration). */
  evolves?: boolean;
  /** Principle IV — publication gated only by consent. */
  consentStatus: ConsentStatus;
  /** PII like phone numbers shown only when explicitly consented. Never seed PII. */
  contactPublic?: boolean;
  socials?: Record<string, string>;
  quotes?: string[];
  note?: string;
}

// ── artwork ──────────────────────────────────────────────────────────────────
export interface Artwork extends Timestamps, Verifiable {
  slug: Slug;
  title: string;
  titleVariant?: string;
  artist: Slug; // -> Person
  chapter?: Slug;
  medium?: string; // default "Discarded items assemblage"
  materials: string[];
  dimensions?: string; // default "61cm x 61cm"
  year?: number; // default 2026
  statement?: string; // the artist's own words
  significance?: string;
  primaryMedia?: string;
  detailMedia?: string[];
  exhibitorRole?: "artist" | "facilitator";
}

// ── timeline ─────────────────────────────────────────────────────────────────
export type TimelinePhase =
  | "Preparation" | "Road Walk" | "Workshop" | "Creation" | "Installation"
  | "Opening" | "Exhibition" | "Panel" | "Performance" | "Certificates" | "Media";

export interface TimelineEvent extends Verifiable {
  order: number;
  phase: TimelinePhase;
  title: string;
  date: ISODate | null; // null = not specified in source; never guessed
  description: string;
  people?: Slug[];
  media?: string[];
  ref?: string;
  note?: string;
}

// ── panel & performance ──────────────────────────────────────────────────────
export interface Panel extends Verifiable {
  chapter: Slug;
  title: string;
  moderator: Slug;
  speakers: Slug[];
}

export type PerformerBilling = "lead" | "co_performer";

export interface Performance extends Verifiable {
  chapter: Slug;
  title: string;
  yorubaTitle?: string;
  translation?: string;
  type: string;
  subtitle?: string;
  description: string;
  lead: Slug;
  coPerformers: Slug[];
  curator: Slug;
  photoCredit: Slug;
  date?: ISODate;
  venue?: string;
}

// ── press ────────────────────────────────────────────────────────────────────
export interface PressItem extends Verifiable {
  outlet: string;
  title: string;
  url: string;
  topic?: string;
  publishedOn?: ISODate;
  excerpt?: string;
  /** Local snapshot to defeat link rot (preservation task). */
  snapshot?: string | null;
}

// ── founding council (Principle V) ───────────────────────────────────────────
export interface FoundingCouncilMember {
  person: Slug;
  categories: FoundingCouncilCategory[];
  citation: string;
  inductedOn?: ISODate;
  /** true for the Genesis cohort; this cohort is never removed. */
  isCharterMember?: boolean;
  sortOrder?: number;
}

export interface FoundingCouncil {
  chapter: Slug;
  charterCohort: boolean;
  members: FoundingCouncilMember[];
  pending?: Array<{ what: string } & Pending>;
}

// ── certificate (Principle III + VII) ────────────────────────────────────────
export type CertificateStatus = "draft" | "issued" | "revoked" | "reserved";

export interface Certificate extends Timestamps {
  /** Stable public id, e.g. "PB-ABJ-2026-001". Never changes. */
  publicId: string;
  /** Recipient — a person OR an organization. `null` only for a reserved slot. */
  person?: Slug | null;
  organization?: Slug | null;
  chapter: Slug;
  /** Honors contribution, not attendance. */
  roleAtIssue: string;
  artwork?: Slug | null;
  issuedOn?: ISODate;
  status: CertificateStatus;
  /** Off-chain verification today: sha256 of the canonical record. */
  verificationHash?: string;
  /** Filled only if/when a Soulbound token is minted later. Nullable by design. */
  soulboundRef?: string | null;
  pdfMedia?: string;
  /** QR encodes the permalink /certificates/{publicId}. */
  permalink?: string;
  note?: string;
}

/** The exact, ordered fields hashed for verification. Versioned so a 2026 hash
 *  still validates in 2050. The verify service hashes the canonical JSON of this. */
export interface CertificateClaimV1 {
  v: 1;
  publicId: string;
  subject: string;       // person or organization slug
  roleAtIssue: string;
  chapter: Slug;
  artwork?: string | null;
  issuedOn: ISODate;
}

export interface VerificationResult {
  publicId: string;
  hashValid: boolean;
  onChain: boolean;       // false until Blockchain Phase 3
  soulboundRef?: string | null;
}

// ── impact ───────────────────────────────────────────────────────────────────
export interface ImpactMetric extends Verifiable {
  chapter: Slug;
  metric: string; // "artists" | "artworks" | "waste_diverted_kg" | "press_mentions"
  value: number;
  unit?: string;
  asOf?: ISODate;
  source?: string;
}
