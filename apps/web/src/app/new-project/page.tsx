"use client";

/**
 * New Project — Prompt Writing Page
 *
 * The user describes what they want to build.
 * On submit, calls OpenAI to generate a DesignSpec,
 * then redirects to the Design Preview page.
 */

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Palette,
  Code2,
  Wand2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { createQuickDraft, generateDesignSpec, generateAppIdeas } from "../../lib/openai";
import type { Project } from "../../lib/types";
import styles from "./page.module.css";

const DEFAULT_EXAMPLES = [
  "A freelance invoicing app with client management and payment tracking",
  "A fitness tracking dashboard with workout logs and progress charts",
  "A team task manager with kanban boards and real-time collaboration",
  "A recipe sharing platform with collections and meal planning",
  "A personal finance tracker with budgets, expenses, and savings goals",
];

async function prepareSketchForOllama(file: File): Promise<string> {
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose an image smaller than 15 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not read this image.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export default function NewProjectPage() {
  const router = useRouter();
  const { apiKey, model, aiProvider, addProject } = useStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [generationMode, setGenerationMode] = useState<"quick" | "full">("quick");
  const [error, setError] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [sketchName, setSketchName] = useState("");
  const [preparingSketch, setPreparingSketch] = useState(false);
  
  const [examples, setExamples] = useState<string[]>(DEFAULT_EXAMPLES);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
    loadIdeas();
  }, []);

  const loadIdeas = async () => {
    setRefreshing(true);
    try {
      const ideas = await generateAppIdeas(apiKey, model);
      if (ideas && ideas.length > 0) {
        setExamples(ideas);
      }
    } catch (err) {
      console.error("Failed to load ideas", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Show elapsed time instead of marking fake pipeline stages complete while the
  // local model is still generating its response.
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setLoadingElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const useInstantDraft = generationMode === "quick" && !imageDataUrl;

    setError(null);
    setLoading(!useInstantDraft);
    setLoadingElapsed(0);

    const result = useInstantDraft
      ? { success: true, spec: createQuickDraft(prompt) }
      : await generateDesignSpec({ prompt, apiKey, model, provider: aiProvider || "cloud", imageDataUrl, generationMode: "full" });

    if (!result.success || !result.spec) {
      setError(result.error || "Generation failed. Please try again.");
      setLoading(false);
      return;
    }

    // Create the project
    const projectId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: projectId,
      name: typeof result.spec.appName === "string" ? result.spec.appName : ((result.spec.appName as any)?.stringVal?.value || "Untitled"),
      description: typeof result.spec.tagline === "string" ? result.spec.tagline : ((result.spec.tagline as any)?.stringVal?.value || ""),
      stage: "previewing",
      prompt,
      designSpec: result.spec,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageCount: result.spec.pages.length,
      widgetCount: result.spec.pages.reduce((s, p) => s + p.widgets.length, 0),
    };

    addProject(newProject);

    // Store the design spec in sessionStorage for the preview page
    sessionStorage.setItem(`design-${projectId}`, JSON.stringify(result.spec));

    // Navigate to preview
    router.push(`/design-preview/${projectId}`);
  };

  const handleChipClick = (example: string) => {
    setPrompt(example);
    textareaRef.current?.focus();
  };

  return (
    <div className={styles.promptPage}>
      {/* Loading Overlay */}
      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingTitle}>
            {loadingElapsed >= 20 ? "Still generating your design..." : "Generating your design..."}
          </div>
          <div className={styles.loadingSteps}>
            <div className={styles.loadingStepActive}>
              <div className={styles.loadingDotActive} />
              {aiProvider === "cloud" ? "Google Gemini (gemini-3.8-flash) is creating your design..." : generationMode === "quick" && !imageDataUrl ? "Preparing your instant local draft..." : "Gemma is creating a compact two-page blueprint on this computer."}
            </div>
            {loadingElapsed >= 15 && (
              <div className={styles.loadingStep}>
                Local models can take a little longer on the first run. Please keep this tab open.
              </div>
            )}
            <div className={styles.loadingStep}>{loadingElapsed}s elapsed</div>
          </div>
        </div>
      )}

      {/* Left Panel — Pipeline Context */}
      <aside className={styles.contextPanel}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to workspace
        </Link>

        <div>
          <h1 className={styles.contextTitle}>
            What do you want
            <br />
            to build?
          </h1>
          <p className={styles.contextSub}>
            Describe your app idea in plain language. Wiraflow will generate a
            complete, professional UI design with color themes, typography, and
            page layouts.
          </p>
        </div>

        <div className={styles.pipeline}>
          <div className={styles.pipelineStep}>
            <div className={styles.stepIconBlue}>
              <Wand2 size={18} />
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>1. Describe Your Vision</div>
              <div className={styles.stepDesc}>
                Write a clear description of the app you want — features, users,
                and goals.
              </div>
            </div>
          </div>

          <div className={styles.pipelineStep}>
            <div className={styles.stepIconPurple}>
              <Palette size={18} />
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>2. AI Generates Design</div>
              <div className={styles.stepDesc}>
                Wiraflow creates a complete design spec — pages, widgets, colors,
                fonts, and layout structure.
              </div>
            </div>
          </div>

          <div className={styles.pipelineStep}>
            <div className={styles.stepIconGreen}>
              <Code2 size={18} />
            </div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>3. Preview & Approve</div>
              <div className={styles.stepDesc}>
                Review the rendered design, tweak if needed, then move into the
                full workspace for wiring.
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Panel — Editor */}
      <main className={styles.editorPanel}>
        <div className={styles.editorContainer}>
          <div className={styles.editorLabel}>Your App Description</div>

          <div className={styles.textareaWrap}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Describe the app you want to build...&#10;&#10;Example: A personal finance app where users can track expenses, set budgets for categories, view spending analytics with charts, and get AI-powered savings recommendations."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={3000}
            />
            <div className={styles.charCount}>{prompt.length} / 3000</div>
          </div>

          <div className={styles.sketchUpload}>
            <div>
              <div className={styles.chipLabel}>Start from a sketch or screenshot</div>
              <div className={styles.sketchHint}>A sketch switches to the full Gemma blueprint flow.</div>
            </div>
            <label className={styles.sketchButton}>
              {preparingSketch ? "Reading image…" : imageDataUrl ? "Replace image" : "Choose image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={preparingSketch}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setPreparingSketch(true);
                  setError(null);
                  try {
                    setImageDataUrl(await prepareSketchForOllama(file));
                    setGenerationMode("full");
                    setSketchName(file.name);
                  } catch (imageError) {
                    setError(imageError instanceof Error ? imageError.message : "Could not read this image.");
                  } finally {
                    setPreparingSketch(false);
                    event.target.value = "";
                  }
                }}
              />
            </label>
            {imageDataUrl && <>
              <span className={styles.sketchName}>{sketchName}</span>
              <button type="button" className={styles.sketchRemove} onClick={() => { setImageDataUrl(undefined); setSketchName(""); }}>Remove</button>
            </>}
          </div>

          {/* Example Chips */}
          <div className={styles.chipSection}>
            <div className={styles.chipHeader}>
              <div className={styles.chipLabel}>Try an example</div>
              <button 
                className={styles.refreshBtn} 
                onClick={loadIdeas} 
                disabled={refreshing || !apiKey}
                title="Generate new ideas"
              >
                <RefreshCw size={14} className={refreshing ? styles.spin : ""} />
                {refreshing ? "Thinking..." : "Refresh"}
              </button>
            </div>
            <div className={styles.chipRow}>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  className={styles.chip}
                  onClick={() => handleChipClick(ex)}
                >
                  {ex.length > 50 ? ex.slice(0, 50) + "..." : ex}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.modeSelector} role="group" aria-label="Blueprint size">
            <button
              type="button"
              className={generationMode === "quick" ? styles.modeOptionActive : styles.modeOption}
              aria-pressed={generationMode === "quick"}
              disabled={!!imageDataUrl}
              onClick={() => setGenerationMode("quick")}
            >
              <span className={styles.modeTitle}>Quick preview</span>
              <span className={styles.modeDescription}>Instant local draft, no model wait</span>
            </button>
            <button
              type="button"
              className={generationMode === "full" ? styles.modeOptionActive : styles.modeOption}
              aria-pressed={generationMode === "full"}
              onClick={() => setGenerationMode("full")}
            >
              <span className={styles.modeTitle}>Full blueprint</span>
              <span className={styles.modeDescription}>AI-generated, two screens, takes longer</span>
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.errorMsg}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Generate CTA */}
          <button
            className={styles.generateBtn}
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading || preparingSketch}
          >
            <Sparkles size={18} />
            {generationMode === "quick" && !imageDataUrl ? "Create instant preview" : "Generate Design"}
          </button>
        </div>
      </main>
    </div>
  );
}
