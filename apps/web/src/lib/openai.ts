/**
 * Wiraflow AI Client
 *
 * Client-side wrapper that calls the /api/generate-design server route (local Ollama by default).
 * Also contains the designSpecToUIGraph converter used everywhere.
 */

import type { DesignSpec, GenerateDesignRequest, GenerateDesignResult } from "./types";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are Wiraflow, an expert UI/UX designer and Flutter architect.

Given a product description, generate a complete, professional-grade design specification as JSON.

OUTPUT FORMAT — Return ONLY valid JSON matching this schema (no markdown, no code fences):
{
  "appName": "string — A clean, catchy app name",
  "tagline": "string — One-line tagline for the app",
  "palette": {
    "primary": "#hex",
    "onPrimary": "#hex — text/icon color on primary",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex — main app background (dark preferred)",
    "surface": "#hex — card/container bg",
    "surfaceElevated": "#hex — elevated surfaces",
    "textPrimary": "#hex",
    "textSecondary": "#hex",
    "textMuted": "#hex",
    "divider": "#hex",
    "error": "#hex",
    "success": "#hex"
  },
  "fonts": {
    "heading": "string — Google Font name (e.g. Inter, Outfit, Space Grotesk)",
    "body": "string — Google Font name (e.g. JetBrains Mono, DM Sans, IBM Plex Sans)"
  },
  "pages": [
    {
      "key": "page-slug",
      "name": "Page Name",
      "purpose": "Brief description of the page purpose",
      "pageType": "list|detail|form|dashboard|settings|profile",
      "widgets": [
        {
          "key": "unique-widget-id",
          "parentKey": null or "parent-widget-key",
          "type": "Scaffold|Column|Row|Container|Stack|Text|Button|TextField|Icon|Expanded|Center|Divider|SizedBox",
          "label": "human-readable label",
          "semanticRole": "layout_root|layout_column|layout_row|layout_container|text_body|text_heading|form_input|action_trigger|icon|component",
          "interactive": false,
          "properties": {
            // Type-specific properties:
            // For Text: content, style (headline_large/headline_medium/title_large/title_medium/body_large/body_medium/body_small/label_large/label_medium/label_small), color
            // For Button: content, variant (primary/ghost/outlined), size (small/large), full_width
            // For Container: bg(color), radius, padding, border, shadow, width, height
            // For TextField: label, hint, icon, is_password
            // For Icon: name (Material icon name), size, color
            // For Column/Row: spacing (xs/sm/md/lg/xl), align, cross_align
            // Use color names from the palette keys (e.g. "primary", "accent", "textPrimary") OR hex values
          }
        }
      ]
    }
  ]
}

DESIGN RULES:
1. Create 3-6 pages that form a complete, production-quality app.
2. Every page MUST have a Scaffold root with a body Column. 
3. Use a dark theme with vibrant accent colors — professional, modern aesthetic.
4. Each page should have 8-25 widgets forming a realistic layout.
5. Use proper widget hierarchy: Scaffold → Column → Container → Row → Text/Button/etc.
6. Include icons using Material icon names (e.g. "home", "search", "settings", "person", "favorite").
7. Make it look PREMIUM — not a generic template. Use subtle gradients, rounded corners (16-24px), proper spacing.
8. Include at least: a login/onboarding page, a main dashboard, a detail/form page, and a settings page.
9. Every Text widget MUST have a "content" property with the actual display text.
10. Every widget MUST have a unique "key" — use descriptive kebab-case (e.g. "login-email-field", "dashboard-header-title").`;

/** Build an immediate, private starter screen without waiting for model inference. */
export function createQuickDraft(prompt: string): DesignSpec {
  const cleanPrompt = prompt.trim().replace(/\s+/g, " ");
  const words = cleanPrompt
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word && !["a", "an", "the", "build", "create", "make", "app", "application", "for", "me"].includes(word.toLowerCase()))
    .slice(0, 3);
  const appName = words.length
    ? words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ")
    : "New App";
  const summary = cleanPrompt.length > 120 ? `${cleanPrompt.slice(0, 117).trimEnd()}…` : cleanPrompt;
  const pageKey = "quick-home";
  const bodyKey = "quick-home-body";

  return {
    appName,
    tagline: `A focused starter for ${summary.toLowerCase()}`,
    palette: {
      primary: "#6366F1",
      onPrimary: "#FFFFFF",
      secondary: "#8B5CF6",
      accent: "#22D3EE",
      background: "#080B14",
      surface: "#121827",
      surfaceElevated: "#1A2233",
      textPrimary: "#F8FAFC",
      textSecondary: "#CBD5E1",
      textMuted: "#64748B",
      divider: "#263247",
      error: "#F87171",
      success: "#4ADE80",
    },
    fonts: { heading: "Inter", body: "DM Sans" },
    pages: [{
      key: pageKey,
      name: "Home",
      purpose: "Instant starter screen based on the app brief",
      pageType: "dashboard",
      widgets: [
        { key: "quick-root", parentKey: null, type: "Scaffold", label: "App screen", semanticRole: "layout_root", interactive: false, properties: { bg: { color: { color: "background" } }, safe_area: { boolVal: { value: true } } } },
        { key: bodyKey, parentKey: "quick-root", type: "Column", label: "Main layout", semanticRole: "layout_column", interactive: false, properties: { spacing: { stringVal: { value: "lg" } }, scroll: { boolVal: { value: true } } } },
        { key: "quick-title", parentKey: bodyKey, type: "Text", label: appName, semanticRole: "text_heading", interactive: false, properties: { content: { stringVal: { value: appName } }, style: { textStyle: { styleName: "headline_large" } } } },
        { key: "quick-brief", parentKey: bodyKey, type: "ListTile", label: "Your app brief", semanticRole: "component", interactive: false, properties: { title: { stringVal: { value: "Your app brief" } }, subtitle: { stringVal: { value: summary } } } },
        { key: "quick-action", parentKey: bodyKey, type: "Button", label: "Get started", semanticRole: "action_trigger", interactive: true, properties: { content: { stringVal: { value: "Get started" } }, full_width: { boolVal: { value: true } } } },
      ],
    }],
    generatedAt: new Date().toISOString(),
    model: "Instant local draft",
  };
}

// ---------------------------------------------------------------------------
// Design generation — calls /api/generate-design (Genkit + Gemini on server)
// ---------------------------------------------------------------------------

export async function generateDesignSpec(
  request: GenerateDesignRequest
): Promise<GenerateDesignResult> {
  const { prompt, apiKey, model, provider = "ollama", imageDataUrl, generationMode = "quick" } = request;

  if (provider === "cloud" && !apiKey) {
    return { success: false, error: "No API key configured. Go to Settings to add your Gemini API key." };
  }
  if (!prompt.trim()) {
    return { success: false, error: "Please describe what you want to build." };
  }
  if (imageDataUrl && provider !== "ollama") {
    return { success: false, error: "Sketch input currently requires local Ollama. Switch providers in Settings to continue." };
  }

  try {
    const res = await fetch("/api/generate-design", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ...(provider === "cloud" ? { apiKey } : {}), model, provider, ...(imageDataUrl ? { imageDataUrl } : {}), generationMode }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || `Error ${res.status}` };
    }

    return { success: true, spec: data.spec as DesignSpec };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error." };
  }
}

// ---------------------------------------------------------------------------
// Generate random app ideas — for inspiration chips
// ---------------------------------------------------------------------------

export async function generateAppIdeas(apiKey: string, model?: string): Promise<string[]> {
  if (!apiKey) return [];
  
  const prompt = "Generate 5 diverse, creative, and modern mobile app ideas. Each idea should be a single, descriptive sentence (15-25 words). Examples: 'A freelance invoicing app with client management and payment tracking', 'A fitness tracking dashboard with workout logs and progress charts'. Return ONLY the 5 ideas separated by newlines.";

  try {
    const res = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        prompt, 
        apiKey, 
        model: model || "gemini-2.0-flash",
        temperature: 0.8
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.text) {
      return [];
    }

    const lines = data.text.split("\n").filter((l: string) => l.trim().length > 10).slice(0, 5);
    return lines.map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").trim());
  } catch {
    return [];
  }
}


// ---------------------------------------------------------------------------
// API key test — supports both Gemini and OpenAI keys
// ---------------------------------------------------------------------------

export async function testApiKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
  if (!apiKey) return { success: false, error: "No API key provided." };

  const isGemini = apiKey.startsWith("AIza");
  const isOAI = apiKey.startsWith("sk-");

  // Since we execute generation from Next.js server, making direct calls from the browser 
  // (client-side) to test keys often triggers CORS blocks on free tier Google/OpenAI accounts. 
  // Instead of throwing false-positive "Network errors", we validate format.
  if (isGemini || isOAI) {
    return { success: true };
  }

  return { success: false, error: "Invalid API key format. Ensure it starts with AIza or sk-" };
}

// ---------------------------------------------------------------------------
// Widget type normalization (accept legacy DSL exports)
// ---------------------------------------------------------------------------

function canonicalWidgetType(rawType: string): string {
  const raw = (rawType || "").trim();
  const key = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const map: Record<string, string> = {
    scaffold: "Scaffold",
    column: "Column",
    row: "Row",
    container: "Container",
    card: "Card",
    stack: "Stack",
    expanded: "Expanded",
    center: "Center",
    sizedbox: "SizedBox",
    sized_box: "SizedBox",
    divider: "Divider",
    text: "Text",
    icon: "Icon",
    iconbutton: "IconButton",
    icon_button: "IconButton",
    textfield: "TextField",
    text_field: "TextField",
    button: "Button",
    socialbutton: "SocialButton",
    social_button: "SocialButton",
    image: "Image",
    progress: "Progress",
    chart: "Chart",
    barchart: "Chart",
    linechart: "Chart",
    bar_chart: "Chart",
    line_chart: "Chart",
    piechart: "Chart",
    pie_chart: "Chart",
    chip: "Chip",
    // New widget types
    carousel: "Carousel",
    horizontal_list: "Carousel",
    pageview: "Carousel",
    page_view: "Carousel",
    avatar: "Avatar",
    circleavatar: "CircleAvatar",
    circle_avatar: "CircleAvatar",
    switch: "Switch",
    toggle: "Switch",
    slider: "Slider",
    range_slider: "Slider",
    ratingbar: "RatingBar",
    rating_bar: "RatingBar",
    rating: "RatingBar",
    star_rating: "RatingBar",
    gridview: "GridView",
    grid_view: "GridView",
    grid: "GridView",
    wrap: "Wrap",
    flow: "Wrap",
    bottomsheet: "BottomSheet",
    bottom_sheet: "BottomSheet",
    listtile: "ListTile",
    list_tile: "ListTile",
    dropdown: "Dropdown",
    dropdown_button: "Dropdown",
    dropdownbutton: "Dropdown",
    fab: "FAB",
    floating_action_button: "FAB",
    floatingactionbutton: "FAB",
    bottomnavigationbar: "BottomNavigationBar",
    bottom_navigation_bar: "BottomNavigationBar",
    bottomnav: "BottomNavigationBar",
    bottom_nav: "BottomNavigationBar",
    appbar: "AppBar",
    app_bar: "AppBar",
    topappbar: "AppBar",
    top_app_bar: "AppBar",
    sliverappbar: "AppBar",
    tabbar: "TabBar",
    tab_bar: "TabBar",
    tabs: "TabBar",
    badge: "Badge",
    listview: "ListView",
    list_view: "ListView",
  };
  return map[key] ?? raw;
}

function canonicalizeWidgetProperties(
  widgetType: string,
  props: Record<string, any>,
  rawType: string
): Record<string, any> {
  if (!props) return {};
  const result = { ...props };

  if (widgetType === "Chart") {
    const raw = (rawType || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    const inferred =
      raw.includes("line") ? "line" : raw.includes("pie") ? "pie" : raw.includes("bar") ? "bar" : null;

    // Support legacy chart exports that store values as CSV strings.
    if (!result.chart_type && inferred) {
      result.chart_type = { stringVal: { value: inferred } };
    } else if (!result.chart_type && result.type?.stringVal?.value) {
      result.chart_type = { stringVal: { value: result.type.stringVal.value } };
    }
  }

  if (widgetType === "Image") {
    // Support legacy imageSource URL shape.
    const legacyUrl =
      result.source_desc?.imageSource?.value ||
      result.source_desc?.imageSource?.url ||
      result.source_desc?.imageSource?.stringVal?.value;
    if (!result.src && typeof legacyUrl === "string") {
      result.src = { stringVal: { value: legacyUrl } };
    }
  }

  return result;
}

function canonicalizeWidget(w: any): any {
  const rawType = w.type;
  const type = canonicalWidgetType(rawType);
  const properties = canonicalizeWidgetProperties(type, w.properties || {}, rawType);
  return { ...w, type, properties };
}


// ---------------------------------------------------------------------------
// Convert DesignSpec to UIGraph format (for the WidgetTree renderer)
// ---------------------------------------------------------------------------

export function designSpecToUIGraph(spec: DesignSpec) {
  const readStr = (val: any, fallback = ""): string => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object" && val.stringVal && typeof val.stringVal.value === "string") {
      return val.stringVal.value;
    }
    return fallback;
  };

  const pages = spec.pages.map((p) => ({
    key: readStr(p.key),
    label: readStr(p.name || p.key, "Page"),
    pageType: readStr(p.pageType, "list"),
    widgetKeys: (p.widgets || []).map((w) => readStr(w.key)),
  }));

  const widgets = spec.pages.flatMap((page) =>
    (page.widgets || []).map((rawWidget) => {
      const w = canonicalizeWidget(rawWidget);
      return {
        key: readStr(w.key),
        parentKey: w.parentKey ? readStr(w.parentKey) : undefined,
        label: readStr(w.label, "Widget"),
        flutterWidgetType: readStr(w.type, "Container"),
        semanticRole: readStr(w.semanticRole, "component"),
        pageKey: readStr(page.key),
        interactive: w.interactive,
        action: w.action ? {
          ...w.action,
          operation: readStr(w.action.operation, "none"),
          targetPageKey: readStr(w.action.targetPageKey),
          targetEntityKey: readStr(w.action.targetEntityKey),
          url: readStr(w.action.url),
        } : undefined,
        properties: normalizeWidgetProperties(
          w.type,
          convertProperties(w.properties, spec.palette),
          spec.palette
        ),
        dataBindings: [],
      };
    })
  );

  return {
    version: "2.5.0",
    projectId: "active-project",
    palette: spec.palette,
    fonts: spec.fonts,
    pages,
    widgets,
    navigationEdges: [],
    sourceLinks: [],
    unknowns: [],
  };
}

/**
 * Converts simple design-spec properties into the UIGraph property format
 * that WidgetTree expects. Also resolves palette color tokens to hex values.
 */

// Map camelCase palette tokens (from AI) to snake_case (used by mock data/renderer)
const PALETTE_TOKEN_MAP: Record<string, string> = {
  textPrimary: "primary_text",
  textSecondary: "secondary_text",
  textMuted: "hint",
  onPrimary: "on_primary",
  onSecondary: "on_secondary",
  surfaceElevated: "surface",
};

function resolveColorToken(token: string, palette: any): string {
  if (!token) return token;
  const t = String(token).trim();

  // If hex equals a palette entry, return the palette key so themes can swap.
  if (t.startsWith("#") && palette) {
    const lower = t.toLowerCase();
    for (const [k, v] of Object.entries(palette)) {
      if (typeof v === "string" && v.toLowerCase() === lower) return k;
    }
    return t;
  }

  // Keep known palette tokens as tokens (do NOT resolve to hex here).
  if (palette && palette[t]) return t;

  // Try snake_case mapping → use the original camelCase key where possible.
  const mapped = PALETTE_TOKEN_MAP[t];
  if (mapped && palette && palette[mapped]) return mapped;

  return t;
}

function normalizeWidgetProperties(
  widgetType: string,
  props: Record<string, any>,
  palette: any
): Record<string, any> {
  if (!props) return {};
  const result = { ...props };

  if (widgetType === "Button") {
    const variant = result.variant?.stringVal?.value || "primary";

    if (!result.bg && variant !== "ghost" && variant !== "outlined") {
      result.bg = { color: { color: resolveColorToken("primary", palette) } };
    }

    if (!result.color) {
      const textToken =
        variant === "ghost" || variant === "outlined" ? "textPrimary" : "onPrimary";
      result.color = { color: { color: resolveColorToken(textToken, palette) } };
    }

    if (variant === "outlined" && !result.border) {
      result.border = {
        border: { width: 1, color: resolveColorToken("divider", palette) },
      };
    }
  }

  return result;
}

function convertProperties(props: Record<string, any>, palette: any): Record<string, any> {
  if (!props) return {};

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(props)) {
    // Already in DSL wrapper format — pass through but resolve color tokens
    if (typeof value === "object" && value !== null) {
      // Deep-resolve color tokens inside objects
      if (value.color?.color && typeof value.color.color === "string") {
        const token = resolveColorToken(value.color.color, palette);
        result[key] = { color: { color: token } };
      } else if (value.border?.color && typeof value.border.color === "string") {
        const token = resolveColorToken(value.border.color, palette);
        result[key] = { border: { ...value.border, color: token } };
      } else {
        result[key] = value;
      }
      continue;
    }

    // Flat value conversions (when AI returns simplified properties)
    if (key === "content" && typeof value === "string") {
      result.content = { stringVal: { value } };
    } else if (key === "style" && typeof value === "string") {
      result.style = { textStyle: { styleName: value } };
    } else if (key === "color" && typeof value === "string") {
      result.color = { color: { color: resolveColorToken(value, palette) } };
    } else if (key === "bg" && typeof value === "string") {
      result.bg = { color: { color: resolveColorToken(value, palette) } };
    } else if (key === "spacing" && typeof value === "string") {
      result.spacing = { stringVal: { value } };
    } else if (key === "variant" && typeof value === "string") {
      result.variant = { stringVal: { value } };
    } else if (key === "size" && typeof value === "string") {
      result.size = { stringVal: { value } };
    } else if (key === "size" && typeof value === "number") {
      result.size = { numberVal: { value } };
    } else if (key === "full_width" && typeof value === "boolean") {
      result.full_width = { boolVal: { value } };
    } else if (key === "label" && typeof value === "string") {
      result.label = { stringVal: { value } };
    } else if (key === "hint" && typeof value === "string") {
      result.hint = { stringVal: { value } };
    } else if (key === "is_password" && typeof value === "boolean") {
      result.is_password = { boolVal: { value } };
    } else if (key === "icon" && typeof value === "string") {
      result.icon = { stringVal: { value } };
    } else if (key === "name" && typeof value === "string") {
      result.name = { icon: { name: value } };
    } else if (key === "radius" && typeof value === "number") {
      result.radius = { radius: { topLeft: value, topRight: value, bottomLeft: value, bottomRight: value } };
    } else if (key === "padding" && typeof value === "string") {
      result.padding = { edgeInsets: { top: 0, right: 0, bottom: 0, left: 0, token: value } };
    } else if (key === "cross_align" && typeof value === "string") {
      result.cross_align = { align: { named: value } };
    } else if (key === "align" && typeof value === "string") {
      result.align = { align: { named: value } };
    } else if (key === "align_child" && typeof value === "string") {
      result.align_child = { align: { named: value } };
    } else if (key === "main_align" && typeof value === "string") {
      result.main_align = { align: { named: value } };
    } else if (key === "text_align" && typeof value === "string") {
      result.text_align = { align: { named: value } };
    } else if (key === "shadow" && typeof value === "string") {
      result.shadow = { stringVal: { value } };
    } else if (key === "font_weight" && typeof value === "number") {
      result.font_weight = { numberVal: { value } };
    } else if (key === "opacity" && typeof value === "number") {
      result.opacity = { numberVal: { value } };
    } else if (key === "width" && typeof value === "number") {
      result.width = { px: { value, isInfinity: false } };
    } else if (key === "height" && typeof value === "number") {
      result.height = { px: { value, isInfinity: false } };
    } else if (key === "clip" && typeof value === "boolean") {
      result.clip = { boolVal: { value } };
    } else if (key === "scroll" && typeof value === "boolean") {
      result.scroll = { boolVal: { value } };
    } else if (key === "safe_area" && typeof value === "boolean") {
      result.safe_area = { boolVal: { value } };
    } else if (key === "fit" && typeof value === "string") {
      result.fit = { stringVal: { value } };
    } else {
      result[key] = value;
    }
  }

  return result;
}
