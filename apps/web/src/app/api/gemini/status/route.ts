import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithFallback, getGeminiApiKey } from "@/lib/gemini";

export const runtime = "nodejs";

export async function GET() {
  try {
    const key = getGeminiApiKey();
    if (!key) {
      return NextResponse.json({
        connected: false,
        error: "GEMINI_API_KEY environment variable is not configured.",
      }, { status: 400 });
    }

    const { text, model } = await callGeminiWithFallback({
      contents: "Respond with the single word: OK",
    });

    return NextResponse.json({
      connected: true,
      model,
      status: "online",
      reply: text.trim(),
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      error: err?.message || "Failed to reach Google Gemini API",
    }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customKey = body?.apiKey;
    const key = getGeminiApiKey(customKey);

    if (!key) {
      return NextResponse.json({
        connected: false,
        error: "No Gemini API key available. Provide a key or set GEMINI_API_KEY.",
      }, { status: 400 });
    }

    const { text, model } = await callGeminiWithFallback({
      contents: "Respond with the single word: OK",
      customKey,
    });

    return NextResponse.json({
      connected: true,
      model,
      status: "online",
      reply: text.trim(),
    });
  } catch (err: any) {
    return NextResponse.json({
      connected: false,
      error: err?.message || "Failed to reach Google Gemini API",
    }, { status: 502 });
  }
}
