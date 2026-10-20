/**
 * Wiraflow Contracts — Preview Trace Envelope & Debug Events
 *
 * Defines the event model for preview/debug sessions.
 * The platform should let users see and inspect the app while it runs,
 * with step-by-step explainability.
 *
 * Blueprint reference: "Preview and Debug Experience" section
 */

import { z } from "zod";

import { ArtifactEnvelopeSchema, SourceLinkSchema } from "./shared.js";

// ---------------------------------------------------------------------------
// Debug Event Types
// ---------------------------------------------------------------------------

export const DebugEventTypeSchema = z.enum([
  // Query lifecycle
  "query_started",
  "query_completed",
  "query_failed",

  // Mutation lifecycle
  "mutation_started",
  "mutation_completed",
  "mutation_failed",

  // Upload lifecycle
  "upload_started",
  "upload_progress",
  "upload_completed",
  "upload_failed",

  // Function lifecycle
  "function_called",
  "function_response",
  "function_failed",

  // Navigation
  "navigation_triggered",
  "navigation_completed",

  // State
  "variable_changed",
  "state_transition",

  // Async
  "polling_tick",
  "polling_completed",
  "job_enqueued",
  "job_status_changed",

  // Guard
  "guard_passed",
  "guard_failed",

  // System
  "retry_event",
  "error_caught",
  "action_step_started",
  "action_step_completed",
  "action_step_failed",

  // Flow lifecycle
  "flow_started",
  "flow_completed",
  "flow_failed",
]);
export type DebugEventType = z.infer<typeof DebugEventTypeSchema>;

// ---------------------------------------------------------------------------
// Debug Event
// ---------------------------------------------------------------------------

export const DebugEventSchema = z.object({
  /** Unique event ID. */
  eventId: z.string(),
  /** Session this event belongs to. */
  sessionId: z.string(),
  /** When this event occurred. */
  timestamp: z.string().datetime({ offset: true }),
  /** Event type. */
  eventType: DebugEventTypeSchema,
  /** Which flow produced this event. */
  flowKey: z.string().optional(),
  /** Which step within the flow. */
  stepKey: z.string().optional(),
  /** The source widget or component that triggered this. */
  source: z.string().optional(),
  /** Human-readable summary. */
  summary: z.string(),
  /** Structured payload. */
  payload: z.record(z.unknown()).default({}),
  /** Duration in ms (for completed events). */
  durationMs: z.number().optional(),
  /** Nested error if this event represents a failure. */
  error: z
    .object({
      code: z.string().optional(),
      message: z.string(),
      details: z.record(z.unknown()).optional(),
    })
    .optional(),
  /** Artifact lineage for explainability. */
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type DebugEvent = z.infer<typeof DebugEventSchema>;

// ---------------------------------------------------------------------------
// Preview Session
// ---------------------------------------------------------------------------

export const PreviewModeSchema = z.enum([
  "design_preview",
  "wired_preview",
  "live_preview",
]);
export type PreviewMode = z.infer<typeof PreviewModeSchema>;

export const PreviewSessionSchema = z.object({
  sessionId: z.string(),
  projectId: z.string(),
  mode: PreviewModeSchema,
  startedAt: z.string().datetime({ offset: true }),
  endedAt: z.string().datetime({ offset: true }).optional(),
  status: z.enum(["running", "paused", "completed", "failed"]),
  /** Current page being previewed. */
  currentPageKey: z.string().optional(),
  /** Accumulated event count. */
  eventCount: z.number().default(0),
  /** Page state snapshot. */
  stateSnapshot: z.record(z.unknown()).default({}),
});
export type PreviewSession = z.infer<typeof PreviewSessionSchema>;

// ---------------------------------------------------------------------------
// Trace Envelope
// ---------------------------------------------------------------------------

/**
 * A trace envelope wraps a complete execution trace —
 * all events from a flow execution in one inspectable unit.
 */
export const PreviewTraceEnvelopeSchema = z.object({
  traceId: z.string(),
  sessionId: z.string(),
  flowKey: z.string(),
  label: z.string(),
  status: z.enum(["ok", "warn", "error", "in_progress"]),
  startedAt: z.string().datetime({ offset: true }),
  completedAt: z.string().datetime({ offset: true }).optional(),
  totalDurationMs: z.number().optional(),
  summary: z.string(),
  /** All events in this trace, ordered by timestamp. */
  events: z.array(DebugEventSchema).default([]),
  /** Artifact lineage. */
  sourceLinks: z.array(SourceLinkSchema).default([]),
  /** Related selection state for inspector cross-highlighting. */
  relatedSelection: z.record(z.string()).default({}),
});
export type PreviewTraceEnvelope = z.infer<typeof PreviewTraceEnvelopeSchema>;

// ---------------------------------------------------------------------------
// Top-Level Debug Session Artifact
// ---------------------------------------------------------------------------

export const DebugSessionArtifactSchema = ArtifactEnvelopeSchema.extend({
  projectId: z.string(),
  session: PreviewSessionSchema,
  traceEnvelopes: z.array(PreviewTraceEnvelopeSchema).default([]),
  /** All events (denormalized for easy export). */
  allEvents: z.array(DebugEventSchema).default([]),
});

export type DebugSessionArtifact = z.infer<typeof DebugSessionArtifactSchema>;
