/**
 * @wiraflow/backend-planner
 *
 * Generates a BackendIntentGraph from an AppIntentSpec.
 * Composes: entity inference, access planning, storage planning, function planning.
 */

import type { AppIntentSpec } from "@wiraflow/contracts";
import type { BackendIntentGraph } from "@wiraflow/contracts";

import { inferEntities } from "./entity-inferrer.js";
import { inferAccessProfiles } from "./access-planner.js";
import { inferStorageIntents } from "./storage-planner.js";
import { inferFunctionIntents } from "./function-planner.js";

// Re-export submodules
export { inferEntities } from "./entity-inferrer.js";
export { inferAccessProfiles } from "./access-planner.js";
export { inferStorageIntents } from "./storage-planner.js";
export { inferFunctionIntents } from "./function-planner.js";

/**
 * Build a complete BackendIntentGraph from an AppIntentSpec.
 *
 * This is the main entry point for Sprint 2.
 * Pipeline: AppIntentSpec → entities + relations + access + storage + functions
 */
export function buildBackendIntentGraph(
  spec: AppIntentSpec,
  projectId: string
): BackendIntentGraph {
  const now = new Date().toISOString();

  // 1. Infer entities and relations
  const { entities, relations } = inferEntities(spec);

  // 2. Infer access profiles
  const accessProfiles = inferAccessProfiles(entities, spec);

  // 3. Infer storage intents
  const storageIntents = inferStorageIntents(spec);

  // 4. Infer functions and async jobs
  const { functionIntents, asyncJobIntents } = inferFunctionIntents(spec);

  // 5. Determine identity model
  const hasTeams = spec.roles.some(
    (r) => r.permissions?.some((p) => p.includes("team"))
  );

  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    generatedBy: "system",
    unknowns: [],
    projectId,

    identityModel: {
      authProvider: "supabase_auth",
      hasTeams,
      hasMultiTenancy: false,
      membershipModel: hasTeams ? "role_based" : "flat",
    },

    entities,
    relations,
    accessProfiles,
    storageIntents,
    functionIntents,
    asyncJobIntents,
  };
}
