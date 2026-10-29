import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_OLLAMA_MODEL, getOllamaBaseUrl, ollamaUnavailableMessage } from "../../../lib/ollama-server";
import { callGeminiWithFallback, GEMINI_MODEL, getGeminiApiKey } from "../../../lib/gemini";

export const runtime = "nodejs";

/**
 * POST /api/agent-edit
 * Body:
 *  {
 *    prompt: string,
 *    apiKey: string,
 *    model: string,
 *    designSpec: any,
 *    scope?: { type: "app" | "page" | "widget", pageKey?: string, targetWidgetKey?: string },
 *    guidelines?: string
 *  }
 *
 * Returns:
 *  { success: true, spec: any, appliedKeys: string[] }
 */

const AGENT_SYSTEM_PROMPT =
  "You are Wiraflow Agent Editor. Return ONLY valid JSON. Prefer minimal, high-impact changes. Do not wrap output in markdown.";

function stripFences(raw: string) {
  return (raw || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findPageByKey(spec: any, pageKey: string) {
  const pages = spec?.pages;
  if (!Array.isArray(pages)) return null;
  return pages.find((p: any) => String(p?.key) === String(pageKey)) || null;
}

function findWidgetByKey(spec: any, widgetKey: string) {
  const pages = spec?.pages;
  if (!Array.isArray(pages)) return null;
  for (const page of pages) {
    const widgets = page?.widgets;
    if (!Array.isArray(widgets)) continue;
    const found = widgets.find((w: any) => String(w?.key) === String(widgetKey));
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
    const idx = widgets.findIndex((w: any) => String(w?.key) === String(widgetKey));
    if (idx !== -1) {
      widgets[idx] = replacement;
      return true;
    }
  }
  return false;
}

function mergeProperties(base: any, patch: any) {
  const out: any = { ...(base && typeof base === "object" ? base : {}) };
  if (!patch || typeof patch !== "object") return out;
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    const baseVal = out[k];
    if (
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal) &&
      v &&
      typeof v === "object" &&
      !Array.isArray(v)
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
  merged.parentKey = patchWidget.parentKey ?? baseWidget.parentKey;
  merged.type = patchWidget.type ?? baseWidget.type;
  merged.label = patchWidget.label ?? baseWidget.label;
  merged.semanticRole = patchWidget.semanticRole ?? baseWidget.semanticRole;
  merged.interactive =
    typeof patchWidget.interactive === "boolean" ? patchWidget.interactive : baseWidget.interactive;
  merged.properties = mergeProperties(baseWidget.properties, patchWidget.properties);
  return merged;
}

function buildAgentPrompt(args: {
  prompt: string;
  designSpec: any;
  scope?: { type: "app" | "page" | "widget"; pageKey?: string; targetWidgetKey?: string };
  guidelines?: string;
  allowedKeys?: string[];
}) {
  const { prompt, designSpec, scope, guidelines, allowedKeys } = args;
  const appName = designSpec?.appName || "App";
  const pages = Array.isArray(designSpec?.pages) ? designSpec.pages : [];
  const pageKey = scope?.type === "page" ? scope?.pageKey : undefined;
  const targetWidgetKey = scope?.type === "widget" ? scope?.targetWidgetKey : undefined;

  const page = pageKey ? findPageByKey(designSpec, pageKey) : null;
  const targetWidget = targetWidgetKey ? findWidgetByKey(designSpec, targetWidgetKey) : null;

  const pageWidgets = page && Array.isArray(page.widgets) ? page.widgets : null;
  const pageWidgetsJson =
    pageWidgets && pageWidgets.length ? JSON.stringify(pageWidgets) : "(no widgets)";
  const targetWidgetJson = targetWidget ? JSON.stringify(targetWidget) : "(none)";

  const scopeHeader =
    scope?.type === "page"
      ? `SCOPE: page\nPAGE KEY: ${pageKey || "(missing)"}`
      : scope?.type === "widget"
        ? `SCOPE: widget\nTARGET WIDGET KEY: ${targetWidgetKey || "(missing)"}`
        : "SCOPE: app";

  const pageIndex = pages.map((p: any) => ({ key: p?.key, name: p?.name, pageType: p?.pageType }));

  return `You are editing an existing Wiraflow design spec for "${appName}".

${scopeHeader}

${Array.isArray(allowedKeys) && allowedKeys.length ? `ALLOWED WIDGET KEYS (ONLY edit these):\n${JSON.stringify(allowedKeys)}\n` : ""}

USER REQUEST:
${prompt}

OPTIONAL PROJECT GUIDELINES (follow if present):
${guidelines?.trim() ? guidelines.trim() : "(none)"}

PAGES INDEX (do not change keys unless explicitly requested):
${JSON.stringify(pageIndex)}

${page ? `PAGE "${page.key}" WIDGETS JSON:\n${pageWidgetsJson}\n` : ""}
${targetWidgetKey ? `TARGET WIDGET JSON:\n${targetWidgetJson}\n` : ""}

OUTPUT FORMAT:
Return ONLY valid JSON with the shape:
{
  "widgets": [
    { "key": "existing-widget-key", "...": "only changed fields" }
  ]
}

RULES:
- Only reference existing widget keys in "widgets". Do NOT invent new keys.
- If ALLOWED WIDGET KEYS are provided, ONLY return patches for those keys.
- Include ONLY widgets that changed.
- Keep changes minimal but make the UI feel premium: spacing, hierarchy, typography, contrast.
- Do NOT add image URLs. Prefer icons and shapes.`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, provider = "cloud", designSpec, scope, guidelines, dryRun, allowedKeys } = await req.json();
    const allowedKeyList =
      Array.isArray(allowedKeys) && allowedKeys.length ? allowedKeys.slice(0, 60).map(String) : null;

    const localMode = provider === "ollama";
    const effectiveApiKey = apiKey || getGeminiApiKey();

    if (!localMode && !effectiveApiKey) return NextResponse.json({ error: "No API key provided." }, { status: 400 });
    if (!prompt?.trim()) return NextResponse.json({ error: "No prompt provided." }, { status: 400 });
    if (!designSpec) return NextResponse.json({ error: "No designSpec provided." }, { status: 400 });

    const isGeminiKey = !localMode && effectiveApiKey.startsWith("AIza");
    const isOpenAIKey = !localMode && effectiveApiKey.startsWith("sk-");
    const isGeminiModel = !model || model.startsWith("gemini") || model.startsWith("models/gemini");
    const isGemini = isGeminiKey || (!isOpenAIKey && isGeminiModel) || (!localMode && !isOpenAIKey);
    const modelName = localMode
      ? (typeof model === "string" && model.trim() ? model.trim() : DEFAULT_OLLAMA_MODEL)
      : isGemini
      ? ((model && !model.includes("2.0-flash") && !model.includes("1.5")) ? model : GEMINI_MODEL)
      : (!model || isGeminiModel ? "gpt-4o" : model);

    const agentPrompt = buildAgentPrompt({
      prompt,
      designSpec,
      scope,
      guidelines,
      allowedKeys: allowedKeyList ? allowedKeyList.slice(0, 40) : undefined,
    });

    let result = "";
    if (localMode) {
      let response: Response;
      try {
        response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelName,
            stream: false,
            format: EDIT_PATCH_SCHEMA,
            messages: [
              { role: "system", content: AGENT_SYSTEM_PROMPT },
              { role: "user", content: agentPrompt },
            ],
            options: { temperature: 0.2, num_predict: 3000 },
          }),
          signal: AbortSignal.timeout(180000),
        });
      } catch (error) {
        return NextResponse.json({ error: ollamaUnavailableMessage(error) }, { status: 503 });
      }
      const data = await response.json();
      if (!response.ok) {
        return NextResponse.json({ error: data?.error || `Ollama returned HTTP ${response.status}.` }, { status: 502 });
      }
      result = data?.message?.content || "";
    } else if (isGemini) {
      const res = await callGeminiWithFallback({
        contents: agentPrompt,
        config: {
          systemInstruction: AGENT_SYSTEM_PROMPT,
          temperature: 0.15,
          responseMimeType: "application/json",
        },
        model: modelName,
        customKey: apiKey,
      });
      result = res.text || "";
    } else {
      const usesMaxCompletionTokens = String(modelName).startsWith("gpt-5") || String(modelName).startsWith("o");
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveApiKey}` },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: AGENT_SYSTEM_PROMPT },
            { role: "user", content: agentPrompt },
          ],
          temperature: 0.15,
          ...(usesMaxCompletionTokens ? { max_completion_tokens: 2000 } : { max_tokens: 2000 }),
        }),
      });
      const oaiData = await oaiRes.json();
      if (!oaiRes.ok) {
        return NextResponse.json({ error: oaiData?.error?.message || "OpenAI error" }, { status: 502 });
      }
      result = oaiData.choices?.[0]?.message?.content || "";
    }

    const cleaned = stripFences(result);
    const parsed = safeJsonParse(cleaned);
    const widgets = parsed?.widgets;
    if (!Array.isArray(widgets) || widgets.length === 0) {
      return NextResponse.json(
        { error: "AI returned no widget updates. Try a more specific instruction." },
        { status: 422 }
      );
    }

    if (dryRun) {
      const appliedKeys = widgets
        .map((w: any) => (typeof w?.key === "string" ? w.key : null))
        .filter(Boolean);
      return NextResponse.json({ success: true, patch: { widgets }, appliedKeys });
    }

    const mergedSpec = JSON.parse(JSON.stringify(designSpec));
    const appliedKeys: string[] = [];
    let anyChange = false;

    for (const patchWidget of widgets) {
      const key = String(patchWidget?.key || "");
      if (!key) continue;
      if (allowedKeyList && !allowedKeyList.includes(key)) continue;
      const current = findWidgetByKey(mergedSpec, key);
      if (!current) continue;
      const mergedWidget = mergeWidget(current, patchWidget);
      const beforeJson = JSON.stringify(current);
      const replaced = replaceWidgetByKey(mergedSpec, key, mergedWidget);
      if (!replaced) continue;
      const afterJson = JSON.stringify(mergedWidget);
      if (beforeJson !== afterJson) {
        anyChange = true;
        appliedKeys.push(key);
      }
    }

    if (!anyChange) {
      return NextResponse.json(
        { error: "AI did not apply any changes. Try a more specific instruction." },
        { status: 422 }
      );
    }

    mergedSpec.generatedAt = new Date().toISOString();
    mergedSpec.model = modelName;

    return NextResponse.json({ success: true, spec: mergedSpec, appliedKeys });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON in request." }, { status: 400 });
    }
    return NextResponse.json({ error: err.message || "Agent edit failed." }, { status: 500 });
  }
}

const EDIT_PATCH_SCHEMA = {
  type: "object",
  required: ["widgets"],
  properties: {
    widgets: {
      type: "array",
      items: {
        type: "object",
        required: ["key"],
        properties: { key: { type: "string" } },
        additionalProperties: true,
      },
    },
  },
};
