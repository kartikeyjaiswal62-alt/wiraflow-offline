import React, { useMemo, useState } from "react";
import styles from "./WidgetTree.module.css";
import type { DesignSpec } from "../../lib/types";
import { generateFlutterPageDart } from "../../lib/flutter-codegen";
import { generateFlutterProjectFiles } from "../../lib/flutter-project-export";
import { buildZipBlob } from "../../lib/zip";
import { FlutterBuildPanel } from "./FlutterBuildPanel";

function downloadTextFile(fileName: string, contents: string, mime = "text/plain") {
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CodeViewer({
  designSpec,
  currentPageKey,
}: {
  designSpec?: DesignSpec;
  currentPageKey: string;
}) {
  const [includeSupabase, setIncludeSupabase] = useState(false);
  const code = useMemo(() => {
    if (!designSpec) {
      return "// No DesignSpec loaded.\n// Generate a design first to see Flutter code here.";
    }
    return generateFlutterPageDart(designSpec, currentPageKey);
  }, [designSpec, currentPageKey]);

  const fileName = useMemo(() => {
    if (!designSpec) return "design_page.dart";
    const page = designSpec.pages.find((p) => p.key === currentPageKey) ?? designSpec.pages[0];
    if (!page) return "design_page.dart";
    return `${page.key.replace(/[^a-z0-9_-]/gi, "_")}.dart`;
  }, [designSpec, currentPageKey]);

  return (
    <div className={styles.canvasContainer} style={{ padding: "0" }}>
      <div style={{ flex: 1, backgroundColor: "#1E1E1E", color: "#D4D4D4", width: "100%", minHeight: "100%", display: "flex", flexDirection: "column" }}>
        
        {/* Editor Tab Header */}
        <div style={{ display: "flex", alignItems: "center", backgroundColor: "#252526", padding: "8px 16px", borderBottom: "1px solid #333" }}>
          <div style={{ 
            padding: "6px 12px", 
            backgroundColor: "#1E1E1E", 
            borderTop: "1px solid #007ACC", 
            color: "#FFFFFF", 
            fontSize: "12px", 
           fontFamily: "'Inter', sans-serif",
            display: "flex", alignItems: "center", gap: "8px"
           }}>
            <span style={{ color: "#519ABA" }}>{"{}"}</span> {fileName}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 5, color: "#A1A1A6", fontSize: 11 }}>
              <input type="checkbox" checked={includeSupabase} onChange={(event) => setIncludeSupabase(event.target.checked)} />
              Supabase starter
            </label>
            <button
              type="button"
              onClick={() => downloadTextFile(fileName, code, "text/plain")}
              style={{
                fontSize: 12,
                color: "#D4D4D4",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
              title="Download current page Dart file"
            >
              Download Page
            </button>
            <button
              type="button"
              disabled={!designSpec}
              onClick={() => {
                if (!designSpec) return;
                const files = generateFlutterProjectFiles(designSpec, { includeSupabase });
                const appBase = (designSpec.appName || "wiraflow_app").replace(/[^a-z0-9_-]/gi, "_");
                const zipInputs = Object.entries(files).map(([path, data]) => ({ path, data }));
                const zip = buildZipBlob(zipInputs, { modifiedAt: new Date(designSpec.generatedAt || Date.now()) });
                const url = URL.createObjectURL(zip);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${appBase}_flutter_export.zip`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontSize: 12,
                color: designSpec ? "#FFFFFF" : "rgba(255,255,255,0.5)",
                background: designSpec ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.05)",
                border: "1px solid rgba(99,102,241,0.35)",
                borderRadius: 10,
                padding: "6px 10px",
                cursor: designSpec ? "pointer" : "not-allowed",
                fontFamily: "'Inter', sans-serif",
              }}
              title="Download a ZIP bundle (pubspec + main.dart + all pages)"
            >
              Export Bundle
            </button>
          </div>
          <div style={{ fontSize: "12px", color: "#A1A1A6", fontFamily: "'Inter', sans-serif" }}>
             Generated UI Source
          </div>
        </div>

        {/* Text Area */}
        <div style={{ flex: 1, minHeight: 260, maxHeight: 560, padding: "16px", overflowY: "auto", overflowX: "auto" }}>
          <pre style={{ 
              margin: 0, 
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace", 
              fontSize: "13px", 
              lineHeight: "1.5", 
              color: "#C586C0" // Generic token color
            }}>
            <code style={{ color: "#D4D4D4" }}>
              {code}
            </code>
          </pre>
        </div>

        <FlutterBuildPanel designSpec={designSpec} />

      </div>
    </div>
  );
}
