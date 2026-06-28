"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const ok = await login(email, password);
  if (!ok) return { error: "Invalid email or password." };
  redirect("/admin");
}
