# 13 · Testing Strategy

Confidence to change software future generations inherit. Tests follow the **testing pyramid**, run in CI on every PR, and gate merges. Coverage targets are meaningful, not vanity.

## Layers
| Layer | Tool | Scope | Gate |
|-------|------|-------|------|
| **Static** | TypeScript (strict), ESLint, type-aware lint | types, no-`any`, import boundaries, no hardcoded values | must pass |
| **Unit** | Vitest | domain logic, services, value objects, registry minting, zod schemas | ≥ 90% on `packages/core` |
| **Integration** | Vitest + ephemeral Supabase | repositories vs real Postgres, **RLS policies**, triggers (registry immutability, audit, soft-delete) | required |
| **Contract** | OpenAPI + zod | API handlers match the published spec; generated client stays in sync | required |
| **E2E** | Playwright | critical user journeys, web + admin, against a Supabase branch | required on main |
| **Visual/a11y** | Playwright + axe / Storybook | component regressions, WCAG 2.2 AA, reduced-motion | required |
| **Perf** | Lighthouse CI | LCP/JS budgets on public pages | warn→block |
| **Load** (periodic) | k6 | read paths at target scale, pagination, replica behavior | scheduled |

## What we explicitly test (institution-grade invariants)
- **Registry IDs**: minted once, correct format, **immutable** (update attempt throws).
- **Nothing is deleted**: no delete endpoint/policy; archive→restore round-trips; archived rows hidden from public.
- **RLS**: each role sees exactly the [permission matrix](06-permission-matrix.md) — a `chapter_editor` of Lagos cannot read/write Abuja drafts; public cannot read drafts/PII/consent-pending.
- **Versioning/audit**: every mutation writes a `revision` + `audit_log` with correct before/after; restore-to-version works.
- **Consent gating**: `consent_status != granted` ⇒ never publicly published.
- **Certificate verification**: hash recomputation matches; tamper ⇒ invalid; reserved 15th-artist slot behaves.
- **Relationship engine**: `entity_links` rejects unknown relations / missing endpoints; graph traversal bounded.
- **Sanity↔Supabase**: `entityRef.registryId` resolves; broken refs surface as validation errors, not crashes.

## Test data & isolation
- **Factories/fixtures** in `packages/core/testing` build valid entities; the Genesis seed doubles as a realistic fixture.
- Each integration run gets an **isolated database** (Supabase branch or Docker), migrated fresh, torn down after — no shared mutable state.
- Deterministic: no real network; Sanity/Storage mocked at the adapter boundary; clock injected.

## Process
- **PR**: static → unit → integration → contract → build → e2e (preview) must be green to merge.
- **Coverage** reported per package; regressions block.
- **Flake policy**: quarantined + fixed, never ignored.
- **Migrations**: every migration has an applied+reverted test in CI before it can reach staging/prod.
- **Definition of Done** includes tests + docs; PR template links the architecture doc touched.

## Philosophy
Test **behavior and invariants**, not implementation. The repository interfaces make domain logic testable without a database; the integration layer proves the adapters and policies are real. Prioritize the tests that protect the irreplaceable: identity, preservation, access control, provenance.
