/**
 * @wiraflow/contracts
 *
 * Canonical Zod-validated TypeScript contracts for all Wiraflow artifacts.
 * Every artifact in the pipeline — from intent capture through debug traces —
 * is defined, validated, and typed here.
 */

// Shared foundation types
export {
  ArtifactEnvelopeSchema,
  ConfidenceLevelSchema,
  SourceLinkSchema,
  TimestampSchema,
  UnknownEntrySchema,
  VersionSchema,
  WarningSchema,
  type ArtifactEnvelope,
  type ConfidenceLevel,
  type SourceLink,
  type UnknownEntry,
  type Warning,
} from "./shared.js";

// App Intent Spec
export {
  AppIntentSpecSchema,
  AsyncJobSchema,
  ConstraintSchema,
  DomainEntitySchema,
  EntityFieldSchema,
  EntityRelationshipSchema,
  FileMediaNeedSchema,
  IntegrationNeedSchema,
  PageCatalogEntrySchema,
  RoleSchema,
  WorkflowSchema,
  WorkflowStepSchema,
  type AppIntentSpec,
  type AsyncJob,
  type Constraint,
  type DomainEntity,
  type EntityField,
  type EntityRelationship,
  type FileMediaNeed,
  type IntegrationNeed,
  type PageCatalogEntry,
  type Role,
  type Workflow,
  type WorkflowStep,
} from "./app-intent-spec.js";

// UI Semantic Graph
export {
  ActionOperationSchema,
  DataAccessPatternSchema,
  NavigationEdgeSchema,
  PageNodeSchema,
  PageTypeSchema,
  RouteParamSchema,
  RouteSchema,
  SectionSchema,
  UISemanticGraphSchema,
  WidgetNodeSchema,
  WidgetSemanticRoleSchema,
  type ActionOperation,
  type DataAccessPattern,
  type NavigationEdge,
  type PageNode,
  type PageType,
  type Route,
  type RouteParam,
  type Section,
  type UISemanticGraph,
  type WidgetNode,
  type WidgetSemanticRole,
} from "./ui-semantic-graph.js";

// Backend Intent Graph
export {
  AccessProfileSchema,
  AsyncJobIntentSchema,
  BackendIntentGraphSchema,
  EntityFieldIntentSchema,
  EntityIntentSchema,
  EntityRelationIntentSchema,
  EntityStatusMachineSchema,
  FunctionIntentSchema,
  IdentityModelSchema,
  StorageIntentSchema,
  type AccessProfile,
  type AsyncJobIntent,
  type BackendIntentGraph,
  type EntityFieldIntent,
  type EntityIntent,
  type EntityRelationIntent,
  type EntityStatusMachine,
  type FunctionIntent,
  type IdentityModel,
  type StorageIntent,
} from "./backend-intent-graph.js";

// Supabase Schema Plan
export {
  BucketPlanSchema,
  ColumnPlanSchema,
  EnumPlanSchema,
  FunctionPlanSchema,
  IndexPlanSchema,
  MigrationStepSchema,
  RlsPolicyPlanSchema,
  SchemaValidationSchema,
  SupabaseSchemaPlanSchema,
  TablePlanSchema,
  ViewPlanSchema,
  type BucketPlan,
  type ColumnPlan,
  type EnumPlan,
  type FunctionPlan,
  type IndexPlan,
  type MigrationStep,
  type RlsPolicyPlan,
  type SchemaValidation,
  type SupabaseSchemaPlan,
  type TablePlan,
  type ViewPlan,
} from "./supabase-schema-plan.js";

// Wiring Action Flow Plan
export {
  WiringActionFlowPlanSchema,
  WiringActionFlowSchema,
  WiringDebugBindingSchema,
  WiringFilterInputSchema,
  WiringFlowStepSchema,
  WiringFunctionBindingSchema,
  WiringGuardSchema,
  WiringMutationBindingSchema,
  WiringNavigationBindingSchema,
  WiringPlanMetaSchema,
  WiringPlanValidationSchema,
  WiringReadBindingSchema,
  WiringSourceLinkSchema,
  WiringStateTransitionSchema,
  WiringUnknownSchema,
  WiringUploadBindingSchema,
  type WiringActionFlow,
  type WiringActionFlowPlan,
  type WiringDebugBinding,
  type WiringFilterInput,
  type WiringFlowStep,
  type WiringFunctionBinding,
  type WiringGuard,
  type WiringMutationBinding,
  type WiringNavigationBinding,
  type WiringPlanMeta,
  type WiringPlanValidation,
  type WiringReadBinding,
  type WiringSourceLink,
  type WiringStateTransition,
  type WiringUnknown,
  type WiringUploadBinding,
} from "./wiring-action-flow-plan.js";

// Preview Trace Envelope & Debug Events
export {
  DebugEventSchema,
  DebugEventTypeSchema,
  DebugSessionArtifactSchema,
  PreviewModeSchema,
  PreviewSessionSchema,
  PreviewTraceEnvelopeSchema,
  type DebugEvent,
  type DebugEventType,
  type DebugSessionArtifact,
  type PreviewMode,
  type PreviewSession,
  type PreviewTraceEnvelope,
} from "./preview-trace-envelope.js";

// Validation Report
export {
  BackendSchemaCheckSchema,
  DesignParsingCheckSchema,
  PermissionSafetyCheckSchema,
  PreviewReadinessCheckSchema,
  ValidationCategorySchema,
  ValidationIssueSchema,
  ValidationReportSchema,
  WiringConsistencyCheckSchema,
  type ValidationCategory,
  type ValidationIssue,
  type ValidationReport,
} from "./validation-report.js";
