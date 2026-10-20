/**
 * @wiraflow/wiring-engine
 *
 * The intelligence layer that connects UISemanticGraph + BackendIntentGraph
 * + SupabaseSchemaPlan into a deterministic WiringActionFlowPlan.
 *
 * This is the core value proposition of Wiraflow: turning design + schema
 * into executable, debuggable, inspect-able action flows.
 */

import type {
  UISemanticGraph,
  BackendIntentGraph,
  SupabaseSchemaPlan,
  WiringActionFlowPlan,
  WiringSourceLink,
  WiringUnknown,
} from "@wiraflow/contracts";

import { compileReadBindings } from "./read-binding-compiler.js";
import { compileActionFlows } from "./action-flow-compiler.js";
import { compileDebugBindings } from "./debug-binding-compiler.js";

// Re-export submodules
export { compileReadBindings } from "./read-binding-compiler.js";
export { compileActionFlows } from "./action-flow-compiler.js";
export { compileDebugBindings } from "./debug-binding-compiler.js";

/**
 * Build a complete WiringActionFlowPlan from the three upstream artifacts.
 *
 * This is the Sprint 3 crown jewel: it reads the UI semantics, backend
 * entities, and schema resources, then produces every read binding, action
 * flow, mutation, upload, navigation, function binding, guard, debug trace,
 * and state transition needed to make the app work.
 */
export function buildWiringPlan(
  uiGraph: UISemanticGraph,
  backendGraph: BackendIntentGraph,
  schemaPlan: SupabaseSchemaPlan,
  projectId: string
): WiringActionFlowPlan {
  const now = new Date().toISOString();
  const sourceLinks: WiringSourceLink[] = [];
  const unknowns: WiringUnknown[] = [];

  // 1. Compile read bindings (page loads, data display)
  const readBindings = compileReadBindings(
    uiGraph,
    backendGraph,
    schemaPlan,
    sourceLinks
  );

  // 2. Compile action flows (button presses, form submits, uploads)
  const {
    actionFlows,
    flowSteps,
    mutationBindings,
    uploadBindings,
    navigationBindings,
    functionBindings,
    guards,
  } = compileActionFlows(uiGraph, backendGraph, schemaPlan, sourceLinks);

  // 3. Compile debug bindings and state transitions
  const { debugBindings, stateTransitions } = compileDebugBindings(
    actionFlows,
    flowSteps,
    sourceLinks
  );

  // 4. Detect unknowns — interactive widgets WITHOUT resolved action flows
  const resolvedActionKeys = new Set(actionFlows.map((f) => f.actionKey));
  const unresolvedWidgets = uiGraph.widgets.filter(
    (w) => w.interactive && w.action && !resolvedActionKeys.has(w.key)
  );

  for (const w of unresolvedWidgets) {
    unknowns.push({
      key: `unknown-${w.key}`,
      category: "ambiguous_action",
      severity: "degrading",
      summary: `Widget "${w.label}" has action ${w.action?.operation} but no resolved binding`,
      affectedFlowKeys: [],
      suggestedAction: `Review widget "${w.label}" and provide explicit entity mapping`,
    });
  }

  // 5. Detect pages with data patterns but no read bindings
  for (const page of uiGraph.pages) {
    const hasDataPatterns = page.dataAccessPatterns.some(
      (p) => p !== "none" && p !== "unknown"
    );
    const hasReadBinding = readBindings.some(
      (rb) => rb.dataViewKey === page.key
    );

    if (hasDataPatterns && !hasReadBinding) {
      unknowns.push({
        key: `unknown-read-${page.key}`,
        category: "unresolved_binding",
        severity: "degrading",
        summary: `Page "${page.label}" expects data but no read binding was generated`,
        affectedFlowKeys: [],
        suggestedAction: `Ensure page "${page.label}" has relatedEntityKeys that match backend entities`,
      });
    }
  }

  // 6. Validation summary
  const highImpactUnknownCount = unknowns.filter(
    (u) => u.severity === "blocking"
  ).length;

  const validation = {
    actionFlowCount: actionFlows.length,
    flowStepCount: flowSteps.length,
    readBindingCount: readBindings.length,
    mutationBindingCount: mutationBindings.length,
    uploadBindingCount: uploadBindings.length,
    functionBindingCount: functionBindings.length,
    navigationBindingCount: navigationBindings.length,
    debugBindingCount: debugBindings.length,
    highImpactUnknownCount,
    contradictionsWithUISemanticGraph: [] as string[],
    contradictionsWithBackendIntentGraph: [] as string[],
    contradictionsWithSupabaseSchemaPlan: [] as string[],
    warnings: [],
    reviewRequired: unknowns.length > 0,
    executionReady: highImpactUnknownCount === 0,
  };

  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    generatedBy: "system",

    meta: {
      projectId,
      appIntentSpecVersion: "1.0.0",
      uiSemanticGraphVersion: uiGraph.version,
      backendIntentGraphVersion: backendGraph.version,
      supabaseSchemaPlanVersion: schemaPlan.version,
    },
    sourceLinks,
    actionFlows,
    flowSteps,
    readBindings,
    mutationBindings,
    uploadBindings,
    navigationBindings,
    functionBindings,
    stateTransitions,
    debugBindings,
    guards,
    unknowns,
    validation,
  };
}
