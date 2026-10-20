"use client";

/**
 * Settings — Local Ollama model and optional cloud AI configuration
 *
 * Users enter their OpenAI API key, choose a model,
 * and configure their Supabase connection.
 * Everything is stored in localStorage via the global store.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Key,
  Save,
  Eye,
  EyeOff,
  Zap,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Wifi,
  ShieldCheck,
  Database,
  ExternalLink,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { testApiKey } from "../../lib/openai";
import styles from "./page.module.css";

export default function SettingsPage() {
  const {
    apiKey,
    model,
    aiProvider,
    setApiKey,
    setModel,
    setAiProvider,
  } = useStore();

  const [localKey, setLocalKey] = useState("");
  const [localModel, setLocalModel] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    models?: string[];
  } | null>(null);

  // Hydrate from store
  useEffect(() => {
    setLocalKey(apiKey);
    setLocalModel(model);
  }, [apiKey, model]);

  const handleSave = () => {
    setApiKey(localKey.trim());
    setModel(localModel.trim() || (aiProvider === "ollama" ? "gemma4:e2b-it-q4_K_M" : "gemini-2.0-flash"));
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestOllama = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/ollama/status", { cache: "no-store" });
      const data = await response.json();
      setTestResult({ success: !!data.connected, error: data.error, models: data.models || [] });
    } catch {
      setTestResult({ success: false, error: "Could not check Ollama. Make sure the local app server is running." });
    } finally {
      setTesting(false);
    }
  };

  const handleTest = async () => {
    if (!localKey.trim()) {
      setTestResult({ success: false, error: "Enter an API key first." });
      return;
    }

    setTesting(true);
    setTestResult(null);
    const result = await testApiKey(localKey.trim());
    setTestResult(result);
    setTesting(false);
  };

  const handleClearAll = () => {
    if (
      confirm(
        "This will clear all local data including API keys, projects, and design specs. Are you sure?"
      )
    ) {
      localStorage.removeItem("wiraflow-store");
      window.location.href = "/";
    }
  };

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to workspace
        </Link>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Local Ollama is the default. Cloud providers remain optional.
        </p>
      </div>
      {/* ================================================================= */}
      {/* API Configuration & Danger Zone Grid */}
      {/* ================================================================= */}
      <div className={styles.sectionsGrid}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}><Zap size={18} /> Local AI with Ollama</h2>
        <p className={styles.sectionDesc}>Blueprints, Agent Studio UI edits, and local SQLite schema plans use Ollama on this computer and need no API key. <code>gemma4:e2b-it-q4_K_M</code> is the faster default for CPU-only laptops; larger models can improve quality if your hardware supports them. Supabase schema planning remains available in cloud mode.</p>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="ai-provider">Generation provider</label>
          <select id="ai-provider" className={styles.input} value={aiProvider || "ollama"} onChange={(event) => {
            const nextProvider = event.target.value as "ollama" | "cloud";
            setAiProvider(nextProvider);
            setLocalModel(nextProvider === "ollama" ? "gemma4:e2b-it-q4_K_M" : "gemini-2.0-flash");
            setTestResult(null);
          }}>
            <option value="ollama">Local Ollama (private, no API key)</option>
            <option value="cloud">Cloud API (optional)</option>
          </select>
        </div>
        {aiProvider !== "cloud" && <>
          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ollama-model">Ollama model name</label>
            <input id="ollama-model" className={styles.input} placeholder="gemma4:e2b-it-q4_K_M" value={localModel} onChange={(event) => setLocalModel(event.target.value)} />
            <span className={styles.fieldHint}>Use the exact tag shown by <code>ollama list</code>.</span>
          </div>
          <div className={styles.btnRow}>
            <button className={styles.saveBtn} onClick={handleSave}><Save size={14} /> Save Settings</button>
            <button className={styles.testBtn} onClick={handleTestOllama} disabled={testing}><Wifi size={14} />{testing ? "Checking Ollama..." : "Test Local Connection"}</button>
            {saved && <div className={styles.savedBadgeVisible}><Check size={14} /> Saved</div>}
          </div>
          {testResult && <div className={testResult.success ? styles.statusSuccess : styles.statusError}>
            {testResult.success ? <><Check size={14} /> Ollama is running. {testResult.models?.length ? `Installed: ${testResult.models.join(", ")}` : "No models installed yet; pull one to generate."}</> : <><X size={14} /> {testResult.error}</>}
          </div>}
        </>}
      </div>

      {aiProvider === "cloud" && <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Key size={18} />
          AI API Configuration
        </h2>
        <p className={styles.sectionDesc}>
          Your API key is stored locally in your browser and is never sent
          anywhere except the AI provider&apos;s API.
        </p>

        {/* Private Testing (Cloudflare Tunnel) */}
        <div className={styles.notice}>
          <div className={styles.noticeTitle}>
            <ShieldCheck size={16} />
            Private testing tip (Cloudflare Tunnel)
          </div>
          <div className={styles.noticeBody}>
            If you share a <code>trycloudflare.com</code> URL, protect it with Basic Auth by setting{" "}
            <code>WIRAFLOW_BASIC_USER</code> and <code>WIRAFLOW_BASIC_PASS</code> before starting the dev server.
            When unset, the app stays open (no password).
          </div>
        </div>

        {/* API Key */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Google AI (Gemini) API Key</label>
          <div className={styles.inputRow}>
            <input
              type={showKey ? "text" : "password"}
              className={styles.input}
              placeholder="AIza..."
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
            />
            <button
              className={styles.toggleBtn}
              onClick={() => setShowKey(!showKey)}
              title={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <span className={styles.fieldHint}>
            Get your free key from{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener"
              style={{ color: "var(--accent-primary)" }}
            >
              aistudio.google.com/apikey
            </a>{" "}
            — OpenAI keys (sk-...) also work.
          </span>
        </div>

        {/* Model */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Model Name</label>
          <input
            type="text"
            className={styles.input}
            placeholder="gemini-2.0-flash"
            value={localModel}
            onChange={(e) => setLocalModel(e.target.value)}
          />
          <span className={styles.fieldHint}>
            Default: <strong>gemini-2.0-flash</strong> (free, fast). Also supports: gemini-2.5-pro, gemini-1.5-pro, gpt-4o.
          </span>
        </div>

        {/* Actions */}
        <div className={styles.btnRow}>
          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={14} />
            Save Settings
          </button>

          <button
            className={styles.testBtn}
            onClick={handleTest}
            disabled={testing || !localKey.trim()}
          >
            <Wifi size={14} />
            {testing ? "Testing..." : "Test Connection"}
          </button>

          {saved && (
            <div className={styles.savedBadgeVisible}>
              <Check size={14} />
              Saved
            </div>
          )}
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={
              testResult.success ? styles.statusSuccess : styles.statusError
            }
          >
            {testResult.success ? (
              <>
                <Check size={14} />
                Connection successful — your API key is valid.
              </>
            ) : (
              <>
                <X size={14} />
                {testResult.error}
              </>
            )}
          </div>
        )}
      </div>}

      {/* Danger Zone */}
      <div className={styles.dangerSection}>
        <h2 className={styles.dangerTitle}>
          <AlertTriangle size={18} />
          Danger Zone
        </h2>
        <p className={styles.dangerDesc}>
          Clear all local data including API keys, Supabase credentials, projects, and generated
          designs. This action cannot be undone.
        </p>
        <button className={styles.dangerBtn} onClick={handleClearAll}>
          <Trash2 size={14} />
          Clear All Local Data
        </button>
      </div>
      </div>
    </div>
  );
}
