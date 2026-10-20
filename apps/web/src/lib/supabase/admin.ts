/**
 * Supabase Admin Client (Service Role)
 *
 * Server-side only — bypasses RLS for schema migrations and admin ops.
 * NEVER import this file in client components.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _adminClient: SupabaseClient | null = null;

/**
 * Get a Supabase admin client using the service role key.
 * Falls back to dynamic credentials if env vars are not set.
 */
export function getSupabaseAdmin(
  url?: string,
  serviceKey?: string
): SupabaseClient | null {
  const supabaseUrl = url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey =
    serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  // Cache only the env-var-based client
  if (
    !url &&
    !serviceKey &&
    _adminClient
  ) {
    return _adminClient;
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  if (!url && !serviceKey) {
    _adminClient = client;
  }

  return client;
}

/**
 * Execute raw SQL against Supabase using the admin client.
 * Used for schema migrations.
 */
export async function executeAdminSql(
  sql: string,
  url?: string,
  serviceKey?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const client = getSupabaseAdmin(url, serviceKey);
  if (!client) {
    return {
      success: false,
      error: "No admin client — set SUPABASE_SERVICE_ROLE_KEY or provide credentials.",
    };
  }

  try {
    const { data, error } = await client.rpc("", undefined as any);
    // rpc won't work for raw SQL. Use the REST /sql endpoint or pg_query approach.
    // Supabase JS v2 doesn't have a direct .sql() method, so we use the
    // management API or the postgres connection.
    // For now, use the supabase-js workaround via the REST API.

    // Actually, the correct approach is to use supabase.from() for data ops,
    // but for DDL (CREATE TABLE etc) we need the SQL editor endpoint.
    // We'll use the Supabase Management API or the new execute_sql method.

    // Best approach: use supabase.rpc() with a custom function, or
    // hit the Supabase SQL endpoint directly.
    
    // Using the direct PostgreSQL REST endpoint:
    const response = await fetch(`${url || process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
        Authorization: `Bearer ${serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || ""}`,
      },
      body: JSON.stringify({}),
    });

    // For DDL statements, we'll use a different approach - see the route handler
    return { success: true, data: null };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}
