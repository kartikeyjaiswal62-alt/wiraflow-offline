"use client";

/**
 * Settings — Google Gemini Cloud API and optional local Ollama configuration
 *
 * Users can switch between Google Gemini Cloud API (online default)
 * and local Ollama (offline). Everything is stored in localStorage.
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
  Sparkles,
  Cloud,
  Cpu,
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

  const [provider, setProvider] = useState<"cloud" | "ollama">("cloud");
  const [localKey, setLocalKey] = useState("");
  const [cloudModel, setCloudModel] = useState("gemini-3.8-flash");
  const [ollamaModel, setOllamaModel] = useState("gemma4:e2b-it-q4_K_M");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    model?: string;
    models?: string[];
  } | null>(null);

  // Hydrate from store on mount
  useEffect(() => {
    const currentProvider = aiProvider || "cloud";
    setProvider(currentProvider);
    setLocalKey(apiKey || "");

    if (currentProvider === "cloud") {
      setCloudModel(
        model && !model.startsWith("gemma") && !model.includes("2.0-flash") && !model.includes("1.5")
          ? model
          : "gemini-3.8-flash"
      );
    } else {
      setOllamaModel(
        model && !model.startsWith("gemini")
          ? model
          : "gemma4:e2b-it-q4_K_M"
      );
    }
  }, [apiKey, model, aiProvider]);

  const handleSave = () => {
    setAiProvider(provider);
    if (provider === "cloud") {
      const effectiveModel = cloudModel.trim() || "gemini-3.8-flash";
      setModel(effectiveModel);
      setApiKey(localKey.trim());
    } else {
      const effectiveModel = ollamaModel.trim() || "gemma4:e2b-it-q4_K_M";
      setModel(effectiveModel);
    }
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestCloud = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testApiKey(localKey.trim() || undefined);
    setTestResult(result);
    setTesting(false);
  };

  const handleTestOllama = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/ollama/status", { cache: "no-store" });
      const data = await response.json();
      setTestResult({
        success: !!data.connected,
        error: data.error,
        models: data.models || [],
      });
    } catch {
      setTestResult({
        success: false,
        error: "Could not check Ollama. Make sure the local Ollama server is running.",
      });
    } finally {
      setTesting(false);
    }
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
          Choose online Google Gemini Cloud API or local offline Ollama.
        </p>
      </div>

      <div className={styles.sectionsGrid}>
        {/* ================================================================= */}
        {/* AI Provider Selection */}
        {/* ================================================================= */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={18} />
            AI Generation Engine
          </h2>
          <p className={styles.sectionDesc}>
            Select whether to use the online Cloud API powered by Google Gemini, or run offline with local Ollama.
          </p>

          <div className={styles.field}>
            <label className={styles.fieldLabel} htmlFor="ai-provider">
              Active Provider
            </label>
            <select
              id="ai-provider"
              className={styles.input}
              value={provider}
              onChange={(e) => {
                const next = e.target.value as "cloud" | "ollama";
                setProvider(next);
                setTestResult(null);
              }}
            >
              <option value="cloud">Google Gemini (Cloud API — Online, Recommended)</option>
              <option value="ollama">Local Ollama (Offline, on this computer)</option>
            </select>
          </div>

          {/* Cloud Configuration */}
          {provider === "cloud" && (
            <>
              <div className={styles.notice} style={{ borderColor: "rgba(59, 130, 246, 0.4)", background: "rgba(59, 130, 246, 0.08)" }}>
                <div className={styles.noticeTitle} style={{ color: "#60a5fa" }}>
                  <Cloud size={16} />
                  Google Gemini Cloud API Active
                </div>
                <div className={styles.noticeBody}>
                  Online generation uses Google Gemini (<code>gemini-3.8-flash</code>). The server-side API key is preconfigured in your environment, so no manual key entry is required.
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Gemini Model</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="gemini-3.8-flash"
                  value={cloudModel}
                  onChange={(e) => setCloudModel(e.target.value)}
                />
                <span className={styles.fieldHint}>
                  Default: <strong>gemini-3.8-flash</strong> (Google GenAI SDK).
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Custom Gemini API Key (Optional)</label>
                <div className={styles.inputRow}>
                  <input
                    type={showKey ? "text" : "password"}
                    className={styles.input}
                    placeholder="Leave blank to use preconfigured server key"
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
                  Optional. If provided, overrides the default server-side key.
                </span>
              </div>

              <div className={styles.btnRow}>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <Save size={14} /> Save Cloud Settings
                </button>
                <button className={styles.testBtn} onClick={handleTestCloud} disabled={testing}>
                  <Wifi size={14} />
                  {testing ? "Testing..." : "Test Gemini Connection"}
                </button>
                {saved && (
                  <div className={styles.savedBadgeVisible}>
                    <Check size={14} /> Saved
                  </div>
                )}
              </div>

              {testResult && (
                <div className={testResult.success ? styles.statusSuccess : styles.statusError}>
                  {testResult.success ? (
                    <>
                      <Check size={14} />
                      Connected to Google Gemini ({testResult.model || cloudModel}) successfully!
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      {testResult.error}
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Ollama Configuration */}
          {provider === "ollama" && (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="ollama-model">
                  Ollama Model Tag
                </label>
                <input
                  id="ollama-model"
                  className={styles.input}
                  placeholder="gemma4:e2b-it-q4_K_M"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                />
                <span className={styles.fieldHint}>
                  Default: <code>gemma4:e2b-it-q4_K_M</code>. Run <code>ollama list</code> in your terminal to see installed tags.
                </span>
              </div>

              <div className={styles.btnRow}>
                <button className={styles.saveBtn} onClick={handleSave}>
                  <Save size={14} /> Save Ollama Settings
                </button>
                <button className={styles.testBtn} onClick={handleTestOllama} disabled={testing}>
                  <Wifi size={14} />
                  {testing ? "Checking Ollama..." : "Test Local Connection"}
                </button>
                {saved && (
                  <div className={styles.savedBadgeVisible}>
                    <Check size={14} /> Saved
                  </div>
                )}
              </div>

              {testResult && (
                <div className={testResult.success ? styles.statusSuccess : styles.statusError}>
                  {testResult.success ? (
                    <>
                      <Check size={14} />
                      Ollama is running. {testResult.models?.length ? `Installed: ${testResult.models.join(", ")}` : "No models found."}
                    </>
                  ) : (
                    <>
                      <X size={14} />
                      {testResult.error}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Danger Zone */}
        <div className={styles.dangerSection}>
          <h2 className={styles.dangerTitle}>
            <AlertTriangle size={18} />
            Danger Zone
          </h2>
          <p className={styles.dangerDesc}>
            Clear all local data including API keys, Supabase credentials, projects, and generated designs. This action cannot be undone.
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
