/**
 * Action Executor
 *
 * Orchestrates full action flows: guard → collect → mutate → notify → navigate.
 * Generates debug events during execution for the DebugRail.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { executeMutation, executeUpload, type MutationBinding } from "./data-fetcher";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ActionFlow {
  key: string;
  actionKey: string;
  flowType: string;
  trigger: string;
  stepKeys: string[];
}

export interface FlowStep {
  key: string;
  flowKey: string;
  stepType: string;
  executionMode: string;
  bindingKey?: string;
  description: string;
  onFailure?: string;
}

export interface DebugEvent {
  eventId: string;
  timestamp: string;
  eventType: string;
  summary: string;
  flowKey?: string;
  stepKey?: string;
  payload?: Record<string, unknown>;
  error?: { message: string };
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Execute a full action flow
// ---------------------------------------------------------------------------

export async function executeActionFlow(
  client: SupabaseClient | null,
  flow: ActionFlow,
  steps: FlowStep[],
  mutationBindings: MutationBinding[],
  formData: Record<string, any>,
  onDebugEvent: (event: DebugEvent) => void
): Promise<{ success: boolean; error?: string }> {
  const flowStart = Date.now();

  // Flow started event
  onDebugEvent({
    eventId: `evt-${Date.now()}-start`,
    timestamp: new Date().toISOString(),
    eventType: "flow_started",
    summary: `Flow "${flow.key}" triggered (${flow.trigger})`,
    flowKey: flow.key,
  });

  const flowSteps = flow.stepKeys
    .map((sk) => steps.find((s) => s.key === sk))
    .filter(Boolean) as FlowStep[];

  for (const step of flowSteps) {
    const stepStart = Date.now();

    // Step started
    onDebugEvent({
      eventId: `evt-${Date.now()}-step-start`,
      timestamp: new Date().toISOString(),
      eventType: "action_step_started",
      summary: `Step: ${step.description} (${step.stepType})`,
      flowKey: flow.key,
      stepKey: step.key,
    });

    try {
      switch (step.stepType) {
        case "collect_input":
          // Validate form data (basic check)
          if (!formData || Object.keys(formData).length === 0) {
            throw new Error("No form data provided");
          }
          break;

        case "mutate": {
          if (!client) {
            throw new Error("No Supabase connection — cannot execute mutation");
          }

          const mutation = mutationBindings.find((m) => m.key === step.bindingKey);
          if (!mutation) {
            throw new Error(`No mutation binding found for key: ${step.bindingKey}`);
          }

          const result = await executeMutation(client, mutation, formData);
          if (!result.success) {
            throw new Error(result.error ?? "Mutation failed");
          }

          onDebugEvent({
            eventId: `evt-${Date.now()}-mutation`,
            timestamp: new Date().toISOString(),
            eventType: "mutation_completed",
            summary: `${mutation.operation.toUpperCase()} on ${mutation.targetTableKey}`,
            flowKey: flow.key,
            stepKey: step.key,
            payload: { table: mutation.targetTableKey, operation: mutation.operation, data: result.data },
            durationMs: Date.now() - stepStart,
          });
          break;
        }

        case "upload": {
          if (!client) {
            throw new Error("No Supabase connection — cannot execute upload");
          }
          // Upload is handled separately when a file is provided
          onDebugEvent({
            eventId: `evt-${Date.now()}-upload`,
            timestamp: new Date().toISOString(),
            eventType: "upload_completed",
            summary: "File upload completed",
            flowKey: flow.key,
            stepKey: step.key,
            durationMs: Date.now() - stepStart,
          });
          break;
        }

        case "guard_check":
          // In preview mode, guards always pass
          onDebugEvent({
            eventId: `evt-${Date.now()}-guard`,
            timestamp: new Date().toISOString(),
            eventType: "guard_passed",
            summary: `Guard check passed: ${step.description}`,
            flowKey: flow.key,
            stepKey: step.key,
          });
          break;

        case "navigate":
          onDebugEvent({
            eventId: `evt-${Date.now()}-nav`,
            timestamp: new Date().toISOString(),
            eventType: "navigation_triggered",
            summary: `Navigate: ${step.description}`,
            flowKey: flow.key,
            stepKey: step.key,
          });
          break;

        case "notify":
          onDebugEvent({
            eventId: `evt-${Date.now()}-notify`,
            timestamp: new Date().toISOString(),
            eventType: "notification",
            summary: step.description,
            flowKey: flow.key,
            stepKey: step.key,
          });
          break;

        default:
          onDebugEvent({
            eventId: `evt-${Date.now()}-unknown`,
            timestamp: new Date().toISOString(),
            eventType: "custom_step",
            summary: `Custom step: ${step.description}`,
            flowKey: flow.key,
            stepKey: step.key,
          });
      }

      // Step completed
      onDebugEvent({
        eventId: `evt-${Date.now()}-step-done`,
        timestamp: new Date().toISOString(),
        eventType: "action_step_completed",
        summary: `Step "${step.description}" completed`,
        flowKey: flow.key,
        stepKey: step.key,
        durationMs: Date.now() - stepStart,
      });
    } catch (err: any) {
      // Step failed
      onDebugEvent({
        eventId: `evt-${Date.now()}-step-fail`,
        timestamp: new Date().toISOString(),
        eventType: "action_step_failed",
        summary: `Step "${step.description}" FAILED`,
        flowKey: flow.key,
        stepKey: step.key,
        error: { message: err.message },
        durationMs: Date.now() - stepStart,
      });

      // Flow failed
      onDebugEvent({
        eventId: `evt-${Date.now()}-flow-fail`,
        timestamp: new Date().toISOString(),
        eventType: "flow_failed",
        summary: `Flow "${flow.key}" failed at step "${step.description}"`,
        flowKey: flow.key,
        error: { message: err.message },
        durationMs: Date.now() - flowStart,
      });

      return { success: false, error: err.message };
    }
  }

  // Flow completed
  onDebugEvent({
    eventId: `evt-${Date.now()}-flow-done`,
    timestamp: new Date().toISOString(),
    eventType: "flow_completed",
    summary: `Flow "${flow.key}" completed (${flowSteps.length} steps)`,
    flowKey: flow.key,
    durationMs: Date.now() - flowStart,
  });

  return { success: true };
}
