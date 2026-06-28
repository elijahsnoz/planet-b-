"use client";

import { useFormState, useFormStatus } from "react-dom";
import { PlanetBMark } from "@/components/PlanetBMark";
import { loginAction, type LoginState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-sm bg-accent px-4 py-3 text-sm text-paper transition-opacity disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export default function LoginPage() {
  const [state, action] = useFormState<LoginState, FormData>(loginAction, {});
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5" data-theme="ink">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center text-paper">
          <PlanetBMark size={56} className="text-accent" />
          <h1 className="mt-4 font-display text-2xl">Planet B Admin</h1>
          <p className="mt-1 text-sm text-text-muted">The collections management console.</p>
        </div>
        <form action={action} className="space-y-4 rounded-sm border border-border bg-bg p-6 text-text">
          <label className="block text-sm">
            <span className="text-text-muted">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
              className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm">
            <span className="text-text-muted">Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-sm border border-border bg-transparent px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          {state.error && <p className="text-sm text-accent">{state.error}</p>}
          <SubmitButton />
        </form>
      </div>
    </div>
  );
}
