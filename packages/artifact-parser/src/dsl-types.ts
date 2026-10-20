/**
 * DSL Tree Types
 *
 * TypeScript representation of the FlutterFlow Designer DslDocument JSON format.
 * Derived from analysis of real Designer export artifacts.
 *
 * The DSL is a recursive widget tree where each node has:
 * - type: widget kind (scaffold, column, row, text, icon, @custom_component, etc.)
 * - properties: typed property values
 * - children: child widgets
 * - editorId: unique UUID for the widget in the Designer editor
 */

// ---------------------------------------------------------------------------
// Property Value Types (Designer uses typed wrapper objects)
// ---------------------------------------------------------------------------

export interface DslStringVal {
  stringVal: { value: string };
}

export interface DslNumberVal {
  numberVal: { value: number };
}

export interface DslBoolVal {
  boolVal: { value: boolean };
}

export interface DslColorRef {
  color: { color: string };
}

export interface DslIconRef {
  icon: { name: string };
}

export interface DslTextStyleRef {
  textStyle: { styleName: string };
}

export interface DslAlignRef {
  align: { named: string };
}

export interface DslEdgeInsets {
  edgeInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    token?: string;
    topToken?: string;
    rightToken?: string;
    bottomToken?: string;
    leftToken?: string;
  };
}

export interface DslRadiusRef {
  radius: {
    topLeft: number;
    topRight: number;
    bottomLeft: number;
    bottomRight: number;
    token?: string;
  };
}

export interface DslPxSize {
  px: { value: number | string; isInfinity?: boolean };
}

export interface DslPercentSize {
  percent: { value: number };
}

export interface DslBorderRef {
  border?: { width: number; color: string };
  borderSided?: { side: string; width: number; color: string };
}

/**
 * A property value can be any of several typed wrappers.
 * The Designer serializes every value with a type tag.
 */
export type DslPropertyValue =
  | DslStringVal
  | DslNumberVal
  | DslBoolVal
  | DslColorRef
  | DslIconRef
  | DslTextStyleRef
  | DslAlignRef
  | DslEdgeInsets
  | DslRadiusRef
  | DslPxSize
  | DslPercentSize
  | DslBorderRef
  | Record<string, unknown>;

// ---------------------------------------------------------------------------
// DSL Node (the recursive widget tree)
// ---------------------------------------------------------------------------

export interface DslNode {
  type: string;
  properties?: Record<string, DslPropertyValue>;
  children?: DslNode[];
  editorId?: string;
}

// ---------------------------------------------------------------------------
// Parsed Designer Export (top-level structure)
// ---------------------------------------------------------------------------

export interface DesignerTheme {
  fonts: Record<string, string>;
  colors: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  text_styles: Record<
    string,
    { font: string; size: number; weight: number; height: number }
  >;
  spacing: Record<string, number>;
  radii: Record<string, number>;
  shadows: Record<string, unknown>;
  gradients: Record<string, unknown>;
}

export interface DesignerPage {
  /** 1-indexed page number from the export. */
  pageNumber: number;
  /** Page name from the markdown heading. */
  pageName: string;
  /** Unique frame ID from the Designer. */
  frameId: string;
  /** Original page-level prompt. */
  pagePrompt: string;
  /** Follow-up prompts, if any. */
  followUpPrompts: string[];
  /** The root DslNode of the widget tree. */
  dslRoot: DslNode;
}

export interface ParsedDesignerExport {
  /** When the export was generated. */
  generatedAt: string;
  /** Document ID from the Designer. */
  documentId: string;
  /** Total page count declared in the export. */
  declaredPageCount: number;
  /** The original user prompt. */
  originalPrompt: string;
  /** Full theme definition. */
  theme: DesignerTheme;
  /** All pages with their DSL documents. */
  pages: DesignerPage[];
}

// ---------------------------------------------------------------------------
// Flattened Widget (intermediate representation for analysis)
// ---------------------------------------------------------------------------

export interface FlatWidget {
  /** Unique ID (from editorId or generated). */
  id: string;
  /** Parent widget ID, null for root. */
  parentId: string | null;
  /** Depth in the tree (0 = root). */
  depth: number;
  /** Widget type from DSL (e.g., "text", "container", "@status_chip"). */
  type: string;
  /** Whether this is a custom component (type starts with "@"). */
  isCustomComponent: boolean;
  /** Extracted text content if this is a text node. */
  textContent: string | null;
  /** Extracted icon name if this is an icon/iconbutton. */
  iconName: string | null;
  /** Extracted hint text if this is a textfield. */
  hintText: string | null;
  /** Extracted button label if this is a button. */
  buttonLabel: string | null;
  /** All custom component properties (for @-prefixed types). */
  componentProps: Record<string, string | number | boolean>;
  /** Whether this widget is interactive (button, iconbutton, textfield). */
  interactive: boolean;
  /** Whether this widget has scroll enabled. */
  scrollable: boolean;
  /** Child widget IDs. */
  childIds: string[];
  /** Raw properties for detailed inspection. */
  rawProperties: Record<string, DslPropertyValue>;
  /** Source line hint for traceability. */
  sourceEditorId: string;
}
