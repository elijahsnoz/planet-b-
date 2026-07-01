import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The ONE place the Supabase SDK is imported.
 *
 * Everything else — the domain, the application, the transport — depends only on
 * repository interfaces. This module is the outermost infrastructure edge. Replace
 * Supabase in five years and only this folder changes; no domain or app code moves.
 *
 * Service-role client: server-only, never shipped to the browser, no session
 * persistence. Row-Level Security is bypassed by design here because the write
 * broker (edge function / server action) enforces authorization above it.
 */
let cached: SupabaseClient | null = null;

export function supabaseServiceClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "[planet-b] The Garden is not provisioned: set SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY before enabling PLANET_B_GARDEN.",
    );
  }
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
