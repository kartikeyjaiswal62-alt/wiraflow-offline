import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_OLLAMA_MODEL, getOllamaBaseUrl, ollamaUnavailableMessage } from "../../../lib/ollama-server";

export const runtime = "nodejs";

// We define the expected JSON schema structure in the system prompt.
const EXPECTED_SCHEMA_FORMAT = `
{
  "tables": [
    {
      "key": "users",
      "name": "users",
      "columns": [
        {
          "key": "id",
          "name": "id",
          "type": "uuid",
          "nullable": false,
          "isPrimaryKey": true,
          "isUnique": true,
          "defaultExpression": "gen_random_uuid()",
          "comment": "Primary ID"
        }
      ],
      "enableRls": true,
      "comment": "Users table"
    }
  ],
  "migrationSteps": [
    {
      "key": "create-users",
      "order": 10,
      "description": "Create users table",
      "upSql": "CREATE TABLE ...",
      "downSql": "DROP TABLE ..."
    }
  ],
  "enums": [],
  "rlsPolicies": []
}
`;

export async function POST(req: NextRequest) {
  try {
    const { spec, prompt, model: modelStr, apiKey, provider = "cloud" } = await req.json();

    if (!spec || !prompt) {
      return NextResponse.json({ error: "Missing spec or prompt" }, { status: 400 });
    }

    const localMode = provider === "ollama";
    if (!localMode && !apiKey) {
      return NextResponse.json({ error: "Missing Google AI/Vertex API key" }, { status: 401 });
    }

    const isGeminiKey = !localMode && apiKey.startsWith("AIza");
    const isOpenAIKey = !localMode && apiKey.startsWith("sk-");
    const isGeminiModel = !modelStr || modelStr.startsWith("gemini") || modelStr.startsWith("models/gemini");
    const isGemini = isGeminiKey || (!isOpenAIKey && isGeminiModel);
    
    const modelName = localMode
      ? (typeof modelStr === "string" && modelStr.trim() ? modelStr.trim() : DEFAULT_OLLAMA_MODEL)
      : isGemini
      ? (isGeminiModel ? (modelStr || "gemini-2.0-flash") : "gemini-2.0-flash")
      : (!modelStr || isGeminiModel ? "gpt-4o" : modelStr);

    const systemPrompt = `You are a Principal Database Architect for Wiraflow.
You will be provided with a frontend Design Specification (JSON constraints for UI pages and widgets) and a high-level project description ('prompt').
Your goal is to output a fully-fledged, production-ready PostgreSQL / Supabase Schema Plan that cleanly supports the frontend application.

Instructions:
1. Deduce necessary tables, foreign key relationships, complex joins, and datatypes based on the frontend UI requirements.
2. ALWAYS generate a \`users\` table (id=uuid pk, email=text, created_at=timestamptz, updated_at=timestamptz).
3. Use sensible Postgres data types (boolean, integer, numeric, jsonb, text). If a widget is named "price", use numeric. If it's "is_active", use boolean.
4. Correctly output migration steps: order matters.
   - Order 10: Create ENUM types.
   - Order 20: Create Users table.
   - Order 30+: Create all other tables. IMPORTANT: A table with a FOREIGN KEY must have a higher 'order' than the table it references.
   - Order 100+: Create RLS Policies.
5. Dependency Analysis: Thoroughly check which tables depend on others. If 'orders' references 'users', 'users' MUST be Order 20 and 'orders' MUST be Order 21+.

RETURN RAW JSON ONLY matching this structure:
${EXPECTED_SCHEMA_FORMAT}`;

    const effectiveSystemPrompt = localMode
      ? `You are a careful SQLite database architect. Design a local SQLite schema for this app. Use SQLite-compatible column types and SQL only. Do not create Postgres enums, Supabase RLS, or Supabase policies. Do not include DROP statements in upSql. Return a migration plan matching this JSON schema:\n${EXPECTED_SCHEMA_FORMAT}`
      : systemPrompt;

    let result: string;

    if (localMode) {
      let response: Response;
      try {
        response = await fetch(`${getOllamaBaseUrl()}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: modelName,
            stream: false,
            format: SCHEMA_PLAN_SCHEMA,
            messages: [
              { role: "system", content: effectiveSystemPrompt },
              { role: "user", content: `App goal: ${prompt}\n\nDesign blueprint:\n${JSON.stringify(spec)}\n\nReturn a SQLite schema plan. Use dialect "sqlite", set enableRls false, and leave enums and rlsPolicies empty.` },
            ],
            options: { temperature: 0.2, num_predict: 8000 },
          }),
          signal: AbortSignal.timeout(240000),
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
      const cleanModelName = modelName.replace(/^models\//, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: effectiveSystemPrompt }] },
            contents: [
              { role: "user", parts: [{ text: `Project Goal: ${prompt}\n\nDesignSpec UI:\n${JSON.stringify(spec, null, 2)}\n\nGenerate the complete relational Postgres Schema Plan as JSON.` }] }
            ],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: "application/json"
            }
          }),
        }
      );
      
      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json({ error: data?.error?.message || "Gemini REST API error" }, { status: 502 });
      }
      result = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const oaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: effectiveSystemPrompt },
            { role: "user", content: `Project Goal: ${prompt}\n\nDesignSpec UI:\n${JSON.stringify(spec, null, 2)}\n\nGenerate the complete relational Postgres Schema Plan as JSON.` },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }),
      });
      const oaiData = await oaiRes.json();
      if (!oaiRes.ok) {
        return NextResponse.json({ error: oaiData?.error?.message || "OpenAI error" }, { status: 502 });
      }
      result = oaiData.choices?.[0]?.message?.content || "";
    }

    const cleaned = result.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
    const output = JSON.parse(cleaned);
    if (!Array.isArray(output.tables) || !Array.isArray(output.migrationSteps)) {
      return NextResponse.json({ error: "AI returned an incomplete schema plan." }, { status: 422 });
    }
    if (localMode) output.dialect = "sqlite";

    return NextResponse.json({ schemaPlan: output });
  } catch (err: any) {
    console.error("[generate-schema] error:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned invalid JSON." }, { status: 422 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const SCHEMA_PLAN_SCHEMA = {
  type: "object",
  required: ["tables", "migrationSteps", "enums", "rlsPolicies"],
  properties: {
    tables: { type: "array", items: { type: "object", required: ["key", "name", "columns", "enableRls"], properties: { key: { type: "string" }, name: { type: "string" }, columns: { type: "array", items: { type: "object", required: ["key", "name", "type", "nullable", "isPrimaryKey", "isUnique"], properties: { key: { type: "string" }, name: { type: "string" }, type: { type: "string" }, nullable: { type: "boolean" }, isPrimaryKey: { type: "boolean" }, isUnique: { type: "boolean" }, defaultExpression: { type: "string" }, comment: { type: "string" } } } }, enableRls: { type: "boolean" }, comment: { type: "string" } } } },
    migrationSteps: { type: "array", items: { type: "object", required: ["key", "order", "description", "upSql", "downSql"], properties: { key: { type: "string" }, order: { type: "integer" }, description: { type: "string" }, upSql: { type: "string" }, downSql: { type: "string" } } } },
    enums: { type: "array", items: { type: "object", additionalProperties: true } },
    rlsPolicies: { type: "array", items: { type: "object", additionalProperties: true } },
  },
};
