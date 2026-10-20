/**
 * Wiraflow Contracts — Backend Intent Graph
 *
 * Represents the intended backend structure implied by app goals,
 * page semantics, workflows, and domain relationships.
 *
 * Blueprint reference: "Backend Intent Graph" + "Backend Planning Rules"
 * WIR-005 spec
 */

import { z } from "zod";

import {
  ArtifactEnvelopeSchema,
  ConfidenceLevelSchema,
  SourceLinkSchema,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Identity & Access
// ---------------------------------------------------------------------------

export const IdentityModelSchema = z.object({
  /** How users are identified. */
  authProvider: z.enum(["supabase_auth", "custom", "external", "none"]),
  /** Identity table key (usually maps to auth.users). */
  identityTableKey: z.string().optional(),
  /** Profile table key if separate from identity. */
  profileTableKey: z.string().optional(),
  /** Whether teams/orgs exist. */
  hasTeams: z.boolean().default(false),
  /** Whether multi-tenancy is needed. */
  hasMultiTenancy: z.boolean().default(false),
  /** Membership model. */
  membershipModel: z
    .enum(["flat", "role_based", "hierarchical", "none"])
    .default("flat"),
});
export type IdentityModel = z.infer<typeof IdentityModelSchema>;

export const AccessProfileSchema = z.object({
  key: z.string(),
  entityKey: z.string(),
  /** Who can see this entity's data. */
  rowVisibilityBasis: z.enum([
    "public",
    "owner_only",
    "team_scoped",
    "org_scoped",
    "role_gated",
    "admin_only",
    "custom",
    "unknown",
  ]),
  /** Column used for owner-scoping. */
  ownerColumn: z.string().optional(),
  /** Column used for team/org-scoping. */
  scopeColumn: z.string().optional(),
  /** Role required for access, if role-gated. */
  requiredRole: z.string().optional(),
  /** Operations allowed. */
  operations: z.object({
    select: z.boolean().default(true),
    insert: z.boolean().default(false),
    update: z.boolean().default(false),
    delete: z.boolean().default(false),
  }),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type AccessProfile = z.infer<typeof AccessProfileSchema>;

// ---------------------------------------------------------------------------
// Entity Intent
// ---------------------------------------------------------------------------

export const EntityFieldIntentSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum([
    "uuid",
    "text",
    "varchar",
    "integer",
    "bigint",
    "float",
    "numeric",
    "boolean",
    "date",
    "timestamp",
    "timestamptz",
    "jsonb",
    "enum",
    "array",
    "bytea",
  ]),
  nullable: z.boolean().default(false),
  defaultValue: z.string().optional(),
  enumValues: z.array(z.string()).optional(),
  isPrimaryKey: z.boolean().default(false),
  isForeignKey: z.boolean().default(false),
  foreignKeyTarget: z
    .object({
      entityKey: z.string(),
      fieldKey: z.string(),
    })
    .optional(),
  isIndexed: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  description: z.string().optional(),
});
export type EntityFieldIntent = z.infer<typeof EntityFieldIntentSchema>;

export const EntityRelationIntentSchema = z.object({
  key: z.string(),
  fromEntityKey: z.string(),
  toEntityKey: z.string(),
  type: z.enum(["one_to_one", "one_to_many", "many_to_many"]),
  foreignKeyFieldKey: z.string(),
  /** If M:N, the join table key. */
  joinTableKey: z.string().optional(),
  cascadeDelete: z.boolean().default(false),
  description: z.string().optional(),
});
export type EntityRelationIntent = z.infer<typeof EntityRelationIntentSchema>;

export const EntityStatusMachineSchema = z.object({
  entityKey: z.string(),
  statusFieldKey: z.string(),
  states: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      isInitial: z.boolean().default(false),
      isTerminal: z.boolean().default(false),
    })
  ),
  transitions: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      trigger: z.string().optional(),
      guardDescription: z.string().optional(),
    })
  ),
});
export type EntityStatusMachine = z.infer<typeof EntityStatusMachineSchema>;

export const EntityIntentSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  /** Whether this is a base table, a view, or a join table. */
  kind: z.enum(["table", "view", "join_table", "materialized_view"]),
  fields: z.array(EntityFieldIntentSchema).default([]),
  /** Audit fields automatically included. */
  auditFields: z.object({
    hasId: z.boolean().default(true),
    hasCreatedAt: z.boolean().default(true),
    hasUpdatedAt: z.boolean().default(true),
    hasCreatedBy: z.boolean().default(false),
  }),
  /** Ownership model. */
  ownershipModel: z
    .enum(["user_owned", "team_owned", "org_owned", "public", "system"])
    .default("user_owned"),
  /** Route lookup modes — how this entity is typically fetched. */
  routeLookupMode: z
    .enum(["by_id", "by_owner", "by_team", "by_slug", "by_composite", "unknown"])
    .default("by_id"),
  /** Status machine if this entity has lifecycle states. */
  statusMachine: EntityStatusMachineSchema.optional(),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type EntityIntent = z.infer<typeof EntityIntentSchema>;

// ---------------------------------------------------------------------------
// Storage Intent
// ---------------------------------------------------------------------------

export const StorageIntentSchema = z.object({
  key: z.string(),
  bucketName: z.string(),
  purpose: z.string(),
  accessScope: z.enum(["public", "user_private", "team_scoped", "admin_only"]),
  allowedMimeTypes: z.array(z.string()).default([]),
  maxFileSizeMb: z.number().optional(),
  pathTemplate: z.string().optional(),
  relatedEntityKey: z.string().optional(),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type StorageIntent = z.infer<typeof StorageIntentSchema>;

// ---------------------------------------------------------------------------
// Function Intent
// ---------------------------------------------------------------------------

export const FunctionIntentSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  /** RPC (short atomic DB work) vs Edge Function (external APIs, long-running). */
  kind: z.enum(["rpc", "edge_function"]),
  /** Why this needs to be a function rather than direct table access. */
  reason: z.string(),
  inputContract: z
    .array(
      z.object({
        key: z.string(),
        type: z.string(),
        required: z.boolean().default(true),
      })
    )
    .default([]),
  outputContract: z
    .array(
      z.object({
        key: z.string(),
        type: z.string(),
      })
    )
    .default([]),
  /** Does this function need elevated privileges? */
  needsServiceRole: z.boolean().default(false),
  /** Does this function call external APIs? */
  hasExternalCalls: z.boolean().default(false),
  /** Transaction boundary. */
  transactionBoundary: z
    .enum(["single_statement", "short_transaction", "no_transaction", "unknown"])
    .default("unknown"),
  relatedEntityKeys: z.array(z.string()).default([]),
  relatedAsyncJobKey: z.string().optional(),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type FunctionIntent = z.infer<typeof FunctionIntentSchema>;

// ---------------------------------------------------------------------------
// Async Job Intent
// ---------------------------------------------------------------------------

export const AsyncJobIntentSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  triggerType: z.enum([
    "user_action",
    "entity_change",
    "scheduled",
    "webhook",
    "system_event",
  ]),
  /** Whether job state should be persisted as a record. */
  requiresJobRecord: z.boolean().default(false),
  /** Entity key for the job record table if persisted. */
  jobRecordEntityKey: z.string().optional(),
  /** Status field on the source entity to update. */
  sourceEntityKey: z.string().optional(),
  sourceStatusFieldKey: z.string().optional(),
  /** Estimated duration. */
  estimatedDuration: z
    .enum(["instant", "seconds", "minutes", "hours", "unknown"])
    .default("unknown"),
  /** Function that implements this job. */
  implementingFunctionKey: z.string().optional(),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type AsyncJobIntent = z.infer<typeof AsyncJobIntentSchema>;

// ---------------------------------------------------------------------------
// Top-Level Backend Intent Graph
// ---------------------------------------------------------------------------

export const BackendIntentGraphSchema = ArtifactEnvelopeSchema.extend({
  projectId: z.string(),

  /** Identity and auth model. */
  identityModel: IdentityModelSchema,

  /** All backend entities. */
  entities: z.array(EntityIntentSchema).default([]),

  /** Relations between entities. */
  relations: z.array(EntityRelationIntentSchema).default([]),

  /** Access profiles (RLS intent). */
  accessProfiles: z.array(AccessProfileSchema).default([]),

  /** Storage bucket intents. */
  storageIntents: z.array(StorageIntentSchema).default([]),

  /** Function intents (RPCs and edge functions). */
  functionIntents: z.array(FunctionIntentSchema).default([]),

  /** Async job intents. */
  asyncJobIntents: z.array(AsyncJobIntentSchema).default([]),
});

export type BackendIntentGraph = z.infer<typeof BackendIntentGraphSchema>;
