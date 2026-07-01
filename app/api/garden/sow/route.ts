import { NextResponse } from "next/server";
import { flags } from "@/lib/flags";
import { checkRateLimit, registerFailure } from "@/lib/rate-limit";
import { ContributionValidationError, contributionInput } from "@domains/contribution";
import { contributionService } from "@platform/contribution/container";
import { resolveVisitor, VISITOR_COOKIE, visitorCookieOptions } from "@/lib/garden/visitor";

/**
 * HTTP write endpoint for The Garden. Same flow as the server action, exposed as a
 * plain route handler so the whole path (anonymous visitor → atomic contribution +
 * event) can be exercised over HTTP. Gated by flags.garden.
 */
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export async function POST(req: Request) {
  if (!flags.garden) return NextResponse.json({ ok: false, error: "The Garden is not open." }, { status: 404 });

  const { visitor, issue } = await resolveVisitor(readCookie(req, VISITOR_COOKIE));

  const key = `garden:contribute:${visitor.id}`;
  if (!checkRateLimit(key).allowed) {
    return NextResponse.json({ ok: false, error: "Please rest a moment." }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }
  const text = body.text;
  const parsed = contributionInput.safeParse({
    type: typeof body.type === "string" ? body.type : "dream",
    content: typeof text === "string" ? { text } : (typeof body.content === "object" && body.content ? body.content : {}),
    lang: typeof body.lang === "string" ? body.lang : undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  try {
    const c = await contributionService().contribute(visitor.id, parsed.data);
    registerFailure(key);
    const res = NextResponse.json(
      { ok: true, id: c.id, url: `/garden/${c.id}`, visitorId: c.authorVisitorId },
      { status: 201 },
    );
    if (issue) res.cookies.set(VISITOR_COOKIE, issue, visitorCookieOptions());
    return res;
  } catch (e) {
    if (e instanceof ContributionValidationError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Something went wrong." }, { status: 500 });
  }
}
