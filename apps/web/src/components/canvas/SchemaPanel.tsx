"use client";

/**
 * SchemaPanel — Database Schema Viewer & Deployer
 *
 * Shows the generated SupabaseSchemaPlan for the current project:
 *   - Tables tab: visual cards for each table with columns
 *   - SQL tab: full migration SQL (copyable)
 *   - Deploy tab: step-by-step migration runner
 */

import { useState, useMemo, useCallback } from "react";
import {
  Table2,
  Code2,
  Rocket,
  Copy,
  Check,
  AlertTriangle,
  Database,
  Key,
  ExternalLink,
  ChevronRight,
  Loader2,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../../lib/store";
import styles from "./SchemaPanel.module.css";
import { ERDiagram } from "./ERDiagram";

// We import the compiler + types from the monorepo packages
import type { DesignSpec } from "../../lib/types";

// ---------------------------------------------------------------------------
// Schema generation from DesignSpec (inline, since we can't import packages
// directly in the Next.js app without a build step for them)
// ---------------------------------------------------------------------------

interface SchemaPlanTable {
  key: string;
  name: string;
  columns: SchemaPlanColumn[];
  enableRls: boolean;
  comment?: string;
}

interface SchemaPlanColumn {
  key: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultExpression?: string;
  references?: {
    table: string;
    column: string;
    onDelete: string;
  };
  comment?: string;
}

interface MigrationStep {
  key: string;
  order: number;
  description: string;
  upSql: string;
  downSql: string;
}

interface SchemaPlan {
  dialect?: "sqlite" | "postgres";
  tables: SchemaPlanTable[];
  migrationSteps: MigrationStep[];
  enums: { key: string; name: string; values: string[] }[];
  rlsPolicies: { key: string; name: string; tableName: string; operation: string; usingExpression: string }[];
}



// ---------------------------------------------------------------------------
// Step result type
// ---------------------------------------------------------------------------
interface StepResult {
  key: string;
  status: "pending" | "running" | "success" | "failed";
  error?: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Component Props
// ---------------------------------------------------------------------------
interface SchemaPanelProps {
  designSpec: DesignSpec | undefined;
  projectId: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function SchemaPanel({ designSpec, projectId }: SchemaPanelProps) {
  const readStr = (val: any, fallback = "") => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") {
      if (val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
      if (typeof val.value === "string") return val.value;
    }
    return fallback;
  };

  const { getProject, updateProject, apiKey, model, aiProvider } = useStore();
  const project = getProject(projectId);
  const supabaseUrl = project?.supabaseUrl;
  const supabaseAnonKey = project?.supabaseAnonKey;
  const supabaseConnectionString = project?.supabaseConnectionString;
  
  const schemaPlan = project?.schemaPlan;

  const [activeTab, setActiveTab] = useState<"diagram" | "tables" | "sql" | "deploy">("diagram");
  const [copied, setCopied] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stepResults, setStepResults] = useState<StepResult[]>([]);
  const [deployDone, setDeployDone] = useState(false);
  
  const [generatingSchema, setGeneratingSchema] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [droppingSchema, setDroppingSchema] = useState(false);
  const [showDropConfirm, setShowDropConfirm] = useState(false);

  const hasSupabase = !!(supabaseUrl && supabaseAnonKey);
  const hasConnectionString = !!supabaseConnectionString;

  const handleGenerateSchema = async () => {
    if (!designSpec || !project) return;
    setGeneratingSchema(true);
    setGenerateError("");
    
    try {
      const response = await fetch("/api/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spec: designSpec,
          prompt: project.description,
          model: model,
          provider: aiProvider || "ollama",
          ...(aiProvider === "cloud" ? { apiKey } : {}),
        }),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to generate schema");
      }
      
      updateProject(projectId, { schemaPlan: result.schemaPlan });
      setActiveTab("diagram");
    } catch (err: any) {
      setGenerateError(err.message);
    } finally {
      setGeneratingSchema(false);
    }
  };

  // Full SQL text
  const fullSql = useMemo(() => {
    if (!schemaPlan) return "";
    return schemaPlan.migrationSteps.map((s) => `-- ${readStr(s.description)}\n${s.upSql}`).join("\n\n");
  }, [schemaPlan]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(fullSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [fullSql]);

  const handleDeploy = useCallback(async () => {
    if (!schemaPlan || !supabaseUrl || !supabaseConnectionString) return;
    setShowConfirm(false);
    setDeploying(true);
    setDeployDone(false);

    // Initialize step results
    const initial: StepResult[] = schemaPlan.migrationSteps.map((s) => ({
      key: s.key,
      status: "pending",
    }));
    setStepResults(initial);

    try {
      const response = await fetch("/api/schema-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supabaseUrl,
          connectionString: supabaseConnectionString,
          steps: schemaPlan.migrationSteps,
          atomic: true,
        }),
      });

      const result = await response.json();

      if (result.results) {
        setStepResults(
          result.results.map((r: any) => ({
            key: r.key,
            status: r.success ? "success" : "failed",
            error: r.error,
            durationMs: r.durationMs,
          }))
        );
      }
    } catch (err: any) {
      setStepResults(
        initial.map((s) => ({ ...s, status: "failed" as const, error: err.message }))
      );
    } finally {
      setDeploying(false);
      setDeployDone(true);
    }
  }, [schemaPlan, supabaseUrl, supabaseConnectionString]);
  
  const handleDropSchema = useCallback(async () => {
    if (!supabaseConnectionString) return;
    setShowDropConfirm(false);
    setDroppingSchema(true);

    try {
      const response = await fetch("/api/schema-drop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: supabaseConnectionString }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to drop schema");

      // Clear the plan in the store to allow regeneration
      updateProject(projectId, { schemaPlan: undefined });
      setStepResults([]);
      setDeployDone(false);
    } catch (err: any) {
      setGenerateError(`Drop failed: ${err.message}`);
    } finally {
      setDroppingSchema(false);
    }
  }, [projectId, supabaseConnectionString, updateProject]);

  if (!designSpec || !schemaPlan) {
    return (
      <div className={styles.schemaPanel}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Database size={24} />
          </div>
          <div className={styles.emptyTitle}>Production Database Architecture</div>
          <div className={styles.emptySub}>
            Generate a full Postgres relational schema powered by Genkit.
            This will deduce complex relationships, ENUMs, and optimal data types from your UI.
          </div>
          <button 
            onClick={handleGenerateSchema} 
            className={styles.deployBtn} 
            disabled={generatingSchema || !designSpec}
            style={{ marginTop: 12, opacity: (!designSpec) ? 0.3 : 1 }}
          >
            {generatingSchema ? <Loader2 className="spinner" size={16} /> : <Database size={16} />}
            {generatingSchema ? "Compiling Schema..." : "Generate Production Schema"}
          </button>
          {generateError && (
            <div className={styles.stepError} style={{ marginTop: 12, marginLeft: 0 }}>
              {generateError}
            </div>
          )}
          {!designSpec && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
              Please generate a design for your application first.
            </div>
          )}
        </div>
      </div>
    );
  }

  const successCount = stepResults.filter((r) => r.status === "success").length;
  const failCount = stepResults.filter((r) => r.status === "failed").length;

  return (
    <div className={styles.schemaPanel}>
      {/* Tab Bar */}
      <div className={styles.tabBar}>
        <button
          className={activeTab === "diagram" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("diagram")}
        >
          <Database size={14} />
          ER Diagram
        </button>
        <button
          className={activeTab === "tables" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("tables")}
        >
          <Table2 size={14} />
          Tables
          <span className={styles.tabBadge}>{schemaPlan.tables.length}</span>
        </button>
        <button
          className={activeTab === "sql" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("sql")}
        >
          <Code2 size={14} />
          SQL
          <span className={styles.tabBadge}>{schemaPlan.migrationSteps.length}</span>
        </button>
        {schemaPlan.dialect !== "sqlite" && <button
          className={activeTab === "deploy" ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab("deploy")}
        >
          <Rocket size={14} />
          Deploy
        </button>}

        {/* Action Buttons */}
        <div className={styles.tabActions}>
          {schemaPlan.dialect !== "sqlite" && <button 
            className={styles.actionBtn} 
            onClick={handleGenerateSchema}
            disabled={generatingSchema}
            title="Regenerate schema using AI"
          >
            {generatingSchema ? <Loader2 size={12} className="spinner" /> : <RefreshCw size={12} />}
            Regenerate
          </button>}
          <button 
            className={styles.dangerBtn} 
            onClick={() => setShowDropConfirm(true)}
            disabled={droppingSchema || !hasConnectionString}
            title="Drop all tables in the database"
          >
            {droppingSchema ? <Loader2 size={12} className="spinner" /> : <Trash2 size={12} />}
            Drop All
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content} style={activeTab === "diagram" ? { padding: 0, overflow: "hidden" } : {}}>
        {/* ---- Diagram Tab ---- */}
        {activeTab === "diagram" && (
          <div style={{ flex: 1, width: "100%", height: "100%", position: "relative" }}>
            <ERDiagram schemaPlan={schemaPlan} />
          </div>
        )}

        {/* ---- Tables Tab ---- */}
        {activeTab === "tables" && (
          <>
            {schemaPlan.tables.map((table) => (
              <div key={table.key} className={styles.tableCard}>
                <div className={styles.tableHeader}>
                  <div className={styles.tableName}>
                    <Table2 size={14} />
                    {readStr(table.name)}
                    <span className={table.enableRls ? styles.rlsBadge : styles.noRlsBadge}>
                      {table.enableRls ? "RLS" : "No RLS"}
                    </span>
                  </div>
                  <div className={styles.colCount}>{table.columns.length} columns</div>
                </div>

                <div className={styles.columnsGrid}>
                  <div className={styles.colHeaderRow}>
                    <div>Column</div>
                    <div>Type</div>
                    <div>Nullable</div>
                    <div>Default</div>
                  </div>
                  {table.columns.map((col) => (
                    <div key={col.key} className={styles.colRow}>
                      <div className={styles.colName}>
                        {readStr(col.name)}
                        {col.isPrimaryKey && <span className={styles.pkBadge}>PK</span>}
                        {col.references && <span className={styles.fkBadge}>FK</span>}
                      </div>
                      <div className={styles.colType}>{readStr(col.type)}</div>
                      <div className={styles.nullBadge}>{col.nullable ? "yes" : "no"}</div>
                      <div className={styles.nullBadge}>{readStr(col.defaultExpression) || "—"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ---- SQL Tab ---- */}
        {activeTab === "sql" && (
          <div className={styles.sqlContainer}>
            <div className={styles.sqlHeader}>
              <div className={styles.sqlTitle}>
                Migration SQL — {schemaPlan.migrationSteps.length} steps
              </div>
              <button className={styles.copyBtn} onClick={handleCopy}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy All"}
              </button>
            </div>
            <pre className={styles.sqlCode}>{fullSql}</pre>
          </div>
        )}

        {/* ---- Deploy Tab ---- */}
        {activeTab === "deploy" && (
          <>
            {/* Warning if no credentials */}
            {!hasSupabase && (
              <div className={styles.warningCard}>
                <AlertTriangle size={16} className={styles.warningIcon} />
                <div>
                  <strong>Supabase not connected.</strong> Go to{" "}
                  <a href="/settings" style={{ color: "var(--accent-primary)" }}>
                    Settings
                  </a>{" "}
                  to enter your Supabase URL and keys before deploying.
                </div>
              </div>
            )}

            {!hasConnectionString && hasSupabase && (
              <div className={styles.warningCard}>
                <Key size={16} className={styles.warningIcon} />
                <div>
                  <strong>Database Connection String required.</strong> Schema deployment
                  needs a direct Postgres connection to execute DDL statements. Add it in{" "}
                  <a href="/settings" style={{ color: "var(--accent-primary)" }}>
                    Settings
                  </a>.
                </div>
              </div>
            )}

            {/* Deploy Button */}
            <div className={styles.deployHeader}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                <strong>{schemaPlan.migrationSteps.length}</strong> migration steps ready to deploy
              </div>
              <button
                className={styles.deployBtn}
                disabled={!hasConnectionString || deploying}
                onClick={() => setShowConfirm(true)}
              >
                {deploying ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Rocket size={14} />}
                {deploying ? "Deploying..." : "Deploy Schema"}
              </button>
            </div>

            {/* Summary */}
            {deployDone && (
              <div className={failCount === 0 ? styles.deploySummarySuccess : styles.deploySummaryFailed}>
                <Check size={16} />
                {failCount === 0
                  ? `All ${successCount} steps completed successfully!`
                  : `${successCount} succeeded, ${failCount} failed`}
              </div>
            )}

            {/* Steps */}
            <div className={styles.stepList}>
              {(stepResults.length ? stepResults : schemaPlan.migrationSteps.map((s) => ({ key: s.key, status: "pending" as const }))).map((sr, i) => {
                const step = schemaPlan.migrationSteps.find((s) => s.key === sr.key);
                const statusClass =
                  sr.status === "success" ? styles.stepSuccess
                  : sr.status === "failed" ? styles.stepFailed
                  : sr.status === "running" ? styles.stepRunning
                  : styles.stepPending;
                const dotClass =
                  sr.status === "success" ? styles.stepDotSuccess
                  : sr.status === "failed" ? styles.stepDotFailed
                  : sr.status === "running" ? styles.stepDotRunning
                  : styles.stepDotPending;

                return (
                  <div key={sr.key}>
                    <div className={statusClass}>
                      <div className={dotClass} />
                      <div className={styles.stepDesc}>
                        {readStr(step?.description || sr.key)}
                      </div>
                      {(sr as any).durationMs != null && (
                        <div className={styles.stepTime}>{(sr as any).durationMs}ms</div>
                      )}
                      {sr.status === "success" && <Check size={14} />}
                      {sr.status === "failed" && <AlertTriangle size={14} />}
                    </div>
                    {sr.status === "failed" && (sr as any).error && (
                      <div className={styles.stepError}>{(sr as any).error}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle}>
              <Rocket size={20} />
              Deploy Schema to Supabase?
            </div>
            <div className={styles.confirmBody}>
              This will execute <strong>{schemaPlan.migrationSteps.length}</strong> SQL 
              migration steps against your Supabase project at{" "}
              <code style={{
                fontSize: 11,
                padding: "2px 6px",
                borderRadius: 4,
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-color)",
              }}>
                {supabaseUrl}
              </code>.
              <br /><br />
              This includes CREATE TABLE, ALTER TABLE, and CREATE POLICY statements.
              Make sure you are targeting a <strong>development project</strong>.
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmExecute} onClick={handleDeploy}>
                <Rocket size={14} style={{ marginRight: 6 }} />
                Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirm Drop Dialog */}
      {showDropConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowDropConfirm(false)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmTitle} style={{ color: "#F87171" }}>
              <Trash2 size={20} />
              Drop ALL Tables?
            </div>
            <div className={styles.confirmBody}>
              <strong style={{ color: "#F87171" }}>WARNING: THIS ACTION IS IRREVERSIBLE.</strong>
              <br /><br />
              This will execute <code style={{ color: "#F87171" }}>DROP TABLE ... CASCADE</code> for every 
              table in the <strong>public</strong> schema of your database at:
              <br />
              <code style={{ fontSize: 11, display: "block", marginTop: 8, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                {supabaseUrl}
              </code>
              <br />
              All data currently stored in these tables will be <strong>permanently deleted</strong>.
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowDropConfirm(false)}>
                Cancel
              </button>
              <button className={styles.confirmDrop} onClick={handleDropSchema}>
                <Trash2 size={14} style={{ marginRight: 6 }} />
                Yes, Drop Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
