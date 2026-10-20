"use client";

/**
 * Test Mode — Interactive App Runtime
 *
 * A standalone /test?id=<projectId> route that renders the generated app
 * with full interactivity: working navigation, button actions, form input,
 * database queries, and a debug console.
 */

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { WidgetTree } from "../../components/canvas/WidgetTree";
import { useStore } from "../../lib/store";
import { designSpecToUIGraph } from "../../lib/openai";
import { ensureGoogleFontsLoaded } from "../../lib/googleFonts";
import {
  createInitialState,
  navigate,
  goBack,
  setField,
  addToast,
  dismissToast,
  addEvent,
  clearEvents,
  setAuthenticated,
  type RuntimeState,
} from "../../lib/runtime-engine";
import { resolveWidgetAction } from "../../lib/action-resolver";
import { getSupabaseClient } from "../../lib/supabase/client";
import { fetchReadBinding, executeMutation, type ReadBinding, type MutationBinding } from "../../lib/supabase/data-fetcher";
import { useTestData } from "../../lib/useTestData";
import { ArrowLeft, Terminal, X, Trash2, ChevronUp, ChevronDown, Sun, Moon, Home, Database, Loader2, Wand2 } from "lucide-react";
import { getStoredUiTheme, setStoredUiTheme } from "../../lib/uiTheme";
import styles from "./page.module.css";

/** Safely unbox DSL stringVal wrapper or return a plain string. */
const readStr = (val: any, fallback = ""): string => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    if (val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
    if (typeof val.value === "string") return val.value;
  }
  return fallback;
};

function TestModeInner() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "sandbox";
  const { getProject } = useStore();
  const project = getProject(projectId);
  const spec = project?.designSpec;

  const uiGraph = useMemo(() => {
    if (!spec) return null;
    return designSpecToUIGraph(spec);
  }, [spec]);

  const firstPageKey = useMemo(() => {
    if (!uiGraph?.pages?.length) return "";
    return (uiGraph.pages as any[])[0]?.key || "";
  }, [uiGraph]);

  const [runtime, setRuntime] = useState<RuntimeState>(() => createInitialState(firstPageKey));
  const [debugOpen, setDebugOpen] = useState(false);
  const [showEmulator, setShowEmulator] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => getStoredUiTheme());
  const [dbSeeding, setDbSeeding] = useState(false);
  const [dbSeeded, setDbSeeded] = useState(false);
  const [ripples, setRipples] = useState<{ id: string; x: number; y: number }[]>([]);

  // Supabase client (from project or env)
  const supabaseClient = useMemo(() => {
    return getSupabaseClient(project?.supabaseUrl, project?.supabaseAnonKey);
  }, [project?.supabaseUrl, project?.supabaseAnonKey]);

  const { testData } = useTestData(spec as any, supabaseClient, project?.schemaPlan);

  // Sync first page key when graph loads
  useEffect(() => {
    if (firstPageKey && runtime.currentPageKey !== firstPageKey && runtime.navigationHistory.length <= 1) {
      setRuntime(createInitialState(firstPageKey));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstPageKey]);

  // Load fonts
  useEffect(() => {
    if (spec?.fonts) {
      ensureGoogleFontsLoaded([readStr((spec.fonts as any).heading), readStr((spec.fonts as any).body)]);
    }
  }, [(spec?.fonts as any)?.heading, (spec?.fonts as any)?.body]);

  // Auto-dismiss toasts after 3s
  useEffect(() => {
    if (runtime.toasts.length === 0) return;
    const timer = setTimeout(() => {
      setRuntime((s) => ({
        ...s,
        toasts: s.toasts.filter((t) => Date.now() - t.createdAt < 3000),
      }));
    }, 3200);
    return () => clearTimeout(timer);
  }, [runtime.toasts]);

  // Navigation Guard: Enforce Auth
  useEffect(() => {
    if (!spec || !runtime.currentPageKey) return;
    
    const currentPage = spec.pages.find(p => p.key === runtime.currentPageKey);
    const pageType = readStr(currentPage?.pageType);
    
    // If not authenticated and trying to access a non-auth page
    const isAuthPage = pageType === "form" || runtime.currentPageKey.includes("login") || runtime.currentPageKey.includes("register");
    
    if (!runtime.isAuthenticated && !isAuthPage && runtime.currentPageKey !== firstPageKey) {
      const loginPage = spec.pages.find(p => readStr(p.pageType) === "form" || p.key.includes("login"));
      if (loginPage && runtime.currentPageKey !== loginPage.key) {
        setRuntime(s => navigate(addToast(s, "Authentication required", "info"), loginPage.key));
      }
    }
  }, [runtime.isAuthenticated, runtime.currentPageKey, spec, firstPageKey]);

  // Update stored theme when changed
  useEffect(() => {
    setStoredUiTheme(theme);
  }, [theme]);

  /** No-op: test mode doesn't need visual selection. */
  const handleSelectWidget = useCallback((_key: string) => {}, []);

  /** Handle field changes from interactive TextFields */
  const handleFieldChange = useCallback(
    (widgetKey: string, value: string) => {
      setRuntime((s) => {
        const next = setField(s, s.currentPageKey, widgetKey, value);
        return next;
      });
    },
    []
  );

  /** Called when an interactive widget fires its action. */
  const handleAction = useCallback(
    (widgetKey: string) => {
      if (!spec) return;
      try {
        const pageFields = runtime.formState[runtime.currentPageKey] || {};
        const action = resolveWidgetAction(widgetKey, spec, pageFields);

        setRuntime((s) => {
          let next = addEvent(s, "action", `Tapped "${widgetKey}" → ${action.type}`, { action });

          // Go back
          if (action.type === "go_back") {
            next = goBack(next);
            next = addEvent(next, "navigate", `Back to previous page`);
            return next;
          }

          // Navigate
          if (action.type === "navigate" && action.targetPageKey) {
            const pageExists = spec.pages.some((p) => p.key === action.targetPageKey);
            if (pageExists) {
              next = navigate(next, action.targetPageKey!);
              next = addEvent(next, "navigate", `Navigated → ${action.targetPageKey}`);
            } else {
              next = addEvent(next, "error", `Page "${action.targetPageKey}" not found`);
            }
          }

          // Auth / Form Submit
          if (action.type === "auth" || action.type === "submit_form") {
            const isAuth = action.type === "auth";
            const email = pageFields.email || pageFields.user_email || "";
            const password = pageFields.password || pageFields.user_password || "";

            if (isAuth && supabaseClient) {
              const isRegister = action.label?.toLowerCase().includes("register") || action.label?.toLowerCase().includes("sign up");
              
              // Perform real Supabase Auth!
              const authPromise = isRegister 
                ? supabaseClient.auth.signUp({ email, password })
                : supabaseClient.auth.signInWithPassword({ email, password });

              authPromise.then(({ data, error }) => {
                if (error) {
                  setRuntime(s => addToast(addEvent(s, "error", `Auth failed: ${error.message}`), error.message, "error"));
                } else if (data.user) {
                  setRuntime(s => {
                    let next = setAuthenticated(s, true, { email: data.user!.email!, id: data.user!.id });
                    next = addToast(addEvent(next, "action", `Authenticated as ${data.user!.email}`), "Successfully authenticated!", "success");
                    if (action.targetPageKey) {
                      const exists = spec.pages.some((p) => p.key === action.targetPageKey);
                      if (exists) next = navigate(next, action.targetPageKey!);
                    }
                    return next;
                  });
                }
              });
              return s; // Wait for promise
            }

            if (action.toastMessage) next = addToast(next, action.toastMessage, "success");
            next = addEvent(next, "form_submit", `Submitted form on ${s.currentPageKey}`, {
              fields: pageFields,
            });

            // Execute Supabase mutation if client available
            if (supabaseClient && project?.schemaPlan?.tables?.length) {
              // ... existing mutation logic ...
              const tables = project.schemaPlan.tables;
              if (tables.length > 0) {
                const table = tables[0];
                const mutationBinding: MutationBinding = {
                  key: `mutation-${Date.now()}`,
                  targetTableKey: table.name,
                  operation: "insert",
                };
                executeMutation(supabaseClient, mutationBinding, pageFields)
                  .then((result) => {
                    setRuntime((prev) => {
                      if (result.success) {
                        return addEvent(
                          addToast(prev, `Data saved to ${table.name}`, "success"),
                          "mutation",
                          `INSERT into ${table.name} succeeded`,
                          { data: result.data }
                        );
                      } else {
                        return addEvent(
                          addToast(prev, `DB Error: ${result.error}`, "error"),
                          "error",
                          `INSERT into ${table.name} failed: ${result.error}`
                        );
                      }
                    });
                  })
                  .catch(() => {});
              }
            }

            if (action.targetPageKey) {
              const exists = spec.pages.some((p) => p.key === action.targetPageKey);
              if (exists) next = navigate(next, action.targetPageKey!);
            }
          }

          // Toast
          if (action.type === "toast" && action.toastMessage) {
            next = addToast(next, action.toastMessage, "info");
          }

          return next;
        });
      } catch (err: any) {
        console.error("[TestMode] handleAction error:", err);
        setRuntime((s) => addEvent(s, "error", `Action error: ${err?.message || "unknown"}`));
      }
    },
    [spec, runtime.currentPageKey, runtime.formState, supabaseClient, project?.schemaPlan]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    const id = `ripple-${Date.now()}-${Math.random()}`;
    setRipples((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  };

  const handleBack = useCallback(() => {
    setRuntime((s) => goBack(s));
  }, []);

  const handleClear = useCallback(() => {
    setRuntime((s) => clearEvents(s));
  }, []);

  /** Seed mock data into Supabase tables */
  const handleSeedData = useCallback(async () => {
    if (!supabaseClient || !project?.schemaPlan?.tables?.length) {
      setRuntime((s) => addToast(s, "No database connection or schema available", "error"));
      return;
    }
    setDbSeeding(true);
    const tables = project.schemaPlan.tables;
    let totalSeeded = 0;

    for (const table of tables) {
      // Generate 5 mock rows per table
      const mockRows: Record<string, any>[] = [];
      for (let i = 0; i < 5; i++) {
        const row: Record<string, any> = {};
        for (const col of table.columns) {
          if (col.isPrimaryKey && col.defaultExpression) continue; // Skip auto-generated PKs
          if (col.key === "id" && (col.type === "uuid" || col.type === "bigint")) continue;
          if (col.key === "created_at" || col.key === "updated_at") continue;

          // Generate mock values based on column type
          switch (col.type.toLowerCase()) {
            case "text":
            case "varchar":
            case "character varying":
              if (col.key.includes("email")) row[col.key] = `user${i + 1}@example.com`;
              else if (col.key.includes("name")) row[col.key] = ["Alice Johnson", "Bob Smith", "Charlie Brown", "Diana Ross", "Eve Williams"][i];
              else if (col.key.includes("title")) row[col.key] = ["Meeting Notes", "Project Update", "Sprint Review", "Daily Standup", "Brainstorm Session"][i];
              else if (col.key.includes("description") || col.key.includes("content") || col.key.includes("body")) row[col.key] = `Sample content for entry ${i + 1}. This is mock data generated for testing.`;
              else if (col.key.includes("url") || col.key.includes("image") || col.key.includes("avatar")) row[col.key] = `https://picsum.photos/seed/${i + 1}/200/200`;
              else if (col.key.includes("status")) row[col.key] = ["active", "pending", "completed", "archived", "draft"][i];
              else if (col.key.includes("category") || col.key.includes("type")) row[col.key] = ["General", "Work", "Personal", "Health", "Finance"][i];
              else if (col.key.includes("phone")) row[col.key] = `+1555010${i}00${i}`;
              else if (col.key.includes("address") || col.key.includes("location")) row[col.key] = ["New York, NY", "San Francisco, CA", "Austin, TX", "Seattle, WA", "Denver, CO"][i];
              else row[col.key] = `Sample ${col.name || col.key} ${i + 1}`;
              break;
            case "integer":
            case "int4":
            case "int8":
            case "bigint":
            case "smallint":
              if (col.key.includes("age")) row[col.key] = 25 + i * 5;
              else if (col.key.includes("count") || col.key.includes("quantity")) row[col.key] = (i + 1) * 3;
              else if (col.key.includes("rating") || col.key.includes("score")) row[col.key] = Math.min(5, i + 1);
              else if (col.key.includes("price") || col.key.includes("amount")) row[col.key] = (i + 1) * 100;
              else row[col.key] = i + 1;
              break;
            case "numeric":
            case "decimal":
            case "float4":
            case "float8":
            case "double precision":
            case "real":
              if (col.key.includes("price") || col.key.includes("amount") || col.key.includes("cost")) row[col.key] = (i + 1) * 29.99;
              else if (col.key.includes("rating")) row[col.key] = Math.round((3.5 + i * 0.3) * 10) / 10;
              else row[col.key] = Math.round((i + 1) * 1.5 * 100) / 100;
              break;
            case "boolean":
            case "bool":
              row[col.key] = i % 2 === 0;
              break;
            case "timestamp":
            case "timestamptz":
            case "timestamp with time zone":
            case "timestamp without time zone":
              row[col.key] = new Date(Date.now() - i * 86400000).toISOString();
              break;
            case "date":
              row[col.key] = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
              break;
            case "json":
            case "jsonb":
              row[col.key] = { note: `Sample data ${i + 1}`, tags: ["test", "mock"] };
              break;
            default:
              if (!col.nullable) row[col.key] = `mock_${i + 1}`;
          }
        }
        if (Object.keys(row).length > 0) mockRows.push(row);
      }

      if (mockRows.length > 0) {
        try {
          const { data, error } = await supabaseClient.from(table.name).insert(mockRows).select();
          if (error) {
            setRuntime((s) => addEvent(s, "error", `Seed ${table.name}: ${error.message}`));
          } else {
            totalSeeded += data?.length || 0;
            setRuntime((s) => addEvent(s, "mutation", `Seeded ${data?.length || 0} rows into ${table.name}`));
          }
        } catch (err: any) {
          setRuntime((s) => addEvent(s, "error", `Seed ${table.name}: ${err.message}`));
        }
      }
    }

    setDbSeeding(false);
    setDbSeeded(true);
    setRuntime((s) => addToast(s, `Seeded ${totalSeeded} rows across ${tables.length} tables`, "success"));
  }, [supabaseClient, project?.schemaPlan]);

  const handleMagicFill = useCallback(() => {
    if (!uiGraph || !runtime.currentPageKey) return;
    
    // Find all interactive input-like widgets on the current page
    const pageWidgetKeys = new Set((uiGraph.pages as any[]).find(p => p.key === runtime.currentPageKey)?.widgetKeys || []);
    const inputs = (uiGraph.widgets as any[]).filter(w => 
      pageWidgetKeys.has(w.key) && 
      (w.flutterWidgetType === "TextField" || w.flutterWidgetType === "Dropdown" || w.flutterWidgetType === "Switch")
    );

    if (inputs.length === 0) {
      setRuntime(s => addToast(s, "No input fields found on this page.", "info"));
      return;
    }

    setRuntime(s => {
      let next = s;
      inputs.forEach(input => {
        let val = "";
        const label = (input.label || "").toLowerCase();
        
        // Smarter mock data based on labels
        if (label.includes("email")) val = "jane.doe@example.com";
        else if (label.includes("name")) val = "Jane Doe";
        else if (label.includes("phone")) val = "+1 555-0123";
        else if (label.includes("address")) val = "123 Innovation Drive, Tech City";
        else if (label.includes("password")) val = "••••••••";
        else if (label.includes("city")) val = "San Francisco";
        else if (label.includes("zip") || label.includes("postal")) val = "94105";
        else if (input.flutterWidgetType === "Switch") val = "true";
        else val = `Sample ${input.label || "Data"}`;

        next = setField(next, s.currentPageKey, input.key, val);
      });
      
      return addEvent(addToast(next, `Magic filled ${inputs.length} fields`, "success"), "action", "Magic Filled form fields");
    });
  }, [uiGraph, runtime.currentPageKey]);

  if (!spec || !uiGraph) {
    return (
      <div className={styles.testContainer}>
        <div style={{ padding: 40, textAlign: "center", color: "#A1A1A6" }}>
          <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No project found</p>
          <p style={{ fontSize: 13 }}>Open Test Mode from a project workspace with a generated design.</p>
        </div>
      </div>
    );
  }

  const appName = readStr((spec as any).appName, "Test Mode");
  const currentPageLabel = readStr(
    (uiGraph.pages as any[]).find((p: any) => p.key === runtime.currentPageKey)?.label,
    runtime.currentPageKey
  );

  const getDebugTypeClass = (type: string) => {
    if (type === "navigate") return styles.debugTypeNav;
    if (type === "action") return styles.debugTypeAction;
    if (type === "field_change") return styles.debugTypeField;
    if (type === "error") return styles.debugTypeError;
    if (type === "mutation") return styles.debugTypeMutation;
    return styles.debugTypeSubmit;
  };

  return (
    <div 
      className={`${styles.testContainer} ${theme === "light" ? styles.lightTheme : ""}`}
      onPointerDown={handlePointerDown}
    >
      {/* Ripples */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className={styles.ripple}
          style={{ left: r.x, top: r.y }}
        />
      ))}
      {/* Header */}
      <div className={styles.testHeader}>
        <button className={styles.headerBack} onClick={handleBack} disabled={runtime.navigationHistory.length <= 1}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div className={styles.headerTitle}>{appName}</div>
        <div className={styles.headerPage}>{currentPageLabel}</div>

        {runtime.isAuthenticated && (
          <div className={styles.userBadge}>
            <div className={styles.userDot} />
            {runtime.user?.email}
            <button 
              className={styles.logoutBtn} 
              onClick={() => {
                supabaseClient?.auth.signOut();
                setRuntime(s => setAuthenticated(s, false));
              }}
              title="Log Out"
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Magic Fill */}
        <button
          className={styles.themeToggle}
          onClick={handleMagicFill}
          title="Magic Fill Form"
          style={{ color: "var(--accent-cyber)" }}
        >
          <Wand2 size={14} />
        </button>

        {/* DB Seed button */}
        {supabaseClient && project?.schemaPlan?.tables?.length && !dbSeeded && (
          <button
            className={styles.themeToggle}
            onClick={handleSeedData}
            disabled={dbSeeding}
            title="Seed mock data into database"
          >
            {dbSeeding ? <Loader2 size={14} className={styles.spin} /> : <Database size={14} />}
          </button>
        )}

        <button 
          className={styles.themeToggle} 
          onClick={() => setShowEmulator(v => !v)}
          title={showEmulator ? "Hide Emulator Controls" : "Show Emulator Controls"}
        >
          <Terminal size={14} />
        </button>
        <button 
          className={styles.themeToggle} 
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button className={styles.headerExit} onClick={() => window.close()}>
          <X size={12} style={{ marginRight: 4 }} />
          Exit
        </button>
      </div>

      {/* Preview */}
      <div className={styles.testBody}>
        <div className={styles.previewPane}>
          <WidgetTree
            pages={uiGraph.pages as any}
            widgets={uiGraph.widgets as any}
            selectedWidgetKey={null}
            onSelectWidget={handleSelectWidget}
            onTriggerAction={handleAction}
            onFieldChange={handleFieldChange}
            currentPageKey={runtime.currentPageKey}
            showControls={showEmulator}
            initialFrameMode="device"
            initialDeviceSkin="bezel"
            palette={spec.palette as any}
            fonts={spec.fonts as any}
            themeMode={theme}
            testData={testData}
          />
        </div>
      </div>

      {/* Debug Console */}
      <div className={`${styles.debugPanel} ${!debugOpen ? styles.debugPanelCollapsed : ""}`}>
        <div className={styles.debugHeader} onClick={() => setDebugOpen((v) => !v)}>
          <Terminal size={12} />
          Debug Console
          <span className={styles.debugBadge}>{runtime.events.length}</span>
          {debugOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          {debugOpen && (
            <button
              className={styles.debugClearBtn}
              onClick={(e) => { e.stopPropagation(); handleClear(); }}
            >
              <Trash2 size={10} style={{ marginRight: 4 }} />
              Clear
            </button>
          )}
        </div>
        {debugOpen && (
          <div className={styles.debugBody}>
            {runtime.events.length === 0 && (
              <div style={{ color: "#555", padding: "8px 0" }}>
                Interact with the app to see events here...
              </div>
            )}
            {runtime.events.map((evt) => (
              <div key={evt.id} className={styles.debugEvent}>
                <span className={styles.debugTime}>
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <span className={`${styles.debugType} ${getDebugTypeClass(evt.type)}`}>
                  {evt.type}
                </span>
                <span className={styles.debugSummary}>{evt.summary}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toasts */}
      {runtime.toasts.length > 0 && (
        <div className={styles.toastContainer}>
          {runtime.toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${
                toast.type === "success" ? styles.toastSuccess :
                toast.type === "error" ? styles.toastError :
                styles.toastInfo
              }`}
              onClick={() => setRuntime((s) => dismissToast(s, toast.id))}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "#A1A1A6" }}>Loading test mode…</div>}>
      <TestModeInner />
    </Suspense>
  );
}
