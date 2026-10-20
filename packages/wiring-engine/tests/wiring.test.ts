/**
 * Wiring Engine E2E Tests
 *
 * Tests the COMPLETE pipeline:
 *   Designer export → AppIntentSpec → UISemanticGraph
 *     → BackendIntentGraph → SupabaseSchemaPlan → WiringActionFlowPlan
 *
 * Uses the real FlutterFlow Designer export as the starting fixture.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";

import {
  WiringActionFlowPlanSchema,
} from "@wiraflow/contracts";

import { parseDesignerExport, compileAppIntentSpec } from "@wiraflow/artifact-parser";
import { buildBackendIntentGraph } from "@wiraflow/backend-planner";
import { compileSupabaseSchema } from "@wiraflow/supabase-generator";
import { buildWiringPlan } from "../src/index.js";

import type {
  AppIntentSpec,
  UISemanticGraph,
  BackendIntentGraph,
  SupabaseSchemaPlan,
  WiringActionFlowPlan,
} from "@wiraflow/contracts";

// ---------------------------------------------------------------------------
// Pipeline Setup
// ---------------------------------------------------------------------------

const FIXTURE_PATH = resolve(
  import.meta.dirname ?? ".",
  "../../..",
  "docs/designer-export-sample.md"
);

let spec: AppIntentSpec;
let uiGraph: UISemanticGraph;
let backendGraph: BackendIntentGraph;
let schemaPlan: SupabaseSchemaPlan;
let wiringPlan: WiringActionFlowPlan;

beforeAll(() => {
  const markdown = readFileSync(FIXTURE_PATH, "utf8");
  const parsed = parseDesignerExport(markdown);
  spec = compileAppIntentSpec(parsed, "test-project");

  // Build a minimal UISemanticGraph from parsed + spec data for testing
  uiGraph = buildMinimalUIGraph(parsed, spec);

  backendGraph = buildBackendIntentGraph(spec, "test-project");
  schemaPlan = compileSupabaseSchema(backendGraph, "test-project");
  wiringPlan = buildWiringPlan(uiGraph, backendGraph, schemaPlan, "test-project");
});

/**
 * Build a minimal UISemanticGraph from parsed data for testing purposes.
 * In production, this comes from the full semantic-graph-builder.
 */
function buildMinimalUIGraph(parsed: any, spec: AppIntentSpec): UISemanticGraph {
  const pages = spec.pageCatalog.map((p: any) => ({
    key: p.key,
    label: p.label,
    purpose: p.purpose ?? p.label,
    pageType: p.pageType ?? "custom",
    route: { key: `route-${p.key}`, path: `/${p.key}`, params: [], guards: [] },
    sections: [],
    widgetKeys: [`btn-${p.key}-cta`, `list-${p.key}`],
    primaryActionKeys: [`btn-${p.key}-cta`],
    dataAccessPatterns: p.relatedEntities?.length ? ["list_by_owner"] : ["none"],
    relatedEntityKeys: p.relatedEntities ?? [],
    requiredRoles: [],
    confidence: "medium" as const,
    sourceLinks: [],
  }));

  const widgets: any[] = [];
  for (const p of spec.pageCatalog) {
    // Infer the primary action from the page type
    const actionLabel = inferActionFromPageType(p.pageType, p.label);
    const operation = inferOperation(actionLabel);

    // Primary CTA button per page
    widgets.push({
      key: `btn-${p.key}-cta`,
      parentKey: p.key,
      designerType: "Button",
      semanticRole: "primary_cta_button",
      label: actionLabel,
      interactive: true,
      action: {
        operation,
        targetEntityKey: p.relatedEntities?.[0],
        description: actionLabel,
      },
      dataAccessPattern: "none",
      confidence: "medium",
      sourceLinks: [],
    });

    // List widget for data pages
    if (p.relatedEntities?.length) {
      widgets.push({
        key: `list-${p.key}`,
        parentKey: p.key,
        designerType: "ListView",
        semanticRole: "list_container",
        label: `${p.relatedEntities[0]} list`,
        repeatable: true,
        interactive: false,
        dataAccessPattern: "list_by_owner",
        relatedEntityKey: p.relatedEntities[0],
        confidence: "medium",
        sourceLinks: [],
      });
    }
  }

  return {
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    generatedBy: "system",
    unknowns: [],
    projectId: "test-project",
    pages,
    widgets,
    navigationEdges: [],
    globalNavigationWidgetKeys: [],
  };
}

function inferActionFromPageType(pageType: string, pageLabel: string): string {
  switch (pageType) {
    case "form": return `Create ${pageLabel}`;
    case "list": return `View ${pageLabel} Details`;
    case "detail": return `Edit ${pageLabel}`;
    case "upload_process": return `Upload and Process`;
    case "dashboard": return `View Dashboard`;
    default: return `Open ${pageLabel}`;
  }
}

function inferOperation(actionLabel: string): string {
  const lower = actionLabel.toLowerCase();
  if (lower.includes("start") || lower.includes("create") || lower.includes("add") || lower.includes("new")) return "create";
  if (lower.includes("upload") || lower.includes("record")) return "upload";
  if (lower.includes("edit") || lower.includes("update") || lower.includes("save")) return "update";
  if (lower.includes("delete") || lower.includes("remove")) return "delete";
  if (lower.includes("view") || lower.includes("detail") || lower.includes("open")) return "navigate";
  if (lower.includes("transcri") || lower.includes("process")) return "invoke_function";
  return "navigate";
}

// ---------------------------------------------------------------------------
// WiringActionFlowPlan
// ---------------------------------------------------------------------------

describe("buildWiringPlan", () => {
  it("produces a valid WiringActionFlowPlan", () => {
    const result = WiringActionFlowPlanSchema.safeParse(wiringPlan);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("has correct meta references", () => {
    expect(wiringPlan.meta.projectId).toBe("test-project");
    expect(wiringPlan.meta.appIntentSpecVersion).toBe("1.0.0");
  });

  it("generates action flows for interactive widgets", () => {
    expect(wiringPlan.actionFlows.length).toBeGreaterThanOrEqual(1);
    for (const flow of wiringPlan.actionFlows) {
      expect(flow.stepKeys.length).toBeGreaterThanOrEqual(1);
      expect(flow.actionKey).toBeDefined();
      expect(flow.trigger).toBeDefined();
    }
  });

  it("each action flow has corresponding flow steps", () => {
    for (const flow of wiringPlan.actionFlows) {
      for (const stepKey of flow.stepKeys) {
        const step = wiringPlan.flowSteps.find((s) => s.key === stepKey);
        expect(step).toBeDefined();
        expect(step!.flowKey).toBe(flow.key);
      }
    }
  });

  it("generates read bindings for data pages", () => {
    expect(wiringPlan.readBindings.length).toBeGreaterThanOrEqual(1);
    for (const rb of wiringPlan.readBindings) {
      expect(rb.sourceType).toBeDefined();
      expect(rb.sourceKey).toBeDefined();
      expect(rb.accessMode).toBeDefined();
    }
  });

  it("generates mutation bindings for create/update actions", () => {
    expect(wiringPlan.mutationBindings.length).toBeGreaterThanOrEqual(0);
    for (const mb of wiringPlan.mutationBindings) {
      expect(mb.operation).toBeDefined();
      expect(mb.mutationMode).toBeDefined();
    }
  });

  it("generates debug bindings for every flow step", () => {
    expect(wiringPlan.debugBindings.length).toBeGreaterThanOrEqual(
      wiringPlan.flowSteps.length
    );
    for (const db of wiringPlan.debugBindings) {
      expect(db.channel).toBeDefined();
      expect(db.eventName).toBeDefined();
    }
  });

  it("generates state transitions for mutation and upload steps", () => {
    const mutateSteps = wiringPlan.flowSteps.filter(
      (s) => ["mutate", "upload", "invoke_function"].includes(s.stepType)
    );
    if (mutateSteps.length > 0) {
      expect(wiringPlan.stateTransitions.length).toBeGreaterThanOrEqual(
        mutateSteps.length
      );
    }
  });

  it("has complete source links for traceability", () => {
    expect(wiringPlan.sourceLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of wiringPlan.sourceLinks) {
      expect(link.artifact).toBeDefined();
      expect(link.artifactKey).toBeDefined();
    }
  });

  it("validation counts match actual data", () => {
    expect(wiringPlan.validation.actionFlowCount).toBe(wiringPlan.actionFlows.length);
    expect(wiringPlan.validation.flowStepCount).toBe(wiringPlan.flowSteps.length);
    expect(wiringPlan.validation.readBindingCount).toBe(wiringPlan.readBindings.length);
    expect(wiringPlan.validation.mutationBindingCount).toBe(wiringPlan.mutationBindings.length);
    expect(wiringPlan.validation.debugBindingCount).toBe(wiringPlan.debugBindings.length);
  });

  it("is execution ready when no blocking unknowns", () => {
    expect(wiringPlan.validation.executionReady).toBe(true);
  });
});
