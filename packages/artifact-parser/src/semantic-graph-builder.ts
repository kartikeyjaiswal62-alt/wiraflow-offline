/**
 * Semantic Graph Builder
 *
 * Transforms a ParsedDesignerExport into a UISemanticGraph by applying
 * deterministic heuristics to classify widgets, detect page types,
 * infer data access patterns, and identify actions.
 *
 * Philosophy: Deterministic rules first. Every inference carries a
 * confidence score. Unknown items go to the unknowns channel.
 */

import type {
  UISemanticGraph,
  PageNode,
  WidgetNode,
  WidgetSemanticRole,
  DataAccessPattern,
  Section,
  NavigationEdge,
} from "@wiraflow/contracts";
import type { ConfidenceLevel, UnknownEntry } from "@wiraflow/contracts";
import type { ParsedDesignerExport, DesignerPage, FlatWidget } from "./dsl-types.js";
import {
  flattenDslTree,
  extractStringProp,
} from "./dsl-tree-parser.js";

// ---------------------------------------------------------------------------
// Widget Semantic Role Classification
// ---------------------------------------------------------------------------

/** Classify a FlatWidget into a semantic role using deterministic heuristics. */
function classifyWidgetRole(
  widget: FlatWidget,
  parentWidget: FlatWidget | undefined
): { role: WidgetSemanticRole; confidence: ConfidenceLevel } {
  const t = widget.type;

  // Custom components — highest confidence, they carry explicit semantics
  if (t === "@std.button") return { role: "primary_cta_button", confidence: "high" };
  if (t === "@std.textfield") return { role: "text_input", confidence: "high" };
  if (t === "@status_chip") return { role: "badge_display", confidence: "high" };
  if (t === "@transcription_bubble") return { role: "list_item", confidence: "high" };

  // Standard widgets
  if (t === "scaffold") return { role: "page_root", confidence: "high" };
  if (t === "text") {
    // Determine text role from context
    const content = widget.textContent ?? "";
    if (
      content === content.toUpperCase() &&
      content.length < 30 &&
      content.length > 0
    ) {
      return { role: "badge_display", confidence: "medium" };
    }
    return { role: "text_display", confidence: "medium" };
  }
  if (t === "icon") return { role: "icon_display", confidence: "high" };
  if (t === "iconbutton") return { role: "icon_button", confidence: "high" };
  if (t === "progress") return { role: "progress_indicator", confidence: "high" };
  if (t === "stack") return { role: "section_container", confidence: "medium" };
  if (t === "expanded") return { role: "section_container", confidence: "low" };

  // Layout containers — classify by context
  if (t === "column" || t === "row") {
    // If it has scroll enabled, it's likely a list container
    if (widget.scrollable) return { role: "list_container", confidence: "medium" };
    // If top-level (depth 1 or 2), it's a section
    if (widget.depth <= 2) return { role: "section_container", confidence: "medium" };
    return { role: "card_container", confidence: "low" };
  }
  if (t === "container") {
    // Container with border + padding near top → header/section
    if (widget.depth <= 2) return { role: "section_container", confidence: "medium" };
    // Container with small fixed dimensions → avatar/badge
    const rawW = widget.rawProperties["width"];
    if (rawW && "px" in rawW) {
      const pxVal = (rawW as { px: { value: number } }).px.value;
      if (typeof pxVal === "number" && pxVal <= 64) {
        return { role: "avatar", confidence: "low" };
      }
    }
    return { role: "card_container", confidence: "low" };
  }

  // Any custom component not specifically handled
  if (widget.isCustomComponent) {
    return { role: "unknown", confidence: "low" };
  }

  return { role: "unknown", confidence: "none" };
}

// ---------------------------------------------------------------------------
// Page Type Classification
// ---------------------------------------------------------------------------

function classifyPageType(
  page: DesignerPage,
  widgets: FlatWidget[]
): { pageType: PageNode["pageType"]; confidence: ConfidenceLevel } {
  const promptLower = (page.pagePrompt + " " + page.pageName).toLowerCase();
  const allText = widgets
    .map((w) => w.textContent ?? "")
    .join(" ")
    .toLowerCase();
  const customTypes = new Set(
    widgets.filter((w) => w.isCustomComponent).map((w) => w.type)
  );
  const hasTextField = widgets.some((w) => w.type === "@std.textfield");
  const hasButton = widgets.some((w) => w.type === "@std.button");

  // Heuristic chain — order matters, most specific first

  // Upload/process page: has upload-related text or icons
  if (
    promptLower.includes("upload") ||
    allText.includes("upload") ||
    widgets.some((w) => w.iconName?.includes("upload"))
  ) {
    return { pageType: "upload_process", confidence: "medium" };
  }

  // Form page: primarily textfields + submit button
  if (hasTextField && hasButton && !customTypes.has("@transcription_bubble")) {
    return { pageType: "form", confidence: "medium" };
  }

  // List page: has repeating components
  if (
    customTypes.has("@transcription_bubble") ||
    promptLower.includes("list") ||
    promptLower.includes("feed")
  ) {
    return { pageType: "list", confidence: "medium" };
  }

  // Detail page: single record view with sections
  if (
    promptLower.includes("detail") ||
    promptLower.includes("view") ||
    promptLower.includes("profile")
  ) {
    return { pageType: "detail", confidence: "medium" };
  }

  // Dashboard: has metrics, charts, or overview
  if (
    promptLower.includes("dashboard") ||
    promptLower.includes("overview") ||
    promptLower.includes("analytics") ||
    customTypes.has("@status_chip")
  ) {
    return { pageType: "dashboard", confidence: "medium" };
  }

  // Auth page
  if (
    promptLower.includes("login") ||
    promptLower.includes("sign") ||
    promptLower.includes("auth")
  ) {
    return { pageType: "auth", confidence: "medium" };
  }

  // Recording/transcription implies a detail/process hybrid
  if (
    promptLower.includes("recording") ||
    promptLower.includes("transcri")
  ) {
    return { pageType: "detail", confidence: "medium" };
  }

  return { pageType: "custom", confidence: "low" };
}

// ---------------------------------------------------------------------------
// Data Access Pattern Detection
// ---------------------------------------------------------------------------

function detectDataAccessPattern(
  widgets: FlatWidget[]
): DataAccessPattern {
  const hasRepeatingItems = widgets.some(
    (w) =>
      w.type === "@transcription_bubble" ||
      (w.scrollable && w.childIds.length > 1)
  );
  const hasSearchInput = widgets.some(
    (w) =>
      w.type === "@std.textfield" &&
      (w.hintText?.toLowerCase().includes("search") ?? false)
  );

  if (hasSearchInput) return "search";
  if (hasRepeatingItems) return "list_by_owner";
  return "single_record_by_id";
}

// ---------------------------------------------------------------------------
// Section Detection
// ---------------------------------------------------------------------------

function detectSections(
  widgets: FlatWidget[],
  pageKey: string
): Section[] {
  const sections: Section[] = [];
  let sectionIdx = 0;

  // Sections are top-level containers (depth 1-2) with meaningful children
  const topContainers = widgets.filter(
    (w) =>
      w.depth >= 1 &&
      w.depth <= 2 &&
      (w.type === "container" || w.type === "column") &&
      w.childIds.length > 0
  );

  for (const container of topContainers) {
    // Find text labels in immediate children
    const childWidgets = widgets.filter(
      (w) => w.parentId === container.id
    );
    const labelWidget = childWidgets.find((w) => w.textContent);

    // Skip purely structural containers with no semantic value
    if (
      childWidgets.length === 1 &&
      !childWidgets[0].textContent &&
      !childWidgets[0].interactive
    ) {
      continue;
    }

    const sectionKey = `${pageKey}-section-${sectionIdx++}`;
    const label =
      labelWidget?.textContent ?? `Section ${sectionIdx}`;

    sections.push({
      key: sectionKey,
      label,
      widgetKeys: [container.id, ...container.childIds],
      dataAccessPattern: "none",
      confidence: "low",
    });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Action Detection
// ---------------------------------------------------------------------------

function detectActions(widgets: FlatWidget[]): WidgetNode["action"][] {
  const actions: WidgetNode["action"][] = [];

  for (const w of widgets) {
    if (w.type === "@std.button") {
      const label = w.buttonLabel?.toLowerCase() ?? "";
      let operation: WidgetNode["action"] = undefined;

      if (label.includes("analyz") || label.includes("process")) {
        operation = {
          operation: "invoke_function",
          description: w.buttonLabel ?? "Invoke action",
        };
      } else if (label.includes("save") || label.includes("submit") || label.includes("create")) {
        operation = {
          operation: "create",
          description: w.buttonLabel ?? "Submit form",
        };
      } else if (label.includes("upload")) {
        operation = {
          operation: "upload",
          description: w.buttonLabel ?? "Upload file",
        };
      } else if (label.includes("delete") || label.includes("remove")) {
        operation = {
          operation: "delete",
          description: w.buttonLabel ?? "Delete item",
        };
      } else {
        operation = {
          operation: "unknown",
          description: w.buttonLabel ?? "Unknown action",
        };
      }

      actions.push(operation);
    }
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Widget Node Builder
// ---------------------------------------------------------------------------

function buildWidgetNodes(
  widgets: FlatWidget[],
  pageKey: string
): WidgetNode[] {
  const widgetMap = new Map(widgets.map((w) => [w.id, w]));

  return widgets.map((w) => {
    const parent = w.parentId ? widgetMap.get(w.parentId) : undefined;
    const { role, confidence } = classifyWidgetRole(w, parent);

    const node: WidgetNode = {
      key: `${pageKey}-${w.id}`,
      parentKey: w.parentId ? `${pageKey}-${w.parentId}` : null,
      designerType: w.type,
      semanticRole: role,
      label: w.textContent ?? w.buttonLabel ?? w.type,
      textContent: w.textContent ?? undefined,
      repeatable: w.type === "@transcription_bubble",
      interactive: w.interactive,
      dataAccessPattern: w.type === "@transcription_bubble" ? "list_all" : "none",
      confidence,
      sourceLinks: [
        {
          sourceType: "designer_markdown",
          sourceKey: w.sourceEditorId,
          reason: `Widget type "${w.type}" classified as "${role}"`,
        },
      ],
    };

    // Add action for interactive widgets
    if (w.type === "@std.button" && w.buttonLabel) {
      const label = w.buttonLabel.toLowerCase();
      if (label.includes("analyz") || label.includes("process")) {
        node.action = {
          operation: "invoke_function",
          description: w.buttonLabel,
        };
      } else if (label.includes("save") || label.includes("submit") || label.includes("create")) {
        node.action = { operation: "create", description: w.buttonLabel };
      } else if (label.includes("upload")) {
        node.action = { operation: "upload", description: w.buttonLabel };
      } else {
        node.action = { operation: "unknown", description: w.buttonLabel };
      }
    }

    // Add hint text info for text fields
    if (w.type === "@std.textfield" && w.hintText) {
      node.label = w.hintText;
    }

    return node;
  });
}

// ---------------------------------------------------------------------------
// Main Builder
// ---------------------------------------------------------------------------

/**
 * Build a UISemanticGraph from a ParsedDesignerExport.
 *
 * This applies deterministic heuristics to classify every widget,
 * detect page types, infer data patterns, and identify user actions.
 *
 * @param parsed - The parsed Designer export from parseDesignerExport().
 * @param projectId - Project identifier to use in the graph.
 * @returns A fully populated UISemanticGraph.
 */
export function buildUISemanticGraph(
  parsed: ParsedDesignerExport,
  projectId: string
): UISemanticGraph {
  const now = new Date().toISOString();
  const allPages: PageNode[] = [];
  const allWidgets: WidgetNode[] = [];
  const allNavigationEdges: NavigationEdge[] = [];
  const unknowns: UnknownEntry[] = [];

  for (const page of parsed.pages) {
    const pageKey = `page-${page.pageNumber}-${page.pageName
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

    // Flatten the DSL tree
    const flatWidgets = flattenDslTree(page.dslRoot);

    // Classify page type
    const { pageType, confidence: pageConfidence } = classifyPageType(
      page,
      flatWidgets
    );

    // Detect data access pattern
    const dataAccessPattern = detectDataAccessPattern(flatWidgets);

    // Build sections
    const sections = detectSections(flatWidgets, pageKey);

    // Build widget nodes
    const widgetNodes = buildWidgetNodes(flatWidgets, pageKey);
    allWidgets.push(...widgetNodes);

    // Detect primary actions
    const primaryActionKeys = widgetNodes
      .filter((w) => w.action !== undefined)
      .map((w) => w.key);

    // Build page node
    const pageNode: PageNode = {
      key: pageKey,
      label: page.pageName,
      purpose: page.pagePrompt || `${page.pageName} page`,
      pageType,
      route: {
        key: `${pageKey}-route`,
        path: `/${page.pageName.toLowerCase().replace(/\s+/g, "-")}`,
        params: [],
        guards: [],
      },
      sections,
      widgetKeys: widgetNodes.map((w) => w.key),
      primaryActionKeys,
      dataAccessPatterns: [dataAccessPattern],
      relatedEntityKeys: [],
      requiredRoles: [],
      confidence: pageConfidence,
      sourceLinks: [
        {
          sourceType: "designer_markdown",
          sourceKey: page.frameId,
          sourceRef: `Page ${page.pageNumber}`,
          reason: `Page "${page.pageName}" classified as "${pageType}"`,
        },
      ],
    };

    allPages.push(pageNode);

    // Flag any custom components we don't recognize
    const knownCustom = new Set([
      "@std.button",
      "@std.textfield",
      "@status_chip",
      "@transcription_bubble",
    ]);
    const unknownCustom = flatWidgets
      .filter((w) => w.isCustomComponent && !knownCustom.has(w.type))
      .map((w) => w.type);

    for (const ucType of [...new Set(unknownCustom)]) {
      unknowns.push({
        key: `unknown-component-${ucType}`,
        category: "unsupported_pattern",
        severity: "informational",
        summary: `Unknown custom component: ${ucType}`,
        detail: `The component type "${ucType}" was found in page "${page.pageName}" but has no semantic classification rule. It will be treated as a generic container.`,
        suggestedAction: `Add a classification rule for "${ucType}" in the semantic graph builder.`,
        affectedKeys: [pageKey],
        sourceLinks: [
          {
            sourceType: "designer_markdown",
            sourceKey: page.frameId,
          },
        ],
      });
    }
  }

  // Detect navigation edges between pages
  // (minimal for single-page exports, but the structure supports multi-page)
  if (allPages.length > 1) {
    for (let i = 0; i < allPages.length - 1; i++) {
      const navWidgets = allWidgets.filter(
        (w) =>
          w.key.startsWith(allPages[i].key) &&
          w.interactive &&
          w.action?.operation === "navigate"
      );
      for (const navWidget of navWidgets) {
        allNavigationEdges.push({
          key: `nav-${i}-${navWidget.key}`,
          fromPageKey: allPages[i].key,
          toPageKey: allPages[i + 1].key,
          triggerWidgetKey: navWidget.key,
          params: [],
          confidence: "low",
        });
      }
    }
  }

  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    generatedBy: "system",
    unknowns,
    projectId,
    pages: allPages,
    widgets: allWidgets,
    navigationEdges: allNavigationEdges,
    globalNavigationWidgetKeys: [],
  };
}
