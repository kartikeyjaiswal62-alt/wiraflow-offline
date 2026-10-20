/**
 * Wiraflow Contracts — App Intent Spec
 *
 * The canonical source of truth for what the app should do.
 * This artifact must exist before Designer prompting, backend generation,
 * wiring generation, or preview runtime generation.
 *
 * Blueprint reference: "Canonical Source of Truth" section
 */

import { z } from "zod";

import {
  ArtifactEnvelopeSchema,
  ConfidenceLevelSchema,
  SourceLinkSchema,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

export const RoleSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()).default([]),
  isDefault: z.boolean().default(false),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type Role = z.infer<typeof RoleSchema>;

export const EntityFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum([
    "string",
    "text",
    "integer",
    "float",
    "boolean",
    "date",
    "datetime",
    "timestamp",
    "enum",
    "json",
    "uuid",
    "url",
    "email",
    "file_ref",
  ]),
  enumValues: z.array(z.string()).optional(),
  required: z.boolean().default(true),
  description: z.string().optional(),
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const EntityRelationshipSchema = z.object({
  targetEntity: z.string(),
  type: z.enum(["one_to_one", "one_to_many", "many_to_many"]),
  label: z.string().optional(),
  ownershipImplied: z.boolean().default(false),
});
export type EntityRelationship = z.infer<typeof EntityRelationshipSchema>;

export const DomainEntitySchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  fields: z.array(EntityFieldSchema).default([]),
  relationships: z.array(EntityRelationshipSchema).default([]),
  lifecycle: z
    .object({
      hasStatusField: z.boolean().default(false),
      statusValues: z.array(z.string()).default([]),
    })
    .optional(),
  ownershipModel: z
    .enum(["user_owned", "team_owned", "org_owned", "public", "system"])
    .default("user_owned"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
  confidence: ConfidenceLevelSchema.default("medium"),
});
export type DomainEntity = z.infer<typeof DomainEntitySchema>;

export const PageCatalogEntrySchema = z.object({
  key: z.string(),
  label: z.string(),
  purpose: z.string(),
  pageType: z.enum([
    "dashboard",
    "list",
    "detail",
    "form",
    "upload_process",
    "settings",
    "auth",
    "custom",
  ]),
  relatedEntities: z.array(z.string()).default([]),
  requiredRoles: z.array(z.string()).default([]),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type PageCatalogEntry = z.infer<typeof PageCatalogEntrySchema>;

export const WorkflowStepSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  type: z.enum([
    "user_action",
    "system_action",
    "background_job",
    "external_call",
    "condition",
    "wait",
  ]),
  nextStepKeys: z.array(z.string()).default([]),
});
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;

export const WorkflowSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  triggerType: z.enum([
    "user_initiated",
    "system_event",
    "scheduled",
    "webhook",
  ]),
  steps: z.array(WorkflowStepSchema).default([]),
  relatedEntities: z.array(z.string()).default([]),
  relatedPages: z.array(z.string()).default([]),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const AsyncJobSchema = z.object({
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
  inputEntities: z.array(z.string()).default([]),
  outputEntities: z.array(z.string()).default([]),
  estimatedDuration: z
    .enum(["instant", "seconds", "minutes", "hours", "unknown"])
    .default("unknown"),
  requiresExternalApi: z.boolean().default(false),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type AsyncJob = z.infer<typeof AsyncJobSchema>;

export const FileMediaNeedSchema = z.object({
  key: z.string(),
  label: z.string(),
  purpose: z.string(),
  allowedTypes: z.array(z.string()).default([]),
  maxSizeMb: z.number().optional(),
  relatedEntity: z.string().optional(),
  accessScope: z.enum(["public", "user_private", "team_scoped", "admin_only"]).default("user_private"),
});
export type FileMediaNeed = z.infer<typeof FileMediaNeedSchema>;

export const IntegrationNeedSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  type: z.enum(["api", "webhook", "oauth", "database", "file_storage", "email", "sms", "push_notification", "other"]),
  required: z.boolean().default(true),
});
export type IntegrationNeed = z.infer<typeof IntegrationNeedSchema>;

export const ConstraintSchema = z.object({
  key: z.string(),
  description: z.string(),
  type: z.enum(["business_rule", "technical", "regulatory", "ux", "performance", "security"]),
  relatedEntities: z.array(z.string()).default([]),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type Constraint = z.infer<typeof ConstraintSchema>;

// ---------------------------------------------------------------------------
// Top-Level App Intent Spec
// ---------------------------------------------------------------------------

export const AppIntentSpecSchema = ArtifactEnvelopeSchema.extend({
  /** Project-unique identifier. */
  projectId: z.string(),

  /** The raw user brief that started everything. */
  originalPrompt: z.string(),

  /** App identity. */
  appName: z.string(),
  appDescription: z.string(),
  domain: z.string(),

  /** High-level goal statement. */
  appGoal: z.string(),

  /** User roles. */
  roles: z.array(RoleSchema).min(1),

  /** Domain entities. */
  entities: z.array(DomainEntitySchema).default([]),

  /** Page catalog. */
  pageCatalog: z.array(PageCatalogEntrySchema).default([]),

  /** Workflows. */
  workflows: z.array(WorkflowSchema).default([]),

  /** Async jobs. */
  asyncJobs: z.array(AsyncJobSchema).default([]),

  /** File/media needs. */
  fileMediaNeeds: z.array(FileMediaNeedSchema).default([]),

  /** Integration needs. */
  integrationNeeds: z.array(IntegrationNeedSchema).default([]),

  /** Constraints and business rules. */
  constraints: z.array(ConstraintSchema).default([]),

  /** Things this app explicitly will NOT do. */
  nonGoals: z.array(z.string()).default([]),

  /** Assumptions made during intent compilation. */
  assumptions: z.array(z.string()).default([]),
});

export type AppIntentSpec = z.infer<typeof AppIntentSpecSchema>;
