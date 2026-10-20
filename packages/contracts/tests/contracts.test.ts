/**
 * Contract Validation Tests
 *
 * Verifies all canonical artifact schemas accept valid fixtures
 * and reject invalid input with descriptive errors.
 */

import { describe, expect, it } from "vitest";

import {
  AppIntentSpecSchema,
  BackendIntentGraphSchema,
  SupabaseSchemaPlanSchema,
  UISemanticGraphSchema,
  ValidationReportSchema,
  WiringActionFlowPlanSchema,
  DebugSessionArtifactSchema,
} from "../src/index.js";

import { SAMPLE_APP_INTENT_SPEC } from "./fixtures/sample-app-intent-spec.js";

const NOW = new Date().toISOString();

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function makeEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    version: "1.0.0",
    createdAt: NOW,
    updatedAt: NOW,
    generatedBy: "system" as const,
    unknowns: [],
    ...overrides,
  };
}

// -------------------------------------------------------------------------
// AppIntentSpec
// -------------------------------------------------------------------------

describe("AppIntentSpec", () => {
  it("accepts the sample golden fixture", () => {
    const result = AppIntentSpecSchema.safeParse(SAMPLE_APP_INTENT_SPEC);
    expect(result.success).toBe(true);
  });

  it("has 2 roles", () => {
    expect(SAMPLE_APP_INTENT_SPEC.roles).toHaveLength(2);
  });

  it("has 4 entities", () => {
    expect(SAMPLE_APP_INTENT_SPEC.entities).toHaveLength(4);
  });

  it("has 4 pages", () => {
    expect(SAMPLE_APP_INTENT_SPEC.pageCatalog).toHaveLength(4);
  });

  it("has 1 workflow", () => {
    expect(SAMPLE_APP_INTENT_SPEC.workflows).toHaveLength(1);
  });

  it("rejects missing version", () => {
    const { version: _, ...noVersion } = SAMPLE_APP_INTENT_SPEC;
    const result = AppIntentSpecSchema.safeParse(noVersion);
    expect(result.success).toBe(false);
  });

  it("rejects empty roles", () => {
    const result = AppIntentSpecSchema.safeParse({
      ...SAMPLE_APP_INTENT_SPEC,
      roles: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid version format", () => {
    const result = AppIntentSpecSchema.safeParse({
      ...SAMPLE_APP_INTENT_SPEC,
      version: "v1",
    });
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// UISemanticGraph
// -------------------------------------------------------------------------

describe("UISemanticGraph", () => {
  it("accepts a minimal valid graph", () => {
    const result = UISemanticGraphSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      pages: [
        {
          key: "home",
          label: "Home Page",
          purpose: "Landing page",
          pageType: "dashboard",
          route: { key: "home-route", path: "/", params: [], guards: [] },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("validates widget semantic roles", () => {
    const result = UISemanticGraphSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      widgets: [
        {
          key: "btn-1",
          parentKey: null,
          designerType: "Button",
          semanticRole: "primary_cta_button",
          label: "Submit",
          interactive: true,
          confidence: "high",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid semantic role", () => {
    const result = UISemanticGraphSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      widgets: [
        {
          key: "btn-1",
          parentKey: null,
          designerType: "Button",
          semanticRole: "not_a_real_role",
          label: "Submit",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// BackendIntentGraph
// -------------------------------------------------------------------------

describe("BackendIntentGraph", () => {
  it("accepts a minimal valid graph", () => {
    const result = BackendIntentGraphSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      identityModel: {
        authProvider: "supabase_auth",
        hasTeams: false,
        hasMultiTenancy: false,
      },
      entities: [
        {
          key: "posts",
          label: "Post",
          kind: "table",
          fields: [],
          auditFields: {
            hasId: true,
            hasCreatedAt: true,
            hasUpdatedAt: true,
            hasCreatedBy: true,
          },
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// -------------------------------------------------------------------------
// SupabaseSchemaPlan
// -------------------------------------------------------------------------

describe("SupabaseSchemaPlan", () => {
  it("accepts a minimal valid plan", () => {
    const result = SupabaseSchemaPlanSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      tables: [
        {
          key: "projects",
          name: "projects",
          columns: [
            { key: "id", name: "id", type: "uuid", isPrimaryKey: true },
          ],
          enableRls: true,
        },
      ],
      validation: {
        tableCount: 1,
        viewCount: 0,
        policyCount: 0,
        enumCount: 0,
        bucketCount: 0,
        functionCount: 0,
        migrationReady: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid table name", () => {
    const result = SupabaseSchemaPlanSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      tables: [
        {
          key: "projects",
          name: "Projects Table",
          columns: [],
        },
      ],
      validation: {
        tableCount: 1,
        viewCount: 0,
        policyCount: 0,
        enumCount: 0,
        bucketCount: 0,
        functionCount: 0,
        migrationReady: false,
      },
    });
    expect(result.success).toBe(false);
  });
});

// -------------------------------------------------------------------------
// WiringActionFlowPlan
// -------------------------------------------------------------------------

describe("WiringActionFlowPlan", () => {
  it("accepts a minimal valid plan", () => {
    const result = WiringActionFlowPlanSchema.safeParse({
      ...makeEnvelope(),
      meta: {
        projectId: "test-001",
        appIntentSpecVersion: "1.0.0",
        uiSemanticGraphVersion: "1.0.0",
        backendIntentGraphVersion: "1.0.0",
        supabaseSchemaPlanVersion: "1.0.0",
      },
      actionFlows: [
        {
          key: "flow-1",
          actionKey: "action-1",
          flowType: "read",
          trigger: "page_load",
          stepKeys: ["step-1"],
          sourceLinkKeys: ["link-1"],
        },
      ],
      flowSteps: [
        {
          key: "step-1",
          flowKey: "flow-1",
          stepType: "query",
          executionMode: "client_direct",
          description: "Load project list",
        },
      ],
      validation: {
        actionFlowCount: 1,
        flowStepCount: 1,
        readBindingCount: 0,
        mutationBindingCount: 0,
        uploadBindingCount: 0,
        functionBindingCount: 0,
        navigationBindingCount: 0,
        debugBindingCount: 0,
        highImpactUnknownCount: 0,
        reviewRequired: false,
        executionReady: true,
      },
    });
    expect(result.success).toBe(true);
  });
});

// -------------------------------------------------------------------------
// ValidationReport
// -------------------------------------------------------------------------

describe("ValidationReport", () => {
  it("accepts a minimal valid report", () => {
    const result = ValidationReportSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      status: "passed",
      totalIssues: 0,
      blockingIssues: 0,
      warningIssues: 0,
      infoIssues: 0,
    });
    expect(result.success).toBe(true);
  });
});

// -------------------------------------------------------------------------
// DebugSessionArtifact
// -------------------------------------------------------------------------

describe("DebugSessionArtifact", () => {
  it("accepts a minimal valid session", () => {
    const result = DebugSessionArtifactSchema.safeParse({
      ...makeEnvelope(),
      projectId: "test-001",
      session: {
        sessionId: "session-001",
        projectId: "test-001",
        mode: "wired_preview",
        startedAt: NOW,
        status: "running",
      },
    });
    expect(result.success).toBe(true);
  });
});
