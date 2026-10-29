"use client";

/**
 * Design Preview — Review AI-Generated Design
 *
 * Shows the rendered design in a phone mockup,
 * page selector on the left, theme inspector on the right.
 * "Looks Good" → moves to the project workspace.
 * "Regenerate" → re-runs AI with the same prompt.
 */

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Check,
  AlertCircle,
  Layers,
  Type,
  Palette as PaletteIcon,
  Moon,
  Sun,
} from "lucide-react";
import { useStore } from "../../../lib/store";
import { generateDesignSpec, designSpecToUIGraph } from "../../../lib/openai";
import { PagesStrip } from "../../../components/canvas/PagesStrip";
import type { DesignSpec } from "../../../lib/types";
import { DESIGN_THEMES, applyDesignThemeToSpec, getThemeById, type ThemeMode } from "../../../lib/designThemes";
import { ensureGoogleFontsLoaded } from "../../../lib/googleFonts";
import { applyUiThemeToDom, getStoredUiTheme, setStoredUiTheme, type UiThemeMode } from "../../../lib/uiTheme";
import { AIAssistantSidebar } from "../../../components/canvas/AIAssistantSidebar";
import { ThemePicker } from "../../../components/theme/ThemePicker";
import { Sparkles, Palette } from "lucide-react";
import styles from "./page.module.css";

const readStr = (val: any, fallback = "") => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object" && val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
  return fallback;
};

export default function DesignPreviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { getProject, updateProject, apiKey, model, aiProvider } = useStore();

  const [spec, setSpec] = useState<DesignSpec | null>(null);
  const [currentPageKey, setCurrentPageKey] = useState<string>("");
  const [selectedWidgetKey, setSelectedWidgetKey] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"theme" | "agent">("theme");
  const [previewSpec, setPreviewSpec] = useState<any | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [designThemeId, setDesignThemeId] = useState<string>("midnight-neon");
  const [designThemeMode, setDesignThemeMode] = useState<ThemeMode>("dark");
  const [uiThemeMode, setUiThemeMode] = useState<UiThemeMode>("dark");

  // Load spec from store or sessionStorage
  useEffect(() => {
    const project = getProject(sessionId);
    if (project?.designSpec) {
      setSpec(project.designSpec);
      if (project.designThemeId) setDesignThemeId(project.designThemeId);
      if (project.designThemeMode) setDesignThemeMode(project.designThemeMode);
      if (project.designSpec.pages.length > 0) {
        setCurrentPageKey(project.designSpec.pages[0].key);
      }
      return;
    }

    // Fallback: try sessionStorage
    try {
      const raw = sessionStorage.getItem(`design-${sessionId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setSpec(parsed);
        if (parsed.pages?.length > 0) {
          setCurrentPageKey(parsed.pages[0].key);
        }
      }
    } catch {}
  }, [sessionId, getProject]);

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

  // Load design fonts in the browser (no build-time fetching)
  useEffect(() => {
    if (!spec?.fonts) return;
    ensureGoogleFontsLoaded([spec.fonts.heading, spec.fonts.body]);
  }, [spec?.fonts?.heading, spec?.fonts?.body]);

  // Convert spec to UIGraph for rendering
  const effectiveSpec = previewSpec || spec;

  const uiGraph = useMemo(() => {
    if (!effectiveSpec) return null;
    return designSpecToUIGraph(effectiveSpec);
  }, [effectiveSpec]);

  const selectedWidget = useMemo(() => {
    if (!selectedWidgetKey || !effectiveSpec) return null;
    const pages = Array.isArray(effectiveSpec.pages) ? effectiveSpec.pages : [];
    for (const p of pages) {
      const w = Array.isArray(p.widgets) ? p.widgets.find((x: any) => x.key === selectedWidgetKey) : null;
      if (w) return { key: w.key, label: readStr(w.label || w.type), flutterWidgetType: w.type };
    }
    return null;
  }, [selectedWidgetKey, effectiveSpec]);

  useEffect(() => {
    if (selectedWidgetKey) setRightTab("agent");
  }, [selectedWidgetKey]);

  const currentPage = effectiveSpec?.pages.find((p: any) => p.key === currentPageKey);

  const handleApprove = () => {
    // If we have a preview spec, we should probably apply it before leaving, 
    // but the AI sidebar handles the store update if the user clicks Apply.
    updateProject(sessionId, { stage: "wired" });
    router.push(`/project?id=${sessionId}`);
  };

  const applyTheme = (themeId: string, mode: ThemeMode, nextSpec?: DesignSpec | null) => {
    const base = nextSpec || spec;
    if (!base) return;
    const theme = getThemeById(themeId);
    if (!theme) return;
    const themed = applyDesignThemeToSpec(base, theme, mode);
    setSpec(themed);
    updateProject(sessionId, { designSpec: themed, designThemeId: themeId, designThemeMode: mode });
    try {
      sessionStorage.setItem(`design-${sessionId}`, JSON.stringify(themed));
    } catch {}
  };

  const handlePaletteColorChange = (key: string, color: string) => {
    const base = previewSpec || spec;
    if (!base) return;
    const updated = {
      ...base,
      palette: { ...base.palette, [key]: color },
    } as DesignSpec;
    setSpec(updated);
    if (previewSpec) setPreviewSpec(updated);
    updateProject(sessionId, { designSpec: updated });
    try {
      sessionStorage.setItem(`design-${sessionId}`, JSON.stringify(updated));
    } catch {}
  };

  const handleRegenerate = async () => {
    const project = getProject(sessionId);
    if (!project?.prompt) return;

    const generatorAddendum = (project.promptLabGenerate || "").trim();
    const effectivePrompt =
      generatorAddendum.length > 0
        ? `${project.prompt}\n\nPROMPT LAB (GENERATOR) ADDENDUM:\n${generatorAddendum}`
        : project.prompt;

    setRegenerating(true);
    const result = await generateDesignSpec({ prompt: effectivePrompt, apiKey, model, provider: aiProvider || "cloud", generationMode: "full" });
    setRegenerating(false);

    if (result.success && result.spec) {
      // Preserve selected theme across regenerations (if any).
      const themed = (() => {
        const theme = getThemeById(project.designThemeId || designThemeId);
        const mode = (project.designThemeMode as ThemeMode) || designThemeMode;
        return theme ? applyDesignThemeToSpec(result.spec!, theme, mode) : result.spec!;
      })();

      setSpec(themed);
      updateProject(sessionId, {
        designSpec: themed,
        designThemeId: project.designThemeId || designThemeId,
        designThemeMode: (project.designThemeMode as ThemeMode) || designThemeMode,
        name: readStr(themed.appName),
        description: readStr(themed.tagline),
        pageCount: themed.pages.length,
        widgetCount: themed.pages.reduce((s, p) => s + p.widgets.length, 0),
      });
      if (themed.pages.length > 0) {
        setCurrentPageKey(themed.pages[0].key);
      }
      sessionStorage.setItem(`design-${sessionId}`, JSON.stringify(themed));
    }
  };

  if (!spec) {
    return (
      <div className={styles.errorState}>
        <AlertCircle size={48} color="var(--text-muted)" />
        <div className={styles.errorTitle}>Design not found</div>
        <p className={styles.errorSub}>
          This design session may have expired or doesn't exist yet.
        </p>
        <Link href="/new-project" className={styles.errorBtn}>
          Create New Design
        </Link>
      </div>
    );
  }

  const paletteEntries = effectiveSpec.palette
    ? Object.entries(effectiveSpec.palette)
        .map(([k, v]) => [k, readStr(v)])
        .filter(([, v]) => typeof v === "string" && v.startsWith("#"))
    : [];

  const totalWidgets = effectiveSpec.pages.reduce((s: number, p: any) => s + p.widgets.length, 0);

  return (
    <div className={styles.previewPage}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={14} />
            <span>Home</span>
          </Link>
          <div className={styles.titleGroup}>
            <h1 className={styles.appName}>{readStr(effectiveSpec.appName, "Untitled")}</h1>
            <span className={styles.modelBadge}>{readStr(effectiveSpec.model, "gemini")}</span>
          </div>
        </div>
        <div className={styles.topBarRight}>
          <button
            className={styles.iconBtn}
            onClick={() => setUiThemeMode((m) => (m === "dark" ? "light" : "dark"))}
            title="Toggle UI theme"
          >
            {uiThemeMode === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          <button
            className={styles.regenerateBtn}
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            <RefreshCw size={14} className={regenerating ? "spin" : ""} />
            <span className={styles.btnText}>{regenerating ? "Regenerating..." : "Regenerate"}</span>
          </button>
          <button className={styles.approveBtn} onClick={handleApprove}>
            <Check size={14} />
            <span className={styles.btnText}>Looks Good</span>
            <ArrowRight size={14} className={styles.hideMobile} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.previewContent}>
        {/* Left — Page Selector */}
        <aside className={styles.pageSidebar}>
          <div className={styles.pageSidebarTitle}>Pages ({effectiveSpec.pages.length})</div>
          <div className={styles.pageList}>
            {effectiveSpec.pages.map((page: any) => (
              <div
                key={page.key}
                className={
                  currentPageKey === page.key
                    ? styles.pageItemActive
                    : styles.pageItem
                }
                onClick={() => {
                  setCurrentPageKey(page.key);
                  setSelectedWidgetKey(null);
                }}
              >
                <div className={styles.pageItemName}>{readStr(page.name, "Page")}</div>
                <div className={styles.pageItemPurpose}>{readStr(page.purpose, "")}</div>
                <div className={styles.pageItemMeta}>
                  {page.widgets.length} widgets · {readStr(page.pageType, "unknown")}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center — Phone Preview */}
        <div className={styles.previewCenter}>
          {uiGraph && currentPageKey && (
            <PagesStrip
              uiGraph={uiGraph as any}
              selectedPageKey={currentPageKey}
              onSelectPageKey={(k) => {
                setCurrentPageKey(k);
                setSelectedWidgetKey(null);
              }}
              selectedWidgetKey={selectedWidgetKey}
              onSelectWidget={setSelectedWidgetKey}
              storageKey={`wiraflow.designPreview.viewport.${sessionId}`}
            />
          )}
        </div>

        {/* Right — Inspector / Agent */}
        <aside className={styles.themePanel}>
          <div className={styles.rightTabs}>
            <button 
              className={`${styles.rightTab} ${rightTab === "theme" ? styles.rightTabActive : ""}`}
              onClick={() => setRightTab("theme")}
            >
              <Palette size={14} />
              <span>Theme</span>
            </button>
            <button 
              className={`${styles.rightTab} ${rightTab === "agent" ? styles.rightTabActive : ""}`}
              onClick={() => setRightTab("agent")}
            >
              <Sparkles size={14} />
              <span>AI Edit</span>
            </button>
          </div>

          <div className={styles.rightContent}>
            {rightTab === "theme" ? (
              <>
                <div className={styles.themeSection}>
                  <div className={styles.themeSectionTitle}>Design System</div>
                  <ThemePicker
                    themes={DESIGN_THEMES}
                    value={designThemeId}
                    mode={designThemeMode}
                    onChange={(id) => {
                      setDesignThemeId(id);
                      applyTheme(id, designThemeMode);
                    }}
                    onModeChange={(m) => {
                      setDesignThemeMode(m);
                      applyTheme(designThemeId, m);
                    }}
                  />
                </div>

                <div className={styles.themeSection}>
                  <div className={styles.themeSectionTitle}>Design Stats</div>
                  <div className={styles.summaryGrid}>
                    <div className={styles.summaryStat}>
                      <div className={styles.summaryStatValue}>{effectiveSpec.pages.length}</div>
                      <div className={styles.summaryStatLabel}>Pages</div>
                    </div>
                    <div className={styles.summaryStat}>
                      <div className={styles.summaryStatValue}>{totalWidgets}</div>
                      <div className={styles.summaryStatLabel}>Widgets</div>
                    </div>
                  </div>
                </div>

                <div className={styles.themeSection}>
                  <div className={styles.themeSectionTitle}>Color Palette</div>
                  <div className={styles.colorGrid}>
                    {paletteEntries.slice(0, 9).map(([key, value]) => (
                      <div key={key} className={styles.colorSwatch}>
                        <label className={styles.swatchPicker} title={`Change ${key} color`}>
                          <span
                            className={styles.swatchCircle}
                            style={{ backgroundColor: value as string }}
                          />
                          <input
                            aria-label={`Change ${key} color`}
                            type="color"
                            value={value as string}
                            onChange={(event) => handlePaletteColorChange(key, event.target.value)}
                          />
                        </label>
                        <div className={styles.swatchLabel}>{key.replace(/([A-Z])/g, " $1").trim()}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.themeSection}>
                  <div className={styles.themeSectionTitle}>Typography</div>
                  <div className={styles.fontItem}>
                    <span className={styles.fontLabel}>Headings</span>
                    <span className={styles.fontValue}>{readStr(effectiveSpec.fonts?.heading, "Inter")}</span>
                  </div>
                  <div className={styles.fontItem}>
                    <span className={styles.fontLabel}>Body</span>
                    <span className={styles.fontValue}>{readStr(effectiveSpec.fonts?.body, "DM Sans")}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.agentWrap}>
                {sessionId && (
                  <AIAssistantSidebar
                    projectId={sessionId}
                    designSpec={spec}
                    selectedWidget={selectedWidget}
                    currentPageKey={currentPageKey}
                    onSetPreviewSpec={setPreviewSpec}
                    isPreviewingPatch={!!previewSpec}
                    onEdited={() => {}}
                  />
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
