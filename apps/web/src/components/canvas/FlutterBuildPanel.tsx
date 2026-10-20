"use client";

import { useEffect, useState } from "react";
import { useStore } from "../../lib/store";
import type { DesignSpec } from "../../lib/types";
import { generateFlutterProjectFiles } from "../../lib/flutter-project-export";
import styles from "./FlutterBuildPanel.module.css";

type BuildEvent = {
  type: "step" | "result";
  name?: string;
  status?: "running" | "success" | "failed";
  message?: string;
  output?: string;
  success?: boolean;
  firstPassSuccess?: boolean;
  durationMs?: number;
  previewUrl?: string;
  fixAttempts?: number;
};

type BuildMetric = { model: string; firstPassSuccess: boolean; success: boolean; repairCount: number; durationMs: number; recordedAt: number };
const METRICS_KEY = "wiraflow.flutterBuildMetrics.v1";

export function FlutterBuildPanel({ designSpec }: { designSpec?: DesignSpec }) {
  const { aiProvider, model } = useStore();
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<BuildEvent[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState<BuildMetric[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(METRICS_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setMetrics(parsed.filter((item): item is BuildMetric => item && typeof item.model === "string" && typeof item.success === "boolean" && typeof item.firstPassSuccess === "boolean" && typeof item.recordedAt === "number"));
      }
    } catch { /* Local metrics are optional if browser storage is unavailable. */ }
  }, []);

  const startBuild = async () => {
    if (!designSpec || running) return;
    setRunning(true);
    setEvents([]);
    setPreviewUrl("");
    setError("");
    try {
      const generated = generateFlutterProjectFiles(designSpec);
      const files = Object.entries(generated)
        .filter(([filePath]) => filePath === "pubspec.yaml" || filePath === "analysis_options.yaml" || /^(lib|test)\/.+\.dart$/.test(filePath))
        .map(([filePath, content]) => ({ path: filePath, content }));
      const response = await fetch("/api/flutter/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files, model }),
      });
      if (!response.ok || !response.body) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Build request failed (${response.status}).`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let hasResult = false;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() || "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const event = JSON.parse(dataLine.slice(6)) as BuildEvent;
          if (event.type === "step") setEvents((current) => [...current, event]);
          if (event.type === "result") {
            hasResult = true;
            if (event.success && event.previewUrl) setPreviewUrl(event.previewUrl);
            else setError(event.message || "The local build did not complete.");
            if (typeof event.success === "boolean") {
              const metric: BuildMetric = { model, firstPassSuccess: event.firstPassSuccess === true, success: event.success, repairCount: event.fixAttempts || 0, durationMs: event.durationMs || 0, recordedAt: Date.now() };
              setMetrics((current) => {
                const next = [...current, metric].slice(-200);
                try { localStorage.setItem(METRICS_KEY, JSON.stringify(next)); } catch { /* Keep the current session metric in memory. */ }
                return next;
              });
            }
          }
        }
      }
      if (!hasResult) throw new Error("Build stream ended before returning a result.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build this Flutter project.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className={styles.panel} aria-label="Local Flutter build">
      <div className={styles.header}>
        <div>
          <h3>Local build & preview</h3>
          <p>Flutter checks run on this machine. Gemma can repair Dart errors locally.</p>
        </div>
        <button type="button" onClick={startBuild} disabled={!designSpec || running || aiProvider !== "ollama"}>
          {running ? "Working…" : "Analyze, repair & preview"}
        </button>
      </div>
      {aiProvider !== "ollama" && <p className={styles.notice}>Switch to Local Ollama in Settings to use local Gemma repairs.</p>}
      {events.length > 0 && (
        <ol className={styles.timeline} aria-live="polite">
          {events.map((event, index) => (
            <li key={`${event.name}-${index}`} className={styles[event.status || "running"]}>
              <span className={styles.dot} />
              <div className={styles.eventBody}>
                <div className={styles.eventTitle}><strong>{event.name}</strong><span>{event.status}</span></div>
                {event.message && <p>{event.message}</p>}
                {event.output && <details><summary>Show command output</summary><pre>{event.output}</pre></details>}
              </div>
            </li>
          ))}
        </ol>
      )}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {metrics.length > 0 && (
        <div className={styles.metrics}>
          <strong>Local build results</strong>
          <span>Collected on this device · {metrics.length} run{metrics.length === 1 ? "" : "s"}</span>
          {Array.from(new Set(metrics.map((metric) => metric.model))).map((tag) => {
            const sample = metrics.filter((metric) => metric.model === tag);
            const firstPass = sample.filter((metric) => metric.firstPassSuccess).length;
            const repaired = sample.filter((metric) => metric.success).length;
            const firstRate = sample.length ? Math.round((firstPass / sample.length) * 100) : 0;
            const finalRate = sample.length ? Math.round((repaired / sample.length) * 100) : 0;
            return <div className={styles.metricRow} key={tag}>
              <b>{tag} <small>({sample.length} runs)</small></b>
              <label>First pass <span>{firstPass}/{sample.length} · {firstRate}%</span><i><em style={{ width: `${firstRate}%` }} /></i></label>
              <label>After repair <span>{repaired}/{sample.length} · {finalRate}%</span><i><em style={{ width: `${finalRate}%` }} /></i></label>
            </div>;
          })}
        </div>
      )}
      {previewUrl && <div className={styles.preview}><h4>Running Flutter web preview</h4><iframe title="Generated Flutter application preview" src={previewUrl} sandbox="allow-scripts allow-forms" /></div>}
    </section>
  );
}
