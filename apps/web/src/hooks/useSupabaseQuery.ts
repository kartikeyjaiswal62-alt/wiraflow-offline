"use client";

/**
 * useSupabaseQuery — React hook for live Supabase queries
 *
 * Takes a table name and optional filters, returns live data
 * from the connected Supabase project.
 */

import { useState, useEffect, useCallback } from "react";
import { useStore } from "../lib/store";
import { getSupabaseClient } from "../lib/supabase/client";
import { fetchReadBinding, type ReadBinding } from "../lib/supabase/data-fetcher";

interface UseSupabaseQueryOptions {
  tableName: string;
  filters?: ReadBinding["filterInputs"];
  accessMode?: string;
  enabled?: boolean;
  params?: Record<string, unknown>;
  projectId?: string;
}

interface UseSupabaseQueryResult {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  count: number;
  refetch: () => Promise<void>;
  connected: boolean;
}

export function useSupabaseQuery(options: UseSupabaseQueryOptions): UseSupabaseQueryResult {
  const { getProject } = useStore();
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const project = options.projectId ? getProject(options.projectId) : undefined;
  const client = getSupabaseClient(project?.supabaseUrl, project?.supabaseAnonKey);
  const connected = !!client;
  const enabled = options.enabled !== false;

  const fetchData = useCallback(async () => {
    if (!client || !enabled) return;

    setLoading(true);
    setError(null);

    const binding: ReadBinding = {
      key: `query-${options.tableName}`,
      sourceKey: options.tableName,
      accessMode: options.accessMode ?? "list",
      filterInputs: options.filters,
    };

    const result = await fetchReadBinding(client, binding, options.params);

    setData(result.data);
    setError(result.error);
    setCount(result.count ?? 0);
    setLoading(false);
  }, [client, enabled, options.tableName, options.accessMode, JSON.stringify(options.filters), JSON.stringify(options.params)]);

  useEffect(() => {
    if (connected && enabled) {
      fetchData();
    }
  }, [fetchData, connected, enabled]);

  return { data, loading, error, count, refetch: fetchData, connected };
}

/**
 * useSupabaseMutation — React hook for executing mutations
 */

import { executeMutation, type MutationBinding } from "../lib/supabase/data-fetcher";

interface UseSupabaseMutationOptions {
  tableName: string;
  operation: string;
}

interface UseSupabaseMutationResult {
  execute: (data: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  loading: boolean;
  error: string | null;
  lastResult: any;
}

export function useSupabaseMutation(options: UseSupabaseMutationOptions): UseSupabaseMutationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);

  // Mutations currently use the static client unless a caller wires projectId into a wrapper.
  const client = getSupabaseClient();

  const execute = useCallback(async (data: Record<string, any>) => {
    if (!client) {
      return { success: false, error: "No Supabase connection" };
    }

    setLoading(true);
    setError(null);

    const binding: MutationBinding = {
      key: `mutation-${options.tableName}-${options.operation}`,
      targetTableKey: options.tableName,
      operation: options.operation,
    };

    const result = await executeMutation(client, binding, data);

    setLoading(false);
    setError(result.error ?? null);
    setLastResult(result.data);

    return result;
  }, [client, options.tableName, options.operation]);

  return { execute, loading, error, lastResult };
}
