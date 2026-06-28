import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db, schema as t } from "@/db/client";
import { sessionSecret } from "@/lib/env";

const COOKIE = "pb_session";
const SESSION_DAYS = 7;

// Resolve the signing secret lazily + memoised, so importing this module during
// the production build (which sets NODE_ENV=production) doesn't trip the
// "secret required" guard before any request is ever served. It's enforced on
// first actual use at runtime instead.
let _secret: Uint8Array | undefined;
function secret(): Uint8Array {
  return (_secret ??= sessionSecret());
}

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string | null;
  permissions: Set<string>;
  roles: string[];
};

/** Verify credentials and start a session (sets the signed cookie). */
export async function login(email: string, password: string): Promise<boolean> {
  const user = db.select().from(t.users).where(eq(t.users.email, email.toLowerCase().trim())).get();
  if (!user || !user.isActive) return false;
  if (!bcrypt.compareSync(password, user.passwordHash)) return false;

  const sessionId = randomUUID();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  db.insert(t.sessions).values({ id: sessionId, userId: user.id, expiresAt: expires.toISOString() }).run();
  db.update(t.users).set({ lastLoginAt: new Date().toISOString() }).where(eq(t.users.id, user.id)).run();

  const jwt = await new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());

  cookies().set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
  return true;
}

export async function logout() {
  const token = cookies().get(COOKIE)?.value;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      if (payload.sid) db.delete(t.sessions).where(eq(t.sessions.id, String(payload.sid))).run();
    } catch {
      /* ignore */
    }
  }
  cookies().delete(COOKIE);
}

function loadPermissions(userId: string): { perms: Set<string>; roles: string[] } {
  const rows = db
    .select({ perm: t.permissions.key, role: t.roles.key })
    .from(t.userRoles)
    .innerJoin(t.roles, eq(t.roles.id, t.userRoles.roleId))
    .leftJoin(t.rolePermissions, eq(t.rolePermissions.roleId, t.userRoles.roleId))
    .leftJoin(t.permissions, eq(t.permissions.id, t.rolePermissions.permissionId))
    .where(eq(t.userRoles.userId, userId))
    .all();
  const perms = new Set<string>();
  const roles = new Set<string>();
  for (const r of rows) {
    if (r.perm) perms.add(r.perm);
    if (r.role) roles.add(r.role);
  }
  return { perms, roles: [...roles] };
}

/** Resolve the current user from the session cookie, or null. Read-only (RSC-safe). */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  let sid: string;
  try {
    const { payload } = await jwtVerify(token, secret());
    sid = String(payload.sid);
  } catch {
    return null;
  }
  const session = db
    .select()
    .from(t.sessions)
    .where(and(eq(t.sessions.id, sid), gt(t.sessions.expiresAt, new Date().toISOString())))
    .get();
  if (!session) return null;
  const user = db.select().from(t.users).where(eq(t.users.id, session.userId)).get();
  if (!user || !user.isActive) return null;
  const { perms, roles } = loadPermissions(user.id);
  return { id: user.id, email: user.email, displayName: user.displayName, permissions: perms, roles };
}

export function can(user: CurrentUser | null, permission: string): boolean {
  return !!user && user.permissions.has(permission);
}

/** Guard for admin pages: redirect to login if unauthenticated. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Guard for actions/pages needing a specific permission. */
export async function requirePermission(permission: string): Promise<CurrentUser> {
  const user = await requireUser();
  if (!can(user, permission)) throw new Error(`Forbidden: missing permission '${permission}'`);
  return user;
}
