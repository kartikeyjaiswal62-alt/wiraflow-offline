/**
 * Artifact Parser Tests
 *
 * Tests the full parsing pipeline using the real FlutterFlow Designer export
 * from docs/designer-export-sample.md.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, beforeAll } from "vitest";

import {
  AppIntentSpecSchema,
  UISemanticGraphSchema,
} from "@wiraflow/contracts";

import { parseDesignerExport } from "../src/designer-markdown-parser.js";
import {
  flattenDslTree,
  extractAllTextContent,
  extractCustomComponentTypes,
  extractInteractiveWidgets,
} from "../src/dsl-tree-parser.js";
import { buildUISemanticGraph } from "../src/semantic-graph-builder.js";
import { compileAppIntentSpec } from "../src/intent-compiler.js";

import type { ParsedDesignerExport } from "../src/dsl-types.js";

// ---------------------------------------------------------------------------
// Load real fixture
// ---------------------------------------------------------------------------

const FIXTURE_PATH = resolve(
  import.meta.dirname ?? ".",
  "../../..",
  "docs/designer-export-sample.md"
);

let realExportMarkdown: string;
let parsed: ParsedDesignerExport;

beforeAll(() => {
  realExportMarkdown = readFileSync(FIXTURE_PATH, "utf8");
  parsed = parseDesignerExport(realExportMarkdown);
});

// ---------------------------------------------------------------------------
// Designer Markdown Parser
// ---------------------------------------------------------------------------

describe("parseDesignerExport", () => {
  it("extracts the document ID", () => {
    expect(parsed.documentId).toBe(
      "7ddf2dc1-6afd-46b8-a4e9-96f6a5559f61"
    );
  });

  it("extracts the declared page count", () => {
    expect(parsed.declaredPageCount).toBe(1);
  });

  it("extracts the original prompt", () => {
    expect(parsed.originalPrompt).toContain("meeting analysis app");
  });

  it("extracts theme with light and dark colors", () => {
    expect(parsed.theme.colors.light.primary).toBe("#1A1A1A");
    expect(parsed.theme.colors.dark.primary).toBe("#FFFFFF");
  });

  it("extracts theme fonts", () => {
    expect(parsed.theme.fonts.primary).toBe("google:Inter");
    expect(parsed.theme.fonts.secondary).toBe("google:JetBrains Mono");
  });

  it("extracts 1 page", () => {
    expect(parsed.pages).toHaveLength(1);
  });

  it("extracts the page name", () => {
    expect(parsed.pages[0].pageName).toBe("Live Transcription");
  });

  it("extracts the page frame ID", () => {
    expect(parsed.pages[0].frameId).toBe(
      "2c1e0c83-86a5-4941-8d52-59b9b1d3a2f3"
    );
  });

  it("extracts the page prompt", () => {
    expect(parsed.pages[0].pagePrompt).toContain(
      "recording screen"
    );
  });

  it("has a valid dslRoot", () => {
    expect(parsed.pages[0].dslRoot.type).toBe("scaffold");
  });
});

// ---------------------------------------------------------------------------
// DSL Tree Parser
// ---------------------------------------------------------------------------

describe("flattenDslTree", () => {
  it("flattens the tree into a flat array", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    expect(flat.length).toBeGreaterThan(20);
  });

  it("root scaffold is present in the flat array", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const scaffold = flat.find((w) => w.type === "scaffold");
    expect(scaffold).toBeDefined();
    expect(scaffold!.parentId).toBeNull();
  });

  it("extracts text content from text nodes", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const texts = extractAllTextContent(flat);
    expect(texts).toContain("LIVE RECORDING");
    expect(texts).toContain("Q3 Product Strategy Sync");
  });

  it("detects custom component types", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const customTypes = extractCustomComponentTypes(flat);
    expect(customTypes).toContain("@status_chip");
    expect(customTypes).toContain("@transcription_bubble");
    expect(customTypes).toContain("@std.textfield");
    expect(customTypes).toContain("@std.button");
  });

  it("detects interactive widgets", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const interactive = extractInteractiveWidgets(flat);
    // Should find: iconbuttons, @std.button, @std.textfield
    expect(interactive.length).toBeGreaterThanOrEqual(4);
  });

  it("extracts button labels", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const buttons = flat.filter((w) => w.type === "@std.button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0].buttonLabel).toBe("Analyze Meeting Insights");
  });

  it("extracts textfield hints", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const fields = flat.filter((w) => w.type === "@std.textfield");
    expect(fields).toHaveLength(1);
    expect(fields[0].hintText).toBe(
      "Enter title to categorize analysis"
    );
  });

  it("extracts transcription bubble speakers", () => {
    const flat = flattenDslTree(parsed.pages[0].dslRoot);
    const bubbles = flat.filter(
      (w) => w.type === "@transcription_bubble"
    );
    expect(bubbles.length).toBeGreaterThanOrEqual(3);
    expect(bubbles[0].componentProps["speaker"]).toBe("Sarah Chen");
  });
});

// ---------------------------------------------------------------------------
// Semantic Graph Builder
// ---------------------------------------------------------------------------

describe("buildUISemanticGraph", () => {
  it("produces a valid UISemanticGraph", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    const result = UISemanticGraphSchema.safeParse(graph);
    if (!result.success) {
      console.error(
        "Validation errors:",
        JSON.stringify(result.error.issues, null, 2)
      );
    }
    expect(result.success).toBe(true);
  });

  it("detects 1 page", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    expect(graph.pages).toHaveLength(1);
  });

  it("classifies the page type", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    // "Live Transcription" has upload icon + recording → upload_process wins
    expect(["upload_process", "detail"]).toContain(graph.pages[0].pageType);
  });

  it("creates widget nodes for all widgets", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    expect(graph.widgets.length).toBeGreaterThan(20);
  });

  it("classifies @std.button as primary_cta_button", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    const ctaButtons = graph.widgets.filter(
      (w) => w.semanticRole === "primary_cta_button"
    );
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("classifies @status_chip as badge_display", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    const badges = graph.widgets.filter(
      (w) => w.semanticRole === "badge_display"
    );
    expect(badges.length).toBeGreaterThanOrEqual(3);
  });

  it("classifies @transcription_bubble as list_item", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    const listItems = graph.widgets.filter(
      (w) => w.semanticRole === "list_item"
    );
    expect(listItems.length).toBeGreaterThanOrEqual(3);
  });

  it("detects the invoke_function action", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    const actionWidgets = graph.widgets.filter(
      (w) => w.action?.operation === "invoke_function"
    );
    expect(actionWidgets.length).toBeGreaterThanOrEqual(1);
    expect(actionWidgets[0].action?.description).toContain("Analyze");
  });

  it("all widgets have source links", () => {
    const graph = buildUISemanticGraph(parsed, "test-project");
    for (const widget of graph.widgets) {
      expect(widget.sourceLinks.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// Intent Compiler
// ---------------------------------------------------------------------------

describe("compileAppIntentSpec", () => {
  it("produces a valid AppIntentSpec", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    const result = AppIntentSpecSchema.safeParse(spec);
    if (!result.success) {
      console.error(
        "Validation errors:",
        JSON.stringify(result.error.issues, null, 2)
      );
    }
    expect(result.success).toBe(true);
  });

  it("detects meeting-related entities", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    const entityKeys = spec.entities.map((e) => e.key);
    expect(entityKeys).toContain("meetings");
  });

  it("detects audio/transcript entities", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    const entityKeys = spec.entities.map((e) => e.key);
    // The prompt contains "transcription" and "audio" — we expect related entities
    const hasRelevantEntity =
      entityKeys.includes("transcripts") ||
      entityKeys.includes("audios") ||
      entityKeys.includes("action_items");
    expect(hasRelevantEntity).toBe(true);
  });

  it("detects the audio analysis workflow", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.workflows.length).toBeGreaterThanOrEqual(1);
    expect(spec.workflows[0].key).toBe("audio_analysis");
  });

  it("detects the audio processing async job", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.asyncJobs.length).toBeGreaterThanOrEqual(1);
  });

  it("detects audio file media needs", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.fileMediaNeeds.length).toBeGreaterThanOrEqual(1);
    expect(spec.fileMediaNeeds[0].key).toBe("audio_files");
  });

  it("infers the meeting-intelligence domain", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.domain).toBe("meeting-intelligence");
  });

  it("extracts at least 1 page in the catalog", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.pageCatalog.length).toBeGreaterThanOrEqual(1);
  });

  it("includes security constraint", () => {
    const spec = compileAppIntentSpec(parsed, "test-project");
    expect(spec.constraints.length).toBeGreaterThanOrEqual(1);
    expect(spec.constraints[0].type).toBe("security");
  });
});
