import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_OLLAMA_MODEL, getOllamaBaseUrl, ollamaUnavailableMessage } from "../../../lib/ollama-server";

export const runtime = "nodejs";

/**
 * POST /api/generate-design
 * Body: { prompt: string, apiKey: string, model: string }
 * Returns: DesignSpec JSON
 */

const SYSTEM_PROMPT = `You are Wiraflow — a world-class Flutter Expert, UI/UX Master, and Enterprise Architect.

MISSION: Act as a Principal UI Architect. Output a COMPLETE, high-density Flutter design as raw JSON. Never return generic templates. Use the exact DSL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT JSON SCHEMA
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
  "fonts": { "heading": "Inter", "body": "DM Sans" },
  "pages": [ ...page objects... ]
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DSL PROPERTY WRAPPERS — MANDATORY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every property MUST use typed wrappers:
  String:    { "stringVal": { "value": "text" } }
  Number:    { "numberVal": { "value": 700 } }
  Boolean:   { "boolVal": { "value": true } }
  Color:     { "color": { "color": "token_or_#hex" } }
  Json:      { "jsonVal": { "value": <any JSON> } }
  Spacing:   { "edgeInsets": { "top":0,"right":0,"bottom":0,"left":0,"token":"lg" } }
  Radius:    { "radius": { "topLeft":16,"topRight":16,"bottomLeft":16,"bottomRight":16 } }
  Border:    { "border": { "width": 1, "color": "divider" } }
  Align:     { "align": { "named": "center|start|end|space_between|stretch" } }
  Icon:      { "icon": { "name": "material_icon_name" } }
  Px:        { "px": { "value": 64, "isInfinity": false } }
  TextStyle: { "textStyle": { "styleName": "headline_large" } }
  Query:     { "stringVal": { "value": "table_name" } } // Attach to ListView/GridView to bind Supabase data

COLOR TOKENS: primary, onPrimary, secondary, accent, background, surface, surfaceElevated, textPrimary, textSecondary, textMuted, divider, error, success OR #hex.
SPACING TOKENS: xs=4px sm=8px md=16px lg=24px xl=32px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY SCALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
headline_large:  32px/w700/1.2 → hero titles
headline_medium: 26px/w600/1.25 → section headings
title_large:     20px/w600/1.3  → card titles
title_medium:    16px/w600/1.4  → sub-headings
body_large:      16px/w400/1.5  → primary body
body_medium:     14px/w400/1.5  → secondary body
body_small:      12px/w400/1.4  → captions/meta
label_large:     14px/w600/1.3  → button labels
label_medium:    12px/w600/1.3  → chip labels
label_small:     10px/w700/1.2  → overline/badge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL WIDGET CATALOG (use ALL of these)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LAYOUT WIDGETS:
  Scaffold:    bg(color), safe_area(boolVal)
  Column:      spacing(stringVal:token), padding(edgeInsets), cross_align(align), main_align(align), scroll(boolVal)
  Row:         spacing(stringVal:token), align(align), cross_align(align), padding(edgeInsets)
  Container:   bg(color), radius(radius), padding(edgeInsets), border(border), shadow(stringVal:"sm|md|lg"), width(px), height(px), clip(boolVal), align_child(align), gradient(gradient)
  Stack:       fit(stringVal:"expand")
  Expanded:    (fills available space)
  Center:      (centers child)
  SizedBox:    width(px), height(px)
  Divider:     color(color)
  GridView:    columns(numberVal:2-4), spacing(stringVal:token), cross_spacing(stringVal:token), padding(edgeInsets), query_table(stringVal)
  Wrap:        spacing(stringVal:token), run_spacing(stringVal:token)
  ListView:    scrollDirection(stringVal:"vertical|horizontal"), spacing(stringVal:token), padding(edgeInsets), query_table(stringVal)

CONTENT WIDGETS:
  Text:        content(stringVal), style(textStyle), color(color), font_weight(numberVal), text_align(align), opacity(numberVal), line_height(numberVal)
  Icon:        name(icon), size(numberVal), color(color)
  IconButton:  name(icon), size(numberVal), color(color), bg(color), radius(radius), border(border)
  Image:       source_desc(stringVal), alt(stringVal), fit(stringVal:"cover|contain"), height(px), radius(radius)

INPUT WIDGETS:
  TextField:   label(stringVal), hint(stringVal), icon(stringVal:material_icon), is_password(boolVal)
  Button:      content(stringVal), variant(stringVal:"primary|ghost|outlined|secondary"), size(stringVal:"small|large"), full_width(boolVal), icon_end(icon)
  SocialButton:icon(stringVal:"google|apple|github"), label(stringVal)
  Switch:      label(stringVal), value(boolVal:true|false), color(color)
  Slider:      label(stringVal), min(numberVal), max(numberVal), value(numberVal), color(color)
  Dropdown:    label(stringVal), hint(stringVal), items(stringVal:"Option 1,Option 2,Option 3"), icon(stringVal)
  Chip:        content(stringVal), selected(boolVal), variant(stringVal:"choice|input")

DATA DISPLAY WIDGETS:
  Chart:       chart_type(stringVal:"bar|line|pie"), title(stringVal), height(px), color(color), data(jsonVal:[{"label":"Mon","value":22},...]), show_grid(boolVal)
  Progress:    variant(stringVal:"circular|linear"), size(numberVal), color(color)
  RatingBar:   value(numberVal:0-5), max(numberVal:5), size(numberVal:18-24), color(color)
  Badge:       content(stringVal), bg(color), fg(color)
  Avatar:      size(numberVal:32-64), bg(color), initials(stringVal:"JD"), border(border)
  CircleAvatar:radius(numberVal), bg(color), initials(stringVal), icon(stringVal)

COMPOSITE WIDGETS:
  ListTile:    title(stringVal), subtitle(stringVal), leading_icon(stringVal:material_icon), trailing_icon(stringVal), trailing_text(stringVal), border_bottom(boolVal)
  Carousel:    height(px:180-240), auto_play(boolVal), item_count(numberVal:3-5)
  BottomNavigationBar: bg(color), items(jsonVal:[{"icon":"home","label":"Home","pageKey":"page-home"},{"icon":"search","label":"Explore","pageKey":"page-explore"},...])
  AppBar:      bg(color), fg(color), height(px)
  FAB:         icon(stringVal:material_icon), bg(color), size(numberVal:56)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MANDATORY DESIGN RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1.  PAGE COUNT: Generate exactly 7-8 pages. Each page must be UNIQUE in layout and purpose.
2.  DARK THEME ONLY: background=#000000 or #080808, surface=#111111 or #121212.
3.  VIBRANT ACCENT: Pick ONE hero accent (neon green/cyan/orange/pink/purple). Use consistently.
4.  CARDS: Container(bg:surface, radius:20-24, padding:lg, border:divider 1px, shadow:"sm"). Non-negotiable for premium look.
    - Inner content needs proper hierarchy: icon/badge top, title, subtitle, metadata row
    - Card grids: use GridView(columns:2) for product/category cards
5.  TYPOGRAPHY: Every page uses 4+ text styles. Use opacity(0.7) for secondary text.
6.  BUTTONS: Primary CTA = full_width + size:"large" + icon_end. Ghost for secondary. Outlined for tertiary.
7.  INPUTS: Always include label + hint + icon. Group in Container(bg:surface, radius:20, padding:lg, border:divider).
8.  CAROUSELS: Use Carousel for featured items, promotions, onboarding slides. Children are Container cards with content inside.
9.  LIST TILES: Use ListTile for settings, notifications, activity items. Include leading_icon + title + subtitle + trailing.
10. GRID LAYOUTS: Use GridView(columns:2) for product grids, category browsing, stats cards.
11. AVATARS: Use Avatar for user profiles. Always include initials and a colored bg.
12. SWITCHES & SLIDERS: Use Switch for toggle settings. Use Slider for range preferences.
13. RATING: Use RatingBar on product/service detail pages.
14. BOTTOM NAV: Main pages (Home, Explore, Activity, Profile) MUST have a BottomNavigationBar with 4 items.
15. SPACING RHYTHM: Vary spacing per section — xs for metadata rows, sm for list gaps, md for card internal, lg for page padding, xl for hero sections. NEVER use the same spacing token everywhere.
16. REAL CONTENT: Every Text has actual content — realistic names (Alex Chen, Sarah Kim), dates (Mar 15, 2026), prices ($42.99), descriptions. NO "Title", "Description", "Item" placeholders.
17. ICONS: Use 30+ unique Material icons. Use _rounded suffix (home_rounded, search_rounded, settings_rounded, person_rounded, favorite_rounded, star_rounded, notifications_none_rounded, shopping_bag_rounded, arrow_forward_rounded, add_rounded, check_circle_rounded, edit_rounded, delete_rounded, share_rounded, bookmark_rounded, trending_up_rounded, calendar_today_rounded, access_time_rounded, location_on_rounded, phone_rounded, email_outlined, lock_outline_rounded, visibility_rounded, filter_list_rounded, sort_rounded, more_vert_rounded, close_rounded, menu_rounded, attach_money_rounded, credit_card_rounded).
18. WIDGET COUNT: 15-25 widgets per page. Rich, detailed layouts.
19. SEMANTIC ROLES: layout_root, layout_column, layout_row, layout_container, text_heading, text_body, form_input, action_trigger, icon, component, navigation, data_display.
20. UNIQUE KEY: Every widget has unique kebab-case key (e.g. "home-hero-card", "profile-avatar-wrap").
21. PARENT HIERARCHY: Root Scaffold has parentKey:null. Every other widget references its parent's key.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURAL GUIDELINES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DEEP SCROLLABILITY: Main pages must be long and scrollable. Use \`scroll: { "boolVal": { "value": true } }\` on root Columns heavily.
2. ROBUST ONBOARDING: Do not generate a tiny "getting started" card. Build a rich, multi-step, visually heavy onboarding page with Carousels, detailed feature lists, and large Hero elements.
3. DYNAMIC DATA BINDING: Whenever generating a ListView or GridView that displays business data (e.g. products, users, posts), you MUST attach \`query_table: { "stringVal": { "value": "<guess_table_name>" } }\` to the widget properties. The compiler will map this to a Supabase query.
4. NO REPETITION: Every design must be uniquely tailored to the prompt. Do not use generic structures.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ONE-SHOT LOGIN EXAMPLE (follow this DSL pattern exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "key": "page-login",
  "name": "Sign In",
  "purpose": "Secure user authentication",
  "pageType": "form",
  "widgets": [
    {"key":"lg-scaffold","parentKey":null,"type":"Scaffold","label":"root","semanticRole":"layout_root","interactive":false,"properties":{"bg":{"color":{"color":"background"}},"safe_area":{"boolVal":{"value":true}}}},
    {"key":"lg-body","parentKey":"lg-scaffold","type":"Column","label":"body","semanticRole":"layout_column","interactive":false,"properties":{"scroll":{"boolVal":{"value":true}},"padding":{"edgeInsets":{"top":0,"right":0,"bottom":0,"left":0,"token":"lg"}},"spacing":{"stringVal":{"value":"xl"}}}},
    {"key":"lg-email","parentKey":"lg-body","type":"TextField","label":"Email","semanticRole":"form_input","interactive":true,"properties":{"label":{"stringVal":{"value":"Email"}},"hint":{"stringVal":{"value":"you@example.com"}},"icon":{"stringVal":{"value":"email_outlined"}},"is_password":{"boolVal":{"value":false}}}},
    {"key":"lg-cta","parentKey":"lg-body","type":"Button","label":"Sign In","semanticRole":"action_trigger","interactive":true,"properties":{"content":{"stringVal":{"value":"Sign In"}},"size":{"stringVal":{"value":"large"}},"full_width":{"boolVal":{"value":true}},"icon_end":{"icon":{"name":"arrow_forward_rounded"}}}}
  ]
}

Every property MUST use the typed DSL wrapper. Generate highly creative, distinct pages.`;

// Local models often run on CPU. Keep their prompt and output deliberately small:
// the full cloud prompt asks for hundreds of widgets and can exceed Gemma's context
// window before it has even started generating.
function localSystemPrompt(pageCount: number): string {
  return `You are WiraFlow, a Flutter UI designer. Return only valid JSON matching the provided schema.
Create exactly ${pageCount} useful ${pageCount === 1 ? "screen" : "pages"} tailored to the app request${pageCount === 1 ? "" : " (a primary workflow and one relevant secondary workflow)"}; do not add login unless relevant.
Each page has exactly 5 widgets, including a Scaffold root and its body Column. Give every widget a unique short kebab-case key; the root has parentKey null and each other widget points to its parent key.
For speed, each widget must contain only key, type, parentKey, and properties. Omit label, semanticRole, and interactive. Give each widget at most 2 concise properties; Text content is at most 8 words. Use only the schema's typed wrappers where needed. Return a cohesive palette with only primary, accent, background, surface, textPrimary, and textSecondary. Avoid filler, arrays, charts, verbose descriptions, and generic placeholder text.`;
}


export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, provider = "cloud", imageDataUrl, generationMode = "full" } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "No prompt provided." }, { status: 400 });
    }
    if (provider !== "ollama" && !apiKey) {
      return NextResponse.json({ error: "No API key provided." }, { status: 400 });
    }

    const localMode = provider === "ollama";
    const localPageCount = generationMode === "full" ? 2 : 1;
    if (imageDataUrl && !localMode) {
      return NextResponse.json({ error: "Sketch input requires local Ollama." }, { status: 400 });
    }
    let imageBase64: string | undefined;
    if (imageDataUrl) {
      if (typeof imageDataUrl !== "string" || imageDataUrl.length > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "Image is too large. Choose a smaller sketch image." }, { status: 413 });
      }
      const match = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
      if (!match) return NextResponse.json({ error: "Sketch must be a PNG, JPEG, or WebP image." }, { status: 400 });
      imageBase64 = match[1];
    }

    // Cloud-provider selection only needs the key and model when local mode is off.
    const isGeminiKey = !localMode && apiKey.startsWith("AIza");
    const isOpenAIKey = !localMode && apiKey.startsWith("sk-");
    const isGeminiModel = !model || model.startsWith("gemini") || model.startsWith("models/gemini");
    const isGemini = isGeminiKey || (!isOpenAIKey && !localMode && isGeminiModel);

    // Enhanced user prompt with explicit page count and quality requirements
    const enhancedUserPrompt = `Design a complete, premium, and deeply contextual mobile app for:

${prompt}

CRITICAL REQUIREMENTS:
- OUTPUT ONLY THE RAW JSON. No preamble, no markdown fences.
- Exactly 5-6 unique pages. Include a dedicated "Login" and "Register" page.
- Pages must be packed with realistic data (12-22 widgets per page).
- Use ALL widget types: Carousel, GridView, ListTile, Chart, etc.
- Every page must expand to fill the screen organically (use Expanded/Spacer).
- Use the exact DSL property format from the schema.`;

    let result: string;
    let modelName: string;

    if (localMode) {
      modelName = typeof model === "string" && model.trim() ? model.trim() : DEFAULT_OLLAMA_MODEL;
      let response: Response;
      try {
        response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelName,
            stream: false,
            think: false,
            format: designSpecSchema(localPageCount),
            messages: [
              { role: "system", content: localSystemPrompt(localPageCount) },
              {
                role: "user",
                content: `${prompt}${imageBase64 ? "\n\nUse the attached image as the primary layout and visual reference." : ""}\n\nReturn a compact, usable MVP blueprint with exactly ${localPageCount} ${localPageCount === 1 ? "screen" : "pages"} and 5 widgets per page.`,
                ...(imageBase64 ? { images: [imageBase64] } : {}),
              },
            ],
            options: { temperature: 0.25, num_ctx: 4096, num_predict: localPageCount === 1 ? 700 : 1600 },
            keep_alive: "10m",
          }),
          signal: AbortSignal.timeout(300000),
        });
      } catch (error) {
        return NextResponse.json({ error: ollamaUnavailableMessage(error) }, { status: 503 });
      }

      const data = await response.json();
      if (!response.ok) {
        const detail = data?.error || `Ollama returned HTTP ${response.status}.`;
        const missingModel = /model .* not found|pull model/i.test(String(detail));
        return NextResponse.json(
          { error: missingModel ? `Model "${modelName}" is not installed. Pull it in Ollama, or choose an installed model in Settings.` : detail },
          { status: 502 },
        );
      }
      result = data?.message?.content || "";
    } else if (isGemini) {
      modelName = isGemini
        ? (isGeminiModel ? (model || "gemini-2.0-flash") : "gemini-2.0-flash")
        : (!model || isGeminiModel ? "gpt-4o" : model);
      const cleanModelName = modelName.replace(/^models\//, "");
      
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
              { role: "user", parts: [{ text: enhancedUserPrompt }] }
            ],
            generationConfig: {
              temperature: 0.75,
              maxOutputTokens: 32000,
              responseMimeType: "application/json"
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
      modelName = !model || isGeminiModel ? "gpt-4o" : model;
      // OpenAI-compatible
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
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: enhancedUserPrompt },
          ],
          temperature: 0.75,
          response_format: { type: "json_object" },
          ...(usesMaxCompletionTokens
            ? { max_completion_tokens: 32000 }
            : { max_tokens: 32000 }),
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

    // Robust JSON extraction: find the first '{' and last '}'
    const startIdx = result.indexOf("{");
    const endIdx = result.lastIndexOf("}");
    
    if (startIdx === -1 || endIdx === -1) {
      throw new SyntaxError("AI output did not contain a valid JSON object.");
    }

    const cleaned = result.substring(startIdx, endIdx + 1);

    const spec = JSON.parse(cleaned);

    if (!spec.appName || !Array.isArray(spec.pages) || spec.pages.length === 0) {
      return NextResponse.json(
        { error: "AI returned an incomplete design. Try a more detailed prompt." },
        { status: 422 }
      );
    }

    spec.generatedAt = new Date().toISOString();
    spec.model = modelName;
    spec.provider = localMode ? "ollama" : isGemini ? "gemini" : "openai";

    return NextResponse.json({ success: true, spec });
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

function designSpecSchema(pageCount: number) {
  return {
  type: "object",
  required: ["appName", "tagline", "palette", "fonts", "pages"],
  properties: {
    appName: { type: "string" },
    tagline: { type: "string" },
    palette: { type: "object", maxProperties: 7, additionalProperties: { type: "string" } },
    fonts: { type: "object", required: ["heading", "body"], properties: { heading: { type: "string" }, body: { type: "string" } } },
    pages: {
      type: "array",
      minItems: pageCount,
      maxItems: pageCount,
      items: {
        type: "object",
        required: ["key", "name", "widgets"],
        properties: {
          key: { type: "string" },
          name: { type: "string" },
          purpose: { type: "string" },
          pageType: { type: "string" },
          widgets: {
            type: "array",
            minItems: 5,
            maxItems: 5,
            items: {
              type: "object",
              maxProperties: 4,
              required: ["key", "type", "properties"],
              properties: {
                key: { type: "string" },
                parentKey: { anyOf: [{ type: "string" }, { type: "null" }] },
                type: { type: "string" },
                label: { type: "string" },
                semanticRole: { type: "string" },
                interactive: { type: "boolean" },
                properties: { type: "object", maxProperties: 2, additionalProperties: true },
              },
            },
          },
        },
      },
    },
  },
  };
}
