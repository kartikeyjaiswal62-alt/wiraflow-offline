import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";

export const GEMINI_MODEL = "gemini-3-flash-preview";
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-flash-latest",
];

export function getGeminiApiKey(customKey?: string): string {
  return customKey || process.env.GEMINI_API_KEY || "";
}

export function getGeminiClient(customKey?: string): GoogleGenAI {
  const apiKey = getGeminiApiKey(customKey);
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

export interface CallGeminiOptions {
  contents: GenerateContentParameters["contents"];
  config?: GenerateContentParameters["config"];
  model?: string;
  customKey?: string;
}

export async function callGeminiWithFallback(options: CallGeminiOptions): Promise<{ text: string; model: string }> {
  const apiKey = getGeminiApiKey(options.customKey);
  if (!apiKey) {
    throw new Error("No Gemini API key available. Provide a key or set GEMINI_API_KEY.");
  }

  const ai = getGeminiClient(options.customKey);
  const preferredModel = options.model && !options.model.includes("2.0-flash") && !options.model.includes("1.5")
    ? options.model
    : GEMINI_MODEL;

  // Build candidate list with preferred model first
  const candidates = [preferredModel, ...GEMINI_FALLBACK_MODELS.filter((m) => m !== preferredModel)];

  let lastError: any = null;

  for (const model of candidates) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });

      const text = response.text || "";
      if (text) {
        return { text, model };
      }
    } catch (err: any) {
      console.warn(`[Gemini] Model ${model} failed: ${err?.message || err}. Trying next fallback...`);
      lastError = err;
      // If client sent an invalid key (400 or 401 with bad key), do not cycle other models
      if (err?.status === 400 && String(err?.message || "").includes("API key not valid")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("All Gemini model candidates failed to respond.");
}
