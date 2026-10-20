import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the Wiraflow Intent Router. Your job is to classify the user's intent into one of four actions based on their message.

ACTIONS:
1. "generate_design": The user wants to create a new app from scratch, generate a completely new design, or start a new project.
2. "generate_schema": The user wants to generate a database schema, compile postgres tables, or deploy a database.
3. "edit_ui": The user wants to change the UI, modify colors, tweak widgets, add a button, or improve the current design.
4. "chat": The user is just asking a question, saying hello, or discussing something without requesting a specific platform action.

Return ONLY a valid JSON object with the following structure:
{
  "intent": "generate_design" | "generate_schema" | "edit_ui" | "chat",
  "cleanPrompt": "The user's prompt, cleaned up if necessary"
}

IMPORTANT: If the user explicitly asks to generate a design/app but the context says they ALREADY HAVE a design spec, classify it as "edit_ui" UNLESS they explicitly say "start over" or "new app".`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey, model, hasDesignSpec } = await req.json();

    if (!apiKey || !prompt?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const isGeminiKey = apiKey.startsWith("AIza");
    const isOpenAIKey = apiKey.startsWith("sk-");
    const isGemini = isGeminiKey || (!isOpenAIKey && (!model || model.includes("gemini")));
    const modelName = isGemini ? "gemini-2.0-flash" : "gpt-4o-mini";

    const contextMsg = `USER PROMPT: "${prompt}"\nCONTEXT: The current project ${hasDesignSpec ? "HAS" : "DOES NOT HAVE"} a design spec.`;

    let result = "";
    if (isGemini) {
      const cleanModelName = String(modelName).replace(/^models\//, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ role: "user", parts: [{ text: contextMsg }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "Gemini error");
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: contextMsg },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || "OpenAI error");
      result = data.choices?.[0]?.message?.content || "";
    }

    const cleaned = (result || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({ 
        intent: parsed.intent || "chat", 
        cleanPrompt: parsed.cleanPrompt || prompt 
      });
    } catch {
      return NextResponse.json({ intent: "chat", cleanPrompt: prompt });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
