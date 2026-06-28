"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { login } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { checkRateLimit, registerFailure, resetRateLimit } from "@/lib/rate-limit";

export type LoginState = { error?: string };

/** Best-effort client IP from common proxy headers (falls back to a constant). */
function clientIp(): string {
  const h = headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip") ?? "unknown";
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const key = `login:${clientIp()}`;
  const limit = checkRateLimit(key);
  if (!limit.allowed) {
    const mins = Math.ceil(limit.retryAfterSec / 60);
    return { error: `Too many attempts. Try again in about ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  const ok = await login(parsed.data.email, parsed.data.password);
  if (!ok) {
    const after = registerFailure(key);
    if (!after.allowed) {
      const mins = Math.ceil(after.retryAfterSec / 60);
      return { error: `Too many attempts. Account locked for about ${mins} minute${mins === 1 ? "" : "s"}.` };
    }
    return { error: "Invalid email or password." };
  }

  resetRateLimit(key);
  redirect("/admin");
}
