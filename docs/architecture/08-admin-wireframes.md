# 08 · Admin Console — Wireframes

A **museum collections-management** experience, not a generic CMS. The admin is a Next.js app (route group `app/(admin)/admin/*`, or a separate workspace app sharing the `core`/`features` packages — [10](10-folder-architecture.md)). Every module shares one **resource shell** so behavior is consistent and maintainable.

## Global shell
```
┌──────────────────────────────────────────────────────────────────────┐
│ ◐ Planet B Admin     ⌘K search registry/anything     [chapter ▾] [you▾]│
├───────────┬──────────────────────────────────────────────────────────┤
│ Dashboard │                                                            │
│ Genesis ★ │   ░░░  module content (list / detail / editor)  ░░░        │
│ Chapters  │                                                            │
│ Artists   │                                                            │
│ Artworks  │                                                            │
│ Orgs      │                                                            │
│ Media     │                                                            │
│ Certs     │                                                            │
│ Research  │                                                            │
│ Stories   │                                                            │
│ Press     │                                                            │
│ Impact    │                                                            │
│ Timeline  │                                                            │
│ Users     │   (sidebar items hidden if no permission — RBAC-driven)    │
│ Settings  │                                                            │
│ Logs      │                                                            │
└───────────┴──────────────────────────────────────────────────────────┘
```
- **Genesis ★** is pinned and visually protected (cannot be deleted/replaced — Principle II).
- The sidebar renders only modules the user can access ([06](06-permission-matrix.md)).
- Global **⌘K** searches by Registry ID, name, or relation.

## Module list view (the shared "collection" screen)
```
Artworks                                   [+ New artwork]  [Bulk ▾]  [Export ▾]
Filters: [chapter ▾] [status ▾] [material ▾] [verified ▾]   Search: [_________]
┌─┬───────────────┬───────────────┬──────────┬─────────┬──────────┬──────────┐
│☐│ PB-ARTWORK-…  │ Title         │ Artist   │ Chapter │ Status   │ Updated  │
├─┼───────────────┼───────────────┼──────────┼─────────┼──────────┼──────────┤
│☐│ PB-ARTWORK-002│ The Watchful… │ E. Snoz  │ Abuja26 │ ● Publ.  │ 2d ago   │
│☐│ PB-ARTWORK-015│ —reserved—    │ —        │ Abuja26 │ ◌ Resv.  │ —        │
└─┴───────────────┴───────────────┴──────────┴─────────┴──────────┴──────────┘
Selected: 3   [Publish] [Archive] [Add to story] [Tag] [Assign chapter]      ◀ 1 2 3 ▶
```
Every module supports: **Create · Read · Update · Archive · Restore · Search · Filter · Bulk actions · Version history · Export**. Archived rows are reachable via a `status: archived` filter and a "Restore" action — never gone.

## Module detail / editor (the shared "record" screen)
```
← Artworks            The Watchful Eye   PB-ARTWORK-000002   ● Published
[ Details ][ Media ][ Relationships ][ Story ][ Provenance ][ History ][ Settings ]
┌────────────────────────────────────────────────────────────────────────┐
│ DETAILS tab                                                              │
│  Title*      [The Watchful Eye            ]   Year [2026]                │
│  Artist*     [⌕ PB-ARTIST-000001 · E. Snoz]                             │
│  Medium      [Discarded items assemblage  ]   Dimensions [61×61cm]      │
│  Materials   [plastics ×][electronics ×][watch ×] (+ add)               │
│  Statement   [ rich text … ]                                            │
│  Consent     (granted ▾)   Verified (✓)                                 │
│                                                                         │
│  [Save draft]  [Submit for review]  [Publish]      Last saved 12:04     │
└────────────────────────────────────────────────────────────────────────┘
```
- **Relationships tab** = visual editor over `entity_links` ([07](07-registry-and-relationships.md)): add/remove typed connections (depicts, featured_in, responds_to…), see the neighborhood graph.
- **Media tab** = attach DAM assets ([05](05-storage-strategy.md)), set primary plate, alt/credit.
- **Provenance tab** = certificate(s), verification hash, future on-chain ref ([14 cert](../14-certificate-system.md), [15](15-ai-and-blockchain-readiness.md)).
- **History tab** = `revisions` timeline with diff + **restore to version**; `audit_logs` for who/when.
- **Settings tab** = slug (locks after publish), archive/restore, danger zone (archive only).

## Dashboard
```
Welcome back.                                   Chapter: All ▾
[ Artists 29 ][ Artworks 16 ][ Certificates 30 (29 draft) ][ Media 22 ]
Pending review (4)   ·   Recently edited   ·   Awaiting consent (28)
Impact snapshot: waste diverted —  ·  press mentions 3  ·  reach —
Audit feed: "E. Snoz published PB-ARTWORK-002 · 2h"
Preservation: ✓ fixity check passed (22/22 masters) · last backup 03:00
```

## Specialized surfaces
- **Media Library** — grid DAM browser with facet filters (kind, license, tags, chapter), bulk tagging, derivative status, upload dropzone.
- **Certificates** — issue (single/batch), preview the seal, verification status, revoke (two-person + MFA), reserved-slot indicator for the 15th artist.
- **Users & Roles** — invite, assign role (+ chapter scope), see effective permissions, deactivate; never delete (audit).
- **System Logs** — searchable `audit_logs`, filter by actor/entity/action, export.
- **Settings** — editorial settings deep-link to Sanity Studio for nav/homepage/SEO; structured settings here.

## UX standards
Keyboard-first, ⌘K everywhere, optimistic saves with autosave drafts, inline validation (zod messages), empty/loading/error states designed, full a11y (WCAG 2.2 AA), responsive down to a curator's tablet on a gallery floor.
