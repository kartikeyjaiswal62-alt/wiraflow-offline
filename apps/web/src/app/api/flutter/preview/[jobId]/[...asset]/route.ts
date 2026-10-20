import { readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

export async function GET(_request: Request, context: { params: Promise<{ jobId: string; asset: string[] }> }) {
  const { jobId, asset } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId) || !Array.isArray(asset) || asset.length < 1 || asset.some((part) => !part || part === "." || part === ".." || part.includes("\\"))) {
    return new Response("Not found", { status: 404 });
  }
  const root = path.join(os.tmpdir(), "wiraflow-previews", jobId);
  const filePath = path.resolve(root, ...asset);
  if (!filePath.startsWith(`${root}${path.sep}`)) return new Response("Not found", { status: 404 });
  try {
    const body = await readFile(filePath);
    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    return new Response(new Uint8Array(body), { headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
