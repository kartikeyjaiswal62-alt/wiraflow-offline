import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate-text
 * Body: { prompt: string, apiKey: string, model: string, temperature?: number }
 * Returns: { text: string }
 */

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, temperature } = await req.json();

    if (!apiKey || !prompt?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isGeminiKey = apiKey.startsWith("AIza");
    const isOpenAIKey = apiKey.startsWith("sk-");
    const isGemini = isGeminiKey || (!isOpenAIKey && (!model || model.includes("gemini")));
    
    const modelName = isGemini ? (model || "gemini-2.0-flash") : (model || "gpt-4o-mini");

    let text = "";

    if (isGemini) {
      const cleanModelName = String(modelName).replace(/^models\//, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: temperature || 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Gemini error");
      text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
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
