/**
 * @wiraflow/artifact-parser
 *
 * Parses FlutterFlow Designer export artifacts into Wiraflow canonical schemas.
 */

// DSL Types
export type {
  DslNode,
  DslPropertyValue,
  DesignerPage,
  DesignerTheme,
  ParsedDesignerExport,
  FlatWidget,
} from "./dsl-types.js";

// Designer Markdown Parser
export { parseDesignerExport } from "./designer-markdown-parser.js";

// DSL Tree Parser
export {
  flattenDslTree,
  findWidgets,
  extractAllTextContent,
  extractCustomComponentTypes,
  extractInteractiveWidgets,
  extractStringProp,
  extractBoolProp,
} from "./dsl-tree-parser.js";

// Semantic Graph Builder
export { buildUISemanticGraph } from "./semantic-graph-builder.js";

// Intent Compiler
export { compileAppIntentSpec } from "./intent-compiler.js";
