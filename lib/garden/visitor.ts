import "server-only";
import { cookies } from "next/headers";
import type { Visitor } from "@domains/contribution";
import { visitorService } from "@platform/contribution/container";
import { hashToken, newRawToken, signToken, verifyToken } from "./anon-token";

/**
 * Transport binding for anonymous identity. Reads (or issues) the durable signed
 * cookie, then asks the domain use-case to resolve the visitor. It depends on the
 * composition root and the domain — never on Supabase directly.
 *
 * MUST be called from a Route Handler or Server Action (it may set a cookie).
 * Identity follows contribution: this involves no auth and no Passport.
 */
const COOKIE = "pb_visitor";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function getOrCreateVisitor(): Promise<Visitor> {
  const jar = cookies();
  const present = jar.get(COOKIE)?.value;
  let raw = present ? verifyToken(present) : null;

  if (!raw) {
    raw = newRawToken();
    jar.set(COOKIE, signToken(raw), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });
  }

  return visitorService().identify(hashToken(raw));
}
