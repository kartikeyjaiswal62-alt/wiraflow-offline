/**
 * Wiraflow Contracts — Supabase Schema Plan
 *
 * Concrete Supabase resource definitions compiled from the BackendIntentGraph.
 * This is the "execution layer" — actual SQL, policies, buckets,
 * and function stubs that will be created in the target Supabase project.
 *
 * Blueprint reference: "Supabase Strategy" + WIR-006 spec
 */

import { z } from "zod";

import {
  ArtifactEnvelopeSchema,
  SourceLinkSchema,
  WarningSchema,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Column
// ---------------------------------------------------------------------------

export const ColumnPlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  type: z.string(),
  nullable: z.boolean().default(false),
  defaultExpression: z.string().optional(),
  isPrimaryKey: z.boolean().default(false),
  isGenerated: z.boolean().default(false),
  references: z
    .object({
      table: z.string(),
      column: z.string(),
      onDelete: z.enum(["cascade", "set_null", "restrict", "no_action"]).default("no_action"),
    })
    .optional(),
  isIndexed: z.boolean().default(false),
  isUnique: z.boolean().default(false),
  checkExpression: z.string().optional(),
  comment: z.string().optional(),
});
export type ColumnPlan = z.infer<typeof ColumnPlanSchema>;

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

export const IndexPlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  columns: z.array(z.string()),
  unique: z.boolean().default(false),
  method: z.enum(["btree", "hash", "gin", "gist"]).default("btree"),
  condition: z.string().optional(),
  comment: z.string().optional(),
});
export type IndexPlan = z.infer<typeof IndexPlanSchema>;

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const TablePlanSchema = z.object({
  key: z.string(),
  /** Deterministic table name (lowercase, snake_case). */
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  schema: z.string().default("public"),
  columns: z.array(ColumnPlanSchema),
  indexes: z.array(IndexPlanSchema).default([]),
  enableRls: z.boolean().default(true),
  comment: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type TablePlan = z.infer<typeof TablePlanSchema>;

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------

export const ViewPlanSchema = z.object({
  key: z.string(),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  schema: z.string().default("public"),
  /** SQL SELECT expression for the view. */
  selectExpression: z.string(),
  /** Whether this should be a materialized view. */
  materialized: z.boolean().default(false),
  comment: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type ViewPlan = z.infer<typeof ViewPlanSchema>;

// ---------------------------------------------------------------------------
// RLS Policy
// ---------------------------------------------------------------------------

export const RlsPolicyPlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  tableName: z.string(),
  operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE", "ALL"]),
  /** The USING clause expression. */
  usingExpression: z.string(),
  /** The WITH CHECK clause expression (for INSERT/UPDATE). */
  withCheckExpression: z.string().optional(),
  /** Which role this policy applies to. */
  role: z.string().default("authenticated"),
  comment: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type RlsPolicyPlan = z.infer<typeof RlsPolicyPlanSchema>;

// ---------------------------------------------------------------------------
// Enum Type
// ---------------------------------------------------------------------------

export const EnumPlanSchema = z.object({
  key: z.string(),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  schema: z.string().default("public"),
  values: z.array(z.string()).min(1),
  comment: z.string().optional(),
});
export type EnumPlan = z.infer<typeof EnumPlanSchema>;

// ---------------------------------------------------------------------------
// Storage Bucket
// ---------------------------------------------------------------------------

export const BucketPlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  public: z.boolean().default(false),
  allowedMimeTypes: z.array(z.string()).default([]),
  fileSizeLimit: z.number().optional(),
  /** RLS-style path policies for the bucket. */
  pathPolicies: z
    .array(
      z.object({
        operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
        expression: z.string(),
      })
    )
    .default([]),
  comment: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type BucketPlan = z.infer<typeof BucketPlanSchema>;

// ---------------------------------------------------------------------------
// Function / RPC
// ---------------------------------------------------------------------------

export const FunctionPlanSchema = z.object({
  key: z.string(),
  name: z.string().regex(/^[a-z][a-z0-9_]*$/),
  kind: z.enum(["rpc", "edge_function"]),
  schema: z.string().default("public"),
  /** Function language (plpgsql for RPC, typescript for edge). */
  language: z.enum(["plpgsql", "sql", "typescript"]),
  /** Parameter definitions. */
  params: z
    .array(
      z.object({
        name: z.string(),
        type: z.string(),
        default: z.string().optional(),
      })
    )
    .default([]),
  /** Return type. */
  returnType: z.string().default("void"),
  /** Security definer (runs as owner, not caller). */
  securityDefiner: z.boolean().default(false),
  /** Stub body — not full impl, just the contract. */
  bodyStub: z.string().optional(),
  comment: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type FunctionPlan = z.infer<typeof FunctionPlanSchema>;

// ---------------------------------------------------------------------------
// Migration Plan
// ---------------------------------------------------------------------------

export const MigrationStepSchema = z.object({
  key: z.string(),
  order: z.number(),
  description: z.string(),
  upSql: z.string(),
  downSql: z.string(),
});
export type MigrationStep = z.infer<typeof MigrationStepSchema>;

// ---------------------------------------------------------------------------
// Schema Validation
// ---------------------------------------------------------------------------

export const SchemaValidationSchema = z.object({
  tableCount: z.number(),
  viewCount: z.number(),
  policyCount: z.number(),
  enumCount: z.number(),
  bucketCount: z.number(),
  functionCount: z.number(),
  /** Issues that block migration execution. */
  blockingIssues: z.array(z.string()).default([]),
  /** Issues that should be reviewed but don't block. */
  warnings: z.array(WarningSchema).default([]),
  /** Is the schema ready to be applied? */
  migrationReady: z.boolean(),
});
export type SchemaValidation = z.infer<typeof SchemaValidationSchema>;

// ---------------------------------------------------------------------------
// Top-Level Supabase Schema Plan
// ---------------------------------------------------------------------------

export const SupabaseSchemaPlanSchema = ArtifactEnvelopeSchema.extend({
  projectId: z.string(),

  /** Enum types to create. */
  enums: z.array(EnumPlanSchema).default([]),

  /** Tables to create. */
  tables: z.array(TablePlanSchema).default([]),

  /** Views to create. */
  views: z.array(ViewPlanSchema).default([]),

  /** RLS policies to apply. */
  rlsPolicies: z.array(RlsPolicyPlanSchema).default([]),

  /** Storage buckets to create. */
  buckets: z.array(BucketPlanSchema).default([]),

  /** Functions (RPCs and edge functions). */
  functions: z.array(FunctionPlanSchema).default([]),

  /** Ordered migration steps. */
  migrationSteps: z.array(MigrationStepSchema).default([]),

  /** Validation summary. */
  validation: SchemaValidationSchema,
});

export type SupabaseSchemaPlan = z.infer<typeof SupabaseSchemaPlanSchema>;
