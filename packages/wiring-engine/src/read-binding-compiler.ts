/**
 * Read Binding Compiler
 *
 * For every page and data-displaying widget in the UISemanticGraph,
 * determines what backend table/view/RPC to read from and how to filter it.
 *
 * Pipeline: UISemanticGraph pages + widgets → WiringReadBinding[]
 */

import type {
  UISemanticGraph,
  PageNode,
  WidgetNode,
  BackendIntentGraph,
  SupabaseSchemaPlan,
  WiringReadBinding,
  WiringSourceLink,
} from "@wiraflow/contracts";

/**
 * Compile read bindings for all pages and data-displaying widgets.
 */
export function compileReadBindings(
  uiGraph: UISemanticGraph,
  backendGraph: BackendIntentGraph,
  schemaPlan: SupabaseSchemaPlan,
  sourceLinks: WiringSourceLink[]
): WiringReadBinding[] {
  const bindings: WiringReadBinding[] = [];
  const entityTableMap = buildEntityTableMap(backendGraph, schemaPlan);

  for (const page of uiGraph.pages) {
    // Page-level reads based on data access patterns
    for (const pattern of page.dataAccessPatterns) {
      if (pattern === "none" || pattern === "unknown") continue;

      for (const entityKey of page.relatedEntityKeys) {
        const tableKey = entityTableMap.get(entityKey);
        if (!tableKey) continue;

        const bindingKey = `read-${page.key}-${entityKey}`;
        const accessMode = mapAccessMode(pattern);
        const filterInputs = buildFilterInputs(page, pattern);

        const srcLink: WiringSourceLink = {
          key: `src-${bindingKey}`,
          artifact: "UISemanticGraph",
          artifactKey: page.key,
          reason: `Page "${page.label}" needs ${pattern} for entity ${entityKey}`,
        };
        sourceLinks.push(srcLink);

        bindings.push({
          key: bindingKey,
          dataViewKey: page.key,
          sourceType: "table",
          sourceKey: tableKey,
          accessMode,
          authContext: page.requiredRoles.length > 0 ? "user_session" : "user_session",
          filterInputs,
          sortMode: "none",
          paginationMode: "none",
          consistencyNeed: "eventual",
          sourceLinkKeys: [srcLink.key],
        });
      }
    }

    // Widget-level reads for repeatable data-display widgets
    const pageWidgets = uiGraph.widgets.filter(
      (w) => page.widgetKeys.includes(w.key)
    );

    for (const widget of pageWidgets) {
      if (
        widget.dataAccessPattern === "none" ||
        widget.dataAccessPattern === "unknown" ||
        !widget.relatedEntityKey
      ) {
        continue;
      }

      // Don't duplicate page-level bindings
      const alreadyBound = bindings.some(
        (b) =>
          b.dataViewKey === page.key &&
          b.sourceKey === entityTableMap.get(widget.relatedEntityKey!)
      );
      if (alreadyBound) continue;

      const tableKey = entityTableMap.get(widget.relatedEntityKey);
      if (!tableKey) continue;

      const bindingKey = `read-${widget.key}-${widget.relatedEntityKey}`;
      const srcLink: WiringSourceLink = {
        key: `src-${bindingKey}`,
        artifact: "UISemanticGraph",
        artifactKey: widget.key,
        reason: `Widget "${widget.label}" displays ${widget.dataAccessPattern} of ${widget.relatedEntityKey}`,
      };
      sourceLinks.push(srcLink);

      bindings.push({
        key: bindingKey,
        dataViewKey: widget.key,
        sourceType: "table",
        sourceKey: tableKey,
        accessMode: mapAccessMode(widget.dataAccessPattern),
        authContext: "user_session",
        filterInputs: [],
        sortMode: "none",
        paginationMode: "none",
        consistencyNeed: "eventual",
        sourceLinkKeys: [srcLink.key],
      });
    }
  }

  return bindings;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEntityTableMap(
  backendGraph: BackendIntentGraph,
  schemaPlan: SupabaseSchemaPlan
): Map<string, string> {
  const map = new Map<string, string>();
  for (const entity of backendGraph.entities) {
    const table = schemaPlan.tables.find((t) => t.key === entity.key);
    if (table) {
      map.set(entity.key, table.name);
    }
  }
  return map;
}

function mapAccessMode(
  pattern: string
): WiringReadBinding["accessMode"] {
  switch (pattern) {
    case "single_record_by_id":
    case "single_record_by_owner":
      return "single";
    case "list_all":
      return "list";
    case "list_filtered":
    case "list_by_relation":
      return "scoped_list";
    case "list_by_owner":
      return "scoped_list";
    case "search":
      return "search";
    case "aggregate_count":
    case "aggregate_summary":
      return "aggregate";
    default:
      return "unknown";
  }
}

function buildFilterInputs(
  page: PageNode,
  pattern: string
): WiringReadBinding["filterInputs"] {
  const filters: WiringReadBinding["filterInputs"] = [];

  if (pattern === "single_record_by_id") {
    filters.push({
      fieldKey: "id",
      operator: "eq",
      source: "route_param",
      sourceKey: "id",
    });
  } else if (pattern === "single_record_by_owner" || pattern === "list_by_owner") {
    filters.push({
      fieldKey: "created_by",
      operator: "eq",
      source: "session_actor",
      sourceKey: "user_id",
    });
  } else if (pattern === "list_by_relation") {
    // Use route param as the FK filter
    const relatedParam = page.route.params[0];
    if (relatedParam) {
      filters.push({
        fieldKey: relatedParam.key,
        operator: "eq",
        source: "route_param",
        sourceKey: relatedParam.key,
      });
    }
  }

  return filters;
}
