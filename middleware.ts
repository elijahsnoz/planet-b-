import { NextResponse, type NextRequest } from "next/server";

/**
 * CSRF defense for the admin area.
 *
 * Every Server Action is an HTTP POST to its own route. For a same-origin app
 * the most robust, can't-forget-it-on-a-new-form CSRF mitigation is to verify
 * that state-changing requests actually originate from this site: the Origin
 * (or Referer) host must equal the Host the request was sent to. Cross-site
 * forgery attempts carry a foreign Origin and are rejected here before they
 * ever reach an action — no per-form token plumbing required.
 *
 * Safe methods (GET/HEAD/OPTIONS) pass through untouched.
 */

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  // The host the browser believes it sent to (honors the proxy in production).
  const expectedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const originHost = hostOf(req.headers.get("origin")) ?? hostOf(req.headers.get("referer"));

  // No Origin/Referer at all on a mutating request → refuse rather than guess.
  if (!originHost || !expectedHost || originHost !== expectedHost) {
    return new NextResponse("Blocked: cross-origin request rejected.", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // Guard the admin console (login + panel). Public pages are read-only.
  matcher: ["/admin/:path*"],
};
