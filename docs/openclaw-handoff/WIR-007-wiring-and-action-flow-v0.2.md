# Wiring and Action Flow Spec

Target path: `/Users/ashutoshrao/.openclaw/workspaces/platform-builder-studio/specs/wiring-and-action-flow.md`
Task: `WIR-007`
Intended status: `draft v0.2`

## Purpose
The `WiringActionFlowPlan` is Wiraflow's execution-binding layer.
It converts `UISemanticGraph`, `BackendIntentGraph`, and `SupabaseSchemaPlan` into deterministic runtime plans for reads, writes, uploads, navigation, async work, and debug-visible transitions.

Its job is to make runtime behavior explicit without collapsing backend privilege boundaries or hiding execution steps in generated code.

## Stable Checkpoint For This Pass
This pass deepens the original draft by:
- making ordered flow steps first-class instead of implicit
- defining canonical mapping rules for page-load, detail-route, form-submit, upload-plus-metadata, and async-job flows
- separating client hints from server-enforced execution boundaries
- requiring preview/debug-visible instrumentation from the same wiring plan
- adding Supabase-specific rules for short transactions, indexed RLS-backed access, and function escalation

## Core Contract

```ts
export interface WiringActionFlowPlan {
  meta: WiringPlanMeta;
  sourceLinks: WiringSourceLink[];
  actionFlows: WiringActionFlow[];
  flowSteps: WiringFlowStep[];
  readBindings: WiringReadBinding[];
  mutationBindings: WiringMutationBinding[];
  uploadBindings: WiringUploadBinding[];
  functionBindings: WiringFunctionBinding[];
  navigationBindings: WiringNavigationBinding[];
  stateTransitions: WiringStateTransition[];
  debugBindings: WiringDebugBinding[];
  guards: WiringGuard[];
  unknowns: WiringUnknown[];
  validation: WiringPlanValidation;
}
```

## Top-Level Contracts

### `actionFlows`

```ts
export interface WiringActionFlow {
  key: string;
  actionKey: string;
  flowType:
    | "read"
    | "create"
    | "update"
    | "delete"
    | "upload"
    | "navigate"
    | "authenticate"
    | "invoke_async"
    | "mixed"
    | "unknown";
  trigger:
    | "button_press"
    | "form_submit"
    | "page_load"
    | "row_select"
    | "file_select"
    | "system_visible"
    | "custom";
  stepKeys: string[];
  successStateKeys?: string[];
  failureStateKeys?: string[];
  sourceLinkKeys: string[];
}
```

Rules:
- every executable UI action must resolve to exactly one primary flow
- flows may reuse bindings, but step order must remain local to the flow
- page-load and system-visible flows are first-class because they must appear in preview/debug timelines

### `flowSteps`

```ts
export interface WiringFlowStep {
  key: string;
  flowKey: string;
  stepType:
    | "guard_check"
    | "collect_input"
    | "query"
    | "mutate"
    | "upload"
    | "invoke_function"
    | "enqueue_job"
    | "await_result"
    | "emit_state"
    | "navigate"
    | "notify"
    | "custom";
  executionMode: "client_direct" | "server_enforced" | "background" | "unknown";
  bindingKey?: string;
  description: string;
  onFailure?: string;
}
```

Rules:
- step order must make privilege escalation visible
- `client_direct` is allowed only for reads, writes, or uploads already justified by upstream access and schema posture
- `server_enforced` is required when the action crosses RLS boundaries, needs privileged integrations, or spans multi-resource atomic work
- background work must be modeled explicitly through enqueue and status-followup steps, not hidden behind a generic function call

### `readBindings`

```ts
export interface WiringReadBinding {
  key: string;
  actionKey?: string;
  dataViewKey?: string;
  sourceType: "table" | "view" | "rpc" | "edge_function" | "unknown";
  sourceKey: string;
  accessMode: "single" | "list" | "scoped_list" | "aggregate" | "search" | "unknown";
  authContext: "anon" | "user_session" | "service_mediated" | "unknown";
  filterInputs?: WiringFilterInput[];
  sortMode?: "none" | "single_field" | "multi_field" | "unknown";
  paginationMode?: "none" | "offset_limit" | "cursor" | "unknown";
  consistencyNeed?: "eventual" | "read_after_write" | "unknown";
  sourceLinkKeys: string[];
}
```

Rules:
- prefer `view` for derived summaries and cross-table read models already planned in `SupabaseSchemaPlan`
- prefer `table` for direct entity reads when the resource is a base record and RLS/index posture is already explicit
- escalate to `rpc` or `edge_function` only when read semantics cannot be represented safely through views or table-backed queries
- filters derived from owner, team, or route scope must map to upstream lookup mode and indexed policy-support columns

### `mutationBindings`

```ts
export interface WiringMutationBinding {
  key: string;
  actionKey: string;
  mutationMode: "direct_table_write" | "rpc" | "edge_function" | "unknown";
  targetTableKey?: string;
  functionKey?: string;
  operation: "insert" | "update" | "upsert" | "delete" | "mixed" | "unknown";
  inputSources: Array<"form" | "route" | "session_actor" | "system_default" | "derived" | "unknown">;
  transactionNeed: "single_resource" | "multi_resource_atomic" | "eventual_side_effects" | "unknown";
  sourceLinkKeys: string[];
}
```

Rules:
- `direct_table_write` is valid only for single-resource mutations whose access profile can be enforced by table structure plus RLS
- `rpc` is preferred for Postgres-side atomic work spanning related writes inside one short transaction
- `edge_function` is preferred when the action needs external APIs, privileged secrets, or orchestration that must not occur inside a database transaction
- no mutation binding may combine long external calls with a lock-holding database transaction

### `uploadBindings`

```ts
export interface WiringUploadBinding {
  key: string;
  actionKey: string;
  bucketKey: string;
  uploadMode: "direct_to_storage" | "signed_url" | "server_brokered" | "unknown";
  pathInputs: Array<"owner_scope" | "tenant_scope" | "resource_id" | "timestamp" | "filename" | "unknown">;
  postUploadMutationBindingKey?: string;
  sourceLinkKeys: string[];
}
```

Rules:
- upload flows must separate blob transfer from metadata persistence
- signed or server-brokered upload is required whenever path creation or visibility cannot be trusted to the client alone
- if file metadata is attached to a record, the follow-up mutation must be explicit and independently failure-handled

### `functionBindings`

```ts
export interface WiringFunctionBinding {
  key: string;
  actionKey?: string;
  functionKey: string;
  invocationMode: "blocking" | "fire_and_forget" | "polling_followup" | "webhook_followup" | "unknown";
  reason: string;
  sourceLinkKeys: string[];
}
```

Rules:
- `blocking` is for user-waiting flows that need a synchronous result before navigation or success state
- `fire_and_forget` is valid only when user-visible completion is not required immediately
- `polling_followup` or `webhook_followup` must be used when an async job produces later-visible state

### `navigationBindings`

```ts
export interface WiringNavigationBinding {
  key: string;
  actionKey: string;
  routeKey: string;
  paramSources: Array<{
    paramKey: string;
    source: "mutation_result" | "selected_row" | "form_value" | "session_actor" | "literal" | "unknown";
  }>;
  navigationMode: "immediate" | "after_success" | "after_async_ack" | "blocked" | "unknown";
  sourceLinkKeys: string[];
}
```

Rules:
- a route param must trace to a concrete source or remain blocked
- navigation may not assume a created resource id exists before the mutation returns it
- protected routes require both route-level guards and server-enforced data access underneath

### `stateTransitions` and `debugBindings`

```ts
export interface WiringStateTransition {
  key: string;
  flowKey: string;
  fromStateKey?: string;
  toStateKey: string;
  triggerStepKey: string;
  visibility: "user_visible" | "debug_only" | "both";
  sourceLinkKeys: string[];
}

export interface WiringDebugBinding {
  key: string;
  flowKey: string;
  stepKey: string;
  channel: "preview_timeline" | "debug_rail" | "event_log" | "network_panel" | "state_panel";
  eventName: string;
  payloadSummary: string;
  visibility: "debug_only" | "both";
  sourceLinkKeys: string[];
}
```

Rules:
- every flow must emit at least one loading or started transition and at least one terminal transition
- failed guard, query, mutation, upload, and async followup states must be inspectable in debug surfaces
- preview/runtime tooling should read these bindings directly instead of inventing ad hoc logs later

## Canonical Mapping Rules

### 1. Page-load read flow
Default order:
1. `guard_check`
2. `emit_state` to loading
3. `query`
4. `emit_state` to data-ready, empty, unauthorized, or error
5. optional `notify`

Use this when a page, section, or system-visible surface depends on initial data.

### 2. Detail-route read flow
Default order:
1. `guard_check`
2. `collect_input` from route params
3. `query`
4. `emit_state`

Rules:
- route-param lookup must align with backend `routeLookupMode`
- owner-scoped or team-scoped lookups must remain scoped in the read binding, not reconstructed only in client code

### 3. Form-submit mutation flow
Default order:
1. `guard_check`
2. `collect_input`
3. `emit_state` to submitting
4. `mutate`
5. optional `query` for read-after-write refresh
6. optional `navigate`
7. `emit_state` to success or error

Rules:
- optimistic success may be shown only when the mutation mode and consistency posture make rollback explainable
- if the flow depends on generated ids or server-computed defaults, success navigation must wait for mutation confirmation

### 4. Upload plus metadata flow
Default order:
1. `guard_check`
2. `collect_input`
3. `upload`
4. `mutate` for metadata or attachment row
5. optional `query` refresh
6. `emit_state`

Rules:
- upload failure and metadata-write failure must be distinguishable
- if the uploaded object becomes orphaned after metadata failure, the plan should record whether cleanup is required or tolerated

### 5. Async invocation flow
Default order:
1. `guard_check`
2. `collect_input`
3. `invoke_function` or `enqueue_job`
4. `emit_state` to accepted or processing
5. optional `navigate`
6. `await_result` via polling or webhook-followup
7. `emit_state` to completed or failed

Rules:
- async flows must reference a backend async capability or function intent
- job state should map to persisted records when the backend graph or schema plan requires `job_record` persistence

## Guard, Auth, And Session Rules
- UI permission summaries become `client_hint` or `both`, never server-only assumptions
- access that depends on ownership, team membership, or organization membership must resolve to `server_enforced` guards or stay blocked
- `session_actor` may populate defaults and filters, but authorization must still be validated by RLS, RPC, or Edge Function boundaries
- anonymous flows are allowed only when upstream auth posture explicitly permits them

## Supabase Alignment Rules
- prefer table or view reads over function reads when the schema layer already exposes a safe read model
- RLS-backed filters should align with indexed owner, tenant, membership, or lookup columns
- RPC is the preferred boundary for short, atomic, database-native write orchestration
- Edge Functions are the preferred boundary for privileged secrets, third-party APIs, or long-running orchestration
- read-after-write refresh should prefer returned payloads or a targeted refetch, not a broad page reload
- long-running effects must not be hidden inside synchronous mutations

## Validation Contract

```ts
export interface WiringPlanValidation {
  actionFlowCount: number;
  flowStepCount: number;
  readBindingCount: number;
  mutationBindingCount: number;
  uploadBindingCount: number;
  functionBindingCount: number;
  navigationBindingCount: number;
  debugBindingCount: number;
  highImpactUnknownCount: number;
  contradictionsWithUISemanticGraph: string[];
  contradictionsWithBackendIntentGraph: string[];
  contradictionsWithSupabaseSchemaPlan: string[];
  warnings: string[];
  reviewRequired: boolean;
  executionReady: boolean;
}
```

Execution readiness rules:
- `false` if a flow requires a blocked schema structure, unknown auth basis, or unresolved route-param source
- `false` if a mutation needs multi-resource atomicity but no RPC or server-enforced function boundary exists
- `false` if debug-visible terminal states are missing for user-visible flows

## Acceptance Criteria For This Checkpoint
The spec is acceptable for the next downstream pass when it:
1. maps page-load, route-detail, form-submit, upload, and async flows concretely
2. keeps step ordering explicit and reviewable
3. preserves client hint vs server enforcement boundaries
4. keeps debug and preview instrumentation in the same contract
5. blocks unsafe runtime generation when schema, auth, or route evidence is incomplete

## Intended Queue Checkpoint Text
`draft v0.2 strengthened on 2026-04-03 with first-class ordered flow steps, canonical read/mutation/upload/async mapping patterns, explicit auth and privilege boundaries, debug binding requirements, and Supabase-aligned execution rules`
