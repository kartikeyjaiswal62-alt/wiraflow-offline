/**
 * Function Planner
 *
 * Infers edge function and RPC needs from AppIntentSpec async jobs
 * and workflows. Distinguishes between:
 * - RPC: Short atomic DB work (run in Postgres)
 * - Edge Function: External APIs, long-running processing (run in Deno)
 */

import type { AppIntentSpec, AsyncJob } from "@wiraflow/contracts";
import type { FunctionIntent, AsyncJobIntent } from "@wiraflow/contracts";

/**
 * Infer function intents from async jobs and workflows.
 */
export function inferFunctionIntents(
  spec: AppIntentSpec
): { functionIntents: FunctionIntent[]; asyncJobIntents: AsyncJobIntent[] } {
  const functionIntents: FunctionIntent[] = [];
  const asyncJobIntents: AsyncJobIntent[] = [];

  for (const job of spec.asyncJobs ?? []) {
    const isLongRunning = job.estimatedDuration === "minutes" || job.estimatedDuration === "hours";
    const hasExternalApi = job.requiresExternalApi ?? false;
    const kind: FunctionIntent["kind"] = isLongRunning || hasExternalApi ? "edge_function" : "rpc";

    // Create function intent
    const fnKey = `fn-${job.key}`;
    functionIntents.push({
      key: fnKey,
      label: job.label,
      description: job.description,
      kind,
      reason: isLongRunning
        ? `Long-running process (${job.estimatedDuration}): requires edge function`
        : hasExternalApi
          ? "Requires external API calls: must run as edge function"
          : "Short atomic work: can run as RPC in Postgres",
      inputContract: (job.inputEntities ?? []).map((e) => ({
        key: `${e}_id`,
        type: "uuid",
        required: true,
      })),
      outputContract: (job.outputEntities ?? []).map((e) => ({
        key: `${e}_result`,
        type: "jsonb",
      })),
      needsServiceRole: kind === "edge_function",
      hasExternalCalls: hasExternalApi,
      transactionBoundary:
        kind === "rpc" ? "short_transaction" : "no_transaction",
      relatedEntityKeys: [
        ...(job.inputEntities ?? []),
        ...(job.outputEntities ?? []),
      ],
      relatedAsyncJobKey: job.key,
      confidence: "medium",
      sourceLinks: job.sourceLinks ?? [],
    });

    // Create async job intent
    asyncJobIntents.push({
      key: job.key,
      label: job.label,
      description: job.description,
      triggerType: (job.triggerType as AsyncJobIntent["triggerType"]) ?? "user_action",
      requiresJobRecord: isLongRunning,
      sourceEntityKey: job.inputEntities?.[0],
      sourceStatusFieldKey: isLongRunning ? "status" : undefined,
      estimatedDuration: (job.estimatedDuration as AsyncJobIntent["estimatedDuration"]) ?? "unknown",
      implementingFunctionKey: fnKey,
      confidence: "medium",
      sourceLinks: job.sourceLinks ?? [],
    });
  }

  return { functionIntents, asyncJobIntents };
}
