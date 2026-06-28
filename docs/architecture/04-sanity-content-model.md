# 04 · Sanity Content Model (editorial layer)

Sanity owns **narrative, marketing, navigation, and SEO** — the *voice* of the institution. It references structured entities by **Registry ID** only ([07](07-registry-and-relationships.md)); it never duplicates them. **Sanity is not a database.**

## Document categories

### Singletons (one document each — the editable chrome)
The brief's requirement that *navigation, footer, homepage, hero, mission* be backend-editable is met here:
- `siteSettings` — brand, default SEO, social handles, contact, logo refs.
- `navigation` — primary nav + mega-menu structure (ordered items → internal route or Registry ID).
- `footer` — footer columns/links.
- `homePage` — ordered **section builder** (hero, manifesto pull-quote, featured founders, featured artworks, impact band, stories, CTA). Each section is a typed block; editors reorder/add/remove.
- `manifesto` / `originStory` — long-form portable text.
- `seoDefaults` — titles, descriptions, OG image, robots.

### Collections (many documents)
- `story` — featured narratives ("Featured Stories"); references artists/artworks/chapters by Registry ID.
- `blogPost` — journal.
- `pressItem` — coverage (mirrors structured press where useful; editorial framing here).
- `researchArticle` — research/educational long-form, with citations.
- `educationalResource` — Learning Hub units.
- `page` — generic editorial landing pages (campaigns, partner microsites).

### Reusable objects (embedded, not documents)
- `seo` (per-document overrides), `cta`, `mediaRef` (points to a Supabase media `registry_id`), `entityRef` (typed Registry-ID reference + cached label), `portableTextBlock` (with custom marks: pull-quote, citation, artwork-embed-by-registry-id).

## The cross-link object (the only bridge to Supabase)
```ts
// objects/entityRef.ts  — links editorial content to structured entities
{
  name: 'entityRef', title: 'Linked record', type: 'object',
  fields: [
    { name: 'registryId', type: 'string', title: 'Registry ID (e.g. PB-ARTIST-000001)',
      validation: Rule => Rule.regex(/^PB-[A-Z]+-\d{6,}$/).required() },
    { name: 'kind', type: 'string', options: { list: ['artist','artwork','chapter','organization','event','media'] } },
    { name: 'cachedLabel', type: 'string', readOnly: true,  // synced for editor readability only
      description: 'Display cache; source of truth is Supabase' }
  ]
}
```
At render time the service layer resolves `registryId` → live entity from Supabase. The cache is for the editor's eyes, never authoritative.

## Homepage section-builder (so the homepage is fully backend-driven)
```ts
// homePage.sections[] is an array of these block types:
heroBlock        { headline, subline, backgroundMediaRef, ctas[] }
manifestoBlock   { quote, attribution }
featuredPeople   { title, entityRefs[] (artists) | mode: 'auto-founders' }
featuredArtworks { title, entityRefs[] | mode: 'auto-latest' }
impactBand       { title, metrics: source from Supabase impact_metrics }
storiesBlock     { title, stories[] }
ctaBlock         { heading, body, cta }
```
"auto-" modes let editors pin *or* delegate selection to the data layer — content-driven without manual upkeep at scale.

## Editorial governance (maps to Principle VIII)
- **Draft → in review → published** workflow (Sanity document actions + a `workflow` field; or Sanity's native drafts + a review step).
- **Versioning on**; revision history retained.
- **Validation:** required `seo`, required `alt` on images, Registry-ID format check, slug lock after publish.
- **Roles in Studio** (mirror [06](06-permission-matrix.md)): Editor (draft), Content Editor (publish editorial), Researcher (research/education only), Platform Admin (all). Sanity roles are coarse; fine-grained gating is enforced where Sanity content is *consumed* and in the admin.

## What Sanity must NOT hold
Artist/artwork/chapter records, certificates, identities, relationships, permissions, impact numbers (source of truth), media binaries. Those are Supabase/Storage. Sanity may *reference and describe* them.
