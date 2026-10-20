/**
 * Wiraflow Contracts — Shared Types
 *
 * Foundation types used across all canonical artifact schemas.
 * Every artifact must carry version, source links, and an unknowns channel.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Version & Metadata
// ---------------------------------------------------------------------------

/** Semantic version string for artifact evolution tracking. */
export const VersionSchema = z.string().regex(/^\d+\.\d+\.\d+$/, {
  message: "Version must be semantic: major.minor.patch",
});

/** ISO-8601 timestamp. */
export const TimestampSchema = z.string().datetime({ offset: true });

// ---------------------------------------------------------------------------
// Confidence
// ---------------------------------------------------------------------------

/**
 * Every inference the platform makes should carry a confidence level.
 * - `high`   → deterministic rule matched
 * - `medium` → strong heuristic match
 * - `low`    → AI-inferred, needs human review
 * - `none`   → placeholder, no evidence yet
 */
export const ConfidenceLevelSchema = z.enum(["high", "medium", "low", "none"]);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// ---------------------------------------------------------------------------
// Source Links
// ---------------------------------------------------------------------------

/**
 * Traces every generated node back to its origin evidence.
 * Enables explainability: "why did the platform decide this?"
 */
export const SourceLinkSchema = z.object({
  /** Which upstream artifact or source produced this. */
  sourceType: z.enum([
    "user_brief",
    "designer_markdown",
    "designer_image",
    "app_intent_spec",
    "ui_semantic_graph",
    "backend_intent_graph",
    "supabase_schema_plan",
    "wiring_action_flow_plan",
    "manual_override",
    "ai_inference",
  ]),
  /** Key or ID referencing the source node. */
  sourceKey: z.string(),
  /** Optional line number or section path in the source. */
  sourceRef: z.string().optional(),
  /** Human-readable reason this link exists. */
  reason: z.string().optional(),
});
export type SourceLink = z.infer<typeof SourceLinkSchema>;

// ---------------------------------------------------------------------------
// Unknowns Channel
// ---------------------------------------------------------------------------

/**
 * Every artifact must preserve unknowns rather than hiding them.
 * This is the platform's way of saying "I don't know this yet."
 */
export const UnknownEntrySchema = z.object({
  /** Unique key for this unknown. */
  key: z.string(),
  /** What category of unknown this is. */
  category: z.enum([
    "ambiguous_intent",
    "missing_data",
    "conflicting_signals",
    "unsupported_pattern",
    "needs_human_decision",
    "external_dependency",
  ]),
  /** Severity: how much does this block progress? */
  severity: z.enum(["blocking", "degrading", "informational"]),
  /** What we don't know. */
  summary: z.string(),
  /** Why we don't know it. */
  detail: z.string().optional(),
  /** Suggested resolution. */
  suggestedAction: z.string().optional(),
  /** What nodes are affected by this unknown. */
  affectedKeys: z.array(z.string()).default([]),
  /** Where did we discover this unknown? */
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type UnknownEntry = z.infer<typeof UnknownEntrySchema>;

// ---------------------------------------------------------------------------
// Artifact Envelope
// ---------------------------------------------------------------------------

/**
 * Base envelope that every canonical artifact must include.
 * Provides version tracking, timestamps, and the unknowns channel.
 */
export const ArtifactEnvelopeSchema = z.object({
  /** Schema version for this artifact type. */
  version: VersionSchema,
  /** When this artifact was first created. */
  createdAt: TimestampSchema,
  /** When this artifact was last updated. */
  updatedAt: TimestampSchema,
  /** Who or what produced this artifact. */
  generatedBy: z.enum(["system", "user", "ai", "hybrid"]).default("system"),
  /** Unknowns that were discovered during generation. */
  unknowns: z.array(UnknownEntrySchema).default([]),
});
export type ArtifactEnvelope = z.infer<typeof ArtifactEnvelopeSchema>;

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

export const WarningSchema = z.object({
  key: z.string(),
  severity: z.enum(["info", "warning", "critical"]),
  category: z.string(),
  message: z.string(),
  recommendedAction: z.string().optional(),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type Warning = z.infer<typeof WarningSchema>;
