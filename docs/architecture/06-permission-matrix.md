# 06 · Permission Matrix (RBAC)

Granular, role-based, **deny-by-default**. Permissions are `resource.action` strings; roles are bundles of permissions; users get roles, optionally **scoped to a chapter**. Enforced twice: app RBAC resolver (UX) + Postgres RLS (security) — see [03](03-supabase-schema.md) `has_perm()`.

## Roles (rank high → low)
| Role | Key | Scope | Purpose |
|------|-----|-------|---------|
| Super Admin | `super_admin` | global | break-glass; manages platform admins, settings, system |
| Platform Administrator | `platform_admin` | global | runs the platform; all content + users (not system internals) |
| Archivist | `archivist` | global | preservation authority: media masters, provenance, restore, versions |
| Content Editor | `content_editor` | global | editorial (Sanity) publish: homepage, stories, blog, press, nav |
| Chapter Director | `chapter_director` | chapter | full control of *their* chapter's records |
| Chapter Editor | `chapter_editor` | chapter | create/edit drafts in their chapter (no publish) |
| Researcher | `researcher` | global (read+) | research/education authoring; read all published + draft research |
| Media Manager | `media_manager` | global | DAM: upload, tag, derivatives, licensing |
| Artist | `artist` | self | manage *own* profile/bio/links (consent-gated) |
| Partner Organization | `partner_org` | org | manage *own* org profile + linked assets |
| Public | `public` | n/a | read published, non-archived content; verify certificates |

## Actions
`read · create · update · publish · archive · restore · bulk · history(view) · export · issue(cert) · revoke(cert) · upload · manage(users/roles/settings)`

## Matrix (✓ = allowed; ▲ = own/scoped only; — = denied)

| Resource \ Role | Super | Platform | Archivist | Content Ed. | Ch. Director | Ch. Editor | Researcher | Media Mgr | Artist | Partner | Public |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ▲ | ▲ | ✓ | ✓ | ▲ | ▲ | — |
| Chapters | ✓ | ✓ | ✓r | ✓r | ▲ | ▲ draft | r | r | r | r | r(pub) |
| Artists | ✓ | ✓ | ✓ | r | ▲ | ▲ draft | r | r | ▲ self | r | r(pub) |
| Artworks | ✓ | ✓ | ✓ | r | ▲ | ▲ draft | r | r | ▲ own | r | r(pub) |
| Organizations | ✓ | ✓ | ✓ | r | ▲ | r | r | r | — | ▲ own | r(pub) |
| Certificates | ✓ | ✓ issue/revoke | ✓ issue | — | ▲ issue | — | r | — | r own | r own | verify only |
| Media Library | ✓ | ✓ | ✓ | r | ▲ | ▲ upload | r | ✓ | ▲ own | ▲ own | r(pub) |
| Research | ✓ | ✓ | ✓ | ✓ | r | r | ✓ author/publish | r | — | — | r(pub) |
| Stories/Blog/Press | ✓ | ✓ | r | ✓ author/publish | ▲ propose | ▲ propose | r | r | — | — | r(pub) |
| Impact | ✓ | ✓ | ✓ | r | ▲ | r | r | — | — | r | r(pub) |
| Timeline | ✓ | ✓ | ✓ | r | ▲ | ▲ draft | r | r | — | — | r(pub) |
| Users & Roles | ✓ | ✓ | — | — | ▲ invite ch. | — | — | — | — | — | — |
| Settings | ✓ | ✓ | — | ▲ editorial | — | — | — | — | — | — | — |
| System Logs / Audit | ✓ | ✓ view | ✓ view | — | ▲ own ch. | — | — | — | — | — | — |

`r` = read (incl. drafts where shown); `r(pub)` = read published only. **No role has hard-delete** anywhere — archive + restore only (Principle VIII).

## Scoping rule
Chapter-scoped roles (`chapter_director`, `chapter_editor`) carry a `chapter_id` in `user_roles`. `has_perm('artwork.update', chapter_id)` returns true only when the row's chapter matches. A director of Lagos cannot touch Abuja. Global roles pass any chapter check.

## Sensitive actions (extra controls, [14](14-security-review.md))
`certificate.issue/revoke`, `user.manage`, `settings.manage`, `*.restore`, `media.master.delete-attempt` → require **MFA**, are always **audit-logged**, and (for issue/revoke + role grants) support **two-person approval** as a configurable policy.

## Seeding
Roles + permissions are seeded via migration (idempotent). The founder is `super_admin`. New chapters auto-provision a `chapter_director` invite slot.
