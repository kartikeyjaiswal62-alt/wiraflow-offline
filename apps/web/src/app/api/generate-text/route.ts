import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback, getGeminiApiKey } from "@/lib/gemini";

export const runtime = "nodejs";

/**
 * POST /api/generate-text
 * Body: { prompt: string, apiKey?: string, model?: string, temperature?: number }
 * Returns: { text: string }
 */

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, temperature } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const effectiveApiKey = apiKey || getGeminiApiKey();

    const isGeminiKey = effectiveApiKey.startsWith("AIza");
    const isOpenAIKey = effectiveApiKey.startsWith("sk-");
    const isGemini = isGeminiKey || (!isOpenAIKey && (!model || model.includes("gemini"))) || (!isOpenAIKey && !model);

    let text = "";

    if (isGemini) {
      if (!effectiveApiKey) {
        return NextResponse.json({ error: "No Gemini API key available" }, { status: 401 });
      }

      const res = await callGeminiWithFallback({
        contents: prompt,
        config: {
          temperature: temperature || 0.7,
        },
        model,
        customKey: effectiveApiKey,
      });

      text = res.text;
    } else {
      const modelName = model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${effectiveApiKey}` },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: prompt }],
          temperature: temperature || 0.7,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "OpenAI error");
      text = data.choices?.[0]?.message?.content || "";
    }

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
