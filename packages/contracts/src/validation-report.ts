/**
 * Wiraflow Contracts — Validation Report
 *
 * Cross-artifact validation that checks consistency between all canonical
 * artifacts. This is the platform's way of saying "everything checks out"
 * or "these issues need attention."
 *
 * Blueprint reference: "Validation Layer" section
 */

import { z } from "zod";

import { ArtifactEnvelopeSchema, SourceLinkSchema, WarningSchema } from "./shared.js";

// ---------------------------------------------------------------------------
// Validation Categories
// ---------------------------------------------------------------------------

export const ValidationCategorySchema = z.enum([
  "design_parsing",
  "backend_schema",
  "wiring_consistency",
  "permission_safety",
  "preview_readiness",
  "cross_artifact_consistency",
]);
export type ValidationCategory = z.infer<typeof ValidationCategorySchema>;

// ---------------------------------------------------------------------------
// Validation Issue
// ---------------------------------------------------------------------------

export const ValidationIssueSchema = z.object({
  key: z.string(),
  category: ValidationCategorySchema,
  severity: z.enum(["info", "warning", "error", "critical"]),
  /** Human-readable issue description. */
  message: z.string(),
  /** Detailed explanation. */
  detail: z.string().optional(),
  /** Suggested fix. */
  suggestedAction: z.string().optional(),
  /** Which artifact(s) are affected. */
  affectedArtifacts: z.array(
    z.enum([
      "AppIntentSpec",
      "UISemanticGraph",
      "BackendIntentGraph",
      "SupabaseSchemaPlan",
      "WiringActionFlowPlan",
      "PreviewTraceEnvelope",
    ])
  ),
  /** Specific keys within those artifacts. */
  affectedKeys: z.array(z.string()).default([]),
  /** Evidence for this issue. */
  sourceLinks: z.array(SourceLinkSchema).default([]),
  /** Whether this issue blocks generation/execution. */
  blocking: z.boolean().default(false),
});
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

// ---------------------------------------------------------------------------
// Category Check Results
// ---------------------------------------------------------------------------

export const DesignParsingCheckSchema = z.object({
  pageCountValid: z.boolean(),
  routeGraphConnected: z.boolean(),
  requiredWidgetsIdentified: z.boolean(),
  orphanedWidgetCount: z.number().default(0),
  issues: z.array(z.string()).default([]),
});

export const BackendSchemaCheckSchema = z.object({
  allTablesExist: z.boolean(),
  allColumnsExist: z.boolean(),
  allEnumValuesExist: z.boolean(),
  allBucketsExist: z.boolean(),
  functionContractsMatch: z.boolean(),
  issues: z.array(z.string()).default([]),
});

export const WiringConsistencyCheckSchema = z.object({
  allQueryReferencesValid: z.boolean(),
  allActionOutputsConnected: z.boolean(),
  allRouteParamsExist: z.boolean(),
  allBindingsReferenceValidFields: z.boolean(),
  loadingAndErrorStatesReachable: z.boolean(),
  issues: z.array(z.string()).default([]),
});

export const PermissionSafetyCheckSchema = z.object({
  allRoleAssumptionsExplicit: z.boolean(),
  allOwnershipAssumptionsExplicit: z.boolean(),
  unsafeMutationsFlagged: z.boolean(),
  privilegeEscalationRisks: z.array(z.string()).default([]),
  issues: z.array(z.string()).default([]),
});

export const PreviewReadinessCheckSchema = z.object({
  allActionChainsExecutable: z.boolean(),
  traceEventsAlignToSpec: z.boolean(),
  retriesAndFailuresSurface: z.boolean(),
  issues: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Top-Level Validation Report
// ---------------------------------------------------------------------------

export const ValidationReportSchema = ArtifactEnvelopeSchema.extend({
  projectId: z.string(),

  /** Overall validation status. */
  status: z.enum(["passed", "passed_with_warnings", "failed"]),

  /** Total issue counts. */
  totalIssues: z.number(),
  blockingIssues: z.number(),
  warningIssues: z.number(),
  infoIssues: z.number(),

  /** All individual issues. */
  issues: z.array(ValidationIssueSchema).default([]),

  /** Category-specific check results. */
  designParsingCheck: DesignParsingCheckSchema.optional(),
  backendSchemaCheck: BackendSchemaCheckSchema.optional(),
  wiringConsistencyCheck: WiringConsistencyCheckSchema.optional(),
  permissionSafetyCheck: PermissionSafetyCheckSchema.optional(),
  previewReadinessCheck: PreviewReadinessCheckSchema.optional(),

  /** Cross-artifact contradictions. */
  contradictions: z.array(
    z.object({
      key: z.string(),
      artifactA: z.string(),
      artifactB: z.string(),
      field: z.string(),
      valueA: z.string(),
      valueB: z.string(),
      severity: z.enum(["info", "warning", "error", "critical"]),
      message: z.string(),
    })
  ).default([]),

  /** Warnings (using shared Warning schema). */
  warnings: z.array(WarningSchema).default([]),
});

export type ValidationReport = z.infer<typeof ValidationReportSchema>;
