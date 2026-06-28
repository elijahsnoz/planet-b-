/**
 * Planet B — Sanity schema groundwork (framework-agnostic).
 * Plain objects mirroring docs/10. When Sanity is installed, wrap each with
 * defineType() and register in sanity.config.ts. No `sanity` import on purpose
 * (keeps the Next build clean pre-install). See sanity/README.md.
 */

export const chapter = {
  name: "chapter",
  title: "Chapter",
  type: "document",
  fields: [
    { name: "name", title: "Name", type: "string" },
    { name: "slug", title: "Slug", type: "slug", options: { source: "name" } },
    { name: "city", title: "City", type: "string" },
    { name: "country", title: "Country", type: "string" },
    { name: "status", title: "Status", type: "string", options: { list: ["genesis", "active", "planned"] } },
    { name: "isGenesis", title: "Is Genesis Chapter (sacred — never delete)", type: "boolean" },
    { name: "theme", title: "Theme", type: "string" },
    { name: "openedOn", title: "Opened on", type: "date" },
    { name: "venue", title: "Venue", type: "string" },
    { name: "summary", title: "Summary", type: "array", of: [{ type: "block" }] },
    { name: "heroMedia", title: "Hero media", type: "reference", to: [{ type: "mediaAsset" }] },
  ],
};

export const person = {
  name: "person",
  title: "Person",
  type: "document",
  fields: [
    { name: "fullName", title: "Full name", type: "string" },
    { name: "slug", title: "Slug", type: "slug", options: { source: "fullName" } },
    { name: "primaryRole", title: "Primary role", type: "string" },
    { name: "roles", title: "Roles (open-ended; profiles evolve)", type: "array", of: [{ type: "string" }] },
    { name: "shortBio", title: "Short bio", type: "text" },
    { name: "bio", title: "Biography", type: "array", of: [{ type: "block" }] },
    { name: "portrait", title: "Portrait", type: "reference", to: [{ type: "mediaAsset" }] },
    {
      name: "consentStatus",
      title: "Consent status (must be 'granted' to publish)",
      type: "string",
      options: { list: ["granted", "pending", "withheld"] },
    },
    { name: "foundingCouncil", title: "Founding Council categories", type: "array", of: [{ type: "string" }] },
    { name: "quotes", title: "Quotes", type: "array", of: [{ type: "text" }] },
  ],
};

export const artwork = {
  name: "artwork",
  title: "Artwork",
  type: "document",
  fields: [
    { name: "title", title: "Title", type: "string" },
    { name: "slug", title: "Slug", type: "slug", options: { source: "title" } },
    { name: "artist", title: "Artist", type: "reference", to: [{ type: "person" }] },
    { name: "chapter", title: "Chapter", type: "reference", to: [{ type: "chapter" }] },
    { name: "medium", title: "Medium", type: "string" },
    { name: "materials", title: "Reclaimed materials", type: "array", of: [{ type: "string" }] },
    { name: "dimensions", title: "Dimensions", type: "string" },
    { name: "year", title: "Year", type: "number" },
    { name: "statement", title: "Artist statement", type: "array", of: [{ type: "block" }] },
    { name: "plate", title: "Plate", type: "reference", to: [{ type: "mediaAsset" }] },
  ],
};

export const timelineEvent = {
  name: "timelineEvent",
  title: "Timeline event",
  type: "document",
  fields: [
    { name: "chapter", title: "Chapter", type: "reference", to: [{ type: "chapter" }] },
    { name: "order", title: "Order", type: "number" },
    { name: "phase", title: "Phase", type: "string" },
    { name: "title", title: "Title", type: "string" },
    { name: "date", title: "Date (leave empty if unverified — never guess)", type: "date" },
    { name: "description", title: "Description", type: "text" },
    { name: "people", title: "People", type: "array", of: [{ type: "reference", to: [{ type: "person" }] }] },
  ],
};

export const certificate = {
  name: "certificate",
  title: "Certificate",
  type: "document",
  fields: [
    { name: "publicId", title: "Public ID (PB-ABJ-2026-NNN)", type: "string" },
    { name: "person", title: "Recipient (person)", type: "reference", to: [{ type: "person" }] },
    { name: "chapter", title: "Chapter", type: "reference", to: [{ type: "chapter" }] },
    { name: "roleAtIssue", title: "Role at issue (contribution, not attendance)", type: "string" },
    { name: "artwork", title: "Artwork (if artist)", type: "reference", to: [{ type: "artwork" }] },
    { name: "issuedOn", title: "Issued on", type: "date" },
    { name: "status", title: "Status", type: "string", options: { list: ["draft", "issued", "revoked", "reserved"] } },
    { name: "verificationHash", title: "Verification hash (off-chain)", type: "string" },
    { name: "soulboundRef", title: "Soulbound ref (on-chain, later)", type: "string" },
  ],
};

export const mediaAsset = {
  name: "mediaAsset",
  title: "Media asset",
  type: "document",
  fields: [
    { name: "file", title: "File", type: "image" },
    { name: "alt", title: "Alt text (required)", type: "string" },
    { name: "caption", title: "Caption", type: "string" },
    { name: "credit", title: "Credit (required)", type: "string" },
    { name: "source", title: "Source (required)", type: "string" },
    { name: "license", title: "License", type: "string" },
  ],
};

export const schemaTypes = [chapter, person, artwork, timelineEvent, certificate, mediaAsset];
