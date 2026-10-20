"use client";

/**
 * WiringGraph — Interactive Visual Node Graph
 *
 * Shows how UI pages, widgets, actions, and database tables are connected.
 * Uses vanilla SVG — no external graph library.
 *
 *   Blue nodes   = Pages
 *   Purple nodes = Widgets (interactive actions)
 *   Green nodes  = Database tables
 *   Edges show read/mutation/navigation flows
 */

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { DesignSpec } from "../../lib/types";
import { readStr } from "../../lib/utils";
import styles from "./WiringGraph.module.css";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GraphNode {
  id: string;
  label: string;
  type: "page" | "widget" | "table";
  x: number;
  y: number;
  width: number;
  height: number;
  meta?: Record<string, string>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  edgeType: "read" | "mutation" | "navigation";
  label: string;
}

interface WiringGraphProps {
  designSpec: DesignSpec | undefined;
}

// ---------------------------------------------------------------------------
// Layout: auto-place nodes in three columns
// ---------------------------------------------------------------------------

function buildGraph(spec: DesignSpec): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const tableSet = new Set<string>();

  const NODE_W = 180;
  const NODE_H = 48;
  const COL_GAP = 300;
  const ROW_GAP = 80;
  const START_X = 80;
  const START_Y = 60;

  // Column 1: Pages
  spec.pages.forEach((page, i) => {
    nodes.push({
      id: `page-${page.key}`,
      label: readStr(page.name || page.key),
      type: "page",
      x: START_X,
      y: START_Y + i * ROW_GAP,
      width: NODE_W,
      height: NODE_H,
      meta: { pageType: readStr(page.pageType ?? "unknown") },
    });
  });

  // Column 2: Widgets with actions
  let widgetIdx = 0;
  spec.pages.forEach((page) => {
    const actionWidgets = page.widgets.filter(
      (w) => w.type === "ElevatedButton" || w.type === "TextButton" || w.type === "IconButton" ||
             w.type === "FloatingActionButton" || w.type === "InkWell" || w.type === "GestureDetector" ||
             w.type === "TextField" || w.type === "DropdownButton" || w.type === "Switch" ||
             w.semanticRole?.includes("action") || w.semanticRole?.includes("submit") ||
             w.semanticRole?.includes("navigate")
    );

    actionWidgets.forEach((widget) => {
      const nodeId = `widget-${widget.key}`;
      nodes.push({
        id: nodeId,
        label: readStr(widget.label || widget.key),
        type: "widget",
        x: START_X + COL_GAP,
        y: START_Y + widgetIdx * ROW_GAP,
        width: NODE_W,
        height: NODE_H,
        meta: {
          widgetType: readStr(widget.type),
          role: readStr(widget.semanticRole || "action"),
        },
      });

      // Edge: page → widget
      edges.push({
        id: `edge-page-${page.key}-widget-${widget.key}`,
        source: `page-${page.key}`,
        target: nodeId,
        edgeType: "navigation",
        label: "contains",
      });

      // Infer table from widget action
      const tableName = readStr(page.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "");

      if (tableName && !["login", "signup", "settings", "profile"].includes(tableName)) {
        tableSet.add(tableName);

        // Determine edge type
        const isSubmit = widget.semanticRole?.includes("submit") ||
                        widget.type === "ElevatedButton" ||
                        widget.type === "FloatingActionButton";
        const isNav = widget.semanticRole?.includes("navigate");

        if (isSubmit) {
          edges.push({
            id: `edge-widget-${widget.key}-table-${tableName}`,
            source: nodeId,
            target: `table-${tableName}`,
            edgeType: "mutation",
            label: "INSERT",
          });
        } else if (!isNav) {
          edges.push({
            id: `edge-table-${tableName}-widget-${widget.key}`,
            source: `table-${tableName}`,
            target: nodeId,
            edgeType: "read",
            label: "SELECT",
          });
        }
      }

      widgetIdx++;
    });
  });

  // Column 3: Tables
  // Always add users table
  tableSet.add("users");

  let tableIdx = 0;
  tableSet.forEach((tableName) => {
    nodes.push({
      id: `table-${tableName}`,
      label: tableName,
      type: "table",
      x: START_X + COL_GAP * 2,
      y: START_Y + tableIdx * ROW_GAP,
      width: NODE_W,
      height: NODE_H,
    });
    tableIdx++;
  });

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WiringGraph({ designSpec }: WiringGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    details: string;
  } | null>(null);

  // Pan and zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const dragRef = useRef<{ startX: number; startY: number; startPanX: number; startPanY: number } | null>(null);

  const graph = useMemo(() => {
    if (!designSpec) return { nodes: [], edges: [] };
    return buildGraph(designSpec);
  }, [designSpec]);

  const pageCount = graph.nodes.filter((n) => n.type === "page").length;
  const widgetCount = graph.nodes.filter((n) => n.type === "widget").length;
  const tableCount = graph.nodes.filter((n) => n.type === "table").length;

  // Mouse handlers for pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).closest(`.${styles.node}`)) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.startPanX + dx, y: dragRef.current.startPanY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setZoom((z) => Math.min(Math.max(z * delta, 0.3), 3));
  }, []);

  // Edge highlight when node is selected
  const isEdgeHighlighted = useCallback(
    (edge: GraphEdge) => {
      if (!selectedNode) return false;
      return edge.source === selectedNode || edge.target === selectedNode;
    },
    [selectedNode]
  );

  // Bezier path for edge
  const edgePath = useCallback((edge: GraphEdge) => {
    const source = graph.nodes.find((n) => n.id === edge.source);
    const target = graph.nodes.find((n) => n.id === edge.target);
    if (!source || !target) return "";

    const sx = source.x + source.width;
    const sy = source.y + source.height / 2;
    const tx = target.x;
    const ty = target.y + target.height / 2;
    const mx = (sx + tx) / 2;

    return `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
  }, [graph.nodes]);

  if (!designSpec) {
    return (
      <div className={styles.wiringGraph}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: 16,
          color: "var(--text-muted)",
        }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>🔗</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)" }}>No Design Spec</div>
          <div style={{ fontSize: 12, maxWidth: 320, textAlign: "center", lineHeight: 1.6 }}>
            Generate a design first to see the UI-to-Database wiring graph.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wiringGraph}>
      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className={styles.graphSvg}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1" className={styles.gridPattern} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Graph content with pan/zoom transform */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Edges */}
          {graph.edges.map((edge) => {
            const highlighted = isEdgeHighlighted(edge);
            const cls = edge.edgeType === "read" ? styles.edgeRead
              : edge.edgeType === "mutation" ? styles.edgeMutation
              : styles.edgeNavigation;

            return (
              <g key={edge.id}>
                <path
                  d={edgePath(edge)}
                  className={`${cls} ${highlighted ? styles.edgeHighlight : styles.edge}`}
                  markerEnd="url(#arrowhead)"
                />
                {/* Edge label */}
                {highlighted && (() => {
                  const source = graph.nodes.find((n) => n.id === edge.source);
                  const target = graph.nodes.find((n) => n.id === edge.target);
                  if (!source || !target) return null;
                  const lx = (source.x + source.width + target.x) / 2;
                  const ly = (source.y + source.height / 2 + target.y + target.height / 2) / 2 - 8;
                  return (
                    <text x={lx} y={ly} className={styles.edgeLabel}>{edge.label}</text>
                  );
                })()}
              </g>
            );
          })}

          {/* Arrowhead marker */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)" opacity="0.5" />
            </marker>
          </defs>

          {/* Nodes */}
          {graph.nodes.map((node) => {
            const rectClass =
              node.type === "page" ? styles.nodeRectPage
              : node.type === "widget" ? styles.nodeRectWidget
              : styles.nodeRectTable;

            const isSelected = selectedNode === node.id;
            const icon = node.type === "page" ? "📄" : node.type === "widget" ? "🔘" : "🗄️";
            const typeLabel = node.type === "page" ? "PAGE" : node.type === "widget" ? "WIDGET" : "TABLE";

            return (
              <g
                key={node.id}
                className={styles.node}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => setSelectedNode(isSelected ? null : node.id)}
                onMouseEnter={(e) => {
                  const rect = svgRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const details = node.meta
                    ? Object.entries(node.meta).map(([k, v]) => `${k}: ${v}`).join("\n")
                    : "";
                  setTooltip({
                    x: e.clientX - rect.left + 12,
                    y: e.clientY - rect.top - 10,
                    title: node.label,
                    details: `Type: ${typeLabel}\n${details}`,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                <rect
                  width={node.width}
                  height={node.height}
                  className={`${rectClass} ${isSelected ? styles.nodeRectSelected : ""}`}
                />
                <text x={14} y={node.height / 2} className={styles.nodeIcon}>{icon}</text>
                <text x={34} y={node.height / 2 - 6} className={styles.nodeLabel}>{node.label}</text>
                <text x={34} y={node.height / 2 + 8} className={styles.nodeType}>{typeLabel}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Stats Overlay */}
      <div className={styles.statsOverlay}>
        <div className={styles.statPillBlue}>📄 {pageCount} pages</div>
        <div className={styles.statPillPurple}>🔘 {widgetCount} widgets</div>
        <div className={styles.statPillGreen}>🗄️ {tableCount} tables</div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <div className={styles.legendDotPage} />Page
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDotWidget} />Widget
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendDotTable} />Table
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendLineRead} />Read
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendLineMutation} />Mutation
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendLineNav} />Navigation
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className={styles.tooltip} style={{ left: tooltip.x, top: tooltip.y }}>
          <div className={styles.tooltipTitle}>{tooltip.title}</div>
          {tooltip.details}
        </div>
      )}
    </div>
  );
}
