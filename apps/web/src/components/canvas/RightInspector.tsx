"use client";

/**
 * RightInspector — Tabbed Inspection Panel
 *
 * When a widget is selected on the WidgetTree canvas, this panel
 * displays deep intelligence about it:
 *   - Semantics: role, FF widget type, data bindings
 *   - Actions: which flows are attached, their steps, guards
 *   - Bindings: read/mutation/navigation bindings
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  SearchCode,
  Layers,
  SlidersHorizontal,
  Paintbrush,
  Move,
  Type,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpDown,
  ArrowLeftRight,
  Image as ImageIcon,
  Lock as LockIcon,
  BarChart3,
  Loader,
  Zap,
  Link2,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Wand2,
  Sparkles,
} from "lucide-react";
import { globalTheme } from "../../data/mock-project";
import { useStore } from "../../lib/store";
import styles from "./RightInspector.module.css";

interface WidgetData {
  key: string;
  label: string;
  flutterWidgetType: string;
  semanticRole: string;
  interactive: boolean;
  action?: { operation: string; targetEntityKey?: string; targetPageKey?: string };
  dataBindings: { sourceEntityKey: string; field: string; displayAs: string }[];
  properties?: Record<string, any>;
}

interface FlowData {
  actionKey: string;
  label: string;
  trigger: string;
  description: string;
  flowStepKeys: string[];
}

interface StepData {
  stepKey: string;
  label: string;
  stepType: string;
  description: string;
}

interface ReadBindingData {
  readBindingKey: string;
  sourceTable: string;
  accessMode: string;
  orderBy?: string;
  orderDirection?: string;
}

interface MutationData {
  mutationKey: string;
  targetTable: string;
  operation: string;
  fieldMappings: { widgetKey: string; column: string }[];
}

interface GuardData {
  guardKey: string;
  flowKey?: string;
  condition: string;
  onFailure: string;
}

interface RightInspectorProps {
  selectedWidget: WidgetData | null;
  flows: FlowData[];
  steps: StepData[];
  readBindings: ReadBindingData[];
  mutations: MutationData[];
  guards: GuardData[];
  onUpdateWidgetProperties?: (widgetKey: string, patch: Record<string, any>) => void;
  palette?: Record<string, string>;
}

type Tab = "semantics" | "customize" | "actions" | "bindings";

export function RightInspector({
  selectedWidget,
  flows,
  steps,
  readBindings,
  mutations,
  guards,
  onUpdateWidgetProperties,
  palette,
}: RightInspectorProps) {
  const { apiKey, model } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>("semantics");
  
  // Asset state
  const [isGeneratingIcon, setIsGeneratingIcon] = useState(false);
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [generatedIcon, setGeneratedIcon] = useState<string | null>(null);
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);

  const handleGenerateAsset = async (type: "icon" | "logo") => {
    if (type === "icon") setIsGeneratingIcon(true);
    else setIsGeneratingLogo(true);

    try {
      const res = await fetch("/api/generate-asset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, apiKey, model }),
      });
      const data = await res.json();
      if (data.success) {
        if (type === "icon") setGeneratedIcon(data.assetUrl);
        else setGeneratedLogo(data.assetUrl);
      }
    } catch (err) {
      console.error("Asset generation failed", err);
    } finally {
      if (type === "icon") setIsGeneratingIcon(false);
      else setIsGeneratingLogo(false);
    }
  };

  // Safely unbox DSL-wrapped string values
  const safeStr = (val: any, fallback = ""): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") {
      if (val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
      if (typeof val.value === "string") return val.value;
    }
    return fallback;
  };

  if (!selectedWidget) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Project Assets</h3>
          <ImageIcon size={16} color="var(--text-muted)" />
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
             <h4 className={styles.subSectionTitle}>App Branding</h4>
             <p className={styles.hint}>Generate professional app icons and branding assets using AI.</p>
             
             <div className={styles.assetCard}>
                <div className={styles.assetPreview}>
                  {isGeneratingIcon ? (
                    <Loader size={24} className={styles.spin} />
                  ) : generatedIcon ? (
                    <img src={generatedIcon} alt="Generated Icon" className={styles.assetImg} />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                </div>
                <div className={styles.assetInfo}>
                   <div className={styles.assetName}>Main App Icon</div>
                   <button 
                    className={styles.generateAssetBtn}
                    onClick={() => handleGenerateAsset("icon")}
                    disabled={isGeneratingIcon}
                   >
                     <Wand2 size={14} />
                     {isGeneratingIcon ? "Generating..." : (generatedIcon ? "Regenerate Icon" : "Generate Icon")}
                   </button>
                </div>
             </div>

             <div className={styles.assetCard}>
                <div className={styles.assetPreview}>
                  {isGeneratingLogo ? (
                    <Loader size={24} className={styles.spin} />
                  ) : generatedLogo ? (
                    <img src={generatedLogo} alt="Generated Logo" className={styles.assetImg} />
                  ) : (
                    <ImageIcon size={32} />
                  )}
                </div>
                <div className={styles.assetInfo}>
                   <div className={styles.assetName}>Splash Logo</div>
                   <button 
                    className={styles.generateAssetBtn}
                    onClick={() => handleGenerateAsset("logo")}
                    disabled={isGeneratingLogo}
                   >
                     <Wand2 size={14} />
                     {isGeneratingLogo ? "Generating..." : (generatedLogo ? "Regenerate Logo" : "Generate Logo")}
                   </button>
                </div>
             </div>
          </div>
          
          <div className={styles.section}>
            <h4 className={styles.subSectionTitle}>Context Inspector</h4>
            <div className={styles.emptyState}>
              Select a widget node on the canvas to inspect its AI-generated semantics, data bindings, and action flows.
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Find flows attached to this widget
  const widgetFlows = flows.filter((f) => f.actionKey.includes(selectedWidget.key) || 
    flows.some(fl => fl.actionKey && selectedWidget.action));
  const relatedFlows = flows.filter(f => {
    // Match by looking at the widget's action
    if (!selectedWidget.action) return false;
    return true; // In real impl, would match by widgetKey in the flow
  });

  return (
    <aside className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>{safeStr(selectedWidget.label, "Widget")}</h3>
        <span className={styles.widgetTypeBadge}>
          {safeStr(selectedWidget.flutterWidgetType, "Unknown")}
        </span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {(["semantics", "customize", "actions", "bindings"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab)}
            title={tab.charAt(0).toUpperCase() + tab.slice(1)}
          >
            {tab === "semantics" && <Layers size={16} />}
            {tab === "customize" && <SlidersHorizontal size={16} />}
            {tab === "actions" && <Zap size={16} />}
            {tab === "bindings" && <Link2 size={16} />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={styles.content}>
        {activeTab === "semantics" && (
          <SemanticsTab widget={selectedWidget} />
        )}
        {activeTab === "customize" && (
          <CustomizeTab widget={selectedWidget} onUpdateWidgetProperties={onUpdateWidgetProperties} palette={palette} />
        )}
        {activeTab === "actions" && (
          <ActionsTab flows={flows} steps={steps} guards={guards} widget={selectedWidget} />
        )}
        {activeTab === "bindings" && (
          <BindingsTab
            widget={selectedWidget}
            readBindings={readBindings}
            mutations={mutations}
          />
        )}
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Sub-Tab Components
// ---------------------------------------------------------------------------

function getStringVal(obj: any, key: string): string {
  const v = obj?.[key];
  return typeof v?.stringVal?.value === "string" ? v.stringVal.value : "";
}

function getNumberVal(obj: any, key: string, fallback: number): number {
  const v = obj?.[key];
  return typeof v?.numberVal?.value === "number" ? v.numberVal.value : fallback;
}

function getBoolVal(obj: any, key: string, fallback: boolean): boolean {
  const v = obj?.[key];
  return typeof v?.boolVal?.value === "boolean" ? v.boolVal.value : fallback;
}

function getColorToken(obj: any, key: string): string {
  const v = obj?.[key];
  const token = v?.color?.color;
  return typeof token === "string" ? token : "";
}

function getIconName(obj: any, key: string): string {
  const v = obj?.[key];
  const name = v?.icon?.name;
  return typeof name === "string" ? name : "";
}

function setStringPatch(key: string, value: string) {
  return { [key]: { stringVal: { value } } };
}
function setNumberPatch(key: string, value: number) {
  return { [key]: { numberVal: { value } } };
}
function setBoolPatch(key: string, value: boolean) {
  return { [key]: { boolVal: { value } } };
}
function setColorPatch(key: string, value: string) {
  return { [key]: { color: { color: value } } };
}
function setAlignPatch(key: string, value: string) {
  return { [key]: { align: { named: value } } };
}
function setIconPatch(key: string, value: string) {
  return { [key]: { icon: { name: value } } };
}
function setRadiusPatch(value: number) {
  const v = Math.max(0, Math.round(value));
  return { radius: { radius: { topLeft: v, topRight: v, bottomLeft: v, bottomRight: v } } };
}
function setPaddingTokenPatch(token: string) {
  return { padding: { edgeInsets: { top: 0, right: 0, bottom: 0, left: 0, token } } };
}
function setEdgeInsetsCustomPatch(top: number, right: number, bottom: number, left: number) {
  return { padding: { edgeInsets: { top, right, bottom, left, token: "" } } };
}

function setBorderPatch(width: number, colorToken: string) {
  const w = Math.max(0, Math.round(width || 0));
  return {
    border: {
      border: {
        width: w,
        color: { color: colorToken || "divider" },
      },
    },
  };
}

function setShadowTokenPatch(token: string) {
  return { shadow: { stringVal: { value: token } } };
}

function setOpacityPatch(value: number) {
  const v = Math.max(0, Math.min(1, value));
  return { opacity: { numberVal: { value: v } } };
}

function setRotatePatch(value: number) {
  const v = Math.max(-180, Math.min(180, value));
  return { transform_rotate: { numberVal: { value: v } } };
}

function setClipPatch(value: boolean) {
  return { clip: { boolVal: { value } } };
}

function setScrollPatch(value: boolean) {
  return { scroll: { boolVal: { value } } };
}

function setTextStylePatch(styleName: string) {
  return { style: { textStyle: { styleName } } };
}

function setGradientPatch(type: "GRADIENT_TYPE_LINEAR" | "GRADIENT_TYPE_RADIAL", stop1: string, stop2: string) {
  return {
    gradient: {
      gradient: {
        type,
        stops: [{ color: { color: stop1 } }, { color: { color: stop2 } }],
      },
    },
  };
}

function clearGradientPatch() {
  return { gradient: { gradient: { type: "GRADIENT_TYPE_LINEAR", stops: [] } } };
}

function SemanticsTab({ widget }: { widget: WidgetData }) {
  return (
    <div className={styles.section}>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Widget Key</span>
        <code className={styles.fieldValue}>{widget.key}</code>
      </div>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Semantic Role</span>
        <span className={styles.rolePill}>{String(widget.semanticRole || "Component").replace(/_/g, " ")}</span>
      </div>
      <div className={styles.fieldGroup}>
        <span className={styles.fieldLabel}>Interactive</span>
        <span className={styles.fieldValue}>{widget.interactive ? "✓ Yes" : "✗ No"}</span>
      </div>

      {widget.dataBindings && widget.dataBindings.length > 0 && (
        <>
          <h4 className={styles.subSectionTitle}>Data Bindings</h4>
          {widget.dataBindings.map((b, i) => (
            <div key={i} className={styles.bindingCard}>
              <span className={styles.bindingEntity}>{b.sourceEntityKey}</span>
              <ChevronRight size={12} color="var(--text-muted)" />
              <code className={styles.bindingField}>{b.field}</code>
              <span className={styles.bindingDisplay}>as {b.displayAs}</span>
            </div>
          ))}
        </>
      )}

      {widget.action && (
        <>
          <h4 className={styles.subSectionTitle}>Primary Action</h4>
          <div className={styles.actionCard}>
            <Zap size={14} color="var(--accent-cyber)" />
            <span>{widget.action.operation.replace(/_/g, " ")}</span>
            {widget.action.targetEntityKey && (
              <code className={styles.targetChip}>→ {widget.action.targetEntityKey}</code>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CustomizeTab({
  widget,
  onUpdateWidgetProperties,
  palette,
}: {
  widget: WidgetData;
  onUpdateWidgetProperties?: (widgetKey: string, patch: Record<string, any>) => void;
  palette?: Record<string, string>;
}) {
  const props = widget.properties || {};
  const type = widget.flutterWidgetType;

  if (!onUpdateWidgetProperties) {
    return <div className={styles.emptyState}>Live customization is not configured for this view.</div>;
  }

  const patch = (p: Record<string, any>) => onUpdateWidgetProperties(widget.key, p);
  const debouncedPatch = useDebouncedCallback((p: Record<string, any>) => onUpdateWidgetProperties(widget.key, p), 180);

  const themeColorTokens = useMemo(() => {
    const a = palette ? Object.keys(palette) : [];
    const b = Object.keys((globalTheme.colors.dark as any) || {});
    return Array.from(new Set([...a, ...b]));
  }, [palette]);

  const textStyleTokens = useMemo(() => {
    return Object.keys((globalTheme.text_styles as any) || {});
  }, []);

  const spacingTokens = useMemo(() => {
    return Object.keys((globalTheme.spacing as any) || {});
  }, []);

  const initialDraft = useMemo(() => {
    const edgeInsets = props.padding?.edgeInsets;
    const hasToken = typeof edgeInsets?.token === "string" && edgeInsets.token.length > 0;
    const border = props.border?.border;
    const gradient = props.gradient?.gradient;
    const stop1 = gradient?.stops?.[0]?.color?.color || gradient?.stops?.[0]?.color || gradient?.stops?.[0] || "";
    const stop2 = gradient?.stops?.[1]?.color?.color || gradient?.stops?.[1]?.color || gradient?.stops?.[1] || "";
    return {
      // Size (optional)
      widthFill: !!props.width?.px?.isInfinity,
      widthPx: typeof props.width?.px?.value === "number" ? props.width.px.value : 0,
      heightPx: typeof props.height?.px?.value === "number" ? props.height.px.value : 0,
      widthToken: (props.width?.stringVal?.value as string) || "",
      heightToken: (props.height?.stringVal?.value as string) || "",
      // Common
      bg: getColorToken(props, "bg"),
      radius: getNumberVal(props, "radius", 16),
      shadow: (props.shadow?.stringVal?.value as string) || "",
      clip: getBoolVal(props, "clip", false),
      opacity: typeof props.opacity?.numberVal?.value === "number" ? props.opacity.numberVal.value : 1,
      rotate: typeof props.transform_rotate?.numberVal?.value === "number" ? props.transform_rotate.numberVal.value : 0,
      borderWidth: typeof border?.width === "number" ? border.width : 0,
      borderColor: (border?.color?.color as string) || "divider",
      // Padding
      paddingMode: hasToken ? "token" : "custom",
      paddingToken: (edgeInsets?.token as string) || "md",
      pTop: typeof edgeInsets?.top === "number" ? edgeInsets.top : 0,
      pRight: typeof edgeInsets?.right === "number" ? edgeInsets.right : 0,
      pBottom: typeof edgeInsets?.bottom === "number" ? edgeInsets.bottom : 0,
      pLeft: typeof edgeInsets?.left === "number" ? edgeInsets.left : 0,
      // Layout (Row/Column)
      spacing: (props.spacing?.stringVal?.value as string) || "md",
      scroll: getBoolVal(props, "scroll", false),
      mainAlign: (props.main_align?.align?.named as string) || "start",
      crossAlign: (props.cross_align?.align?.named as string) || "start",
      rowJustify: (props.align?.align?.named as string) || "start",
      // Content / text
      content: getStringVal(props, "content"),
      label: getStringVal(props, "label"),
      hint: getStringVal(props, "hint"),
      textAlign: (props.text_align?.align?.named as string) || "start",
      color: getColorToken(props, "color"),
      fontWeight: getNumberVal(props, "font_weight", 0),
      lineHeight: typeof props.line_height?.numberVal?.value === "number" ? props.line_height.numberVal.value : 0,
      textStyle: (props.style?.textStyle?.styleName as string) || "",
      // Buttons
      variant: (props.variant?.stringVal?.value as string) || "primary",
      fullWidth: getBoolVal(props, "full_width", true),
      iconEnd: getIconName(props, "icon_end"),
      btnSize: (props.size?.stringVal?.value as string) || "default",
      provider: (props.provider?.stringVal?.value as string) || (props.icon?.stringVal?.value as string) || "google",
      // Icons
      iconName: getIconName(props, "name") || (props.icon?.stringVal?.value as string) || "",
      iconSize: getNumberVal(props, "size", 18),
      // Image
      imageSrc:
        (props.src?.stringVal?.value as string) ||
        (props.source?.stringVal?.value as string) ||
        (props.source_desc?.imageSource?.value as string) ||
        "",
      imageDesc: (props.source_desc?.stringVal?.value as string) || "",
      imageFit: (props.fit?.stringVal?.value as string) || "cover",
      imageHeight: props.height?.px?.value || 180,
      // TextField
      isPassword: getBoolVal(props, "is_password", false),
      fieldIcon: (props.icon?.stringVal?.value as string) || "",
      // Progress
      progressVariant: (props.variant?.stringVal?.value as string) || "linear",
      progressSize: getNumberVal(props, "size", 28),
      // Chart
      chartType: (props.chart_type?.stringVal?.value as string) || (props.variant?.stringVal?.value as string) || "bar",
      chartTitle: (props.title?.stringVal?.value as string) || "",
      chartHeight: props.height?.px?.value || 160,
      chartShowGrid: getBoolVal(props, "show_grid", true),
      chartBarRadius: getNumberVal(props, "bar_radius", 10),
      chartBarWidth: getNumberVal(props, "bar_width", 0),
      // Chip
      chipSelected: getBoolVal(props, "selected", false),
      chipVariant: (props.variant?.stringVal?.value as string) || "choice",
      // Gradient
      gradientEnabled: Array.isArray(gradient?.stops) && gradient.stops.length >= 2,
      gradientType: (gradient?.type as string) || "GRADIENT_TYPE_LINEAR",
      gradientStop1: typeof stop1 === "string" ? stop1 : "",
      gradientStop2: typeof stop2 === "string" ? stop2 : "",
    };
  }, [props]);

  const [draft, setDraft] = useState(initialDraft);
  useEffect(() => {
    setDraft(initialDraft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget.key]);

  const isLayoutWidget = type === "Container" || type === "Card" || type === "Scaffold" || type === "Center" || type === "Expanded" || type === "Stack";
  const isTextWidget = type === "Text";
  const isRowCol = type === "Row" || type === "Column";
  const isButton = type === "Button" || type === "SocialButton";
  const isIcony = type === "Icon" || type === "IconButton";
  const isImage = type === "Image";
  const isField = type === "TextField";
  const isProgress = type === "Progress";
  const isChart = type === "Chart";
  const isChip = type === "Chip";
  const isDivider = type === "Divider";
  const isSizedBox = type === "SizedBox" || type === "Sizedbox";

  const setDraftAndDebounce = (key: string, value: any, p: Record<string, any>) => {
    setDraft((d: any) => ({ ...d, [key]: value }));
    debouncedPatch(p);
  };

  const THEME_SWATCH_TOKENS = useMemo(
    () =>
      [
        "primary",
        "onPrimary",
        "secondary",
        "onSecondary",
        "accent",
        "background",
        "surface",
        "surfaceElevated",
        "on_surface",
        "primary_text",
        "secondary_text",
        "textPrimary",
        "textSecondary",
        "textMuted",
        "divider",
        "success",
        "error",
      ].filter((t) => themeColorTokens.includes(t)),
    [themeColorTokens]
  );

  const resolveToHex = useCallback(
    (tokenOrHex: string): string => {
      if (typeof tokenOrHex !== "string") return "#000000";
      const s = tokenOrHex.trim();
      if (s.startsWith("#") && (s.length === 7 || s.length === 9)) return s.slice(0, 7);
      if (palette && typeof (palette as any)[s] === "string") {
        const pv = (palette as any)[s];
        if (typeof pv === "string" && pv.startsWith("#")) return pv.slice(0, 7);
      }
      // Allow snake_case tokens by mapping into spec palette keys.
      const snakeToCamel: Record<string, string> = {
        primary_text: "textPrimary",
        secondary_text: "textSecondary",
        hint: "textMuted",
        on_primary: "onPrimary",
        on_secondary: "onSecondary",
        surface: "surfaceElevated",
      };
      const camel = snakeToCamel[s];
      if (camel && palette && typeof (palette as any)[camel] === "string") {
        const pv = (palette as any)[camel];
        if (typeof pv === "string" && pv.startsWith("#")) return pv.slice(0, 7);
      }

      const v = (globalTheme.colors.dark as any)[s];
      if (typeof v === "string" && v.startsWith("#")) return v.slice(0, 7);
      return "#000000";
    },
    [palette]
  );

  const ColorTokenInput = ({
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    onPickToken,
    showSwatches = false,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    onPickToken?: (token: string) => void;
    showSwatches?: boolean;
  }) => (
    <>
      <div className={styles.formRow}>
        <label className={styles.formLabel}>{label}</label>
        <div className={styles.colorControls}>
          <input
            className={styles.colorPicker}
            type="color"
            value={resolveToHex(value)}
            onChange={(e) => onChange(e.target.value)}
            title="Pick a color"
          />
          <select
            className={styles.select}
            style={{ width: 150 }}
            value={themeColorTokens.includes(value) ? value : ""}
            onChange={(e) => {
              const t = e.target.value;
              if (!t) return;
              onPickToken ? onPickToken(t) : onChange(t);
            }}
            title="Theme token"
          >
            <option value="">Theme…</option>
            {themeColorTokens.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            className={styles.input}
            placeholder={placeholder || "token or #hex"}
            list="wiraflow-color-tokens"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
          />
        </div>
      </div>
      {showSwatches && (
        <div className={styles.swatches}>
          {THEME_SWATCH_TOKENS.map((t) => (
            <button
              key={t}
              type="button"
              className={styles.swatchBtn}
              style={{ background: resolveToHex(t) }}
              title={t}
              onClick={() => (onPickToken ? onPickToken(t) : onChange(t))}
            />
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitleRow}>
          <Move size={14} className={styles.sectionIcon} />
          <h4 className={styles.subSectionTitle} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
            Layout
          </h4>
        </div>
      </div>

      {(isLayoutWidget || isRowCol || isButton || isIcony || isImage || isField || isProgress || isChart || isChip) && (
        <>
          {/* Padding */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Padding</label>
            <div className={styles.iconGroup}>
              <button
                className={`${styles.iconToggle} ${draft.paddingMode === "token" ? styles.iconToggleActive : ""}`}
                title="Token padding"
                onClick={() => {
                  setDraft((d: any) => ({ ...d, paddingMode: "token" }));
                  patch(setPaddingTokenPatch(draft.paddingToken || "md"));
                }}
                type="button"
              >
                <Layers size={16} />
              </button>
              <button
                className={`${styles.iconToggle} ${draft.paddingMode === "custom" ? styles.iconToggleActive : ""}`}
                title="Custom padding"
                onClick={() => {
                  setDraft((d: any) => ({ ...d, paddingMode: "custom" }));
                  patch(setEdgeInsetsCustomPatch(draft.pTop, draft.pRight, draft.pBottom, draft.pLeft));
                }}
                type="button"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          {draft.paddingMode === "token" ? (
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Pad Token</label>
              <select
                className={styles.select}
                value={draft.paddingToken}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d: any) => ({ ...d, paddingToken: v }));
                  patch(setPaddingTokenPatch(v));
                }}
              >
                {spacingTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.padGrid}>
              {([
                { k: "pTop", I: ArrowUp, label: "Top" },
                { k: "pRight", I: ArrowRightIcon, label: "Right" },
                { k: "pBottom", I: ArrowDown, label: "Bottom" },
                { k: "pLeft", I: ArrowLeft, label: "Left" },
              ] as const).map(({ k, I, label }) => (
                <div key={k} className={styles.padCell} title={label}>
                  <I size={14} className={styles.padIcon} />
                  <input
                    className={styles.miniInput}
                    type="number"
                    step={1}
                    min={0}
                    value={draft[k]}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setDraft((d: any) => ({ ...d, [k]: Number.isFinite(next) ? next : d[k] }));
                      debouncedPatch(
                        setEdgeInsetsCustomPatch(
                          k === "pTop" ? next : draft.pTop,
                          k === "pRight" ? next : draft.pRight,
                          k === "pBottom" ? next : draft.pBottom,
                          k === "pLeft" ? next : draft.pLeft
                        )
                      );
                    }}
                    onBlur={() => patch(setEdgeInsetsCustomPatch(draft.pTop, draft.pRight, draft.pBottom, draft.pLeft))}
                  />
                </div>
              ))}
            </div>
          )}

          {isRowCol && (
            <>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Spacing</label>
                <select
                  className={styles.select}
                  value={draft.spacing}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraft((d: any) => ({ ...d, spacing: v }));
                    patch(setStringPatch("spacing", v));
                  }}
                >
                  {["0", ...spacingTokens].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Scroll</label>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={draft.scroll}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setDraft((d: any) => ({ ...d, scroll: v }));
                    patch(setScrollPatch(v));
                  }}
                />
              </div>

              {type === "Column" && (
                <>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Main</label>
                    <div className={styles.iconGroup}>
                      {[
                        { v: "start", I: AlignLeft, t: "Start" },
                        { v: "center", I: AlignCenter, t: "Center" },
                        { v: "end", I: AlignRight, t: "End" },
                        { v: "space_between", I: ArrowUpDown, t: "Space" },
                      ].map(({ v, I, t }) => (
                        <button
                          key={v}
                          type="button"
                          title={t}
                          className={`${styles.iconToggle} ${draft.mainAlign === v ? styles.iconToggleActive : ""}`}
                          onClick={() => {
                            setDraft((d: any) => ({ ...d, mainAlign: v }));
                            patch({ main_align: { align: { named: v } } });
                          }}
                        >
                          <I size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Cross</label>
                    <div className={styles.iconGroup}>
                      {[
                        { v: "start", I: AlignLeft, t: "Start" },
                        { v: "center", I: AlignCenter, t: "Center" },
                        { v: "end", I: AlignRight, t: "End" },
                      ].map(({ v, I, t }) => (
                        <button
                          key={v}
                          type="button"
                          title={t}
                          className={`${styles.iconToggle} ${draft.crossAlign === v ? styles.iconToggleActive : ""}`}
                          onClick={() => {
                            setDraft((d: any) => ({ ...d, crossAlign: v }));
                            patch({ cross_align: { align: { named: v } } });
                          }}
                        >
                          <I size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {type === "Row" && (
                <>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Justify</label>
                    <div className={styles.iconGroup}>
                      {[
                        { v: "start", I: AlignLeft, t: "Start" },
                        { v: "center", I: AlignCenter, t: "Center" },
                        { v: "end", I: AlignRight, t: "End" },
                        { v: "space_between", I: ArrowLeftRight, t: "Space" },
                      ].map(({ v, I, t }) => (
                        <button
                          key={v}
                          type="button"
                          title={t}
                          className={`${styles.iconToggle} ${draft.rowJustify === v ? styles.iconToggleActive : ""}`}
                          onClick={() => {
                            setDraft((d: any) => ({ ...d, rowJustify: v }));
                            patch({ align: { align: { named: v } } });
                          }}
                        >
                          <I size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Cross</label>
                    <div className={styles.iconGroup}>
                      {[
                        { v: "start", I: AlignLeft, t: "Start" },
                        { v: "center", I: AlignCenter, t: "Center" },
                        { v: "end", I: AlignRight, t: "End" },
                      ].map(({ v, I, t }) => (
                        <button
                          key={v}
                          type="button"
                          title={t}
                          className={`${styles.iconToggle} ${draft.crossAlign === v ? styles.iconToggleActive : ""}`}
                          onClick={() => {
                            setDraft((d: any) => ({ ...d, crossAlign: v }));
                            patch({ cross_align: { align: { named: v } } });
                          }}
                        >
                          <I size={16} />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      <div className={styles.sectionHeader} style={{ marginTop: 6 }}>
        <div className={styles.sectionTitleRow}>
          <Paintbrush size={14} className={styles.sectionIcon} />
          <h4 className={styles.subSectionTitle} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
            Style
          </h4>
        </div>
      </div>

      {(isLayoutWidget || isButton || isIcony || isChip) && (
        <>
          <ColorTokenInput
            label="Background"
            value={draft.bg}
            onChange={(v) => setDraftAndDebounce("bg", v, setColorPatch("bg", v))}
            onBlur={() => patch(setColorPatch("bg", draft.bg))}
            onPickToken={(t) => {
              setDraft((d: any) => ({ ...d, bg: t }));
              patch(setColorPatch("bg", t));
            }}
            showSwatches
          />

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Radius</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={draft.radius}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, radius: Number.isFinite(v) ? v : d.radius }));
                debouncedPatch(setRadiusPatch(v));
              }}
              onBlur={() => patch(setRadiusPatch(draft.radius))}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Border</label>
            <div className={styles.iconGroup} title="Border width">
              <input
                className={styles.miniInput}
                style={{ width: 80 }}
                type="number"
                min={0}
                step={1}
                value={draft.borderWidth}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDraft((d: any) => ({ ...d, borderWidth: Number.isFinite(v) ? v : d.borderWidth }));
                  debouncedPatch(setBorderPatch(v, draft.borderColor));
                }}
                onBlur={() => patch(setBorderPatch(draft.borderWidth, draft.borderColor))}
              />
              <input
                className={styles.miniInput}
                style={{ width: 90 }}
                list="wiraflow-color-tokens"
                placeholder="color"
                value={draft.borderColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d: any) => ({ ...d, borderColor: v }));
                  debouncedPatch(setBorderPatch(draft.borderWidth, v));
                }}
                onBlur={() => patch(setBorderPatch(draft.borderWidth, draft.borderColor))}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Shadow</label>
            <select
              className={styles.select}
              value={draft.shadow}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, shadow: v }));
                patch(setShadowTokenPatch(v));
              }}
            >
              <option value="">none</option>
              {["sm", "md", "lg"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Clip</label>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={draft.clip}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d: any) => ({ ...d, clip: v }));
                patch(setClipPatch(v));
              }}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Opacity</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={draft.opacity}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, opacity: Number.isFinite(v) ? v : d.opacity }));
                debouncedPatch(setOpacityPatch(v));
              }}
              onBlur={() => patch(setOpacityPatch(draft.opacity))}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Rotate</label>
            <input
              className={styles.input}
              type="number"
              min={-180}
              max={180}
              step={1}
              value={draft.rotate}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, rotate: Number.isFinite(v) ? v : d.rotate }));
                debouncedPatch(setRotatePatch(v));
              }}
              onBlur={() => patch(setRotatePatch(draft.rotate))}
            />
          </div>

          {(type === "Container" || type === "Card") && (
            <>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Gradient</label>
                <input
                  className={styles.checkbox}
                  type="checkbox"
                  checked={draft.gradientEnabled}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setDraft((d: any) => ({ ...d, gradientEnabled: v }));
                    patch(
                      v
                        ? setGradientPatch(
                            draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                            draft.gradientStop1 || "primary",
                            draft.gradientStop2 || "secondary"
                          )
                        : clearGradientPatch()
                    );
                  }}
                />
              </div>
              {draft.gradientEnabled && (
                <>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>Type</label>
                    <select
                      className={styles.select}
                      value={draft.gradientType}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d: any) => ({ ...d, gradientType: v }));
                        patch(
                          setGradientPatch(
                            v === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                            draft.gradientStop1 || "primary",
                            draft.gradientStop2 || "secondary"
                          )
                        );
                      }}
                    >
                      <option value="GRADIENT_TYPE_LINEAR">linear</option>
                      <option value="GRADIENT_TYPE_RADIAL">radial</option>
                    </select>
                  </div>
                  <ColorTokenInput
                    label="Stop 1"
                    value={draft.gradientStop1}
                    onChange={(v) => {
                      setDraft((d: any) => ({ ...d, gradientStop1: v }));
                      debouncedPatch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          v,
                          draft.gradientStop2 || "secondary"
                        )
                      );
                    }}
                    onBlur={() =>
                      patch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          draft.gradientStop1 || "primary",
                          draft.gradientStop2 || "secondary"
                        )
                      )
                    }
                    placeholder="primary / #hex"
                    onPickToken={(t) => {
                      setDraft((d: any) => ({ ...d, gradientStop1: t }));
                      patch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          t,
                          draft.gradientStop2 || "secondary"
                        )
                      );
                    }}
                    showSwatches
                  />
                  <ColorTokenInput
                    label="Stop 2"
                    value={draft.gradientStop2}
                    onChange={(v) => {
                      setDraft((d: any) => ({ ...d, gradientStop2: v }));
                      debouncedPatch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          draft.gradientStop1 || "primary",
                          v
                        )
                      );
                    }}
                    onBlur={() =>
                      patch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          draft.gradientStop1 || "primary",
                          draft.gradientStop2 || "secondary"
                        )
                      )
                    }
                    placeholder="secondary / #hex"
                    onPickToken={(t) => {
                      setDraft((d: any) => ({ ...d, gradientStop2: t }));
                      patch(
                        setGradientPatch(
                          draft.gradientType === "GRADIENT_TYPE_RADIAL" ? "GRADIENT_TYPE_RADIAL" : "GRADIENT_TYPE_LINEAR",
                          draft.gradientStop1 || "primary",
                          t
                        )
                      );
                    }}
                    showSwatches
                  />
                </>
              )}
            </>
          )}
        </>
      )}

      <div className={styles.sectionHeader} style={{ marginTop: 6 }}>
        <div className={styles.sectionTitleRow}>
          <Type size={14} className={styles.sectionIcon} />
          <h4 className={styles.subSectionTitle} style={{ margin: 0, borderBottom: "none", paddingBottom: 0 }}>
            Content
          </h4>
        </div>
      </div>

      {isTextWidget && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Text</label>
            <input
              className={styles.input}
              value={draft.content}
              onChange={(e) => setDraftAndDebounce("content", e.target.value, setStringPatch("content", e.target.value))}
              onBlur={() => patch(setStringPatch("content", draft.content))}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Align</label>
            <div className={styles.iconGroup}>
              {[
                { v: "start", I: AlignLeft, t: "Left" },
                { v: "center", I: AlignCenter, t: "Center" },
                { v: "end", I: AlignRight, t: "Right" },
              ].map(({ v, I, t }) => (
                <button
                  key={v}
                  type="button"
                  title={t}
                  className={`${styles.iconToggle} ${draft.textAlign === v ? styles.iconToggleActive : ""}`}
                  onClick={() => {
                    setDraft((d: any) => ({ ...d, textAlign: v }));
                    patch(setAlignPatch("text_align", v));
                  }}
                >
                  <I size={16} />
                </button>
              ))}
            </div>
          </div>

          <ColorTokenInput
            label="Color"
            value={draft.color}
            onChange={(v) => setDraftAndDebounce("color", v, setColorPatch("color", v))}
            onBlur={() => patch(setColorPatch("color", draft.color))}
            onPickToken={(t) => {
              setDraft((d: any) => ({ ...d, color: t }));
              patch(setColorPatch("color", t));
            }}
            showSwatches
          />

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Style</label>
            <select
              className={styles.select}
              value={draft.textStyle}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, textStyle: v }));
                patch(setTextStylePatch(v));
              }}
            >
              <option value="">(default)</option>
              {textStyleTokens.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Weight</label>
            <input
              className={styles.input}
              type="number"
              min={100}
              max={900}
              step={100}
              value={draft.fontWeight || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, fontWeight: Number.isFinite(v) ? v : d.fontWeight }));
                debouncedPatch(setNumberPatch("font_weight", v));
              }}
              onBlur={() => patch(setNumberPatch("font_weight", draft.fontWeight || 0))}
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Line H</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={0.05}
              value={draft.lineHeight || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, lineHeight: Number.isFinite(v) ? v : d.lineHeight }));
                debouncedPatch({ line_height: { numberVal: { value: v } } });
              }}
              onBlur={() => patch({ line_height: { numberVal: { value: draft.lineHeight || 0 } } })}
            />
          </div>
        </>
      )}

      {isButton && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Label</label>
            <input
              className={styles.input}
              value={draft.content}
              onChange={(e) => setDraftAndDebounce("content", e.target.value, setStringPatch("content", e.target.value))}
              onBlur={() => patch(setStringPatch("content", draft.content))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Variant</label>
            <select
              className={styles.select}
              value={draft.variant}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, variant: v }));
                patch(setStringPatch("variant", v));
              }}
            >
              {["primary", "secondary", "ghost", "outlined"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Size</label>
            <select
              className={styles.select}
              value={draft.btnSize}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, btnSize: v }));
                patch(setStringPatch("size", v));
              }}
            >
              <option value="default">default</option>
              <option value="small">small</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Full</label>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={draft.fullWidth}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d: any) => ({ ...d, fullWidth: v }));
                patch(setBoolPatch("full_width", v));
              }}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Icon End</label>
            <input
              className={styles.input}
              placeholder="material icon name"
              value={draft.iconEnd}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, iconEnd: v }));
                debouncedPatch({ icon_end: { icon: { name: v } } });
              }}
              onBlur={() => patch({ icon_end: { icon: { name: draft.iconEnd } } })}
            />
          </div>

          {type === "SocialButton" && (
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Provider</label>
              <select
                className={styles.select}
                value={draft.provider}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d: any) => ({ ...d, provider: v }));
                  patch(setStringPatch("provider", v));
                }}
              >
                {["google", "apple", "github"].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {isIcony && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Icon</label>
            <input
              className={styles.input}
              placeholder="material icon name (e.g. search)"
              value={draft.iconName}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, iconName: v }));
                debouncedPatch(setIconPatch("name", v));
              }}
              onBlur={() => patch(setIconPatch("name", draft.iconName))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Size</label>
            <input
              className={styles.input}
              type="number"
              min={12}
              max={64}
              step={1}
              value={draft.iconSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, iconSize: Number.isFinite(v) ? v : d.iconSize }));
                debouncedPatch(setNumberPatch("size", v));
              }}
              onBlur={() => patch(setNumberPatch("size", draft.iconSize))}
            />
          </div>
          <ColorTokenInput
            label="Color"
            value={draft.color}
            onChange={(v) => setDraftAndDebounce("color", v, setColorPatch("color", v))}
            onBlur={() => patch(setColorPatch("color", draft.color))}
          />
        </>
      )}

      {isField && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Label</label>
            <input
              className={styles.input}
              value={draft.label}
              onChange={(e) => setDraftAndDebounce("label", e.target.value, setStringPatch("label", e.target.value))}
              onBlur={() => patch(setStringPatch("label", draft.label))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Hint</label>
            <input
              className={styles.input}
              value={draft.hint}
              onChange={(e) => setDraftAndDebounce("hint", e.target.value, setStringPatch("hint", e.target.value))}
              onBlur={() => patch(setStringPatch("hint", draft.hint))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Icon</label>
            <input
              className={styles.input}
              placeholder="material icon name"
              value={draft.fieldIcon}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, fieldIcon: v }));
                debouncedPatch(setIconPatch("icon", v));
              }}
              onBlur={() => patch(setIconPatch("icon", draft.fieldIcon))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Password</label>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={draft.isPassword}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d: any) => ({ ...d, isPassword: v }));
                patch(setBoolPatch("is_password", v));
              }}
            />
          </div>
        </>
      )}

      {isImage && (
        <>
          <div className={styles.inlineHelp}>
            Prefer `source_desc` and leave `src` empty to avoid heavy image usage.
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Desc</label>
            <input
              className={styles.input}
              placeholder="e.g. hero background gradient"
              value={draft.imageDesc}
              onChange={(e) => setDraftAndDebounce("imageDesc", e.target.value, setStringPatch("source_desc", e.target.value))}
              onBlur={() => patch(setStringPatch("source_desc", draft.imageDesc))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Src</label>
            <input
              className={styles.input}
              placeholder="https://..."
              value={draft.imageSrc}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, imageSrc: v }));
                debouncedPatch(setStringPatch("src", v));
              }}
              onBlur={() => patch(setStringPatch("src", draft.imageSrc))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Fit</label>
            <select
              className={styles.select}
              value={draft.imageFit}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, imageFit: v }));
                patch(setStringPatch("fit", v));
              }}
            >
              <option value="cover">cover</option>
              <option value="contain">contain</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Height</label>
            <input
              className={styles.input}
              type="number"
              min={40}
              step={1}
              value={draft.imageHeight}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, imageHeight: Number.isFinite(v) ? v : d.imageHeight }));
                debouncedPatch({ height: { px: { value: v, isInfinity: false } } });
              }}
              onBlur={() => patch({ height: { px: { value: draft.imageHeight, isInfinity: false } } })}
            />
          </div>
        </>
      )}

      {isDivider && (
        <>
          <ColorTokenInput
            label="Color"
            value={draft.color}
            onChange={(v) => setDraftAndDebounce("color", v, setColorPatch("color", v))}
            onBlur={() => patch(setColorPatch("color", draft.color))}
          />
        </>
      )}

      {isSizedBox && (
        <>
          <div className={styles.inlineHelp}>Use px for fixed size, or a spacing token for quick layout.</div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Width</label>
            <div className={styles.iconGroup}>
              <input
                className={styles.miniInput}
                style={{ width: 80 }}
                type="number"
                min={0}
                step={1}
                value={draft.widthPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDraft((d: any) => ({ ...d, widthPx: Number.isFinite(v) ? v : d.widthPx, widthFill: false, widthToken: "" }));
                  debouncedPatch({ width: { px: { value: v, isInfinity: false } } });
                }}
                onBlur={() => patch({ width: { px: { value: draft.widthPx, isInfinity: false } } })}
              />
              <select
                className={styles.select}
                style={{ width: 90 }}
                value={draft.widthToken}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d: any) => ({ ...d, widthToken: v, widthFill: false, widthPx: 0 }));
                  patch(setStringPatch("width", v));
                }}
              >
                <option value="">(none)</option>
                {spacingTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={`${styles.iconToggle} ${draft.widthFill ? styles.iconToggleActive : ""}`}
                title="Fill width"
                onClick={() => {
                  const next = !draft.widthFill;
                  setDraft((d: any) => ({ ...d, widthFill: next, widthToken: "", widthPx: 0 }));
                  patch({ width: { px: { value: 0, isInfinity: next } } });
                }}
              >
                <ArrowLeftRight size={16} />
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <label className={styles.formLabel}>Height</label>
            <div className={styles.iconGroup}>
              <input
                className={styles.miniInput}
                style={{ width: 80 }}
                type="number"
                min={0}
                step={1}
                value={draft.heightPx}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDraft((d: any) => ({ ...d, heightPx: Number.isFinite(v) ? v : d.heightPx, heightToken: "" }));
                  debouncedPatch({ height: { px: { value: v, isInfinity: false } } });
                }}
                onBlur={() => patch({ height: { px: { value: draft.heightPx, isInfinity: false } } })}
              />
              <select
                className={styles.select}
                style={{ width: 90 }}
                value={draft.heightToken}
                onChange={(e) => {
                  const v = e.target.value;
                  setDraft((d: any) => ({ ...d, heightToken: v, heightPx: 0 }));
                  patch(setStringPatch("height", v));
                }}
              >
                <option value="">(none)</option>
                {spacingTokens.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}

      {isProgress && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Variant</label>
            <select
              className={styles.select}
              value={draft.progressVariant}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, progressVariant: v }));
                patch(setStringPatch("variant", v));
              }}
            >
              <option value="linear">linear</option>
              <option value="circular">circular</option>
            </select>
          </div>
          <ColorTokenInput
            label="Color"
            value={draft.color}
            onChange={(v) => setDraftAndDebounce("color", v, setColorPatch("color", v))}
            onBlur={() => patch(setColorPatch("color", draft.color))}
          />
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Size</label>
            <input
              className={styles.input}
              type="number"
              min={12}
              step={1}
              value={draft.progressSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, progressSize: Number.isFinite(v) ? v : d.progressSize }));
                debouncedPatch(setNumberPatch("size", v));
              }}
              onBlur={() => patch(setNumberPatch("size", draft.progressSize))}
            />
          </div>
        </>
      )}

      {isChart && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Type</label>
            <select
              className={styles.select}
              value={draft.chartType}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, chartType: v }));
                patch(setStringPatch("chart_type", v));
              }}
            >
              {["bar", "line", "pie"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Title</label>
            <input
              className={styles.input}
              value={draft.chartTitle}
              onChange={(e) => setDraftAndDebounce("chartTitle", e.target.value, setStringPatch("title", e.target.value))}
              onBlur={() => patch(setStringPatch("title", draft.chartTitle))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Height</label>
            <input
              className={styles.input}
              type="number"
              min={80}
              step={1}
              value={draft.chartHeight}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, chartHeight: Number.isFinite(v) ? v : d.chartHeight }));
                debouncedPatch({ height: { px: { value: v, isInfinity: false } } });
              }}
              onBlur={() => patch({ height: { px: { value: draft.chartHeight, isInfinity: false } } })}
            />
          </div>
          <ColorTokenInput
            label="Color"
            value={draft.color}
            onChange={(v) => setDraftAndDebounce("color", v, setColorPatch("color", v))}
            onBlur={() => patch(setColorPatch("color", draft.color))}
          />
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Grid</label>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={draft.chartShowGrid}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d: any) => ({ ...d, chartShowGrid: v }));
                patch(setBoolPatch("show_grid", v));
              }}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Bar RX</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={draft.chartBarRadius}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, chartBarRadius: Number.isFinite(v) ? v : d.chartBarRadius }));
                debouncedPatch(setNumberPatch("bar_radius", v));
              }}
              onBlur={() => patch(setNumberPatch("bar_radius", draft.chartBarRadius))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Bar W</label>
            <input
              className={styles.input}
              type="number"
              min={0}
              step={1}
              value={draft.chartBarWidth}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDraft((d: any) => ({ ...d, chartBarWidth: Number.isFinite(v) ? v : d.chartBarWidth }));
                debouncedPatch(setNumberPatch("bar_width", v));
              }}
              onBlur={() => patch(setNumberPatch("bar_width", draft.chartBarWidth))}
            />
          </div>
        </>
      )}

      {isChip && (
        <>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Text</label>
            <input
              className={styles.input}
              value={draft.content}
              onChange={(e) => setDraftAndDebounce("content", e.target.value, setStringPatch("content", e.target.value))}
              onBlur={() => patch(setStringPatch("content", draft.content))}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Selected</label>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={draft.chipSelected}
              onChange={(e) => {
                const v = e.target.checked;
                setDraft((d: any) => ({ ...d, chipSelected: v }));
                patch(setBoolPatch("selected", v));
              }}
            />
          </div>
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Variant</label>
            <select
              className={styles.select}
              value={draft.chipVariant}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d: any) => ({ ...d, chipVariant: v }));
                patch(setStringPatch("variant", v));
              }}
            >
              {["choice", "filter", "input"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      <datalist id="wiraflow-color-tokens">
        {themeColorTokens.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>
    </div>
  );
}

function useDebouncedCallback<T extends (...args: any[]) => void>(callback: T, delayMs: number) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}

function ActionsTab({
  flows,
  steps,
  guards,
  widget,
}: {
  flows: FlowData[];
  steps: StepData[];
  guards: GuardData[];
  widget: WidgetData;
}) {
  if (flows.length === 0) {
    return <div className={styles.emptyState}>No action flows attached to this widget.</div>;
  }

  return (
    <div className={styles.section}>
      {flows.map((flow) => {
        const flowSteps = steps.filter((s) =>
          flow.flowStepKeys.includes(s.stepKey)
        );
        const flowGuards = guards.filter((g) => g.flowKey === flow.actionKey);

        return (
          <div key={flow.actionKey} className={styles.flowCard}>
            <div className={styles.flowHeader}>
              <Zap size={14} color="var(--accent-cyber)" />
              <span className={styles.flowLabel}>{flow.label}</span>
              <span className={styles.triggerBadge}>{flow.trigger}</span>
            </div>
            <p className={styles.flowDesc}>{flow.description}</p>

            {flowGuards.length > 0 && (
              <div className={styles.guardList}>
                {flowGuards.map((g) => (
                  <div key={g.guardKey} className={styles.guardChip}>
                    <ShieldCheck size={12} />
                    {g.condition}
                    <span className={styles.guardAction}>on fail: {g.onFailure}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.stepList}>
              {flowSteps.map((step, i) => (
                <div key={step.stepKey} className={styles.stepItem}>
                  <span className={styles.stepOrder}>{i + 1}</span>
                  <div className={styles.stepInfo}>
                    <span className={styles.stepLabel}>{step.label}</span>
                    <span className={styles.stepType}>{step.stepType}</span>
                  </div>
                  {i < flowSteps.length - 1 && (
                    <ArrowRight size={12} color="var(--text-muted)" className={styles.stepArrow} />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BindingsTab({
  widget,
  readBindings,
  mutations,
}: {
  widget: WidgetData;
  readBindings: ReadBindingData[];
  mutations: MutationData[];
}) {
  // Find mutations that reference this widget
  const relatedMutations = mutations.filter((m) =>
    m.fieldMappings.some((fm) => fm.widgetKey === widget.key)
  );

  return (
    <div className={styles.section}>
      {readBindings.length > 0 && (
        <>
          <h4 className={styles.subSectionTitle}>Read Bindings (Queries)</h4>
          {readBindings.map((rb) => (
            <div key={rb.readBindingKey} className={styles.bindingCard}>
              <code className={styles.bindingField}>{rb.sourceTable}</code>
              <span className={styles.bindingDisplay}>{rb.accessMode}</span>
              {rb.orderBy && (
                <span className={styles.orderInfo}>
                  ORDER BY {rb.orderBy} {rb.orderDirection}
                </span>
              )}
            </div>
          ))}
        </>
      )}

      {relatedMutations.length > 0 && (
        <>
          <h4 className={styles.subSectionTitle}>Mutation Bindings</h4>
          {relatedMutations.map((m) => (
            <div key={m.mutationKey} className={styles.mutationCard}>
              <span className={styles.mutationOp}>{m.operation.toUpperCase()}</span>
              <code className={styles.bindingField}>{m.targetTable}</code>
              <div className={styles.fieldMappings}>
                {m.fieldMappings
                  .filter((fm) => fm.widgetKey === widget.key)
                  .map((fm, i) => (
                    <span key={i} className={styles.mappingChip}>
                      → {fm.column}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </>
      )}

      {readBindings.length === 0 && relatedMutations.length === 0 && (
        <div className={styles.emptyState}>No direct bindings for this widget.</div>
      )}
    </div>
  );
}
