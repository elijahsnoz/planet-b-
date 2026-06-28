# `src/domains` — the language of the institution

Planet B is organized around **business domains**, not the database (ADR-0009,
[docs/phase-2/13-domain-architecture.md](../../docs/phase-2/13-domain-architecture.md)).
Each domain owns its entities, services, repositories (an *implementation
detail*), validation, business rules, and API handlers, and publishes a single
public contract via `index.ts`. Nothing imports another domain's internals.

## The 12 domains

| Domain | Responsibility | Status |
|--------|----------------|--------|
| **registry** | Mint permanent `PB-<KIND>-<NNNNNN>` identifiers | ✅ reference implementation |
| passport | Lifelong creative identity (`PB-ID-…`) | planned (Phase 2E) |
| certificate | Contribution certificates + Genesis Collection | planned (Phase 2E) |
| verification | Off-chain hash verify + claim/OCR workflow | planned (Phase 2E) |
| artist | People/profiles (museum records) | planned (Phase 2D) |
| artwork | Works, materials, provenance | planned (Phase 2D) |
| story | First-class connective narratives | planned (Phase 2H) |
| chapter | Chapters incl. the sacred Genesis Chapter | planned (Phase 2D) |
| organization | Partners, embassies, galleries | planned (Phase 2D) |
| media | Digital Asset Management | planned (Phase 2D) |
| blockchain | Trust-layer wiring over the platform abstraction | planned (Phase 2E) |
| impact | Verified environmental impact metrics | planned (Phase 2E) |

## Standard domain layout (see `registry/`)

```
<domain>/
  <domain>.types.ts            # entities / value objects (optional if in @shared)
  <domain>.repository.ts       # storage contract (interface) — internal
  <domain>.repository.sqlite.ts# driver impl — internal (ADR-0001)
  <domain>.service.ts          # business rules / use-cases
  <domain>.validation.ts       # zod schemas at the boundary
  <domain>.api.ts              # server-action / route-handler adapters
  ui/                          # components, where appropriate
  index.ts                     # the ONLY public surface
```

Dependencies point inward only: `@domains/*` → `@platform/*` (interfaces) →
`@shared/*`. The `@shared` kernel depends on nothing. The independent
`@intelligence` layer is consulted via its interface, never imported into a
domain.
