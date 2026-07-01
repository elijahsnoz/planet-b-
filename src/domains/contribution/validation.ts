import { z } from "zod";

/**
 * The contribution input contract at the boundary — ritual-agnostic.
 *
 * The presentation ritual ("sow a dream") maps onto this generic shape. Content is
 * validated per-type: a new contribution form registers a validator here (and a
 * content_schema row), it never changes this contract.
 */
export const contributionInput = z.object({
  type: z.string().min(1).max(64),
  content: z.record(z.unknown()),
  lang: z.string().max(16).optional(),
});
export type ContributionInput = z.infer<typeof contributionInput>;

/** V1's single type. A dream is one breath — short, unpolished, never required to be perfect. */
export const dreamContent = z
  .object({
    text: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z
        .string()
        .min(1, "A dream can’t be empty.")
        .max(240, "Keep it to a breath — 240 characters."),
    ),
  })
  .strict();

/**
 * Per-type content validators. The engine looks up the validator by `type`; an
 * unregistered type is rejected. Add a form by adding a row here — nothing else.
 */
export const contentValidators: Record<string, z.ZodTypeAny> = {
  dream: dreamContent,
};

/** Extract the canonical searchable text for a contribution (drives FTS + embeddings). */
export function textProjectionFor(type: string, content: Record<string, unknown>): string | null {
  if (type === "dream" && typeof content.text === "string") return content.text.trim();
  // Future types project their own searchable text here.
  const maybeText = content.text;
  return typeof maybeText === "string" ? maybeText.trim() : null;
}
