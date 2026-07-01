"use server";

import { flags } from "@/lib/flags";
import { checkRateLimit, registerFailure } from "@/lib/rate-limit";
import { ContributionValidationError, contributionInput } from "@domains/contribution";
import { contributionService } from "@platform/contribution/container";
import { getOrCreateVisitor } from "./visitor";

/**
 * The write broker (transport). Ritual-agnostic: it accepts a generic contribution,
 * so the presentation ritual maps its field names onto {type, content}. Gated by
 * flags.garden; identity follows contribution (it resolves an anonymous visitor,
 * never requires auth); rate-limited per visitor.
 *
 * The wiring order honours the Dependency rule: this app-layer module composes the
 * use-case via the container; it never imports Supabase.
 *
 * Not called by any UI yet — the Garden stays dark until the flag is set.
 */
export type ContributeResult = { ok: true; id: string } | { ok: false; error: string };

export async function contributeAction(formData: FormData): Promise<ContributeResult> {
  if (!flags.garden) return { ok: false, error: "The Garden is not open yet." };

  const visitor = await getOrCreateVisitor();

  // Interim per-visitor cap reusing the in-memory limiter. NOTE: process-local; a
  // distributed limiter (Postgres/Redis) is required before enabling in production.
  const key = `garden:contribute:${visitor.id}`;
  if (!checkRateLimit(key).allowed) {
    return { ok: false, error: "Please rest a moment before leaving another." };
  }

  const text = formData.get("text");
  const parsed = contributionInput.safeParse({
    type: String(formData.get("type") ?? "dream"),
    content: typeof text === "string" ? { text } : {},
    lang: (formData.get("lang") as string) || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "That can’t be saved yet." };
  }

  try {
    const contribution = await contributionService().contribute(visitor.id, parsed.data);
    registerFailure(key); // each contribution consumes one unit of the visitor's window budget
    return { ok: true, id: contribution.id };
  } catch (e) {
    if (e instanceof ContributionValidationError) return { ok: false, error: e.message };
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
