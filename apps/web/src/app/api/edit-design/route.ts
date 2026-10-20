import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/edit-design
 * Body: { prompt: string, apiKey: string, model: string, designSpec: any, targetWidgetKey: string }
 * Returns: Updated DesignSpec JSON
 */

const SYSTEM_PROMPT = `You are Wiraflow — a senior Flutter Expert, UI/UX Master, and Enterprise Architect rolled into one.

SKILL SET (integrated from flutter-expert, flutter-ui-ux, flutter-enterprise):
- Flutter 3+ / Material Design 3 expert with 60fps performance mindset
- Clean Architecture: Feature-based structure (Presentation → Domain ← Data)
- State management: Riverpod 2.0 / BLoC / Provider (awareness reflected in page design)
- Widget composition: small, reusable, const-optimized atomic components
- Animation-aware design: implicit animations (AnimatedContainer, AnimatedOpacity), hero transitions, micro-interactions
- Typography: precise scale with line heights, font weights, accessibility contrast
- Responsive design: LayoutBuilder, MediaQuery, Flex/Expanded patterns
- Accessibility: semantic roles, contrast ratios, font scaling awareness

MISSION: Given a product idea, output a COMPLETE production-quality app design as raw JSON.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REQUIRED OUTPUT JSON SCHEMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "appName": "string",
  "tagline": "string",
  "palette": {
    "primary": "#hex",
    "onPrimary": "#hex",
    "secondary": "#hex",
    "accent": "#hex — vibrant neon: #4ADE80 / #22D3EE / #FB923C / #F472B6 / #A78BFA",
    "background": "#hex — always #000000 or #080808 or #0A0A0A",
    "surface": "#hex — #111111 or #121212",
    "surfaceElevated": "#hex — #1A1A1A or #1E1E1E",
    "textPrimary": "#hex — #F5F5F7 or #FAFAFA",
    "textSecondary": "#hex — #A1A1A6 or #9CA3AF",
    "textMuted": "#hex — #555555 or #4B5563",
    "divider": "#hex — #222222 or #2A2A2E",
    "error": "#hex — #F87171",
    "success": "#hex — #4ADE80"
  },
  "fonts": {
    "heading": "Inter",
    "body": "JetBrains Mono"
  },
  "pages": [ ...page objects... ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DSL PROPERTY SCHEMA — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every property MUST use one of these typed wrappers:
  String:    { "stringVal": { "value": "text" } }
  Number:    { "numberVal": { "value": 700 } }
  Boolean:   { "boolVal": { "value": true } }
  Color:     { "color": { "color": "token_or_#hex" } }
  Json:      { "jsonVal": { "value": <any valid JSON> } }
  Spacing:   { "edgeInsets": { "top":0,"right":0,"bottom":0,"left":0,"token":"lg" } }
  Radius:    { "radius": { "topLeft":16,"topRight":16,"bottomLeft":16,"bottomRight":16 } }
  Border:    { "border": { "width": 1, "color": "divider" } }
  Align:     { "align": { "named": "center|start|end|space_between|stretch" } }
  Icon:      { "icon": { "name": "material_icon_name" } }
  Px:        { "px": { "value": 64, "isInfinity": false } }
  TextStyle: { "textStyle": { "styleName": "headline_large" } }

VALID COLOR TOKENS (snake_case):
  primary, on_primary, secondary, accent, background, surface, surfaceElevated,
  textPrimary, textSecondary, textMuted, divider, error, success
  OR any #hex value.

SPACING TOKENS: xs=4px  sm=8px  md=16px  lg=24px  xl=32px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY SCALE (enforce strictly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  headline_large:  32px / w700 / line_height 1.2  → page hero titles
  headline_medium: 26px / w600 / line_height 1.25 → section headings
  title_large:     20px / w600 / line_height 1.3  → card titles
  title_medium:    16px / w600 / line_height 1.4  → sub-headings
  body_large:      16px / w400 / line_height 1.5  → primary body text
  body_medium:     14px / w400 / line_height 1.5  → secondary body text
  body_small:      12px / w400 / line_height 1.4  → captions / meta
  label_large:     14px / w600 / line_height 1.3  → button labels
  label_medium:    12px / w600 / line_height 1.3  → chip labels
  label_small:     10px / w700 / line_height 1.2  → overline / badge text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WIDGET TYPES & PROPERTIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Scaffold:    bg(color), safe_area(boolVal)
Column:      spacing(stringVal:token), padding(edgeInsets), cross_align(align), main_align(align), scroll(boolVal)
Row:         spacing(stringVal:token), align(align), cross_align(align), padding(edgeInsets)
Container:   bg(color), radius(radius), padding(edgeInsets), border(border), shadow(stringVal:"sm|md|lg"),
             width(px), height(px), clip(boolVal), align_child(align)
Stack:       fit(stringVal:"expand")
Expanded:    (no props — fills available space in Row/Column)
Center:      (no props)
SizedBox:    width(px), height(px)
Divider:     color(color)
Text:        content(stringVal), style(textStyle), color(color), font_weight(numberVal), 
             text_align(align), opacity(numberVal:0.0-1.0), line_height(numberVal:1.0-2.0)
Icon:        name(icon), size(numberVal), color(color)
IconButton:  name(icon), size(numberVal), color(color)
TextField:   label(stringVal), hint(stringVal), icon(stringVal:material_icon_name), is_password(boolVal)
Button:      content(stringVal), variant(stringVal:"primary|ghost|outlined|secondary"),
             size(stringVal:"small|large"), full_width(boolVal), icon_end(icon)
SocialButton:icon(stringVal:"google|apple|github"), label(stringVal)
Chip:        content(stringVal), selected(boolVal), variant(stringVal:"choice|input")
Image:       src(stringVal:url optional), source_desc(stringVal), alt(stringVal),
             fit(stringVal:"cover|contain"), height(px), radius(radius), border(border)
Progress:    variant(stringVal:"circular|linear"), size(numberVal), color(color)
Chart:       chart_type(stringVal:"bar|line|pie"), title(stringVal), height(px), color(color),
             data(stringVal:"10,22,18,30"), labels(stringVal:"Mon,Tue,Wed,Thu") OR
             data(jsonVal:[{"label":"Mon","value":22},{"label":"Tue","value":18},...]),
             show_grid(boolVal), bar_radius(numberVal), bar_width(numberVal)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCTION DESIGN RULES (from flutter-expert + flutter-ui-ux skills)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  ARCHITECTURE: Each page maps to a clean Feature Module (login, dashboard, detail, settings, profile).
2.  DARK THEME ONLY: background=#000000, surface=#121212. Never light backgrounds.
3.  VIBRANT ACCENT: Pick ONE hero accent color (neon green/cyan/orange/pink/purple) and use it consistently for CTAs, highlights, and active states.
4.  TYPOGRAPHY HIERARCHY: Every page MUST use at least 4 different text styles. Use opacity(0.7) for secondary info instead of just gray.
5.  LINE HEIGHTS: Add line_height to every Text widget. Headlines: 1.2, Body: 1.5, Labels: 1.2.
6.  CARDS: Container(bg:surface, radius:topLeft16+, padding:lg, border:divider 1px, shadow:"sm"). This is non-negotiable for premium look.
7.  BUTTONS: Primary CTA = full_width:true + size:"large" + icon_end. Ghost = variant:"ghost". Never use plain unstyled Buttons.
8.  INPUTS: Always include label + hint + icon. Group fields in a Container(bg:surface, radius:24, padding:lg, border:divider).
9.  HERO SECTION: Every dashboard page needs a prominent hero area — Container with primary_text bg color + lg padding. Include a real metric, insight, or welcome message.
10. DATA VIZ: Include at least ONE Chart widget on the dashboard (bar or line) with realistic data (7–12 points).
11. IMAGES: Default to ZERO images. Only include an Image widget when the product truly needs it (e.g. property photo, product listing). Hard limit: MAX 1 Image widget across the entire app design. Prefer "source_desc" and omit "src" unless the user provides a URL. DO NOT use AI image-generator URLs (e.g. dreamflow/stability). The preview will show an elegant placeholder.
12. SPACING: Token-based ONLY. xs=tight metadata, sm=list items, md=sections, lg=page padding, xl=major blocks.
13. REAL CONTENT: Every Text widget MUST have actual content. No "Title", "Description", "Item". Use realistic names, numbers, and dates.
14. ICONS: Use Material rounded icon names (search_rounded, home_rounded, settings_rounded, person_rounded, notifications_none_rounded, arrow_forward_rounded, lock_outline_rounded, email_outlined, check_circle_rounded, favorite_rounded, etc.).
15. PARENT HIERARCHY: root Scaffold has parentKey:null. Every other widget references its parent's key. Use descriptive kebab-case keys.
16. WIDGET COUNT: 10-20 widgets per page. Keep it token-efficient while maintaining a premium look.
17. SEMANTIC ROLES: Assign correctly — layout_root, layout_column, layout_row, layout_container, text_heading, text_body, form_input, action_trigger, icon, component.
18. ACCESSIBILITY: Use opacity thoughtfully (min 0.5 for readable text). Ensure high contrast between text and backgrounds.
19. ANIMATION HINTS: For Button widgets, use size:"large" + shadow:"md" to indicate they should have scale micro-interactions. For hero containers, use shadow:"lg".
20. PAGES REQUIRED: Login/Onboarding, Main Dashboard, Detail/Feature Page. NO MORE THAN 3 PAGES.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONE-SHOT EXAMPLE — Login Page (copy this pattern exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "key": "page-login",
  "name": "Sign In",
  "purpose": "Secure user authentication with email, password, and social login",
  "pageType": "form",
  "widgets": [
    {"key":"lg-scaffold","parentKey":null,"type":"Scaffold","label":"root","semanticRole":"layout_root","interactive":false,"properties":{"bg":{"color":{"color":"background"}},"safe_area":{"boolVal":{"value":true}}}},
    {"key":"lg-body","parentKey":"lg-scaffold","type":"Column","label":"body","semanticRole":"layout_column","interactive":false,"properties":{"scroll":{"boolVal":{"value":true}},"padding":{"edgeInsets":{"top":0,"right":0,"bottom":0,"left":0,"token":"lg"}},"spacing":{"stringVal":{"value":"xl"}}}},
    {"key":"lg-brand","parentKey":"lg-body","type":"Column","label":"brand","semanticRole":"layout_column","interactive":false,"properties":{"cross_align":{"align":{"named":"start"}},"spacing":{"stringVal":{"value":"md"}}}},
    {"key":"lg-logo-wrap","parentKey":"lg-brand","type":"Container","label":"logo","semanticRole":"layout_container","interactive":false,"properties":{"width":{"px":{"value":64,"isInfinity":false}},"height":{"px":{"value":64,"isInfinity":false}},"bg":{"color":{"color":"primary"}},"radius":{"radius":{"topLeft":20,"topRight":20,"bottomLeft":20,"bottomRight":20}},"align_child":{"align":{"named":"center"}},"shadow":{"stringVal":{"value":"md"}},"clip":{"boolVal":{"value":true}}}},
    {"key":"lg-logo-icon","parentKey":"lg-logo-wrap","type":"Icon","label":"icon","semanticRole":"icon","interactive":false,"properties":{"name":{"icon":{"name":"bolt_rounded"}},"color":{"color":{"color":"background"}},"size":{"numberVal":{"value":32}}}},
    {"key":"lg-app-title","parentKey":"lg-brand","type":"Text","label":"app name","semanticRole":"text_heading","interactive":false,"properties":{"content":{"stringVal":{"value":"Wiraflow"}},"style":{"textStyle":{"styleName":"headline_medium"}},"color":{"color":{"color":"textPrimary"}},"font_weight":{"numberVal":{"value":700}},"line_height":{"numberVal":{"value":1.25}}}},
    {"key":"lg-tagline","parentKey":"lg-brand","type":"Text","label":"tagline","semanticRole":"text_body","interactive":false,"properties":{"content":{"stringVal":{"value":"Design apps at the speed of thought."}},"style":{"textStyle":{"styleName":"body_medium"}},"color":{"color":{"color":"textSecondary"}},"opacity":{"numberVal":{"value":0.8}},"line_height":{"numberVal":{"value":1.5}}}},
    {"key":"lg-form-card","parentKey":"lg-body","type":"Container","label":"form card","semanticRole":"layout_container","interactive":false,"properties":{"bg":{"color":{"color":"surface"}},"radius":{"radius":{"topLeft":24,"topRight":24,"bottomLeft":24,"bottomRight":24}},"padding":{"edgeInsets":{"top":0,"right":0,"bottom":0,"left":0,"token":"lg"}},"border":{"border":{"width":1,"color":"divider"}},"shadow":{"stringVal":{"value":"sm"}}}},
    {"key":"lg-form-col","parentKey":"lg-form-card","type":"Column","label":"fields","semanticRole":"layout_column","interactive":false,"properties":{"spacing":{"stringVal":{"value":"lg"}}}},
    {"key":"lg-form-title","parentKey":"lg-form-col","type":"Text","label":"form title","semanticRole":"text_heading","interactive":false,"properties":{"content":{"stringVal":{"value":"Welcome back"}},"style":{"textStyle":{"styleName":"title_large"}},"color":{"color":{"color":"textPrimary"}},"font_weight":{"numberVal":{"value":600}},"line_height":{"numberVal":{"value":1.3}}}},
    {"key":"lg-email","parentKey":"lg-form-col","type":"TextField","label":"Email","semanticRole":"form_input","interactive":true,"properties":{"label":{"stringVal":{"value":"Work Email"}},"hint":{"stringVal":{"value":"you@company.com"}},"icon":{"stringVal":{"value":"email_outlined"}},"is_password":{"boolVal":{"value":false}}}},
    {"key":"lg-pass-group","parentKey":"lg-form-col","type":"Column","label":"password group","semanticRole":"layout_column","interactive":false,"properties":{"spacing":{"stringVal":{"value":"xs"}}}},
    {"key":"lg-password","parentKey":"lg-pass-group","type":"TextField","label":"Password","semanticRole":"form_input","interactive":true,"properties":{"label":{"stringVal":{"value":"Password"}},"hint":{"stringVal":{"value":"••••••••••"}},"icon":{"stringVal":{"value":"lock_outline_rounded"}},"is_password":{"boolVal":{"value":true}}}},
    {"key":"lg-cta","parentKey":"lg-form-col","type":"Button","label":"Sign In CTA","semanticRole":"action_trigger","interactive":true,"properties":{"content":{"stringVal":{"value":"Sign In"}},"size":{"stringVal":{"value":"large"}},"full_width":{"boolVal":{"value":true}},"icon_end":{"icon":{"name":"arrow_forward_rounded"}}}},
    {"key":"lg-alt-row","parentKey":"lg-form-col","type":"Row","label":"alt actions","semanticRole":"layout_row","interactive":false,"properties":{"align":{"align":{"named":"center"}},"spacing":{"stringVal":{"value":"md"}}}},
    {"key":"lg-signup-btn","parentKey":"lg-alt-row","type":"Button","label":"Create Account","semanticRole":"action_trigger","interactive":true,"properties":{"content":{"stringVal":{"value":"Create Account"}},"variant":{"stringVal":{"value":"ghost"}},"size":{"stringVal":{"value":"small"}}}},
    {"key":"lg-social-col","parentKey":"lg-body","type":"Column","label":"social section","semanticRole":"layout_column","interactive":false,"properties":{"spacing":{"stringVal":{"value":"md"}}}},
    {"key":"lg-divider-row","parentKey":"lg-social-col","type":"Row","label":"or divider","semanticRole":"layout_row","interactive":false,"properties":{"spacing":{"stringVal":{"value":"md"}}}},
    {"key":"lg-div-left-exp","parentKey":"lg-divider-row","type":"Expanded","label":"left","semanticRole":"layout_column","interactive":false,"properties":{}},
    {"key":"lg-div-left","parentKey":"lg-div-left-exp","type":"Divider","label":"line","semanticRole":"component","interactive":false,"properties":{"color":{"color":{"color":"divider"}}}},
    {"key":"lg-or-text","parentKey":"lg-divider-row","type":"Text","label":"OR","semanticRole":"text_body","interactive":false,"properties":{"content":{"stringVal":{"value":"OR CONTINUE WITH"}},"style":{"textStyle":{"styleName":"label_small"}},"color":{"color":{"color":"textMuted"}},"line_height":{"numberVal":{"value":1.2}}}},
    {"key":"lg-div-right-exp","parentKey":"lg-divider-row","type":"Expanded","label":"right","semanticRole":"layout_column","interactive":false,"properties":{}},
    {"key":"lg-div-right","parentKey":"lg-div-right-exp","type":"Divider","label":"line","semanticRole":"component","interactive":false,"properties":{"color":{"color":{"color":"divider"}}}},
    {"key":"lg-social-row","parentKey":"lg-social-col","type":"Row","label":"social btns","semanticRole":"layout_row","interactive":false,"properties":{"spacing":{"stringVal":{"value":"md"}}}},
    {"key":"lg-google-exp","parentKey":"lg-social-row","type":"Expanded","label":"g-wrap","semanticRole":"layout_column","interactive":false,"properties":{}},
    {"key":"lg-google","parentKey":"lg-google-exp","type":"SocialButton","label":"Google","semanticRole":"action_trigger","interactive":true,"properties":{"icon":{"stringVal":{"value":"google"}},"label":{"stringVal":{"value":"Google"}}}},
    {"key":"lg-apple-exp","parentKey":"lg-social-row","type":"Expanded","label":"a-wrap","semanticRole":"layout_column","interactive":false,"properties":{}},
    {"key":"lg-apple","parentKey":"lg-apple-exp","type":"SocialButton","label":"Apple","semanticRole":"action_trigger","interactive":true,"properties":{"icon":{"stringVal":{"value":"apple"}},"label":{"stringVal":{"value":"Apple"}}}}
  ]
}

FOLLOW THIS EXACT PATTERN for all pages. Every property MUST use the typed DSL wrapper format.
Generate 2-3 pages maximum to save tokens. Design them with extremely high quality.`;

// Keep edit calls fast + token-efficient: do not send the full generation master prompt.
const EDIT_SYSTEM_PROMPT =
  "You are Wiraflow Edit Agent. Return ONLY valid JSON. Prefer minimal changes and minimal output.";

function findWidgetByKey(spec: any, widgetKey: string) {
  const pages = spec?.pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    const widgets = page?.widgets;
    if (!Array.isArray(widgets)) continue;
    const found = widgets.find((w: any) => w?.key === widgetKey);
    if (found) return found;
  }
  return null;
}

function replaceWidgetByKey(spec: any, widgetKey: string, replacement: any): boolean {
  const pages = spec?.pages;
  if (!Array.isArray(pages)) return false;
  for (const page of pages) {
    const widgets = page?.widgets;
    if (!Array.isArray(widgets)) continue;
    const idx = widgets.findIndex((w: any) => w?.key === widgetKey);
    if (idx !== -1) {
      widgets[idx] = replacement;
      return true;
    }
  }
  return false;
}

function findPageForWidget(spec: any, widgetKey: string) {
  const pages = spec?.pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    const widgets = page?.widgets;
    if (!Array.isArray(widgets)) continue;
    if (widgets.some((w: any) => w?.key === widgetKey)) return page;
  }
  return null;
}

function collectDescendantTextWidgetKeys(page: any, rootKey: string, limit = 12): string[] {
  const widgets = page?.widgets;
  if (!Array.isArray(widgets)) return [];

  const childrenByParent = new Map<string, string[]>();
  const widgetByKey = new Map<string, any>();
  for (const w of widgets) {
    if (!w?.key) continue;
    widgetByKey.set(w.key, w);
    if (w.parentKey) {
      const list = childrenByParent.get(w.parentKey) || [];
      list.push(w.key);
      childrenByParent.set(w.parentKey, list);
    }
  }

  const queue: string[] = [rootKey];
  const visited = new Set<string>();
  const found: string[] = [];

  while (queue.length && found.length < limit) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const node = widgetByKey.get(current);
    if (node?.type === "Text") found.push(current);

    const kids = childrenByParent.get(current) || [];
    for (const k of kids) queue.push(k);
  }

  // If the root itself isn't a Text, skip it unless found via type check above.
  return found;
}

function applyLayoutAlignment(widget: any, align: "start" | "center" | "end") {
  if (!widget) return;
  widget.properties = widget.properties || {};

  if (widget.type === "Container") {
    widget.properties.align_child = { align: { named: align } };
    return;
  }
  if (widget.type === "Column") {
    widget.properties.cross_align = { align: { named: align } };
    return;
  }
  if (widget.type === "Row") {
    widget.properties.align = { align: { named: align } };
    return;
  }
  if (widget.type === "Center" && (align === "start" || align === "end")) {
    // Center forces centering; convert to Container so alignment can take effect.
    widget.type = "Container";
    widget.properties.align_child = { align: { named: align } };
    widget.properties.width = { px: { value: 0, isInfinity: true } };
    return;
  }
  if (widget.type === "Center") {
    // no-op: Center always centers.
    return;
  }
}

function isTextAlignPrompt(prompt: string) {
  const p = prompt.toLowerCase();

  // Common misspellings
  const normalized = p
    .replaceAll("allignment", "alignment")
    .replaceAll("allign", "align")
    .replaceAll("alighn", "align");

  const wantsLeft =
    /\bleft\s*align(ed|ment)?\b/.test(normalized) ||
    /\balign(ment)?\s*(to)?\s*left\b/.test(normalized) ||
    /\btext\s*align(ment)?\s*(to)?\s*left\b/.test(normalized);
  const wantsCenter =
    /\bcenter\s*align(ed|ment)?\b/.test(normalized) ||
    /\balign(ment)?\s*(to)?\s*center\b/.test(normalized) ||
    /\btext\s*align(ment)?\s*(to)?\s*center\b/.test(normalized);
  const wantsRight =
    /\bright\s*align(ed|ment)?\b/.test(normalized) ||
    /\balign(ment)?\s*(to)?\s*right\b/.test(normalized) ||
    /\btext\s*align(ment)?\s*(to)?\s*right\b/.test(normalized);

  if (wantsLeft) return "start";
  if (wantsCenter) return "center";
  if (wantsRight) return "end";
  return null;
}

function extractMaterialIconName(prompt: string): string | null {
  const lower = prompt.toLowerCase();
  if (!lower.includes("icon")) return null;

  // Common phrase mapping (lets users speak naturally)
  const phraseMap: Array<[RegExp, string]> = [
    [/\barrow\s*right\b|\bforward\b|\bnext\b/, "arrow_forward_rounded"],
    [/\barrow\s*left\b|\bback\b|\bprevious\b/, "arrow_back_rounded"],
    [/\bhome\b/, "home_rounded"],
    [/\bsettings\b/, "settings_rounded"],
    [/\bsearch\b/, "search_rounded"],
    [/\buser\b|\bprofile\b|\bperson\b/, "person_rounded"],
    [/\bheart\b|\bfavorite\b|\blike\b/, "favorite_rounded"],
    [/\bnotification\b|\bbell\b/, "notifications_none_rounded"],
    [/\bplus\b|\badd\b/, "add_rounded"],
    [/\bcheck\b|\bdone\b|\bsuccess\b/, "check_circle_rounded"],
    [/\bedit\b|\bpencil\b/, "edit_rounded"],
  ];
  for (const [re, icon] of phraseMap) {
    if (re.test(lower)) return icon;
  }

  // Prefer explicit material icon tokens like "arrow_forward_rounded"
  const tokenMatch = prompt.match(/\b([a-z][a-z0-9_]{2,})\b/i);
  if (!tokenMatch) return null;

  // Scan all tokens and pick the most icon-like
  const tokens = prompt.match(/\b[a-z][a-z0-9_]{2,}\b/gi) || [];
  const iconLike = tokens.find((t) =>
    /_(rounded|outlined|sharp|filled)$/i.test(t) ||
    t.includes("_") ||
    ["home", "search", "settings", "person", "favorite", "notifications"].includes(t.toLowerCase())
  );

  return iconLike || null;
}

function isRemoveIconPrompt(prompt: string) {
  const p = prompt.toLowerCase();
  return /\b(remove|delete|clear)\b/.test(p) && /\bicon\b/.test(p);
}

type ModelEditParseResult =
  | { kind: "widget_patch"; widgets: any[] }
  | { kind: "full_spec"; spec: any };

function parseModelEdit(cleanedJson: string): ModelEditParseResult | null {
  const parsed = JSON.parse(cleanedJson);

  if (Array.isArray(parsed?.widgets)) {
    return { kind: "widget_patch", widgets: parsed.widgets };
  }

  // Some models may ignore the patch format and return the full design spec.
  if (parsed?.appName && Array.isArray(parsed?.pages)) {
    return { kind: "full_spec", spec: parsed };
  }

  // Or return a single widget object.
  if (parsed?.key && parsed?.type && parsed?.properties) {
    return { kind: "widget_patch", widgets: [parsed] };
  }

  return null;
}

function mergeProperties(base: any, patch: any): any {
  if (!patch || typeof patch !== "object") return base || {};
  const baseObj = base && typeof base === "object" ? base : {};
  const out: any = Array.isArray(baseObj) ? [...baseObj] : { ...baseObj };

  for (const [k, v] of Object.entries(patch)) {
    const baseVal = (baseObj as any)[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      out[k] = mergeProperties(baseVal, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function mergeWidget(baseWidget: any, patchWidget: any) {
  const merged = { ...baseWidget, ...patchWidget };
  merged.key = baseWidget.key;
  // Preserve required fields if patch omitted them
  merged.parentKey = patchWidget.parentKey ?? baseWidget.parentKey;
  merged.type = patchWidget.type ?? baseWidget.type;
  merged.label = patchWidget.label ?? baseWidget.label;
  merged.semanticRole = patchWidget.semanticRole ?? baseWidget.semanticRole;
  merged.interactive =
    typeof patchWidget.interactive === "boolean"
      ? patchWidget.interactive
      : baseWidget.interactive;
  merged.properties = mergeProperties(baseWidget.properties, patchWidget.properties);
  return merged;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, designSpec, targetWidgetKey, dryRun } = await req.json();

    if (!apiKey) {
      return NextResponse.json({ error: "No API key provided." }, { status: 400 });
    }
    if (!prompt?.trim()) {
      return NextResponse.json({ error: "No prompt provided." }, { status: 400 });
    }
    if (!designSpec || !targetWidgetKey) {
      return NextResponse.json({ error: "No designSpec or targetWidgetKey provided." }, { status: 400 });
    }

    const beforeWidget = findWidgetByKey(designSpec, targetWidgetKey);
    if (!beforeWidget) {
      return NextResponse.json(
        { error: "Target widget not found in the current design. Refresh and try again." },
        { status: 422 }
      );
    }

    // Fast-path common edits to reduce latency and token usage
    const align = isTextAlignPrompt(prompt);
    if (align) {
      const mergedSpec = JSON.parse(JSON.stringify(designSpec));
      const mergedPage = findPageForWidget(mergedSpec, targetWidgetKey);
      const targetKeys =
        beforeWidget?.type === "Text" || !mergedPage
          ? [targetWidgetKey]
          : collectDescendantTextWidgetKeys(mergedPage, targetWidgetKey);

      if (targetKeys.length === 0) {
        return NextResponse.json(
          { error: "No Text widgets found under the selected component. Select the Text widget and try again." },
          { status: 422 }
        );
      }

      for (const key of targetKeys) {
        const widget = findWidgetByKey(mergedSpec, key);
        if (!widget) continue;
        if (widget.type !== "Text") continue;
        widget.properties = widget.properties || {};
        widget.properties.text_align = { align: { named: align } };

        // If a parent container/row/column is centering the Text widget, align it too.
        if (widget.parentKey) {
          const parent = findWidgetByKey(mergedSpec, widget.parentKey);
          applyLayoutAlignment(parent, align);
        }
      }

      // Also align the selected widget itself when it's a layout container.
      const selected = findWidgetByKey(mergedSpec, targetWidgetKey);
      applyLayoutAlignment(selected, align);

      // Mark update metadata
      mergedSpec.generatedAt = new Date().toISOString();
      mergedSpec.model = model || "local-edit";
      return NextResponse.json({ success: true, spec: mergedSpec });
    }

    // Fast-path: change a Button's end icon when user provides an icon name.
    if (beforeWidget?.type === "Button" && (prompt.toLowerCase().includes("icon") || prompt.toLowerCase().includes("button"))) {
      const iconName = extractMaterialIconName(prompt);
      const remove = isRemoveIconPrompt(prompt);
      if (iconName || remove) {
        const mergedSpec = JSON.parse(JSON.stringify(designSpec));
        const widget = findWidgetByKey(mergedSpec, targetWidgetKey);
        if (!widget) {
          return NextResponse.json(
            { error: "Target widget not found in the current design. Refresh and try again." },
            { status: 422 }
          );
        }
        widget.properties = widget.properties || {};
        if (remove) {
          delete widget.properties.icon_end;
        } else {
          widget.properties.icon_end = { icon: { name: iconName } };
        }
        mergedSpec.generatedAt = new Date().toISOString();
        mergedSpec.model = model || "local-edit";
        return NextResponse.json({ success: true, spec: mergedSpec });
      }
    }

    // Determine provider and model name securely
    const isGeminiKey = apiKey.startsWith("AIza");
    const isOpenAIKey = apiKey.startsWith("sk-");
    const isGeminiModel = !model || model.startsWith("gemini") || model.startsWith("models/gemini");
    const isGemini = isGeminiKey || (!isOpenAIKey && isGeminiModel);
    
    // If it's a Gemini key but the user accidentally left the model as gpt-4o, correct it safely.
    // If it's an OpenAI key but the user left the model as gemini-*, correct it safely.
    const modelName = isGemini
      ? (isGeminiModel ? (model || "gemini-2.0-flash") : "gemini-2.0-flash")
      : (!model || isGeminiModel ? "gpt-4o" : model);

    let result: string;

    const page = findPageForWidget(designSpec, targetWidgetKey);
    const parentWidget =
      beforeWidget?.parentKey ? findWidgetByKey(designSpec, beforeWidget.parentKey) : null;

    const EDIT_PROMPT = `You are a UI Editor Agent for Wiraflow's Flutter-JSON DSL.

INSTRUCTIONS: ${prompt}

TARGET WIDGET KEY: ${targetWidgetKey}
TARGET WIDGET (current):
${JSON.stringify(beforeWidget)}

PARENT WIDGET (optional):
${JSON.stringify(parentWidget)}

PAGE CONTEXT:
${JSON.stringify(page ? { key: page.key, name: page.name, pageType: page.pageType } : null)}

PALETTE:
${JSON.stringify(designSpec?.palette || {})}

TASK:
- Apply the instruction to the TARGET widget. If needed, also adjust ONLY the PARENT widget (for alignment/layout).
- Do NOT modify other widgets, pages, palette, or fonts unless explicitly requested.
- Keep all properties in the typed wrapper DSL format (stringVal/numberVal/boolVal/color/edgeInsets/radius/border/align/icon/px/textStyle).

IMPORTANT FOR TEXT ALIGNMENT:
- Left alignment = { "text_align": { "align": { "named": "start" } } }
- Center alignment = { "text_align": { "align": { "named": "center" } } }
- Right alignment = { "text_align": { "align": { "named": "end" } } }

IMPORTANT FOR BUTTON ICON:
- To set an end icon on a Button: { "icon_end": { "icon": { "name": "arrow_forward_rounded" } } }
- To remove an icon, omit icon_end or set it to null.

OUTPUT:
Return ONLY valid JSON (no markdown fences). Preferred output shape:
{
  "widgets": [
    { "key": "${targetWidgetKey}", "parentKey": "...", "type": "...", "label": "...", "semanticRole": "...", "interactive": true/false, "properties": { ... } },
    { "key": "${beforeWidget?.parentKey || ""}", "parentKey": "...", "type": "...", "label": "...", "semanticRole": "...", "interactive": true/false, "properties": { ... } }
  ]
}

Include ONLY widgets you changed.

If you cannot comply with the patch format, you MAY return the full updated design spec (appName/tagline/palette/fonts/pages).`;

    if (isGemini) {
      // Direct REST API call (bypasses Genkit/Plugin issues with API key formats)
      // Make sure we strip 'models/' prefix if it's there
      const cleanModelName = modelName.replace(/^models\//, "");
      
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: EDIT_SYSTEM_PROMPT }]
            },
            contents: [
              { role: "user", parts: [{ text: EDIT_PROMPT }] }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 2000
            }
          }),
        }
      );
      
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data?.error?.message || "Gemini REST API error" },
          { status: 502 }
        );
      }
      
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenAI-compatible: call directly
      const usesMaxCompletionTokens =
        modelName.startsWith("gpt-5") || modelName.startsWith("o");
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: EDIT_SYSTEM_PROMPT },
            { role: "user", content: EDIT_PROMPT },
          ],
          temperature: 0.1,
          ...(usesMaxCompletionTokens
            ? { max_completion_tokens: 2000 }
            : { max_tokens: 2000 }),
        }),
      });
      const oaiData = await oaiRes.json();
      if (!oaiRes.ok) {
        return NextResponse.json(
          { error: oaiData?.error?.message || "OpenAI error" },
          { status: 502 }
        );
      }
      result = oaiData.choices?.[0]?.message?.content || "";
    }

    // Strip markdown fences if model wrapped output
    const cleaned = result
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const mergedSpec = JSON.parse(JSON.stringify(designSpec));
    const parsedEdit = parseModelEdit(cleaned);
    if (!parsedEdit) {
      return NextResponse.json(
        {
          error:
            "AI returned an unsupported edit format. Please try again with a more explicit instruction.",
        },
        { status: 422 }
      );
    }

    let updatedWidgets: any[] = [];
    if (parsedEdit.kind === "widget_patch") {
      updatedWidgets = parsedEdit.widgets;
    } else {
      const updatedTarget = findWidgetByKey(parsedEdit.spec, targetWidgetKey);
      if (updatedTarget) updatedWidgets.push(updatedTarget);
      if (beforeWidget?.parentKey) {
        const updatedParent = findWidgetByKey(parsedEdit.spec, beforeWidget.parentKey);
        if (updatedParent) updatedWidgets.push(updatedParent);
      }
    }

    if (!Array.isArray(updatedWidgets) || updatedWidgets.length === 0) {
      return NextResponse.json(
        { error: "AI returned no widget updates. Try a more specific instruction." },
        { status: 422 }
      );
    }

    if (dryRun) {
      const appliedKeys = updatedWidgets
        .map((w: any) => (typeof w?.key === "string" ? w.key : null))
        .filter(Boolean);
      return NextResponse.json({ success: true, patch: { widgets: updatedWidgets }, appliedKeys });
    }

    let anyChange = false;
    for (const w of updatedWidgets) {
      if (!w?.key || typeof w.key !== "string") continue;
      if (w.key !== targetWidgetKey && w.key !== beforeWidget?.parentKey) continue;

      const current = findWidgetByKey(mergedSpec, w.key);
      if (!current) continue;

      const mergedWidget = mergeWidget(current, w);
      const beforeJson = JSON.stringify(current);
      const replaced = replaceWidgetByKey(mergedSpec, w.key, mergedWidget);
      if (!replaced) continue;
      const afterJson = JSON.stringify(mergedWidget);
      if (beforeJson !== afterJson) anyChange = true;
    }

    if (!anyChange) {
      return NextResponse.json(
        { error: "AI did not apply any changes. Try a more specific instruction." },
        { status: 422 }
      );
    }

    mergedSpec.generatedAt = new Date().toISOString();
    mergedSpec.model = modelName;

    return NextResponse.json({ success: true, spec: mergedSpec });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 422 }
      );
    }
    console.error("[generate-design]", err);
    return NextResponse.json(
      { error: err.message || "Generation failed." },
      { status: 500 }
    );
  }
}
