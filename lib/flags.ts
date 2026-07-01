/**
 * Feature flags.
 *
 * The Garden (the Contribution system) ships DARK. Every surface it adds — the
 * homepage ritual, the garden route, seed pages, the write endpoint — is gated by
 * `flags.garden`, which is OFF unless `PLANET_B_GARDEN` is explicitly set.
 *
 * Server-evaluated by design: it is read at call time from the environment (so it
 * is runtime-togglable, never build-inlined) and passed from Server Components down
 * to Client Components as a prop — no NEXT_PUBLIC_* leakage into the client bundle.
 * On the client `process.env.PLANET_B_GARDEN` is undefined, so it safely reports
 * `false`; the client never enables the feature on its own.
 */
function envFlag(name: string): boolean {
  const v = process.env[name];
  return v === "1" || v === "true" || v === "on";
}

export const flags = {
  /** The Garden — the anonymous contribution system. Off until deliberately enabled. */
  get garden(): boolean {
    return envFlag("PLANET_B_GARDEN");
  },
};
