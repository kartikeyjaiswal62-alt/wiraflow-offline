import * as fs from "fs";
import * as path from "path";

const inputFilePath = "/Users/ashutoshrao/Desktop/App Developement Platform/Login UI agent prompt.md";
const outputPath = path.join(__dirname, "../apps/web/src/data/mock-project.ts");

function parseMarkdownAst() {
  const fileContent = fs.readFileSync(inputFilePath, "utf-8");
  
  // Extract Theme JSON
  const themeMatch = fileContent.match(/## Theme \(JSON\)\s+```json\n([\s\S]*?)```/);
  const themeJson = themeMatch ? JSON.parse(themeMatch[1]) : null;

  // Extract DslDocument JSON
  const dslMatch = fileContent.match(/#### DslDocument \(JSON\)\s+```json\n([\s\S]*?)```/);
  const dslJson = dslMatch ? JSON.parse(dslMatch[1]) : null;

  if (!dslJson || !dslJson.root) {
    console.error("Failed to parse DslDocument JSON");
    process.exit(1);
  }

  const widgets: any[] = [];
  const rolesMap: any = {
    scaffold: "layout_root",
    column: "layout_column",
    row: "layout_row",
    container: "layout_container",
    text: "text_body",
    "@input_field": "form_input",
    "@std.button": "submit_form",
    "@social_button": "action_trigger",
    icon: "icon",
    iconbutton: "action_trigger",
    stack: "layout_stack",
    center: "layout_center",
    expanded: "layout_expanded",
    divider: "layout_divider",
    "@health_ring": "chart"
  };

  // Convert nested AST to flat array with parentKeys
  function traverse(node: any, parentKey?: string) {
    if (!node) return;
    
    // Some elements don't have an editorId at the root level, so we generate a random one if missing
    const nodeKey = node.editorId || `w-${Math.random().toString(36).substr(2, 9)}`;
    
    const widgetType = node.type;
    let label = nodeTypeToLabel(node);

    const flutterWidgetType = formatWidgetType(widgetType);

    widgets.push({
      key: nodeKey,
      parentKey: parentKey,
      label: label,
      flutterWidgetType: flutterWidgetType,
      semanticRole: rolesMap[widgetType] || "component",
      pageKey: "page-login",
      interactive: isInteractive(widgetType),
      properties: node.properties || {}, // Save entire layout properties dictionary
      dataBindings: []
    });

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child: any) => {
        traverse(child, nodeKey);
      });
    }
  }

  function nodeTypeToLabel(node: any) {
    if (node.properties?.content?.stringVal?.value) return node.properties.content.stringVal.value;
    if (node.properties?.label?.stringVal?.value) return node.properties.label.stringVal.value;
    if (node.properties?.name?.icon?.name) return node.properties.name.icon.name;
    return node.type;
  }

  function formatWidgetType(type: string) {
    switch(type) {
      case "scaffold": return "Scaffold";
      case "column": return "Column";
      case "row": return "Row";
      case "container": return "Container";
      case "text": return "Text";
      case "icon": return "Icon";
      case "iconbutton": return "IconButton";
      case "stack": return "Stack";
      case "center": return "Center";
      case "expanded": return "Expanded";
      case "divider": return "Divider";
      case "image": return "Image";
      case "@input_field": return "TextField";
      case "@std.button": return "Button";
      case "@social_button": return "SocialButton";
      default: return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, "");
    }
  }

  function isInteractive(type: string) {
    return ["@input_field", "@std.button", "@social_button", "iconbutton"].includes(type);
  }

  traverse(dslJson.root, undefined);

  // Output mock-project.ts structure
  const code = `
export const globalTheme = ${JSON.stringify(themeJson, null, 2)};

export const mockUIGraph = {
  version: "2.5.0",
  projectId: "proj-universal",
  pages: [
    { key: "page-dashboard", label: "Dashboard", pageType: "list", widgetKeys: [] },
    { key: "page-live-transcription", label: "Live Transcription", pageType: "detail", widgetKeys: [] },
    { key: "page-meeting-analysis", label: "Meeting Analysis", pageType: "detail", widgetKeys: [] },
    { key: "page-login", label: "Login", pageType: "form", widgetKeys: ${JSON.stringify(widgets.map(w => w.key))} }
  ],
  widgets: ${JSON.stringify(widgets, null, 2)},
  navigationEdges: [],
  sourceLinks: [],
  unknowns: []
};

export const mockWiringPlan = {
  actionFlows: [],
  flowSteps: [],
  readBindings: [] as any[],
  mutationBindings: [] as any[],
  uploadBindings: [] as any[],
  navigationBindings: [] as any[],
  functionBindings: [] as any[],
  stateTransitions: [] as any[],
  debugBindings: [] as any[],
  guards: [] as any[],
  unknowns: [],
  validation: { executionReady: true }
};
`;

  fs.writeFileSync(outputPath, code);
  console.log("Successfully extracted " + widgets.length + " elements to " + outputPath);
}

parseMarkdownAst();
