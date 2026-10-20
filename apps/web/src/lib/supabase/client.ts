/**
 * Supabase Browser Client
 *
 * Used in Client Components (browser-side).
 * Reads credentials from NEXT_PUBLIC_ env vars or from the global store
 * for dynamic connection (user-provided keys in Settings).
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Static client (from .env.local — used when env vars are set)
// ---------------------------------------------------------------------------

let _staticClient: SupabaseClient | null = null;

export function getStaticSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!_staticClient) {
    _staticClient = createBrowserClient(url, key);
  }
  return _staticClient;
}

// ---------------------------------------------------------------------------
// Dynamic client (from user-provided credentials in Settings)
// ---------------------------------------------------------------------------

const _dynamicClients = new Map<string, SupabaseClient>();

export function getDynamicSupabaseClient(
  url: string,
  anonKey: string
): SupabaseClient | null {
  if (!url || !anonKey) return null;

  const cacheKey = `${url}|${anonKey}`;
  let client = _dynamicClients.get(cacheKey);
  if (!client) {
    client = createBrowserClient(url, anonKey);
    _dynamicClients.set(cacheKey, client);
  }
  return client;
}

// ---------------------------------------------------------------------------
// Unified getter — prefers env vars, falls back to dynamic
// ---------------------------------------------------------------------------

export function getSupabaseClient(
  storeUrl?: string,
  storeAnonKey?: string
): SupabaseClient | null {
  const staticClient = getStaticSupabaseClient();
  if (staticClient) return staticClient;

  if (storeUrl && storeAnonKey) {
    return getDynamicSupabaseClient(storeUrl, storeAnonKey);
  }

  return null;
}
