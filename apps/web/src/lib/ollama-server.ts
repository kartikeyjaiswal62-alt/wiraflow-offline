/** Server-side access to the local Ollama daemon. */
export const DEFAULT_OLLAMA_MODEL = "gemma4:e2b-it-q4_K_M";

export function getOllamaBaseUrl(): string {
  const configured = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("OLLAMA_BASE_URL must be a valid local Ollama URL.");
  }

  const hostname = url.hostname.toLowerCase();
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(hostname) ||
    url.username ||
    url.password
  ) {
    throw new Error("Ollama must be reachable through localhost. Remote Ollama hosts are disabled for local mode.");
  }

  return url.toString().replace(/\/$/, "");
}

export function ollamaUnavailableMessage(error: unknown): string {
  if (error instanceof Error && error.name === "TimeoutError") {
    return "Ollama did not respond in time. Make sure it is running and try again.";
  }
  return "Could not reach Ollama at localhost:11434. Start Ollama, pull a model, then test the connection again.";
}
