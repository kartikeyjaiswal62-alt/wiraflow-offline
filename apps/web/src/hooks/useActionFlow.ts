"use client";

/**
 * useActionFlow — React hook for triggering full action flows
 */

import { useState, useCallback } from "react";
import { useStore } from "../lib/store";
import { getSupabaseClient } from "../lib/supabase/client";
import { executeActionFlow, type ActionFlow, type FlowStep, type DebugEvent } from "../lib/supabase/action-executor";
import { useToast } from "../components/ui/Toast";
import type { MutationBinding } from "../lib/supabase/data-fetcher";

interface UseActionFlowOptions {
  onDebugEvent?: (event: DebugEvent) => void;
  projectId?: string;
}

export function useActionFlow(options?: UseActionFlowOptions) {
  const { getProject } = useStore();
  const [executing, setExecuting] = useState(false);
  const toast = useToast();

  const project = options?.projectId ? getProject(options.projectId) : undefined;
  const client = getSupabaseClient(project?.supabaseUrl, project?.supabaseAnonKey);

  const trigger = useCallback(
    async (
      flow: ActionFlow,
      allSteps: FlowStep[],
      mutationBindings: MutationBinding[],
      formData: Record<string, any>
    ) => {
      if (!client) {
        toast.error("No Supabase connection");
        return { success: false, error: "No Supabase connection" } as const;
      }
      setExecuting(true);

      const result = await executeActionFlow(
        client,
        flow,
        allSteps,
        mutationBindings,
        formData,
        (event) => {
          // Pass debug events up
          options?.onDebugEvent?.(event);
        }
      );

      setExecuting(false);

      if (result.success) {
        toast.success(`Action "${flow.key}" completed`);
      } else {
        toast.error(result.error || `Action failed`);
      }

      return result;
    },
    [client, toast, options]
  );

  return { trigger, executing };
}
