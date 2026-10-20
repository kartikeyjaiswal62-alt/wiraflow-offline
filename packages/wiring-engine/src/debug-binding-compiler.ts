/**
 * Debug Binding Compiler
 *
 * Generates debug-visible trace events for every flow step so the
 * Preview/Debug session can show what happened and why.
 */

import type {
  WiringFlowStep,
  WiringDebugBinding,
  WiringSourceLink,
  WiringStateTransition,
  WiringActionFlow,
} from "@wiraflow/contracts";

/**
 * Generate debug bindings for all flow steps.
 */
export function compileDebugBindings(
  flows: WiringActionFlow[],
  steps: WiringFlowStep[],
  sourceLinks: WiringSourceLink[]
): { debugBindings: WiringDebugBinding[]; stateTransitions: WiringStateTransition[] } {
  const debugBindings: WiringDebugBinding[] = [];
  const stateTransitions: WiringStateTransition[] = [];

  for (const step of steps) {
    const channel = mapStepToChannel(step.stepType);
    const eventName = `${step.stepType}:${step.key}`;

    const srcLink: WiringSourceLink = {
      key: `src-debug-${step.key}`,
      artifact: "BackendIntentGraph",
      artifactKey: step.bindingKey ?? step.flowKey,
      reason: `Debug trace for step: ${step.description}`,
    };
    sourceLinks.push(srcLink);

    debugBindings.push({
      key: `debug-${step.key}`,
      flowKey: step.flowKey,
      stepKey: step.key,
      channel,
      eventName,
      payloadSummary: step.description,
      visibility: step.executionMode === "background" ? "debug_only" : "both",
      sourceLinkKeys: [srcLink.key],
    });

    // State transitions for mutate, upload, and invoke steps
    if (["mutate", "upload", "invoke_function", "enqueue_job"].includes(step.stepType)) {
      stateTransitions.push({
        key: `transition-${step.key}-start`,
        flowKey: step.flowKey,
        fromStateKey: undefined,
        toStateKey: `${step.stepType}_in_progress`,
        triggerStepKey: step.key,
        visibility: "both",
        sourceLinkKeys: [srcLink.key],
      });

      stateTransitions.push({
        key: `transition-${step.key}-complete`,
        flowKey: step.flowKey,
        fromStateKey: `${step.stepType}_in_progress`,
        toStateKey: `${step.stepType}_complete`,
        triggerStepKey: step.key,
        visibility: "both",
        sourceLinkKeys: [srcLink.key],
      });
    }
  }

  return { debugBindings, stateTransitions };
}

function mapStepToChannel(
  stepType: string
): WiringDebugBinding["channel"] {
  switch (stepType) {
    case "query":
    case "mutate":
      return "network_panel";
    case "upload":
    case "invoke_function":
    case "enqueue_job":
      return "network_panel";
    case "emit_state":
    case "guard_check":
      return "state_panel";
    case "navigate":
      return "preview_timeline";
    case "notify":
    case "collect_input":
      return "event_log";
    default:
      return "debug_rail";
  }
}
