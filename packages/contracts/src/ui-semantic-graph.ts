/**
 * Wiraflow Contracts — UI Semantic Graph
 *
 * Machine-readable representation of the frontend meaning extracted from
 * FlutterFlow Designer artifacts. This is NOT the raw designer output —
 * it's the platform's interpretation of what the UI means.
 *
 * Blueprint reference: "UI Semantic Graph" + "Widget Heuristics" + "Page Heuristics"
 * WIR-004 spec
 */

import { z } from "zod";

import {
  ArtifactEnvelopeSchema,
  ConfidenceLevelSchema,
  SourceLinkSchema,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Widget Semantics
// ---------------------------------------------------------------------------

export const WidgetSemanticRoleSchema = z.enum([
  // Structural
  "page_root",
  "section_container",
  "card_container",
  "list_container",
  "grid_container",
  "tab_container",
  "tab_item",
  "modal_container",
  "drawer_container",

  // Data display
  "text_display",
  "image_display",
  "icon_display",
  "badge_display",
  "status_indicator",
  "progress_indicator",
  "avatar",
  "chart",
  "metric_card",

  // Data input
  "text_input",
  "textarea_input",
  "number_input",
  "date_input",
  "datetime_input",
  "select_input",
  "multi_select_input",
  "checkbox_input",
  "radio_input",
  "toggle_input",
  "file_input",
  "search_input",

  // Interactive
  "primary_cta_button",
  "secondary_button",
  "icon_button",
  "fab_button",
  "link_button",
  "menu_item",
  "filter_chip",
  "sort_control",
  "pagination_control",

  // Repeating
  "list_item",
  "grid_item",
  "table_row",

  // Layout
  "app_bar",
  "bottom_nav",
  "side_nav",
  "divider",
  "spacer",

  // Special
  "map_view",
  "video_player",
  "audio_player",
  "empty_state",
  "error_state",
  "loading_state",

  // Fallback
  "unknown",
]);
export type WidgetSemanticRole = z.infer<typeof WidgetSemanticRoleSchema>;

export const DataAccessPatternSchema = z.enum([
  "single_record_by_id",
  "single_record_by_owner",
  "list_all",
  "list_filtered",
  "list_by_owner",
  "list_by_relation",
  "search",
  "aggregate_count",
  "aggregate_summary",
  "none",
  "unknown",
]);
export type DataAccessPattern = z.infer<typeof DataAccessPatternSchema>;

export const ActionOperationSchema = z.enum([
  "create",
  "update",
  "delete",
  "upsert",
  "upload",
  "invoke_function",
  "navigate",
  "authenticate",
  "logout",
  "filter",
  "sort",
  "search",
  "paginate",
  "refresh",
  "toggle_state",
  "open_modal",
  "close_modal",
  "unknown",
]);
export type ActionOperation = z.infer<typeof ActionOperationSchema>;

// ---------------------------------------------------------------------------
// Widget Node
// ---------------------------------------------------------------------------

export const WidgetNodeSchema = z.object({
  /** Unique widget key. */
  key: z.string(),
  /** Parent widget key, null for page root. */
  parentKey: z.string().nullable(),
  /** Widget type from designer (e.g., "Container", "Button", "ListView"). */
  designerType: z.string(),
  /** Inferred semantic role. */
  semanticRole: WidgetSemanticRoleSchema,
  /** Human-readable label for this widget. */
  label: z.string(),
  /** Visible text content if any. */
  textContent: z.string().optional(),
  /** Whether this widget repeats (list items, grid items). */
  repeatable: z.boolean().default(false),
  /** Whether user can interact with this widget. */
  interactive: z.boolean().default(false),
  /** Data access pattern this widget implies. */
  dataAccessPattern: DataAccessPatternSchema.default("none"),
  /** Which entity this widget likely relates to. */
  relatedEntityKey: z.string().optional(),
  /** Action this widget triggers when interacted with. */
  action: z
    .object({
      operation: ActionOperationSchema,
      targetEntityKey: z.string().optional(),
      targetPageKey: z.string().optional(),
      description: z.string().optional(),
    })
    .optional(),
  /** Permission hint: does this widget require specific roles? */
  permissionHint: z
    .object({
      requiredRoles: z.array(z.string()).default([]),
      ownerOnly: z.boolean().default(false),
    })
    .optional(),
  /** Confidence in this widget's semantic interpretation. */
  confidence: ConfidenceLevelSchema.default("medium"),
  /** Source references. */
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type WidgetNode = z.infer<typeof WidgetNodeSchema>;

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export const SectionSchema = z.object({
  key: z.string(),
  label: z.string(),
  purpose: z.string().optional(),
  widgetKeys: z.array(z.string()).default([]),
  dataAccessPattern: DataAccessPatternSchema.default("none"),
  relatedEntityKey: z.string().optional(),
  confidence: ConfidenceLevelSchema.default("medium"),
});
export type Section = z.infer<typeof SectionSchema>;

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export const RouteParamSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "uuid", "integer", "enum"]),
  source: z
    .enum([
      "path_segment",
      "query_param",
      "navigation_arg",
      "unknown",
    ])
    .default("path_segment"),
  relatedEntityKey: z.string().optional(),
  relatedFieldKey: z.string().optional(),
});
export type RouteParam = z.infer<typeof RouteParamSchema>;

export const RouteSchema = z.object({
  key: z.string(),
  path: z.string(),
  params: z.array(RouteParamSchema).default([]),
  guards: z.array(z.string()).default([]),
});
export type Route = z.infer<typeof RouteSchema>;

// ---------------------------------------------------------------------------
// Page Node
// ---------------------------------------------------------------------------

export const PageTypeSchema = z.enum([
  "dashboard",
  "list",
  "detail",
  "form",
  "upload_process",
  "settings",
  "auth",
  "splash",
  "custom",
  "unknown",
]);
export type PageType = z.infer<typeof PageTypeSchema>;

export const PageNodeSchema = z.object({
  key: z.string(),
  label: z.string(),
  purpose: z.string(),
  pageType: PageTypeSchema,
  route: RouteSchema,
  sections: z.array(SectionSchema).default([]),
  widgetKeys: z.array(z.string()).default([]),
  primaryActionKeys: z.array(z.string()).default([]),
  dataAccessPatterns: z.array(DataAccessPatternSchema).default([]),
  relatedEntityKeys: z.array(z.string()).default([]),
  requiredRoles: z.array(z.string()).default([]),
  confidence: ConfidenceLevelSchema.default("medium"),
  sourceLinks: z.array(SourceLinkSchema).default([]),
});
export type PageNode = z.infer<typeof PageNodeSchema>;

// ---------------------------------------------------------------------------
// Navigation Edge
// ---------------------------------------------------------------------------

export const NavigationEdgeSchema = z.object({
  key: z.string(),
  fromPageKey: z.string(),
  toPageKey: z.string(),
  triggerWidgetKey: z.string().optional(),
  params: z
    .array(
      z.object({
        paramKey: z.string(),
        sourceType: z.enum([
          "selected_row",
          "form_value",
          "mutation_result",
          "session_actor",
          "literal",
          "unknown",
        ]),
        sourceKey: z.string().optional(),
      })
    )
    .default([]),
  confidence: ConfidenceLevelSchema.default("medium"),
});
export type NavigationEdge = z.infer<typeof NavigationEdgeSchema>;

// ---------------------------------------------------------------------------
// Top-Level UI Semantic Graph
// ---------------------------------------------------------------------------

export const UISemanticGraphSchema = ArtifactEnvelopeSchema.extend({
  projectId: z.string(),

  /** All pages detected in the design. */
  pages: z.array(PageNodeSchema).default([]),

  /** All widget nodes (flat list, tree via parentKey). */
  widgets: z.array(WidgetNodeSchema).default([]),

  /** Navigation relationships between pages. */
  navigationEdges: z.array(NavigationEdgeSchema).default([]),

  /** Global navigation widgets (app bar, bottom nav, side nav). */
  globalNavigationWidgetKeys: z.array(z.string()).default([]),
});

export type UISemanticGraph = z.infer<typeof UISemanticGraphSchema>;
