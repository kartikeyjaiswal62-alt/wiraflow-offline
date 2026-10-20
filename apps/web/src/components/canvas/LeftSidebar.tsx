"use client";

import {
  MonitorSmartphone,
  Database,
  Network,
  LayoutGrid,
  Palette,
  Trash2,
  ChevronDown,
  ChevronRight,
  Hash,
  Columns,
  Square,
  Type,
  CheckSquare,
  Plus,
  MousePointerClick,
  ChevronDown as ChevronDownIcon,
  Zap
} from "lucide-react";
import styles from "./LeftSidebar.module.css";
import React, { useState } from "react";

interface LeftSidebarProps {
  primaryMode: "design" | "backend" | "wiring";
  onSelectPrimaryMode: (mode: "design" | "backend" | "wiring") => void;
  currentPageKey: string;
  pages: any[];
  widgets: any[];
  selectedWidgetKey: string | null;
  onSelectWidget: (key: string) => void;
  onSelectPage: (key: string) => void;
}

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  Scaffold: <Hash size={14} />,
  Column: <Columns size={14} />,
  Container: <Square size={14} />,
  Row: <Columns size={14} style={{ transform: "rotate(90deg)" }} />,
  ListView: <Columns size={14} />,
  Text: <Type size={14} />,
  Checkbox: <CheckSquare size={14} />,
  FloatingActionButton: <Plus size={14} />,
  IconButton: <Trash2 size={14} />,
  TextField: <Type size={14} />,
  DropDown: <ChevronDownIcon size={14} />,
  Button: <MousePointerClick size={14} />,
};

type TreeNode = {
  widget: any;
  children: TreeNode[];
};

const readStr = (val: any, fallback = ""): string => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    if (val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
    if (typeof val.value === "string") return val.value;
  }
  return fallback;
};

export function LeftSidebar({
  primaryMode,
  onSelectPrimaryMode,
  currentPageKey,
  pages,
  widgets,
  selectedWidgetKey,
  onSelectWidget,
  onSelectPage,
}: LeftSidebarProps) {
  const [framesExpanded, setFramesExpanded] = useState(true);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // We build a mock hierarchy for the current page since our current mock data is flat.
  const currentPageWidgets = widgets.filter((w) => w.pageKey === currentPageKey);
  
  // Dynamically build hierarchy from parentKey
  const buildHierarchy = (widgetsList: any[]): TreeNode[] => {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // Initialize map
    widgetsList.forEach((w) => {
      map.set(w.key, { widget: w, children: [] });
    });

    // Build connections
    widgetsList.forEach((w) => {
      const node = map.get(w.key)!;
      if (w.parentKey && map.has(w.parentKey)) {
        map.get(w.parentKey)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const hierarchy = buildHierarchy(currentPageWidgets);

  const renderTree = (nodes: TreeNode[], depth = 0) => {
    return nodes.map((node) => {
      const isSelected = selectedWidgetKey === node.widget.key;
      const hasChildren = node.children.length > 0;
      const widgetLabel = readStr(node.widget.label, readStr(node.widget.flutterWidgetType, "Widget"));
      
      const isCollapsed = collapsedNodes.has(node.widget.key);
      
      return (
        <React.Fragment key={node.widget.key}>
          <div 
            className={`${styles.layerItem} ${isSelected ? styles.selected : ''}`}
            style={{ paddingLeft: `${16 + depth * 14}px` }}
            onClick={() => onSelectWidget(node.widget.key)}
          >
             {hasChildren ? (
                 <div onClick={(e) => toggleNode(node.widget.key, e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, cursor: 'pointer' }}>
                   {isCollapsed ? <ChevronRight size={14} className={styles.collapseIcon} /> : <ChevronDown size={14} className={styles.collapseIcon} />}
                 </div>
             ) : (
                <div style={{ width: 14 }}></div> // spacer
             )}
            <span className={styles.widgetIcon}>
               {WIDGET_ICONS[readStr(node.widget.flutterWidgetType, "Widget")] ?? <Zap size={14} />}
            </span>
            <span className={styles.layerLabel}>{widgetLabel}</span>
          </div>
          {!isCollapsed && hasChildren && renderTree(node.children, depth + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.scrollArea}>
        {primaryMode === "design" ? (
          <>
            {/* Frames Section */}
            <div className={styles.section}>
              <div 
                className={styles.sectionHeader} 
                onClick={() => setFramesExpanded(!framesExpanded)}
              >
                <span className={styles.sectionTitle}>Frames <span className={styles.count}>({pages.length})</span></span>
                {framesExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              
              {framesExpanded && (
                <div className={styles.list}>
                  {pages.map((page) => (
                    <div 
                      key={page.key} 
                      className={`${styles.frameItem} ${currentPageKey === page.key ? styles.activeFrame : ''}`}
                      onClick={() => onSelectPage(page.key)}
                    >
                      <MonitorSmartphone size={14} className={styles.frameIcon} />
                      <span className={styles.frameLabel}>{readStr(page.label, readStr(page.key, "Page"))}</span>
                      {currentPageKey === page.key && (
                        <Trash2 size={14} className={styles.deleteIcon} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className={styles.separator} />

            {/* Layers Section */}
            <div className={styles.section}>
              <div 
                className={styles.sectionHeader}
                onClick={() => setLayersExpanded(!layersExpanded)}
              >
                <span className={styles.sectionTitle}>Layers <span className={styles.count}>({currentPageWidgets.length + 4})</span></span>
                {layersExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
              
              {layersExpanded && (
                <div className={styles.layersList}>
                   {renderTree(hierarchy)}
                </div>
              )}
            </div>
          </>
        ) : primaryMode === "backend" ? (
          <div style={{ padding: "24px 16px", color: "var(--text-muted)", fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
            <Database size={24} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Database schema explorer coming soon.</p>
          </div>
        ) : (
          <div style={{ padding: "24px 16px", color: "var(--text-muted)", fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
            <Network size={24} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p>Data bindings, mutators, and logic explorer coming soon.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
