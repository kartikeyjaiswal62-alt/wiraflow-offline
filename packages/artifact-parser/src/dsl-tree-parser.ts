/**
 * DSL Tree Parser
 *
 * Flattens the recursive DslNode tree into a flat array of FlatWidget objects.
 * This intermediate representation makes semantic analysis much easier —
 * we can iterate, filter, and classify widgets without recursive traversal.
 */

import type {
  DslNode,
  DslPropertyValue,
  DslStringVal,
  DslNumberVal,
  DslBoolVal,
  DslColorRef,
  DslIconRef,
  FlatWidget,
} from "./dsl-types.js";

// ---------------------------------------------------------------------------
// Property Extraction Helpers
// ---------------------------------------------------------------------------

function isStringVal(v: DslPropertyValue): v is DslStringVal {
  return "stringVal" in v;
}

function isNumberVal(v: DslPropertyValue): v is DslNumberVal {
  return "numberVal" in v;
}

function isBoolVal(v: DslPropertyValue): v is DslBoolVal {
  return "boolVal" in v;
}

function isColorRef(v: DslPropertyValue): v is DslColorRef {
  return "color" in v && typeof (v as DslColorRef).color === "object" && "color" in (v as DslColorRef).color;
}

function isIconRef(v: DslPropertyValue): v is DslIconRef {
  return "icon" in v && typeof (v as DslIconRef).icon === "object" && "name" in (v as DslIconRef).icon;
}

/** Extract a string value from a property, regardless of wrapper type. */
export function extractStringProp(
  props: Record<string, DslPropertyValue> | undefined,
  key: string
): string | null {
  if (!props || !(key in props)) return null;
  const v = props[key];
  if (isStringVal(v)) return v.stringVal.value;
  if (isNumberVal(v)) return String(v.numberVal.value);
  if (isBoolVal(v)) return String(v.boolVal.value);
  if (isColorRef(v)) return v.color.color;
  if (isIconRef(v)) return v.icon.name;
  return null;
}

/** Extract a boolean value from a property. */
export function extractBoolProp(
  props: Record<string, DslPropertyValue> | undefined,
  key: string
): boolean {
  if (!props || !(key in props)) return false;
  const v = props[key];
  if (isBoolVal(v)) return v.boolVal.value;
  return false;
}

// ---------------------------------------------------------------------------
// Interactive Widget Detection
// ---------------------------------------------------------------------------

const INTERACTIVE_TYPES = new Set([
  "iconbutton",
  "@std.button",
  "@std.textfield",
  "checkbox",
  "radio",
  "switch",
  "slider",
  "dropdown",
  "gesturedetector",
  "inkwell",
]);

function isInteractive(type: string): boolean {
  return INTERACTIVE_TYPES.has(type) || type.includes("button");
}

// ---------------------------------------------------------------------------
// Flatten Tree
// ---------------------------------------------------------------------------

let idCounter = 0;

function generateId(): string {
  return `gen-${++idCounter}`;
}

function flattenNode(
  node: DslNode,
  parentId: string | null,
  depth: number,
  result: FlatWidget[]
): string {
  const id = node.editorId ?? generateId();
  const type = node.type;
  const isCustom = type.startsWith("@");
  const props = node.properties ?? {};

  // Extract text content
  let textContent: string | null = null;
  if (type === "text") {
    textContent = extractStringProp(props, "content");
  }

  // Extract icon name
  let iconName: string | null = null;
  if (type === "icon" || type === "iconbutton") {
    const nameVal = props["name"];
    if (nameVal && isIconRef(nameVal)) {
      iconName = nameVal.icon.name;
    }
  }

  // Extract hint text for text fields
  let hintText: string | null = null;
  if (type === "@std.textfield") {
    hintText = extractStringProp(props, "hint");
  }

  // Extract button label
  let buttonLabel: string | null = null;
  if (type === "@std.button") {
    buttonLabel = extractStringProp(props, "content");
  }

  // Extract custom component properties as flat key-value pairs
  const componentProps: Record<string, string | number | boolean> = {};
  if (isCustom) {
    for (const [key, val] of Object.entries(props)) {
      if (isStringVal(val)) componentProps[key] = val.stringVal.value;
      else if (isNumberVal(val)) componentProps[key] = val.numberVal.value;
      else if (isBoolVal(val)) componentProps[key] = val.boolVal.value;
    }
  }

  // Detect scrollable
  const scrollable = extractBoolProp(props, "scroll");

  // Recurse children
  const childIds: string[] = [];
  if (node.children) {
    for (const child of node.children) {
      const childId = flattenNode(child, id, depth + 1, result);
      childIds.push(childId);
    }
  }

  const widget: FlatWidget = {
    id,
    parentId,
    depth,
    type,
    isCustomComponent: isCustom,
    textContent,
    iconName,
    hintText,
    buttonLabel,
    componentProps,
    interactive: isInteractive(type),
    scrollable,
    childIds,
    rawProperties: props,
    sourceEditorId: node.editorId ?? id,
  };

  result.push(widget);
  return id;
}

/**
 * Flatten a DslNode tree into a flat array of FlatWidget objects.
 *
 * @param root - The root DslNode from a Designer page's DslDocument.
 * @returns Flat array of all widgets in depth-first order.
 */
export function flattenDslTree(root: DslNode): FlatWidget[] {
  idCounter = 0;
  const result: FlatWidget[] = [];
  flattenNode(root, null, 0, result);
  return result;
}

/**
 * Find all widgets matching a predicate.
 */
export function findWidgets(
  widgets: FlatWidget[],
  predicate: (w: FlatWidget) => boolean
): FlatWidget[] {
  return widgets.filter(predicate);
}

/**
 * Find all text content values in the tree.
 */
export function extractAllTextContent(widgets: FlatWidget[]): string[] {
  return widgets
    .map((w) => w.textContent)
    .filter((t): t is string => t !== null);
}

/**
 * Find all custom component types used in the tree.
 */
export function extractCustomComponentTypes(
  widgets: FlatWidget[]
): string[] {
  const types = new Set<string>();
  for (const w of widgets) {
    if (w.isCustomComponent) {
      types.add(w.type);
    }
  }
  return [...types];
}

/**
 * Find all interactive widgets.
 */
export function extractInteractiveWidgets(
  widgets: FlatWidget[]
): FlatWidget[] {
  return widgets.filter((w) => w.interactive);
}
