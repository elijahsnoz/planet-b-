import "server-only";
import { cookies } from "next/headers";
import type { Visitor } from "@domains/contribution";
import { visitorService } from "@platform/contribution/container";
import { hashToken, newRawToken, signToken, verifyToken } from "./anon-token";

/**
 * Anonymous identity resolution. Depends on the composition root and the domain —
 * never on Supabase directly. Identity follows contribution: no auth, no Passport.
 */
export const VISITOR_COOKIE = "pb_visitor";
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Transport-agnostic core: resolve the visitor from a signed cookie value, issuing
 * a fresh signed token when absent or tampered. Returns the visitor and — only when
 * a new token was minted — the cookie value the transport should set. This keeps
 * cookie I/O out of the domain and works from a Route Handler or a Server Action.
 */
export async function resolveVisitor(
  signedCookie: string | undefined,
): Promise<{ visitor: Visitor; issue?: string }> {
  let raw = signedCookie ? verifyToken(signedCookie) : null;
  let issue: string | undefined;
  if (!raw) {
    raw = newRawToken();
    issue = signToken(raw);
  }
  const visitor = await visitorService().identify(hashToken(raw));
  return { visitor, issue };
}

export function visitorCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  };
}

/**
 * Server Action / RSC convenience using next/headers. MUST be called where cookies
 * may be set (a Server Action or Route Handler).
 */
export async function getOrCreateVisitor(): Promise<Visitor> {
  const jar = cookies();
  const { visitor, issue } = await resolveVisitor(jar.get(VISITOR_COOKIE)?.value);
  if (issue) jar.set(VISITOR_COOKIE, issue, visitorCookieOptions());
  return visitor;
}
