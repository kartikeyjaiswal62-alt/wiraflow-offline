/**
 * Designer Markdown Parser
 *
 * Parses the FlutterFlow Designer export markdown format into a structured
 * ParsedDesignerExport object. This handles the markdown envelope:
 * - Header metadata (generated at, document ID, page count)
 * - Original prompt
 * - Theme JSON
 * - Per-page sections with DslDocument JSON
 */

import type {
  DesignerPage,
  DesignerTheme,
  DslNode,
  ParsedDesignerExport,
} from "./dsl-types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract content from a fenced code block (```json ... ``` or ```text ... ```).
 * Returns the content between the fences, or null if not found.
 */
function extractCodeBlock(
  markdown: string,
  startAfter: string,
  language = "json"
): string | null {
  const anchorIdx = markdown.indexOf(startAfter);
  if (anchorIdx === -1) return null;

  const searchFrom = anchorIdx + startAfter.length;
  const fenceStart = markdown.indexOf("```" + language, searchFrom);
  if (fenceStart === -1) return null;

  const contentStart = markdown.indexOf("\n", fenceStart) + 1;
  const fenceEnd = markdown.indexOf("\n```", contentStart);
  if (fenceEnd === -1) return null;

  return markdown.slice(contentStart, fenceEnd).trim();
}

/**
 * Extract a metadata value from lines like "- Generated at: `value`"
 */
function extractMetaValue(
  markdown: string,
  label: string
): string | undefined {
  const regex = new RegExp(`^- ${label}:\\s*\`?([^\`\\n]+)\`?`, "m");
  const match = markdown.match(regex);
  return match?.[1]?.trim();
}

// ---------------------------------------------------------------------------
// Page Parser
// ---------------------------------------------------------------------------

function parsePages(markdown: string): DesignerPage[] {
  // Split on page headings: ### 1. PageName, ### 2. PageName, etc.
  const pageSections = markdown.split(/^### \d+\.\s+/m).slice(1);
  const pages: DesignerPage[] = [];

  for (let i = 0; i < pageSections.length; i++) {
    const section = pageSections[i];

    // Extract page name (first line of the section)
    const firstLineEnd = section.indexOf("\n");
    const pageName = section.slice(0, firstLineEnd).trim();

    // Extract frame ID
    const frameIdMatch = section.match(
      /Frame ID:\s*`([0-9a-f-]+)`/
    );
    const frameId = frameIdMatch?.[1] ?? `unknown-frame-${i}`;

    // Extract page prompt
    const pagePromptMatch = section.match(
      /Original page prompt:\s*"([^"]+)"/
    );
    const pagePrompt = pagePromptMatch?.[1] ?? "";

    // Extract follow-up prompts
    const followUpPrompts: string[] = [];
    const followUpMatch = section.match(
      /Follow-up prompts:\s*([\s\S]*?)(?=\n#### |\n### |\n## |$)/
    );
    if (followUpMatch?.[1] && !followUpMatch[1].includes("_None_")) {
      const prompts = followUpMatch[1].match(/"([^"]+)"/g);
      if (prompts) {
        followUpPrompts.push(
          ...prompts.map((p) => p.replace(/"/g, ""))
        );
      }
    }

    // Extract DslDocument JSON
    const dslJson = extractCodeBlock(section, "DslDocument (JSON)");
    if (!dslJson) {
      throw new Error(
        `Page "${pageName}" (index ${i}) has no DslDocument JSON block`
      );
    }

    let dslRoot: DslNode;
    try {
      const parsed = JSON.parse(dslJson);
      dslRoot = parsed.root ?? parsed;
    } catch (err) {
      throw new Error(
        `Page "${pageName}" (index ${i}) has invalid DslDocument JSON: ${(err as Error).message}`
      );
    }

    pages.push({
      pageNumber: i + 1,
      pageName,
      frameId,
      pagePrompt,
      followUpPrompts,
      dslRoot,
    });
  }

  return pages;
}

// ---------------------------------------------------------------------------
// Main Parser
// ---------------------------------------------------------------------------

/**
 * Parse a FlutterFlow Designer export markdown file into a structured object.
 *
 * @param markdown - The raw markdown string from the Designer export file.
 * @returns A ParsedDesignerExport with prompt, theme, and all pages.
 * @throws If required sections are missing or JSON is malformed.
 */
export function parseDesignerExport(
  markdown: string
): ParsedDesignerExport {
  // Header metadata
  const generatedAt =
    extractMetaValue(markdown, "Generated at") ?? new Date().toISOString();
  const documentId =
    extractMetaValue(markdown, "Document ID") ?? "unknown";
  const pageCountStr = extractMetaValue(markdown, "Page count");
  const declaredPageCount = pageCountStr ? parseInt(pageCountStr, 10) : 0;

  // Original prompt
  const originalPrompt =
    extractCodeBlock(markdown, "## Original Prompt", "text") ?? "";

  // Theme JSON
  const themeJson = extractCodeBlock(markdown, "## Theme (JSON)");
  if (!themeJson) {
    throw new Error("Designer export is missing the Theme (JSON) section");
  }
  let theme: DesignerTheme;
  try {
    theme = JSON.parse(themeJson);
  } catch (err) {
    throw new Error(
      `Theme JSON is malformed: ${(err as Error).message}`
    );
  }

  // Pages
  const pages = parsePages(markdown);

  return {
    generatedAt,
    documentId,
    declaredPageCount,
    originalPrompt,
    theme,
    pages,
  };
}
