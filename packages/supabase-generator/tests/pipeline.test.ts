/**
 * Backend Pipeline E2E Tests
 *
 * Tests the full pipeline: Designer export → AppIntentSpec → BackendIntentGraph → SupabaseSchemaPlan.
 * Uses the real FlutterFlow Designer export as the starting fixture.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";

import {
  BackendIntentGraphSchema,
  SupabaseSchemaPlanSchema,
} from "@wiraflow/contracts";

import { parseDesignerExport, compileAppIntentSpec } from "@wiraflow/artifact-parser";
import { buildBackendIntentGraph } from "@wiraflow/backend-planner";
import { compileSupabaseSchema } from "../src/schema-compiler.js";

import type { AppIntentSpec, BackendIntentGraph, SupabaseSchemaPlan } from "@wiraflow/contracts";

// ---------------------------------------------------------------------------
// Pipeline Setup
// ---------------------------------------------------------------------------

const FIXTURE_PATH = resolve(
  import.meta.dirname ?? ".",
  "../../..",
  "docs/designer-export-sample.md"
);

let spec: AppIntentSpec;
let backendGraph: BackendIntentGraph;
let schemaPlan: SupabaseSchemaPlan;

beforeAll(() => {
  const markdown = readFileSync(FIXTURE_PATH, "utf8");
  const parsed = parseDesignerExport(markdown);
  spec = compileAppIntentSpec(parsed, "test-project");
  backendGraph = buildBackendIntentGraph(spec, "test-project");
  schemaPlan = compileSupabaseSchema(backendGraph, "test-project");
});

// ---------------------------------------------------------------------------
// BackendIntentGraph
// ---------------------------------------------------------------------------

describe("buildBackendIntentGraph", () => {
  it("produces a valid BackendIntentGraph", () => {
    const result = BackendIntentGraphSchema.safeParse(backendGraph);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("has Supabase auth identity model", () => {
    expect(backendGraph.identityModel.authProvider).toBe("supabase_auth");
  });

  it("infers entities from AppIntentSpec", () => {
    expect(backendGraph.entities.length).toBeGreaterThanOrEqual(3);
    const keys = backendGraph.entities.map((e) => e.key);
    expect(keys).toContain("meetings");
  });

  it("adds audit fields to entities", () => {
    const meetings = backendGraph.entities.find((e) => e.key === "meetings");
    expect(meetings?.auditFields.hasId).toBe(true);
    expect(meetings?.auditFields.hasCreatedAt).toBe(true);
    expect(meetings?.auditFields.hasUpdatedAt).toBe(true);
    expect(meetings?.auditFields.hasCreatedBy).toBe(true);
  });

  it("infers relations structure properly", () => {
    // If any relations were extracted, they should be well-formed
    for (const rel of backendGraph.relations) {
      expect(rel.fromEntityKey).toBeDefined();
      expect(rel.toEntityKey).toBeDefined();
      expect(["one_to_one", "one_to_many", "many_to_many"]).toContain(rel.type);
    }
  });

  it("infers access profiles for each entity", () => {
    expect(backendGraph.accessProfiles.length).toBeGreaterThanOrEqual(
      backendGraph.entities.length
    );
  });

  it("infers storage intents for audio files", () => {
    expect(backendGraph.storageIntents.length).toBeGreaterThanOrEqual(1);
    expect(backendGraph.storageIntents[0].bucketName).toContain("audio");
  });

  it("infers function intents from async jobs", () => {
    expect(backendGraph.functionIntents.length).toBeGreaterThanOrEqual(1);
    expect(backendGraph.functionIntents[0].kind).toBe("edge_function");
  });

  it("infers async job intents", () => {
    expect(backendGraph.asyncJobIntents.length).toBeGreaterThanOrEqual(1);
  });

  it("entity fields have proper database types", () => {
    const meetings = backendGraph.entities.find((e) => e.key === "meetings");
    const titleField = meetings?.fields.find((f) => f.key === "title");
    expect(titleField?.type).toBe("varchar");

    const statusField = meetings?.fields.find((f) => f.key === "status");
    expect(statusField?.type).toBe("enum");
  });

  it("builds status machines for lifecycle entities", () => {
    const meetings = backendGraph.entities.find((e) => e.key === "meetings");
    if (meetings?.statusMachine) {
      expect(meetings.statusMachine.states.length).toBeGreaterThanOrEqual(2);
      expect(meetings.statusMachine.transitions.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// SupabaseSchemaPlan
// ---------------------------------------------------------------------------

describe("compileSupabaseSchema", () => {
  it("produces a valid SupabaseSchemaPlan", () => {
    const result = SupabaseSchemaPlanSchema.safeParse(schemaPlan);
    if (!result.success) {
      console.error("Validation errors:", JSON.stringify(result.error.issues.slice(0, 5), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it("creates tables for all entities", () => {
    expect(schemaPlan.tables.length).toBeGreaterThanOrEqual(3);
    const tableNames = schemaPlan.tables.map((t) => t.name);
    expect(tableNames).toContain("meetings");
  });

  it("tables have primary key column", () => {
    for (const table of schemaPlan.tables) {
      const hasPk = table.columns.some((c) => c.isPrimaryKey);
      expect(hasPk).toBe(true);
    }
  });

  it("tables have audit timestamp columns", () => {
    for (const table of schemaPlan.tables) {
      const cols = table.columns.map((c) => c.name);
      expect(cols).toContain("created_at");
      expect(cols).toContain("updated_at");
    }
  });

  it("user_owned tables have created_by column", () => {
    const meetings = schemaPlan.tables.find((t) => t.name === "meetings");
    const createdBy = meetings?.columns.find((c) => c.name === "created_by");
    expect(createdBy).toBeDefined();
    expect(createdBy?.type).toBe("uuid");
    expect(createdBy?.defaultExpression).toBe("auth.uid()");
  });

  it("generates RLS policies", () => {
    expect(schemaPlan.rlsPolicies.length).toBeGreaterThanOrEqual(3);
  });

  it("generates owner-scoped SELECT policies", () => {
    const selectPolicies = schemaPlan.rlsPolicies.filter(
      (p) => p.operation === "SELECT"
    );
    expect(selectPolicies.length).toBeGreaterThanOrEqual(1);
    const ownerPolicy = selectPolicies.find((p) =>
      p.usingExpression.includes("auth.uid()")
    );
    expect(ownerPolicy).toBeDefined();
  });

  it("creates enums for status fields", () => {
    expect(schemaPlan.enums.length).toBeGreaterThanOrEqual(1);
    const meetingStatus = schemaPlan.enums.find((e) =>
      e.key.includes("meetings") && e.key.includes("status")
    );
    expect(meetingStatus).toBeDefined();
    expect(meetingStatus!.values.length).toBeGreaterThanOrEqual(2);
  });

  it("creates storage buckets", () => {
    expect(schemaPlan.buckets.length).toBeGreaterThanOrEqual(1);
    expect(schemaPlan.buckets[0].name).toContain("audio");
    expect(schemaPlan.buckets[0].public).toBe(false);
  });

  it("generates functions", () => {
    expect(schemaPlan.functions.length).toBeGreaterThanOrEqual(1);
  });

  it("generates ordered migration steps", () => {
    expect(schemaPlan.migrationSteps.length).toBeGreaterThanOrEqual(5);
    // Steps should be ordered
    for (let i = 1; i < schemaPlan.migrationSteps.length; i++) {
      expect(schemaPlan.migrationSteps[i].order).toBeGreaterThan(
        schemaPlan.migrationSteps[i - 1].order
      );
    }
  });

  it("migration steps have both up and down SQL", () => {
    for (const step of schemaPlan.migrationSteps) {
      expect(step.upSql.length).toBeGreaterThan(0);
      expect(step.downSql.length).toBeGreaterThan(0);
    }
  });

  it("all tables have RLS enabled", () => {
    for (const table of schemaPlan.tables) {
      expect(table.enableRls).toBe(true);
    }
  });

  it("schema validation reports migration ready", () => {
    expect(schemaPlan.validation.migrationReady).toBe(true);
    expect(schemaPlan.validation.blockingIssues).toHaveLength(0);
  });

  it("validation counts match actual resource counts", () => {
    expect(schemaPlan.validation.tableCount).toBe(schemaPlan.tables.length);
    expect(schemaPlan.validation.policyCount).toBe(schemaPlan.rlsPolicies.length);
    expect(schemaPlan.validation.enumCount).toBe(schemaPlan.enums.length);
    expect(schemaPlan.validation.bucketCount).toBe(schemaPlan.buckets.length);
    expect(schemaPlan.validation.functionCount).toBe(schemaPlan.functions.length);
  });
});
