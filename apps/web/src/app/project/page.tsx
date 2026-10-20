"use client";

/**
 * Project Workspace — The Wiraflow IDE Surface
 *
 * This is the main workspace view where users interact with the
 * generated intelligence. It stitches together:
 *   - WidgetTree (centre canvas)
 *   - RightInspector (right panel — semantics, actions, bindings)
 *   - DebugRail (bottom console — execution traces)
 *
 * All three panels communicate through shared selection state
 * and the preview runtime's EventBus.
 */

import { Suspense, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WidgetTree } from "../../components/canvas/WidgetTree";
import { CodeViewer } from "../../components/canvas/CodeViewer";
import { FlutterNativeRenderer } from "../../components/canvas/FlutterNativeRenderer";
import { PagesStrip } from "../../components/canvas/PagesStrip";
import { RightInspector } from "../../components/canvas/RightInspector";
import { AIAssistantSidebar } from "../../components/canvas/AIAssistantSidebar";
import { LeftSidebar } from "../../components/canvas/LeftSidebar";
import { SchemaPanel } from "../../components/canvas/SchemaPanel";
import { WiringGraph } from "../../components/canvas/WiringGraph";
import { DebugRail } from "../../components/debug/DebugRail";
import { ProjectDatabaseConfig } from "../../components/canvas/ProjectDatabaseConfig";
import { DeployModal } from "../../components/canvas/DeployModal";
import {
  Sparkles,
  LayoutPanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Moon,
  Sun,
  ZoomIn,
  ZoomOut,
  Save,
  Code,
  Loader2,
  Database,
  Play,
  Rocket,
} from "lucide-react";
import { mockUIGraph, mockWiringPlan } from "../../data/mock-project";
import { useStore } from "../../lib/store";
import { designSpecToUIGraph } from "../../lib/openai";
import { DESIGN_THEMES, applyDesignThemeToSpec, getThemeById, type ThemeMode } from "../../lib/designThemes";
import { ensureGoogleFontsLoaded } from "../../lib/googleFonts";
import { applyUiThemeToDom, getStoredUiTheme, setStoredUiTheme, type UiThemeMode } from "../../lib/uiTheme";
import { ThemePicker } from "../../components/theme/ThemePicker";
import { Sidebar } from "../../components/layout/Sidebar";
import styles from "./page.module.css";

interface DebugEventDisplay {
  eventId: string;
  timestamp: string;
  eventType: string;
  summary: string;
  flowKey?: string;
  stepKey?: string;
  payload?: Record<string, unknown>;
  error?: { message: string };
}

function ProjectPageInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id");
  const { getProject, addProject, updateProject, projects, primaryMode, setPrimaryMode } = useStore();
  const [previewSpecOverride, setPreviewSpecOverride] = useState<any | null>(null);

  const [selectedWidgetKey, setSelectedWidgetKey] = useState<string | null>(null);
  const [selectedWidgetKeys, setSelectedWidgetKeys] = useState<string[]>([]);
  
  // Initialize primary mode if not set
  useEffect(() => {
    if (!primaryMode) setPrimaryMode("design");
  }, [primaryMode, setPrimaryMode]);

  const [viewMode, setViewMode] = useState<"ui" | "all" | "code" | "native" | "schema" | "wiring">("ui");

  // Sync viewMode when primaryMode changes from the Activity Bar
  useEffect(() => {
    if (primaryMode === "design") setViewMode("ui");
    if (primaryMode === "backend") setViewMode("schema");
    if (primaryMode === "wiring") setViewMode("wiring");
  }, [primaryMode]);
  const [rightPanelMode, setRightPanelMode] = useState<"inspector" | "agent">("inspector");
  const [debugEvents, setDebugEvents] = useState<DebugEventDisplay[]>([]);
  const [designRevision, setDesignRevision] = useState(0);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(360);
  const [uiThemeMode, setUiThemeMode] = useState<UiThemeMode>("dark");
  const [designThemeMode, setDesignThemeMode] = useState<ThemeMode>("dark");
  const [designThemeId, setDesignThemeId] = useState<string>("midnight-neon");
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const rightResizeRef = useRef<{ dragging: boolean; startX: number; startW: number }>({
    dragging: false,
    startX: 0,
    startW: 360,
  });

  // Load rightPanelWidth from localStorage on mount
  useEffect(() => {
    try {
      const v = localStorage.getItem("wiraflow.workspace.rightPanelWidth");
      if (v) {
        const n = Number(v);
        if (Number.isFinite(n)) {
          setRightPanelWidth(Math.max(260, Math.min(520, n)));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Compact layout defaults (for smaller windows)
  useEffect(() => {
    // Removed auto-close logic to give user full control.
    const w = window.innerWidth;
    if (w < 900) setIsLeftSidebarOpen(false);
  }, []);

  // UI theme (IDE) light/dark
  useEffect(() => {
    const mode = getStoredUiTheme();
    setUiThemeMode(mode);
    applyUiThemeToDom(mode);
  }, []);

  useEffect(() => {
    applyUiThemeToDom(uiThemeMode);
    setStoredUiTheme(uiThemeMode);
  }, [uiThemeMode]);

  useEffect(() => {
    if (!isRightPanelOpen) return;
    const onMove = (e: MouseEvent) => {
      if (!rightResizeRef.current.dragging) return;
      const delta = rightResizeRef.current.startX - e.clientX; // drag left => wider
      const next = Math.max(260, Math.min(520, rightResizeRef.current.startW + delta));
      setRightPanelWidth(next);
    };
    const onUp = () => {
      if (!rightResizeRef.current.dragging) return;
      rightResizeRef.current.dragging = false;
      try {
        localStorage.setItem("wiraflow.workspace.rightPanelWidth", String(rightPanelWidth));
      } catch {
        // ignore
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isRightPanelOpen, rightPanelWidth]);

  // Handle Sandbox / Mock Project creation if no ID is provided
  useEffect(() => {
    if (!projectId) {
      const sandboxProj = getProject("sandbox");
      if (!sandboxProj) {
        const now = new Date().toISOString();
        addProject({
          id: "sandbox",
          name: "Project Sandbox",
          description: "Rapid iteration workspace",
          stage: "previewing",
          prompt: "Empty sandbox",
          createdAt: now,
          updatedAt: now,
          pageCount: 0,
          widgetCount: 0,
          designSpec: {
            appName: "Sandbox",
            tagline: "Unsaved local draft",
            palette: {
              primary: "#22D3EE",
              onPrimary: "#000000",
              secondary: "#111111",
              accent: "#4ADE80",
              background: "#000000",
              surface: "#111111",
              surfaceElevated: "#1A1A1A",
              textPrimary: "#F5F5F7",
              textSecondary: "#A1A1A6",
              textMuted: "#555555",
              divider: "#222222",
              error: "#F87171",
              success: "#4ADE80"
            },
            fonts: { heading: "Inter", body: "JetBrains Mono" },
            pages: [],
            generatedAt: now,
            model: "gemini-2.0-flash"
          }
        });
      }
    }
  }, [projectId, getProject, addProject]);

  // Load project design
  const activeUIGraph = useMemo(() => {
    const id = projectId || "sandbox";
    const project = getProject(id);
    const spec = previewSpecOverride || project?.designSpec;
    if (spec) {
      return designSpecToUIGraph(spec) as typeof mockUIGraph;
    }
    return mockUIGraph;
  }, [projectId, projects, designRevision, getProject, previewSpecOverride]);

  const activeProject = getProject(projectId || "sandbox");
  const storeSpec = activeProject?.designSpec;
  const activeSpec = previewSpecOverride || storeSpec;
  const activeProjectId = projectId || "sandbox";

  // Load design fonts in the browser (no build-time fetching)
  useEffect(() => {
    if (!activeSpec?.fonts) return;
    ensureGoogleFontsLoaded([activeSpec.fonts.heading, activeSpec.fonts.body]);
  }, [activeSpec?.fonts?.heading, activeSpec?.fonts?.body]);

  // Restore last selected design theme for this project (best-effort)
  useEffect(() => {
    if (!activeProject) return;
    if (activeProject.designThemeId) setDesignThemeId(activeProject.designThemeId);
    if (activeProject.designThemeMode) setDesignThemeMode(activeProject.designThemeMode);
  }, [activeProject?.id]);

  const applyDesignTheme = useCallback(
    (themeId: string, mode: ThemeMode) => {
      setPreviewSpecOverride(null);
      const project = getProject(activeProjectId);
      if (!project?.designSpec) return;
      const theme = getThemeById(themeId);
      if (!theme) return;
      const nextSpec = applyDesignThemeToSpec(project.designSpec, theme, mode);
      updateProject(activeProjectId, {
        designSpec: nextSpec,
        designThemeId: themeId,
        designThemeMode: mode,
      });
    },
    [activeProjectId, getProject, updateProject]
  );

  const updateWidgetProperties = useCallback(
    (widgetKey: string, patch: Record<string, any>) => {
      setPreviewSpecOverride(null);
      const project = getProject(activeProjectId);
      if (!project?.designSpec) return;

      const clone =
        typeof (globalThis as any).structuredClone === "function"
          ? (globalThis as any).structuredClone(project.designSpec)
          : JSON.parse(JSON.stringify(project.designSpec));

      let found = false;
      for (const page of clone.pages || []) {
        for (const w of page.widgets || []) {
          if (w?.key === widgetKey) {
            w.properties = { ...(w.properties || {}), ...(patch || {}) };
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) return;

      clone.generatedAt = new Date().toISOString();
      updateProject(activeProjectId, { designSpec: clone });
    },
    [activeProjectId, getProject, updateProject]
  );

  // First page key from the active graph
  const [currentPageKey, setCurrentPageKey] = useState<string>("");
  useEffect(() => {
    const pages = (activeUIGraph.pages || []) as any[];
    const firstPage = pages[0];

    // Keep the current page if it still exists after a design edit.
    if (currentPageKey && pages.some((p) => p?.key === currentPageKey)) return;

    if (firstPage?.key) setCurrentPageKey(firstPage.key);
    else if (activeUIGraph === mockUIGraph) {
      // Fallback for mock data keys
      setCurrentPageKey("page-login");
    }
  }, [activeUIGraph, currentPageKey]);

  // If the selected widget disappears after an edit, clear it.
  useEffect(() => {
    if (!selectedWidgetKey) return;
    const exists = (activeUIGraph as any).widgets?.some((w: any) => w?.key === selectedWidgetKey);
    if (!exists) setSelectedWidgetKey(null);
  }, [activeUIGraph, selectedWidgetKey]);

	  const selectedWidget = selectedWidgetKey
	    ? (activeUIGraph as any).widgets?.find((w: { key: string }) => w.key === selectedWidgetKey) ?? null
	    : null;

  // Find flows relevant to the selected widget
  const selectedFlows = selectedWidget
    ? mockWiringPlan.actionFlows.filter(
        (f: { widgetKey: string }) => f.widgetKey === (selectedWidget as any).key
      )
    : [];

	  const multiSelectRef = useRef(false);
	  useEffect(() => {
	    const onDown = (e: KeyboardEvent) => {
	      if (e.key === "Shift") multiSelectRef.current = true;
	    };
	    const onUp = (e: KeyboardEvent) => {
	      if (e.key === "Shift") multiSelectRef.current = false;
	    };
	    window.addEventListener("keydown", onDown);
	    window.addEventListener("keyup", onUp);
	    return () => {
	      window.removeEventListener("keydown", onDown);
	      window.removeEventListener("keyup", onUp);
	    };
	  }, []);

	  const handleSelectWidget = useCallback((key: string) => {
	    const multi = multiSelectRef.current;
	    if (!multi) {
	      setSelectedWidgetKey(key);
	      setSelectedWidgetKeys([key]);
	      return;
	    }
	    setSelectedWidgetKey(key);
	    setSelectedWidgetKeys((prev) => {
	      const set = new Set(prev);
	      if (set.has(key)) set.delete(key);
	      else set.add(key);
	      const next = Array.from(set);
	      return next.length ? next : [key];
	    });
	  }, []);

	  const handleSelectPage = useCallback((key: string) => {
	    setCurrentPageKey(key);
	    setSelectedWidgetKey(null);
	    setSelectedWidgetKeys([]);
	  }, []);

  const handleTriggerAction = useCallback(
    (widgetKey: string) => {
      const widget = (activeUIGraph as any).widgets?.find((w: any) => w?.key === widgetKey);

      // Prefer explicit widget action (present on generated specs).
      const explicitAction = widget?.action;

      // Otherwise, fall back to wiring plan flows (mock wiring plan is currently empty).
      const flow = mockWiringPlan.actionFlows.find((f: any) => f.widgetKey === widgetKey);

      if (!explicitAction && !flow) return;

      const sessionId = "preview-session-1";
      const now = new Date().toISOString();

      // Simulate the action execution by generating debug events
      const newEvents: DebugEventDisplay[] = [];

      // Flow started
      newEvents.push({
        eventId: `evt-${Date.now()}-0`,
        timestamp: now,
        eventType: "flow_started",
        summary: explicitAction
          ? `Action "${explicitAction.operation}" triggered`
          : `Flow "${flow.label}" triggered (${flow.trigger})`,
        flowKey: flow?.actionKey,
      });

      // Immediate navigation for explicit widget actions.
      if (explicitAction?.operation === "navigate" && explicitAction?.targetPageKey) {
        const target = String(explicitAction.targetPageKey);
        const exists = (activeUIGraph as any).pages?.some((p: any) => p?.key === target);
        if (exists) {
          setCurrentPageKey(target);
          setSelectedWidgetKey(null);
          setSelectedWidgetKeys([]);
        }
        newEvents.push({
          eventId: `evt-${Date.now()}-nav`,
          timestamp: new Date(Date.now() + 60).toISOString(),
          eventType: "navigation_triggered",
          summary: `Navigate to ${target}${exists ? "" : " (missing page)"}`,
          flowKey: flow?.actionKey,
        });
      }

      // Execute each step
      const steps = flow
        ? flow.flowStepKeys
            .map((sk: string) => mockWiringPlan.flowSteps.find((s: any) => s.stepKey === sk))
            .filter(Boolean)
        : [];

      steps.forEach((step: any, i: number) => {
        if (!step) return;
        const stepTime = new Date(
          Date.now() + (i + 1) * 80
        ).toISOString();

        newEvents.push({
          eventId: `evt-${Date.now()}-${i * 2 + 1}`,
          timestamp: stepTime,
          eventType: "action_step_started",
          summary: `Step: ${step.label} (${step.stepType})`,
          flowKey: flow.actionKey,
          stepKey: step.stepKey,
        });

        // Type-specific events
        if (step.stepType === "mutation") {
          const mutation = mockWiringPlan.mutationBindings.find(
            (m: any) => m.mutationKey === step.bindingKey
          );
          if (mutation) {
            newEvents.push({
              eventId: `evt-${Date.now()}-${i * 2 + 1}-mut`,
              timestamp: stepTime,
              eventType: "mutation_completed",
              summary: `${mutation.operation.toUpperCase()} on ${mutation.targetTable}`,
              flowKey: flow.actionKey,
              payload: { table: mutation.targetTable, operation: mutation.operation },
            });
          }
        } else if (step.stepType === "navigate") {
          const nav = mockWiringPlan.navigationBindings.find(
            (n: any) => n.navigationKey === step.bindingKey
          );
          if (nav) {
            newEvents.push({
              eventId: `evt-${Date.now()}-${i * 2 + 1}-nav`,
              timestamp: stepTime,
              eventType: "navigation_triggered",
              summary: `Navigate to ${nav.targetPageKey}`,
              flowKey: flow.actionKey,
            });
            const target = String(nav.targetPageKey);
            const exists = (activeUIGraph as any).pages?.some((p: any) => p?.key === target);
            if (exists) {
              setCurrentPageKey(target);
              setSelectedWidgetKey(null);
              setSelectedWidgetKeys([]);
            }
          }
        } else if (step.stepType === "guard") {
          newEvents.push({
            eventId: `evt-${Date.now()}-${i * 2 + 1}-guard`,
            timestamp: stepTime,
            eventType: "guard_passed",
            summary: `Guard check passed for ${step.label}`,
            flowKey: flow.actionKey,
          });
        }

        newEvents.push({
          eventId: `evt-${Date.now()}-${i * 2 + 2}`,
          timestamp: new Date(Date.now() + (i + 1) * 80 + 50).toISOString(),
          eventType: "action_step_completed",
          summary: `Step "${step.label}" completed`,
          flowKey: flow.actionKey,
          stepKey: step.stepKey,
        });
      });

      // Flow completed
      newEvents.push({
        eventId: `evt-${Date.now()}-done`,
        timestamp: new Date(
          Date.now() + (steps.length + 1) * 80
        ).toISOString(),
        eventType: "flow_completed",
        summary: flow
          ? `Flow "${flow.label}" completed (${steps.length} steps)`
          : `Action completed`,
        flowKey: flow?.actionKey,
      });

      setDebugEvents((prev) => [...prev, ...newEvents]);
    },
    [activeUIGraph]
  );

  const handleClearDebug = useCallback(() => {
    setDebugEvents([]);
  }, []);

  // Get page-level read bindings
  const pageReadBindings = mockWiringPlan.readBindings.filter(
    (rb: any) => rb.dataViewKey === currentPageKey
  );

  return (
    <div className={styles.workspace}>
      {/* Left Sidebar */}
      {isLeftSidebarOpen && (
        <LeftSidebar
          primaryMode={primaryMode as any}
          onSelectPrimaryMode={setPrimaryMode}
          currentPageKey={currentPageKey}
          pages={activeUIGraph.pages as any}
          widgets={activeUIGraph.widgets as any}
          selectedWidgetKey={selectedWidgetKey}
          onSelectWidget={handleSelectWidget}
          onSelectPage={handleSelectPage}
        />
      )}

      {/* Center & Right Column */}
      <div className={styles.editorContent}>
        {/* Main Content Area */}
        <div className={styles.mainArea}>
          {/* Centre Canvas */}
          <div className={styles.canvas}>
            
	            {/* Viewport Toolbar */}
	            <div className={styles.viewportToolbar}>
	              <div className={styles.viewportToolbarLeft}>
	                <button
	                  onClick={() => setIsLeftSidebarOpen((v) => !v)}
	                  title={isLeftSidebarOpen ? "Hide left sidebar" : "Show left sidebar"}
	                  className={`${styles.iconBtn} ${styles.iconBtnCompact}`}
	                >
	                  {isLeftSidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
	                </button>
	                <span className={styles.viewportMeta}>
	                  {activeSpec?.generatedAt ? `spec: ${typeof activeSpec.generatedAt === "string" ? activeSpec.generatedAt : (activeSpec.generatedAt.stringVal?.value || activeSpec.generatedAt.value || "latest")}` : "spec: (none)"}
	                </span>
	              </div>

		              <div className={styles.viewportToolbarCenter}>
		                <div className={styles.segmented} role="tablist" aria-label="Preview mode">
                      {primaryMode === "design" && (
                        <>
                          <button
                            onClick={() => setViewMode("ui")}
                            className={`${styles.segBtn} ${viewMode === "ui" ? styles.segBtnActive : ""}`}
                          >
                            UI Preview
                          </button>
                          <button
                            onClick={() => setViewMode("all")}
                            className={`${styles.segBtn} ${viewMode === "all" ? styles.segBtnActive : ""}`}
                          >
                            All Pages
                          </button>
                          <button
                            onClick={() => setViewMode("code")}
                            className={`${styles.segBtn} ${viewMode === "code" ? styles.segBtnActive : ""}`}
                          >
                            Flutter Code
                          </button>
                          <button
                            onClick={() => setViewMode("native")}
                            className={`${styles.segBtn} ${viewMode === "native" ? styles.segBtnActive : ""}`}
                          >
                            Native Engine
                          </button>
                        </>
                      )}
                      
                      {primaryMode === "backend" && (
                        <>
                          <button
                            onClick={() => setViewMode("schema")}
                            className={`${styles.segBtn} ${viewMode === "schema" ? styles.segBtnActive : ""}`}
                          >
                            Schema Definitions
                          </button>
                        </>
                      )}

                      {primaryMode === "wiring" && (
                        <>
                          <button
                            onClick={() => setViewMode("wiring")}
                            className={`${styles.segBtn} ${viewMode === "wiring" ? styles.segBtnActive : ""}`}
                          >
                            App Logic & Data Flow
                          </button>
                        </>
                      )}
	                </div>
	              </div>

	              <div className={styles.viewportToolbarRight}>
	                <ThemePicker
	                  themes={DESIGN_THEMES}
	                  value={designThemeId}
	                  mode={designThemeMode}
	                  onChange={(id) => {
	                    setDesignThemeId(id);
	                    applyDesignTheme(id, designThemeMode);
	                  }}
	                  onModeChange={(m) => {
	                    setDesignThemeMode(m);
	                    applyDesignTheme(designThemeId, m);
	                  }}
	                />

	                <button
	                  onClick={() => {
	                    const id = projectId || "sandbox";
	                    window.open(`/test?id=${id}`, '_blank');
	                  }}
	                  title="Open interactive Test Mode in a new tab"
	                  className={styles.iconBtn}
	                  style={{ color: "var(--accent-cyber)" }}
	                >
	                  <Play size={16} fill="currentColor" />
	                </button>

                  <button
                    onClick={() => setIsDeployModalOpen(true)}
                    title="Deploy Options (Play Store, APK, GitHub, Vercel)"
                    className={styles.iconBtn}
                    style={{ color: "#34D399" }}
                  >
                    <Rocket size={16} fill="currentColor" />
                  </button>

	                <button
	                  onClick={() => setUiThemeMode((m) => (m === "dark" ? "light" : "dark"))}
	                  title="Toggle UI theme"
	                  className={styles.iconBtn}
	                >
	                  {uiThemeMode === "dark" ? <Moon size={14} /> : <Sun size={14} />}
	                </button>

	                <button
	                  onClick={() => setIsRightPanelOpen((v) => !v)}
	                  title={isRightPanelOpen ? "Hide right panel" : "Show right panel"}
	                  className={`${styles.iconBtn} ${styles.iconBtnCompact}`}
	                  style={{ color: isRightPanelOpen ? "var(--text-primary)" : "var(--accent-cyber)" }}
	                >
	                  {isRightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
	                </button>
	              </div>
	            </div>

	            <div className={styles.canvasBody}>
	              {previewSpecOverride && (
	                <div
	                  style={{
	                    position: "absolute",
	                    top: 12,
	                    left: "50%",
	                    transform: "translateX(-50%)",
	                    zIndex: 80,
	                    display: "inline-flex",
	                    alignItems: "center",
	                    gap: 10,
	                    padding: "8px 10px",
	                    borderRadius: 12,
	                    background: "rgba(59, 130, 246, 0.14)",
	                    border: "1px solid rgba(59, 130, 246, 0.22)",
	                    color: "rgba(245, 245, 247, 0.92)",
	                    backdropFilter: "blur(10px)",
	                  }}
	                >
	                  <span style={{ fontSize: 12, fontWeight: 900 }}>Previewing agent patch</span>
	                  <button
	                    onClick={() => setPreviewSpecOverride(null)}
	                    style={{
	                      padding: "6px 10px",
	                      borderRadius: 10,
	                      border: "1px solid rgba(255, 255, 255, 0.14)",
	                      background: "rgba(0, 0, 0, 0.18)",
	                      color: "rgba(245, 245, 247, 0.92)",
	                      fontSize: 12,
	                      fontWeight: 900,
	                      cursor: "pointer",
	                    }}
	                  >
	                    Exit
	                  </button>
	                </div>
	              )}
	               {viewMode === "ui" ? (
	                  <WidgetTree
	                    initialFrameMode="device"
	                    initialDeviceSkin="clean"
	                    pages={activeUIGraph.pages as any}
	                    widgets={activeUIGraph.widgets as any}
	                    selectedWidgetKey={selectedWidgetKey}
	                    selectedWidgetKeys={selectedWidgetKeys}
	                    onSelectWidget={handleSelectWidget}
	                    currentPageKey={currentPageKey}
                    palette={activeSpec?.palette as any}
                    fonts={activeSpec?.fonts as any}
	                  />
	               ) : viewMode === "all" ? (
	                  <PagesStrip
	                    uiGraph={activeUIGraph as any}
	                    selectedPageKey={currentPageKey}
	                    onSelectPageKey={handleSelectPage}
	                    selectedWidgetKey={selectedWidgetKey}
	                    selectedWidgetKeys={selectedWidgetKeys}
	                    onSelectWidget={handleSelectWidget}
	                    palette={activeSpec?.palette as any}
	                    fonts={activeSpec?.fonts as any}
	                    storageKey={
	                      projectId ? `wiraflow.workspace.pagesStrip.viewport.${projectId}` : undefined
	                    }
	                  />
	               ) : viewMode === "code" ? (
	                  <CodeViewer designSpec={activeSpec as any} currentPageKey={currentPageKey} />
	               ) : viewMode === "schema" ? (
	                  <SchemaPanel
	                    designSpec={activeSpec as any}
	                    projectId={activeProjectId}
	                  />
	               ) : viewMode === "wiring" ? (
	                  <WiringGraph
	                    designSpec={activeSpec as any}
	                  />
	               ) : (
	                  <FlutterNativeRenderer 
	                    pages={activeUIGraph.pages as any}
                    widgets={activeUIGraph.widgets as any}
                    currentPageKey={currentPageKey}
                    palette={activeSpec?.palette as any}
                    fonts={activeSpec?.fonts as any}
                  />
               )}
            </div>
          </div>

          {/* Right Area (Tabs + Content) */}
          {(isRightPanelOpen || primaryMode === "backend") && (
            <div
              className={styles.rightPanel}
              style={{
                width: `${rightPanelWidth}px`,
                minWidth: "260px",
                maxWidth: "600px",
                flexShrink: 0,
              }}
            >
              {/* Resize handle */}
              <div
                onMouseDown={(e) => {
                  rightResizeRef.current.dragging = true;
                  rightResizeRef.current.startX = e.clientX;
                  rightResizeRef.current.startW = rightPanelWidth;
                }}
                title="Drag to resize"
                style={{
                  position: "absolute",
                  left: -6,
                  top: 0,
                  bottom: 0,
                  width: 12,
                  cursor: "col-resize",
                  zIndex: 40,
                }}
              />
               <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", opacity: primaryMode === "backend" ? 0 : 1, pointerEvents: primaryMode === "backend" ? "none" : "auto" }}>
                 <button
                   onClick={() => setRightPanelMode("inspector")}
                   style={{
                     flex: 1, padding: "12px", background: "none", border: "none", cursor: "pointer", 
                     color: rightPanelMode === "inspector" ? "var(--text-primary)" : "var(--text-muted)",
                     borderBottom: rightPanelMode === "inspector" ? "2px solid var(--text-primary)" : "2px solid transparent",
                     display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", fontWeight: 600
                   }}
                 >
                   <LayoutPanelLeft size={14} /> Inspector
                 </button>
                 <button
                   onClick={() => setRightPanelMode("agent")}
                   style={{
                     flex: 1, padding: "12px", background: "none", border: "none", cursor: "pointer", 
                     color: rightPanelMode === "agent" ? "var(--accent-cyber)" : "var(--text-muted)",
                     borderBottom: rightPanelMode === "agent" ? "2px solid var(--accent-cyber)" : "2px solid transparent",
                     display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", fontWeight: 600
                   }}
                 >
                   <Sparkles size={14} /> AI Agent
                 </button>
               </div>
               
               <div style={{ flex: 1, overflow: "hidden" }}>
                 {primaryMode === "backend" ? (
                   <ProjectDatabaseConfig projectId={activeProjectId || "sandbox"} />
                 ) : rightPanelMode === "inspector" ? (
                  <RightInspector
                    selectedWidget={selectedWidget as any}
                    flows={selectedFlows}
                    steps={mockWiringPlan.flowSteps}
                    readBindings={pageReadBindings}
                    mutations={mockWiringPlan.mutationBindings as any}
                    guards={mockWiringPlan.guards as any}
                    onUpdateWidgetProperties={updateWidgetProperties}
                    palette={activeSpec?.palette as any}
                  />
                ) : (
	                  <AIAssistantSidebar
	                    projectId={projectId || "sandbox"}
	                    designSpec={getProject(projectId || "sandbox")?.designSpec}
	                    selectedWidget={selectedWidget as any}
	                    selectedWidgetKeys={selectedWidgetKeys}
	                    currentPageKey={currentPageKey}
	                    onSetPreviewSpec={setPreviewSpecOverride}
	                    isPreviewingPatch={!!previewSpecOverride}
	                    onSetSelectionKeys={(keys) => {
	                      const next = Array.isArray(keys) ? keys.map(String) : [];
	                      setSelectedWidgetKeys(next);
	                      setSelectedWidgetKey(next.length ? next[0] : null);
	                    }}
	                    onEdited={() => setDesignRevision((r) => r + 1)}
	                  />
                )}
              </div>
            </div>
          )}
        </div>

        {isDeployModalOpen && (
          <DeployModal 
            appName={activeProject?.name || activeSpec?.appName || "Your App"} 
            onClose={() => setIsDeployModalOpen(false)} 
          />
        )}

        {/* Debug Rail */}
        <DebugRail events={debugEvents} onClear={handleClearDebug} />
      </div>
    </div>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div style={{ padding: 18, color: "var(--text-muted)" }}>Loading workspace…</div>}>
      <ProjectPageInner />
    </Suspense>
  );
}
