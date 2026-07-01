"use server";

import { redirect } from "next/navigation";
import { flags } from "@/lib/flags";
import { checkRateLimit, registerFailure } from "@/lib/rate-limit";
import { ContributionValidationError, contributionInput } from "@domains/contribution";
import { contributionService } from "@platform/contribution/container";
import { getOrCreateVisitor } from "./visitor";

/**
 * The write broker (transport). Ritual-agnostic; gated by flags.garden; identity
 * follows contribution (resolves an anonymous visitor, never requires auth);
 * rate-limited per visitor. Composes the use-case via the container — never imports
 * Supabase.
 *
 * NOTE: the interim per-visitor limiter is the process-local login limiter reused;
 * a distributed limiter (Postgres/Redis) is required before enabling in production.
 */
export type ContributeResult = { ok: true; id: string } | { ok: false; error: string };

export async function contributeAction(formData: FormData): Promise<ContributeResult> {
  if (!flags.garden) return { ok: false, error: "The Garden is not open yet." };
  const visitor = await getOrCreateVisitor();
  const key = `garden:contribute:${visitor.id}`;
  if (!checkRateLimit(key).allowed) return { ok: false, error: "Please rest a moment before leaving another." };

  const text = formData.get("text");
  const parsed = contributionInput.safeParse({
    type: String(formData.get("type") ?? "dream"),
    content: typeof text === "string" ? { text } : {},
    lang: (formData.get("lang") as string) || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "That can’t be saved yet." };

  try {
    const contribution = await contributionService().contribute(visitor.id, parsed.data);
    registerFailure(key);
    return { ok: true, id: contribution.id };
  } catch (e) {
    if (e instanceof ContributionValidationError) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Progressive-enhancement form action: works with JavaScript disabled. On success
 * it redirects to the contribution's permanent URL; on failure, back to the ritual
 * with a gentle message. (Invariant 6 — the technology disappears.)
 */
export async function sowAction(formData: FormData): Promise<void> {
  const result = await contributeAction(formData);
  if (result.ok) redirect(`/garden/${result.id}`);
  redirect(`/garden?error=${encodeURIComponent(result.error)}`);
}
