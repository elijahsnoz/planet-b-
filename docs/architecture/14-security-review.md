# 14 · Security Review

Planet B holds the identities of real people and the trust of embassies, museums, and governments. Security is a first-class requirement, reviewed against **OWASP Top 10** and institutional norms. Posture: **least privilege, deny by default, defence in depth, audit everything.**

## Identity & access
- **Auth** via Supabase Auth (email + OAuth/SSO for institutions later). Sessions = short-lived JWT + refresh; secure, http-only cookies.
- **MFA required** for all staff roles; enforced for sensitive actions (cert issue/revoke, user/role changes, settings, restore).
- **RBAC + RLS** (two-layer, [03](03-supabase-schema.md)/[06](06-permission-matrix.md)). The **service-role key never reaches the browser** — server-only. The browser uses the anon key bound by RLS.
- **Two-person approval** (configurable) for certificate issuance/revocation and role grants.
- Account lifecycle: invite-only staff, deactivation (never deletion → audit trail), session revocation.

## Data protection
- TLS everywhere; encryption at rest (DB, Storage, backups).
- **PII minimization**: artist phone numbers and similar are stored only with consent, `contact_public=false` by default, and never in the public API or seed data (already enforced in Phase 0).
- **Consent is enforced, not advisory**: `consent_status` gates publication at the RLS layer.
- Signed, short-lived URLs for private/licensed media; no public bucket for masters/certificates.
- Secrets in managed vaults (Vercel/Supabase); rotation policy; no secrets in git (CI secret-scan).

## Application security (OWASP-aligned)
| Risk | Mitigation |
|------|-----------|
| Broken access control | RLS + RBAC, deny-by-default, tested per role ([13](13-testing-strategy.md)) |
| Injection | parameterized queries only; zod validation at every boundary; no string-built SQL |
| Cryptographic failures | TLS, at-rest encryption, vetted hashing for verification; no homemade crypto |
| Insecure design | this architecture set; threat-model reviews per module |
| Security misconfig | hardened defaults, infra-as-config, least-priv DB roles, CSP/HSTS headers |
| Vulnerable dependencies | Dependabot/renovate + `npm audit` + SCA in CI; pinned versions |
| Auth failures | Supabase Auth, MFA, rate-limited login, lockout, secure sessions |
| Data integrity failures | signed webhooks (HMAC), idempotency keys, audit logs, immutable backups |
| Logging/monitoring gaps | full `audit_logs`, APM/error tracking, alerting on anomalies |
| SSRF | allow-listed outbound; media fetch sandboxed in edge functions |
- **Input validation** centralized (zod) → also blocks XSS payloads; output encoded by React; rich text sanitized.
- **CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy** set at the edge.
- **Rate limiting** on API + auth + verify; bot/abuse protection on public endpoints.
- **CSRF**: same-site cookies + token on state-changing form posts; APIs use bearer tokens.
- **File uploads**: type/size validation, content sniffing, AV scan hook, store outside web root, never execute.

## Auditability & compliance
- Every privileged action and data change → `audit_logs` (actor, action, before/after, IP, UA). Immutable, queryable, exportable.
- Data-subject considerations (GDPR-style): consent records, export, and (consent-respecting) suppression — *suppression hides/anonymizes the public projection; the historical record is preserved per Principle VIII, with access restricted*. Reconcile the "permanent archive" intent with privacy law per jurisdiction and partner agreements before launch — **flagged as a required legal review item**.
- Partner/embassy data agreements honored; licenses tracked per media asset.

## Operational security
- Environment isolation (dev/preview/staging/prod); prod access least-privilege + audited.
- Migrations reviewed; no manual prod DB access for routine work.
- Backups encrypted + object-locked ([12](12-backup-and-dr.md)); restore drills.
- Incident response runbook: detect → contain → eradicate → recover → post-mortem; breach-notification path defined.

## Pre-launch checklist
- [ ] RLS policy tests pass for all roles · [ ] MFA enforced for staff · [ ] secrets scanned, none in repo · [ ] CSP/security headers verified · [ ] dependency scan clean · [ ] rate limits live · [ ] pen-test / external review · [ ] privacy/legal review of permanent-retention vs data-subject rights · [ ] backup restore drill passed.
