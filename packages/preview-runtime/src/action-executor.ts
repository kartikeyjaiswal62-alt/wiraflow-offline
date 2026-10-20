/**
 * @wiraflow/preview-runtime — Action Executor
 *
 * The brain of the preview runtime. Receives a WiringActionFlowPlan
 * and executes action flows step-by-step, emitting DebugEvents for
 * every transition. This enables the DebugRail to show real-time
 * execution traces with full explainability.
 *
 * Execution Model (mirrors FlutterFlow's Action Flow Editor):
 *   1. Trigger fires (on_tap, on_submit, on_change, on_page_load)
 *   2. Guards are evaluated (auth checks, validation)
 *   3. Steps execute sequentially (with conditional branching)
 *   4. State transitions are applied
 *   5. Trace envelope is sealed and emitted
 */

import type {
  WiringActionFlowPlan,
  WiringActionFlow,
  WiringFlowStep,
  WiringGuard,
  DebugEvent,
  PreviewTraceEnvelope,
} from "@wiraflow/contracts";

import { EventBus } from "./event-bus.js";
import { StateManager } from "./state-manager.js";
import { MockSupabaseClient } from "./mock-supabase.js";

let traceCounter = 0;
let eventCounter = 1000;

function nextTraceId(): string {
  return `trace-${++traceCounter}-${Date.now()}`;
}

function nextEventId(): string {
  return `exec-evt-${++eventCounter}`;
}

export interface ExecutionContext {
  sessionId: string;
  bus: EventBus;
  state: StateManager;
  supabase: MockSupabaseClient;
}

export class ActionExecutor {
  private plan: WiringActionFlowPlan;
  private ctx: ExecutionContext;

  /** Index of flows by actionKey for fast trigger resolution. */
  private flowIndex = new Map<string, WiringActionFlow>();
  /** Index of steps by key. */
  private stepIndex = new Map<string, WiringFlowStep>();

  constructor(plan: WiringActionFlowPlan, ctx: ExecutionContext) {
    this.plan = plan;
    this.ctx = ctx;

    // Build indexes
    for (const flow of plan.actionFlows) {
      this.flowIndex.set(flow.actionKey, flow);
    }
    for (const step of plan.flowSteps) {
      this.stepIndex.set(step.key, step);
    }
  }

  /**
   * Execute a specific action flow by its actionKey.
   * Returns a sealed TraceEnvelope with every event that occurred.
   */
  async execute(actionKey: string): Promise<PreviewTraceEnvelope> {
    const flow = this.flowIndex.get(actionKey);
    if (!flow) {
      throw new Error(`No action flow found for key: ${actionKey}`);
    }

    const traceId = nextTraceId();
    const events: DebugEvent[] = [];
    const startedAt = new Date().toISOString();
    const flowKey = flow.key;
    const flowLabel = flow.actionKey;

    // Emit flow_started
    const startEvent = this.makeEvent("flow_started", flowKey, {
      summary: `Flow "${flowLabel}" triggered (${flow.trigger})`,
      payload: { trigger: flow.trigger, actionKey: flow.actionKey, flowType: flow.flowType },
      flowKey,
    });
    events.push(startEvent);
    this.ctx.bus.emit(startEvent);

    try {
      // 1. Evaluate guards
      const guardsPassed = await this.evaluateGuards(flow, events);
      if (!guardsPassed) {
        const failEvent = this.makeEvent("flow_failed", flowKey, {
          summary: `Flow "${flowLabel}" blocked by guard`,
          flowKey,
          error: { message: "Guard check failed" },
        });
        events.push(failEvent);
        this.ctx.bus.emit(failEvent);

        return this.sealTrace(traceId, flow, events, startedAt, "warn");
      }

      // 2. Execute steps in order
      const stepKeys = flow.stepKeys;
      for (const stepKey of stepKeys) {
        await this.executeStep(stepKey, flowKey, events);
      }

      // 3. Emit flow_completed
      const completeEvent = this.makeEvent("flow_completed", flowKey, {
        summary: `Flow "${flowLabel}" completed successfully`,
        flowKey,
        payload: { stepsExecuted: stepKeys.length },
      });
      events.push(completeEvent);
      this.ctx.bus.emit(completeEvent);

      return this.sealTrace(traceId, flow, events, startedAt, "ok");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorEvent = this.makeEvent("flow_failed", flowKey, {
        summary: `Flow "${flowLabel}" failed: ${errorMessage}`,
        flowKey,
        error: { message: errorMessage },
      });
      events.push(errorEvent);
      this.ctx.bus.emit(errorEvent);

      return this.sealTrace(traceId, flow, events, startedAt, "error");
    }
  }

  /**
   * Execute all flows that match a given trigger type.
   * Used for page-level triggers like on_page_load.
   */
  async executeByTrigger(trigger: string): Promise<PreviewTraceEnvelope[]> {
    const matching = this.plan.actionFlows.filter((f) => f.trigger === trigger);
    const envelopes: PreviewTraceEnvelope[] = [];

    for (const flow of matching) {
      const envelope = await this.execute(flow.actionKey);
      envelopes.push(envelope);
    }

    return envelopes;
  }

  /** Get all action keys registered in the plan. */
  getActionKeys(): string[] {
    return Array.from(this.flowIndex.keys());
  }

  /** Get a specific flow by its action key. */
  getFlow(actionKey: string): WiringActionFlow | undefined {
    return this.flowIndex.get(actionKey);
  }

  // ---------------------------------------------------------------------------
  // Internal Execution
  // ---------------------------------------------------------------------------

  private async evaluateGuards(
    flow: WiringActionFlow,
    events: DebugEvent[]
  ): Promise<boolean> {
    // Find guards that reference this flow
    const guards = this.plan.guards.filter((g) =>
      g.flowKey === flow.key
    );

    for (const guard of guards) {
      const passed = this.evaluateGuard(guard);

      const eventType = passed ? "guard_passed" : "guard_failed";
      const evt = this.makeEvent(eventType, flow.key, {
        summary: `Guard "${guard.key}": ${guard.condition} → ${passed ? "PASS" : "FAIL"}`,
        flowKey: flow.key,
        payload: { guardKey: guard.key, condition: guard.condition, guardType: guard.guardType },
      });
      events.push(evt);
      this.ctx.bus.emit(evt);

      if (!passed && guard.failureAction === "abort_flow") {
        return false;
      }
    }

    return true;
  }

  private evaluateGuard(guard: WiringGuard): boolean {
    // For preview mode, we simulate guard results based on condition keywords
    const condition = guard.condition.toLowerCase();

    if (condition.includes("authenticated") || condition.includes("logged_in")) {
      // Simulate: user is always authenticated in preview
      return true;
    }
    if (condition.includes("valid") || condition.includes("not_empty")) {
      // Preview runtime doesn't have deterministic field wiring yet — default pass.
      return true;
    }

    // Default: pass
    return true;
  }

  private async executeStep(
    stepKey: string,
    flowKey: string,
    events: DebugEvent[]
  ): Promise<void> {
    const step = this.stepIndex.get(stepKey);
    if (!step) {
      const warnEvent = this.makeEvent("action_step_failed", flowKey, {
        summary: `Step "${stepKey}" not found in plan`,
        stepKey,
        flowKey,
        error: { message: `Missing step: ${stepKey}` },
      });
      events.push(warnEvent);
      this.ctx.bus.emit(warnEvent);
      return;
    }

    // Step started
    const startEvent = this.makeEvent("action_step_started", flowKey, {
      summary: `Step: ${step.stepType}`,
      stepKey: step.key,
      flowKey,
      payload: { stepType: step.stepType, description: step.description },
    });
    events.push(startEvent);
    this.ctx.bus.emit(startEvent);

    // Execute based on step type
    switch (step.stepType) {
      case "mutate": {
        const binding = this.plan.mutationBindings.find(
          (b) => b.key === step.bindingKey
        );
        if (binding) {
          await this.ctx.supabase.insert(binding.targetTableKey ?? "unknown_table", {
            _mock: true,
            source: binding.key,
          });
        }
        break;
      }
      case "query": {
        const readBinding = this.plan.readBindings.find(
          (b) => b.key === step.bindingKey
        );
        if (readBinding) {
          await this.ctx.supabase.select(readBinding.sourceKey);
        }
        break;
      }
      case "navigate": {
        const navBinding = this.plan.navigationBindings.find(
          (b) => b.key === step.bindingKey
        );
        if (navBinding) {
          const navEvent = this.makeEvent("navigation_triggered", flowKey, {
            summary: `Navigate to ${navBinding.routeKey}`,
            flowKey,
            payload: { routeKey: navBinding.routeKey, navigationMode: navBinding.navigationMode },
          });
          events.push(navEvent);
          this.ctx.bus.emit(navEvent);
        }
        break;
      }
      case "emit_state": {
        // Apply state transitions anchored to this step (best-effort in preview mode)
        const transitions = this.plan.stateTransitions.filter(
          (st) => st.flowKey === flowKey && st.triggerStepKey === step.key
        );
        for (const t of transitions) {
          this.ctx.state.set("page", `state:${t.key}`, t.toStateKey, "String");
          const stateEvent = this.makeEvent("variable_changed", flowKey, {
            summary: `State: ${t.fromStateKey ?? "(none)"} → ${t.toStateKey}`,
            flowKey,
            payload: { transitionKey: t.key, from: t.fromStateKey, to: t.toStateKey },
          });
          events.push(stateEvent);
          this.ctx.bus.emit(stateEvent);
        }
        break;
      }
      case "invoke_function": {
        const fnBinding = this.plan.functionBindings.find(
          (b) => b.key === step.bindingKey
        );
        if (fnBinding) {
          await this.ctx.supabase.rpc(fnBinding.functionKey);
        }
        break;
      }
      case "upload": {
        const uploadBinding = this.plan.uploadBindings.find(
          (b) => b.key === step.bindingKey
        );
        if (uploadBinding) {
          const uploadStartEvt = this.makeEvent("upload_started", flowKey, {
            summary: `Uploading to bucket "${uploadBinding.bucketKey}"`,
            flowKey,
            payload: { bucketKey: uploadBinding.bucketKey, uploadMode: uploadBinding.uploadMode },
          });
          events.push(uploadStartEvt);
          this.ctx.bus.emit(uploadStartEvt);

          // Simulated progress
          await new Promise((r) => setTimeout(r, 100));

          const uploadDoneEvt = this.makeEvent("upload_completed", flowKey, {
            summary: `Upload to "${uploadBinding.bucketKey}" complete`,
            flowKey,
            payload: { bucketKey: uploadBinding.bucketKey, mockUrl: "https://mock.storage/file.png" },
          });
          events.push(uploadDoneEvt);
          this.ctx.bus.emit(uploadDoneEvt);
        }
        break;
      }
      case "guard_check":
        // Guards are handled at the flow level in preview mode
        break;
      default: {
        const unknownEvent = this.makeEvent("action_step_completed", flowKey, {
          summary: `Step executed (type: ${step.stepType})`,
          stepKey: step.key,
          flowKey,
        });
        events.push(unknownEvent);
        this.ctx.bus.emit(unknownEvent);
      }
    }

    // Step completed
    const completeEvent = this.makeEvent("action_step_completed", flowKey, {
      summary: `Step "${step.stepType}" completed`,
      stepKey: step.key,
      flowKey,
    });
    events.push(completeEvent);
    this.ctx.bus.emit(completeEvent);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private makeEvent(
    eventType: DebugEvent["eventType"],
    flowKey: string,
    overrides: Partial<DebugEvent>
  ): DebugEvent {
    return {
      eventId: nextEventId(),
      sessionId: this.ctx.sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      flowKey,
      summary: "",
      payload: {},
      sourceLinks: [],
      ...overrides,
    };
  }

  private sealTrace(
    traceId: string,
    flow: WiringActionFlow,
    events: DebugEvent[],
    startedAt: string,
    status: PreviewTraceEnvelope["status"]
  ): PreviewTraceEnvelope {
    const completedAt = new Date().toISOString();
    const startTime = new Date(startedAt).getTime();
    const endTime = new Date(completedAt).getTime();
    const label = flow.actionKey;

    return {
      traceId,
      sessionId: this.ctx.sessionId,
      flowKey: flow.key,
      label,
      status,
      startedAt,
      completedAt,
      totalDurationMs: endTime - startTime,
      summary: `${label} → ${status} (${events.length} events)`,
      events,
      sourceLinks: [],
      relatedSelection: {
        actionKey: flow.actionKey,
      },
    };
  }
}
