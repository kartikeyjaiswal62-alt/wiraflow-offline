import { describe, expect, it } from "vitest";
import { AppIntentSpecSchema } from "@wiraflow/contracts";
import { buildBackendIntentGraph } from "../src/index.js";

const spec = AppIntentSpecSchema.parse({
  version: "1.0.0",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  projectId: "test-project",
  originalPrompt: "A team project tracker with attachments and a scheduled report.",
  appName: "Team Tracker",
  appDescription: "Track work across a team.",
  domain: "project management",
  appGoal: "Keep team work organized.",
  roles: [
    { key: "member", label: "Member", permissions: ["team:read"] },
    { key: "admin", label: "Admin", permissions: ["team:manage"] },
  ],
  entities: [
    {
      key: "projects",
      label: "Projects",
      fields: [{ key: "title", label: "Title", type: "string", required: true }],
      ownershipModel: "team_owned",
      confidence: "high",
    },
  ],
  fileMediaNeeds: [
    { key: "project_files", label: "Project files", purpose: "Attach files to project work", allowedTypes: ["application/pdf"], relatedEntity: "projects", accessScope: "team_scoped" },
  ],
  asyncJobs: [
    { key: "weekly_report", label: "Build weekly report", triggerType: "scheduled", inputEntities: ["projects"], estimatedDuration: "minutes", requiresExternalApi: true },
  ],
});

describe("buildBackendIntentGraph", () => {
  it("composes team access, storage, and long-running external jobs", () => {
    const graph = buildBackendIntentGraph(spec, "test-project");

    expect(graph.projectId).toBe("test-project");
    expect(graph.identityModel).toMatchObject({ hasTeams: true, hasMultiTenancy: false, membershipModel: "role_based" });
    expect(graph.entities).toHaveLength(1);
    expect(graph.entities[0]).toMatchObject({ key: "projects", ownershipModel: "team_owned", routeLookupMode: "by_id" });
    expect(graph.entities[0].fields.map((field) => field.key)).toContain("title");
    expect(graph.accessProfiles.some((profile) => profile.entityKey === "projects" && profile.rowVisibilityBasis === "team_scoped")).toBe(true);
    expect(graph.accessProfiles.some((profile) => profile.requiredRole === "admin" && profile.operations.delete)).toBe(true);
    expect(graph.storageIntents[0]).toMatchObject({ bucketName: "project-files", accessScope: "team_scoped", relatedEntityKey: "projects" });
    expect(graph.functionIntents[0]).toMatchObject({ kind: "edge_function", hasExternalCalls: true, relatedAsyncJobKey: "weekly_report" });
    expect(graph.asyncJobIntents[0].key).toBe("weekly_report");
  });

  it("returns empty inferred collections when the app has no backend needs", () => {
    const minimal = AppIntentSpecSchema.parse({
      version: "1.0.0",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      projectId: "minimal",
      originalPrompt: "A static landing page.",
      appName: "Landing",
      appDescription: "A public landing page.",
      domain: "marketing",
      appGoal: "Present a product.",
      roles: [{ key: "visitor", label: "Visitor" }],
    });
    const graph = buildBackendIntentGraph(minimal, "minimal");

    expect(graph.entities).toEqual([]);
    expect(graph.relations).toEqual([]);
    expect(graph.storageIntents).toEqual([]);
    expect(graph.functionIntents).toEqual([]);
    expect(graph.asyncJobIntents).toEqual([]);
    expect(graph.identityModel).toMatchObject({ hasTeams: false, membershipModel: "flat" });
  });
});
