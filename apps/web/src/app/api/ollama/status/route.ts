import { NextResponse } from "next/server";
import { getOllamaBaseUrl, ollamaUnavailableMessage } from "../../../../lib/ollama-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const response = await fetch(`${getOllamaBaseUrl()}/api/tags`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) {
      return NextResponse.json({ connected: false, error: `Ollama returned HTTP ${response.status}.` }, { status: 502 });
    }

    const payload = await response.json();
    const models = Array.isArray(payload.models)
      ? payload.models.map((model: { name?: unknown }) => model?.name).filter((name: unknown): name is string => typeof name === "string")
      : [];
    return NextResponse.json({ connected: true, models });
  } catch (error) {
    return NextResponse.json({ connected: false, models: [], error: ollamaUnavailableMessage(error) }, { status: 503 });
  }
}
