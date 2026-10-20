/**
 * Wiraflow Contracts — Wiring Action Flow Plan
 *
 * The execution-binding layer that converts UISemanticGraph, BackendIntentGraph,
 * and SupabaseSchemaPlan into deterministic runtime plans for reads, writes,
 * uploads, navigation, async work, and debug-visible transitions.
 *
 * Direct port of the WIR-007 spec contracts into Zod-validated schemas.
 *
 * Blueprint reference: "Wiring Generation" stage + WIR-007 spec
 */

import { z } from "zod";

import {
  ArtifactEnvelopeSchema,
  SourceLinkSchema,
  WarningSchema,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export const WiringPlanMetaSchema = z.object({
  projectId: z.string(),
  appIntentSpecVersion: z.string(),
  uiSemanticGraphVersion: z.string(),
  backendIntentGraphVersion: z.string(),
  supabaseSchemaPlanVersion: z.string(),
});
export type WiringPlanMeta = z.infer<typeof WiringPlanMetaSchema>;

// ---------------------------------------------------------------------------
// Source Link (wiring-specific, wraps the shared SourceLink)
// ---------------------------------------------------------------------------

export const WiringSourceLinkSchema = z.object({
  key: z.string(),
  artifact: z.enum([
    "AppIntentSpec",
    "UISemanticGraph",
    "BackendIntentGraph",
    "SupabaseSchemaPlan",
  ]),
  artifactKey: z.string(),
  fieldPath: z.string().optional(),
  reason: z.string().optional(),
});
export type WiringSourceLink = z.infer<typeof WiringSourceLinkSchema>;

// ---------------------------------------------------------------------------
// Action Flows
// ---------------------------------------------------------------------------

export const WiringActionFlowSchema = z.object({
  key: z.string(),
  actionKey: z.string(),
  flowType: z.enum([
    "read",
    "create",
    "update",
    "delete",
    "upload",
    "navigate",
    "authenticate",
    "invoke_async",
    "mixed",
    "unknown",
  ]),
  trigger: z.enum([
    "button_press",
    "form_submit",
    "page_load",
    "row_select",
    "file_select",
    "system_visible",
    "custom",
  ]),
  stepKeys: z.array(z.string()),
  successStateKeys: z.array(z.string()).default([]),
  failureStateKeys: z.array(z.string()).default([]),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringActionFlow = z.infer<typeof WiringActionFlowSchema>;

// ---------------------------------------------------------------------------
// Flow Steps
// ---------------------------------------------------------------------------

export const WiringFlowStepSchema = z.object({
  key: z.string(),
  flowKey: z.string(),
  stepType: z.enum([
    "guard_check",
    "collect_input",
    "query",
    "mutate",
    "upload",
    "invoke_function",
    "enqueue_job",
    "await_result",
    "emit_state",
    "navigate",
    "notify",
    "custom",
  ]),
  executionMode: z.enum([
    "client_direct",
    "server_enforced",
    "background",
    "unknown",
  ]),
  bindingKey: z.string().optional(),
  description: z.string(),
  onFailure: z.string().optional(),
});
export type WiringFlowStep = z.infer<typeof WiringFlowStepSchema>;

// ---------------------------------------------------------------------------
// Filter Input (shared by read bindings)
// ---------------------------------------------------------------------------

export const WiringFilterInputSchema = z.object({
  fieldKey: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in", "like", "ilike", "is_null", "not_null"]),
  source: z.enum(["route_param", "session_actor", "form_value", "state_var", "literal", "derived", "unknown"]),
  sourceKey: z.string().optional(),
  literalValue: z.unknown().optional(),
});
export type WiringFilterInput = z.infer<typeof WiringFilterInputSchema>;

// ---------------------------------------------------------------------------
// Read Bindings
// ---------------------------------------------------------------------------

export const WiringReadBindingSchema = z.object({
  key: z.string(),
  actionKey: z.string().optional(),
  dataViewKey: z.string().optional(),
  sourceType: z.enum(["table", "view", "rpc", "edge_function", "unknown"]),
  sourceKey: z.string(),
  accessMode: z.enum([
    "single",
    "list",
    "scoped_list",
    "aggregate",
    "search",
    "unknown",
  ]),
  authContext: z.enum([
    "anon",
    "user_session",
    "service_mediated",
    "unknown",
  ]),
  filterInputs: z.array(WiringFilterInputSchema).default([]),
  sortMode: z
    .enum(["none", "single_field", "multi_field", "unknown"])
    .default("none"),
  paginationMode: z
    .enum(["none", "offset_limit", "cursor", "unknown"])
    .default("none"),
  consistencyNeed: z
    .enum(["eventual", "read_after_write", "unknown"])
    .default("eventual"),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringReadBinding = z.infer<typeof WiringReadBindingSchema>;

// ---------------------------------------------------------------------------
// Mutation Bindings
// ---------------------------------------------------------------------------

export const WiringMutationBindingSchema = z.object({
  key: z.string(),
  actionKey: z.string(),
  mutationMode: z.enum([
    "direct_table_write",
    "rpc",
    "edge_function",
    "unknown",
  ]),
  targetTableKey: z.string().optional(),
  functionKey: z.string().optional(),
  operation: z.enum([
    "insert",
    "update",
    "upsert",
    "delete",
    "mixed",
    "unknown",
  ]),
  inputSources: z.array(
    z.enum([
      "form",
      "route",
      "session_actor",
      "system_default",
      "derived",
      "unknown",
    ])
  ),
  transactionNeed: z.enum([
    "single_resource",
    "multi_resource_atomic",
    "eventual_side_effects",
    "unknown",
  ]),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringMutationBinding = z.infer<typeof WiringMutationBindingSchema>;

// ---------------------------------------------------------------------------
// Upload Bindings
// ---------------------------------------------------------------------------

export const WiringUploadBindingSchema = z.object({
  key: z.string(),
  actionKey: z.string(),
  bucketKey: z.string(),
  uploadMode: z.enum([
    "direct_to_storage",
    "signed_url",
    "server_brokered",
    "unknown",
  ]),
  pathInputs: z.array(
    z.enum([
      "owner_scope",
      "tenant_scope",
      "resource_id",
      "timestamp",
      "filename",
      "unknown",
    ])
  ),
  postUploadMutationBindingKey: z.string().optional(),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringUploadBinding = z.infer<typeof WiringUploadBindingSchema>;

// ---------------------------------------------------------------------------
// Function Bindings
// ---------------------------------------------------------------------------

export const WiringFunctionBindingSchema = z.object({
  key: z.string(),
  actionKey: z.string().optional(),
  functionKey: z.string(),
  invocationMode: z.enum([
    "blocking",
    "fire_and_forget",
    "polling_followup",
    "webhook_followup",
    "unknown",
  ]),
  reason: z.string(),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringFunctionBinding = z.infer<typeof WiringFunctionBindingSchema>;

// ---------------------------------------------------------------------------
// Navigation Bindings
// ---------------------------------------------------------------------------

export const WiringNavigationBindingSchema = z.object({
  key: z.string(),
  actionKey: z.string(),
  routeKey: z.string(),
  paramSources: z.array(
    z.object({
      paramKey: z.string(),
      source: z.enum([
        "mutation_result",
        "selected_row",
        "form_value",
        "session_actor",
        "literal",
        "unknown",
      ]),
    })
  ),
  navigationMode: z.enum([
    "immediate",
    "after_success",
    "after_async_ack",
    "blocked",
    "unknown",
  ]),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringNavigationBinding = z.infer<typeof WiringNavigationBindingSchema>;

// ---------------------------------------------------------------------------
// State Transitions
// ---------------------------------------------------------------------------

export const WiringStateTransitionSchema = z.object({
  key: z.string(),
  flowKey: z.string(),
  fromStateKey: z.string().optional(),
  toStateKey: z.string(),
  triggerStepKey: z.string(),
  visibility: z.enum(["user_visible", "debug_only", "both"]),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringStateTransition = z.infer<typeof WiringStateTransitionSchema>;

// ---------------------------------------------------------------------------
// Debug Bindings
// ---------------------------------------------------------------------------

export const WiringDebugBindingSchema = z.object({
  key: z.string(),
  flowKey: z.string(),
  stepKey: z.string(),
  channel: z.enum([
    "preview_timeline",
    "debug_rail",
    "event_log",
    "network_panel",
    "state_panel",
  ]),
  eventName: z.string(),
  payloadSummary: z.string(),
  visibility: z.enum(["debug_only", "both"]),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringDebugBinding = z.infer<typeof WiringDebugBindingSchema>;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

export const WiringGuardSchema = z.object({
  key: z.string(),
  flowKey: z.string(),
  guardType: z.enum([
    "auth_required",
    "role_required",
    "ownership_required",
    "team_membership_required",
    "custom_condition",
    "unknown",
  ]),
  enforcement: z.enum(["client_hint", "server_enforced", "both"]),
  condition: z.string(),
  failureAction: z.string().optional(),
  sourceLinkKeys: z.array(z.string()),
});
export type WiringGuard = z.infer<typeof WiringGuardSchema>;

// ---------------------------------------------------------------------------
// Unknowns (wiring-specific)
// ---------------------------------------------------------------------------

export const WiringUnknownSchema = z.object({
  key: z.string(),
  category: z.enum([
    "unresolved_binding",
    "missing_schema",
    "ambiguous_action",
    "blocked_navigation",
    "unknown_auth_basis",
    "missing_function",
    "other",
  ]),
  severity: z.enum(["blocking", "degrading", "informational"]),
  summary: z.string(),
  affectedFlowKeys: z.array(z.string()).default([]),
  suggestedAction: z.string().optional(),
});
export type WiringUnknown = z.infer<typeof WiringUnknownSchema>;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const WiringPlanValidationSchema = z.object({
  actionFlowCount: z.number(),
  flowStepCount: z.number(),
  readBindingCount: z.number(),
  mutationBindingCount: z.number(),
  uploadBindingCount: z.number(),
  functionBindingCount: z.number(),
  navigationBindingCount: z.number(),
  debugBindingCount: z.number(),
  highImpactUnknownCount: z.number(),
  contradictionsWithUISemanticGraph: z.array(z.string()).default([]),
  contradictionsWithBackendIntentGraph: z.array(z.string()).default([]),
  contradictionsWithSupabaseSchemaPlan: z.array(z.string()).default([]),
  warnings: z.array(WarningSchema).default([]),
  reviewRequired: z.boolean(),
  executionReady: z.boolean(),
});
export type WiringPlanValidation = z.infer<typeof WiringPlanValidationSchema>;

// ---------------------------------------------------------------------------
// Top-Level Wiring Action Flow Plan
// ---------------------------------------------------------------------------

export const WiringActionFlowPlanSchema = ArtifactEnvelopeSchema.extend({
  meta: WiringPlanMetaSchema,
  sourceLinks: z.array(WiringSourceLinkSchema).default([]),
  actionFlows: z.array(WiringActionFlowSchema).default([]),
  flowSteps: z.array(WiringFlowStepSchema).default([]),
  readBindings: z.array(WiringReadBindingSchema).default([]),
  mutationBindings: z.array(WiringMutationBindingSchema).default([]),
  uploadBindings: z.array(WiringUploadBindingSchema).default([]),
  functionBindings: z.array(WiringFunctionBindingSchema).default([]),
  navigationBindings: z.array(WiringNavigationBindingSchema).default([]),
  stateTransitions: z.array(WiringStateTransitionSchema).default([]),
  debugBindings: z.array(WiringDebugBindingSchema).default([]),
  guards: z.array(WiringGuardSchema).default([]),
  unknowns: z.array(WiringUnknownSchema).default([]),
  validation: WiringPlanValidationSchema,
});

export type WiringActionFlowPlan = z.infer<typeof WiringActionFlowPlanSchema>;
