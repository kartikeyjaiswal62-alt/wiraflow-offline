import type { DesignPageSpec, DesignSpec, DesignWidgetSpec } from "./types";

const SPACING_TOKENS_PX: Record<string, number> = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const PALETTE_TOKEN_MAP: Record<string, string> = {
  textPrimary: "textPrimary",
  textSecondary: "textSecondary",
  textMuted: "textMuted",
  onPrimary: "onPrimary",
  surfaceElevated: "surfaceElevated",
  on_primary: "onPrimary",
  on_secondary: "onSecondary",
  primary_text: "textPrimary",
  secondary_text: "textSecondary",
  hint: "textMuted",
};

function indent(code: string, level: number): string {
  const pad = "  ".repeat(level);
  return code
    .split("\n")
    .map((line) => (line.trim().length ? `${pad}${line}` : line))
    .join("\n");
}

function dartStringLiteral(value: string): string {
  // Safe-enough single-quoted Dart string.
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/\$/g, "\\$")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
  return `'${escaped}'`;
}

function unwrapString(v: any): string | undefined {
  if (typeof v === "string") return v;
  const raw = v?.stringVal?.value;
  return typeof raw === "string" ? raw : undefined;
}

function unwrapNumber(v: any): number | undefined {
  if (typeof v === "number") return v;
  const raw = v?.numberVal?.value;
  return typeof raw === "number" ? raw : undefined;
}

function unwrapBool(v: any): boolean | undefined {
  if (typeof v === "boolean") return v;
  const raw = v?.boolVal?.value;
  return typeof raw === "boolean" ? raw : undefined;
}

function unwrapAlign(v: any): string | undefined {
  const raw = v?.align?.named;
  return typeof raw === "string" ? raw : undefined;
}

function unwrapTextStyleName(v: any): string | undefined {
  const raw = v?.textStyle?.styleName;
  return typeof raw === "string" ? raw : undefined;
}

function unwrapIconName(v: any): string | undefined {
  const raw = v?.icon?.name;
  return typeof raw === "string" ? raw : undefined;
}

function getTokenValue(token: string): number {
  return SPACING_TOKENS_PX[token] ?? 0;
}

function resolveColorToken(token: string, palette: DesignSpec["palette"]): string {
  if (!token) return token;
  if (token.startsWith("#")) return token;
  const mappedKey = PALETTE_TOKEN_MAP[token] ?? token;
  const maybe = (palette as any)[mappedKey];
  return typeof maybe === "string" ? maybe : token;
}

function hexToDartColor(hex: any): string {
  const s = String(hex || "").trim();
  const normalized = s.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(normalized)) {
    // Fallback: attempt to compile anyway.
    return "Colors.transparent";
  }
  if (normalized.length === 8) {
    return `const Color(0x${normalized.toUpperCase()})`;
  }
  return `const Color(0xFF${normalized.toUpperCase()})`;
}

function colorPropToDart(v: any, palette: DesignSpec["palette"]): string | undefined {
  const token = v?.color?.color;
  if (typeof token !== "string") return undefined;
  const resolved = resolveColorToken(token, palette);
  return hexToDartColor(resolved);
}

function edgeInsetsToDart(v: any): string | undefined {
  const e = v?.edgeInsets;
  if (!e) return undefined;
  const token = typeof e.token === "string" ? e.token : undefined;
  if (token && SPACING_TOKENS_PX[token] != null) {
    return `const EdgeInsets.all(${SPACING_TOKENS_PX[token]})`;
  }
  const top = typeof e.top === "number" ? e.top : 0;
  const right = typeof e.right === "number" ? e.right : 0;
  const bottom = typeof e.bottom === "number" ? e.bottom : 0;
  const left = typeof e.left === "number" ? e.left : 0;
  return `const EdgeInsets.fromLTRB(${left}, ${top}, ${right}, ${bottom})`;
}

function radiusToDart(v: any): string | undefined {
  const r = v?.radius;
  if (!r) return undefined;
  const tl = typeof r.topLeft === "number" ? r.topLeft : 0;
  const tr = typeof r.topRight === "number" ? r.topRight : 0;
  const br = typeof r.bottomRight === "number" ? r.bottomRight : 0;
  const bl = typeof r.bottomLeft === "number" ? r.bottomLeft : 0;
  if (tl === tr && tr === br && br === bl) {
    return `BorderRadius.circular(${tl})`;
  }
  return `BorderRadius.only(topLeft: Radius.circular(${tl}), topRight: Radius.circular(${tr}), bottomRight: Radius.circular(${br}), bottomLeft: Radius.circular(${bl}))`;
}

function borderToDart(v: any, palette: DesignSpec["palette"]): string | undefined {
  const b = v?.border;
  if (!b) return undefined;
  const width = typeof b.width === "number" ? b.width : 1;
  const color = typeof b.color === "string" ? resolveColorToken(b.color, palette) : "#00000000";
  return `Border.all(width: ${width}, color: ${hexToDartColor(color)})`;
}

function pxToDart(v: any): string | undefined {
  const px = v?.px;
  if (!px) return undefined;
  if (px.isInfinity) return "double.infinity";
  return typeof px.value === "number" ? `${px.value}` : undefined;
}

function textStyleToDart(
  styleName: string | undefined,
  props: Record<string, any>,
  palette: DesignSpec["palette"]
): string | undefined {
  const styleKey = styleName ?? unwrapTextStyleName(props.style);
  const byName: Record<
    string,
    { size: number; weight: number; height: number; fontFamily: "heading" | "body" }
  > = {
    headline_large: { size: 32, weight: 700, height: 1.2, fontFamily: "heading" },
    headline_medium: { size: 26, weight: 600, height: 1.25, fontFamily: "heading" },
    title_large: { size: 20, weight: 600, height: 1.3, fontFamily: "heading" },
    title_medium: { size: 16, weight: 600, height: 1.4, fontFamily: "heading" },
    body_large: { size: 16, weight: 400, height: 1.5, fontFamily: "body" },
    body_medium: { size: 14, weight: 400, height: 1.5, fontFamily: "body" },
    body_small: { size: 12, weight: 400, height: 1.4, fontFamily: "body" },
    label_large: { size: 14, weight: 600, height: 1.3, fontFamily: "heading" },
    label_medium: { size: 12, weight: 600, height: 1.3, fontFamily: "heading" },
    label_small: { size: 10, weight: 700, height: 1.2, fontFamily: "heading" },
  };

  const base = styleKey ? byName[styleKey] : undefined;
  const fontSize = base?.size;
  const fontWeight = unwrapNumber(props.font_weight) ?? base?.weight;
  const height = unwrapNumber(props.line_height) ?? base?.height;

  const colorToken = props.color?.color?.color;
  const opacity = unwrapNumber(props.opacity);
  const resolvedColor =
    typeof colorToken === "string" ? resolveColorToken(colorToken, palette) : undefined;

  const colorExpr = resolvedColor
    ? opacity != null
      ? `${hexToDartColor(resolvedColor)}.withOpacity(${opacity})`
      : hexToDartColor(resolvedColor)
    : undefined;

  const parts: string[] = [];
  if (fontSize != null) parts.push(`fontSize: ${fontSize}`);
  if (fontWeight != null) parts.push(`fontWeight: FontWeight.w${Math.round(fontWeight)}`);
  if (height != null) parts.push(`height: ${height}`);
  if (colorExpr) parts.push(`color: ${colorExpr}`);

  if (parts.length === 0) return undefined;
  return `TextStyle(${parts.join(", ")})`;
}

function crossAxisAlignmentToDart(named?: string): string | undefined {
  switch (named) {
    case "start":
      return "CrossAxisAlignment.start";
    case "center":
      return "CrossAxisAlignment.center";
    case "end":
      return "CrossAxisAlignment.end";
    case "stretch":
      return "CrossAxisAlignment.stretch";
    default:
      return undefined;
  }
}

function mainAxisAlignmentToDart(named?: string): string | undefined {
  switch (named) {
    case "start":
      return "MainAxisAlignment.start";
    case "center":
      return "MainAxisAlignment.center";
    case "end":
      return "MainAxisAlignment.end";
    case "space_between":
      return "MainAxisAlignment.spaceBetween";
    default:
      return undefined;
  }
}

function textAlignToDart(named?: string): string | undefined {
  switch (named) {
    case "start":
      return "TextAlign.left";
    case "center":
      return "TextAlign.center";
    case "end":
      return "TextAlign.right";
    default:
      return undefined;
  }
}

function boxFitToDart(named?: string): string | undefined {
  switch (named) {
    case "cover":
      return "BoxFit.cover";
    case "contain":
      return "BoxFit.contain";
    default:
      return undefined;
  }
}

function childrenWithGaps(children: string[], gapPx: number, axis: "row" | "col"): string[] {
  if (!gapPx || children.length < 2) return children;
  const gap = axis === "row" ? `const SizedBox(width: ${gapPx})` : `const SizedBox(height: ${gapPx})`;
  const out: string[] = [];
  children.forEach((c, idx) => {
    out.push(c);
    if (idx < children.length - 1) out.push(gap);
  });
  return out;
}

function buildWidgetTree(widgets: DesignWidgetSpec[]) {
  const widgetByKey = new Map<string, DesignWidgetSpec>();
  const childrenByParent = new Map<string, DesignWidgetSpec[]>();
  const roots: DesignWidgetSpec[] = [];

  for (const w of widgets) widgetByKey.set(w.key, w);
  for (const w of widgets) {
    const pk = w.parentKey ?? null;
    if (!pk) {
      roots.push(w);
      continue;
    }
    if (!childrenByParent.has(pk)) childrenByParent.set(pk, []);
    childrenByParent.get(pk)!.push(w);
  }

  return { widgetByKey, childrenByParent, roots };
}

function renderWidget(
  widget: DesignWidgetSpec,
  children: DesignWidgetSpec[],
  childrenByParent: Map<string, DesignWidgetSpec[]>,
  spec: DesignSpec,
  usedImports: Set<string>,
  depth: number,
  textFieldKeys: string[] = []
): string {
  const props = widget.properties || {};

  const renderedChildren = children.map((c) =>
    renderWidget(c, childrenByParent.get(c.key) ?? [], childrenByParent, spec, usedImports, depth + 1, textFieldKeys)
  );

  const widgetType = widget.type;
  switch (widgetType) {
    case "Scaffold": {
      const bg = colorPropToDart(props.bg, spec.palette) || hexToDartColor(spec.palette.background || "#0A0A0A");
      const safeArea = unwrapBool(props.safe_area) ?? true;

      const bodyChild = renderedChildren.length
        ? renderedChildren.length === 1
          ? renderedChildren[0]
          : `SingleChildScrollView(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [\n${indent(renderedChildren.join(",\n"), 1)}\n]))`
        : "const Center(child: Text('Empty Page'))";

      const body = safeArea ? `SafeArea(child: ${bodyChild})` : bodyChild;

      const parts: string[] = [];
      parts.push(`backgroundColor: ${bg}`);
      parts.push(`body: ${body}`);

      return `Scaffold(\n${indent(parts.join(",\n"), 1)}\n)`;
    }

    case "Column": {
      const gapToken = unwrapString(props.spacing);
      const gapPx = gapToken && SPACING_TOKENS_PX[gapToken] != null ? SPACING_TOKENS_PX[gapToken] : 0;
      const scroll = unwrapBool(props.scroll) ?? false;
      const padding = edgeInsetsToDart(props.padding);
      const cross = crossAxisAlignmentToDart(unwrapAlign(props.cross_align));
      const main = mainAxisAlignmentToDart(unwrapAlign(props.main_align));

      const withGaps = childrenWithGaps(renderedChildren, gapPx, "col");
      const colParts: string[] = [];
      if (cross) colParts.push(`crossAxisAlignment: ${cross}`);
      if (main) colParts.push(`mainAxisAlignment: ${main}`);
      colParts.push(`children: [\n${indent(withGaps.join(",\n"), 1)}\n]`);
      let expr = `Column(\n${indent(colParts.join(",\n"), 1)}\n)`;

      if (padding) expr = `Padding(padding: ${padding}, child: ${expr})`;
      if (scroll) expr = `SingleChildScrollView(child: ${expr})`;
      return expr;
    }

    case "Row": {
      const gapToken = unwrapString(props.spacing);
      const gapPx = gapToken && SPACING_TOKENS_PX[gapToken] != null ? SPACING_TOKENS_PX[gapToken] : 0;
      const padding = edgeInsetsToDart(props.padding);
      const cross = crossAxisAlignmentToDart(unwrapAlign(props.cross_align));
      const main = mainAxisAlignmentToDart(unwrapAlign(props.align));

      const withGaps = childrenWithGaps(renderedChildren, gapPx, "row");
      const rowParts: string[] = [];
      if (cross) rowParts.push(`crossAxisAlignment: ${cross}`);
      if (main) rowParts.push(`mainAxisAlignment: ${main}`);
      rowParts.push(`children: [\n${indent(withGaps.join(",\n"), 1)}\n]`);
      let expr = `Row(\n${indent(rowParts.join(",\n"), 1)}\n)`;
      if (padding) expr = `Padding(padding: ${padding}, child: ${expr})`;
      return expr;
    }

    case "Container":
    case "Card": {
      const bg = colorPropToDart(props.bg, spec.palette);
      const padding = edgeInsetsToDart(props.padding);
      const radius = radiusToDart(props.radius);
      const border = borderToDart(props.border, spec.palette);
      const shadow = unwrapString(props.shadow);
      const clip = unwrapBool(props.clip) ?? false;
      const width = pxToDart(props.width);
      const height = pxToDart(props.height);

      const decorationParts: string[] = [];
      if (bg) decorationParts.push(`color: ${bg}`);
      if (radius) decorationParts.push(`borderRadius: ${radius}`);
      if (border) decorationParts.push(`border: ${border}`);
      if (shadow) {
        const shadowExpr =
          shadow === "sm"
            ? "const [BoxShadow(color: Color(0x33000000), blurRadius: 6, offset: Offset(0, 2))]"
            : shadow === "md"
              ? "const [BoxShadow(color: Color(0x33000000), blurRadius: 16, offset: Offset(0, 8))]"
              : shadow === "lg"
                ? "const [BoxShadow(color: Color(0x33000000), blurRadius: 28, offset: Offset(0, 16))]"
                : undefined;
        if (shadowExpr) decorationParts.push(`boxShadow: ${shadowExpr}`);
      }

      const childExpr = renderedChildren.length
        ? renderedChildren.length === 1
          ? renderedChildren[0]
          : `Column(children: [\n${indent(renderedChildren.join(",\n"), 1)}\n])`
        : undefined;

      const parts: string[] = [];
      if (width) parts.push(`width: ${width}`);
      if (height) parts.push(`height: ${height}`);
      if (padding) parts.push(`padding: ${padding}`);
      if (decorationParts.length) {
        parts.push(
          `decoration: BoxDecoration(\n${indent(decorationParts.join(",\n"), 1)}\n)`
        );
      }
      if (clip) parts.push("clipBehavior: Clip.antiAlias");
      if (childExpr) parts.push(`child: ${childExpr}`);

      return `Container(\n${indent(parts.join(",\n"), 1)}\n)`;
    }

    case "Stack": {
      const fit = unwrapString(props.fit);
      const stackFit = fit === "expand" ? "StackFit.expand" : undefined;
      const parts: string[] = [];
      if (stackFit) parts.push(`fit: ${stackFit}`);
      parts.push(`children: [\n${indent(renderedChildren.join(",\n"), 1)}\n]`);
      return `Stack(\n${indent(parts.join(",\n"), 1)}\n)`;
    }

    case "ListView": {
      const scrollDir = unwrapString(props.scrollDirection) === "horizontal" ? "Axis.horizontal" : "Axis.vertical";
      const padding = edgeInsetsToDart(props.padding);
      const gapToken = unwrapString(props.spacing);
      const gapPx = gapToken ? getTokenValue(gapToken) : 0;
      const queryTable = unwrapString(props.query_table);

      const parts: string[] = [];
      if (scrollDir === "Axis.horizontal") parts.push(`scrollDirection: Axis.horizontal`);
      if (padding) parts.push(`padding: ${padding}`);

      if (queryTable) {
        // Dynamically wire the ListView to a Supabase database query!
        return `FutureBuilder<List<Map<String, dynamic>>>(
          future: Supabase.instance.client.from('${queryTable}').select(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError) return Center(child: Text('Error: \${snapshot.error}'));
            final data = snapshot.data ?? [];
            if (data.isEmpty) return const Center(child: Text('No records found'));
            
            return ListView.separated(
              ${scrollDir === "Axis.horizontal" ? `scrollDirection: Axis.horizontal,` : ""}
              ${padding ? `padding: ${padding},` : ""}
              itemCount: data.length,
              separatorBuilder: (context, index) => const SizedBox(${scrollDir === "Axis.horizontal" ? `width: ${gapPx}` : `height: ${gapPx}`}),
              itemBuilder: (context, index) {
                // In a production app, map 'data[index]' to the child template
                return ${renderedChildren.length > 0 ? renderedChildren[0] : "const SizedBox.shrink()"};
              },
            );
          }
        )`;
      }

      let listWidget = "";
      if (renderedChildren.length > 0) {
        if (gapPx > 0) {
          parts.push(`separatorBuilder: (context, index) => const SizedBox(${scrollDir === "Axis.horizontal" ? `width: ${gapPx}` : `height: ${gapPx}`})`);
          parts.push(`itemCount: ${renderedChildren.length}`);
          parts.push(`itemBuilder: (context, index) { switch(index) { ${renderedChildren.map((c, i) => `case ${i}: return ${c};`).join(" ")} default: return const SizedBox.shrink(); } }`);
          listWidget = `ListView.separated(${parts.join(", ")})`;
        } else {
          parts.push(`children: [\n${indent(renderedChildren.join(",\n"), 1)}\n]`);
          listWidget = `ListView(${parts.join(", ")})`;
        }
      } else {
        listWidget = `ListView()`;
      }
      return listWidget;
    }

    case "GridView": {
      const cols = unwrapNumber(props.columns) ?? 2;
      const padding = edgeInsetsToDart(props.padding);
      const gapToken = unwrapString(props.spacing);
      const gapPx = gapToken ? getTokenValue(gapToken) : 8;
      const crossGapToken = unwrapString(props.cross_spacing);
      const crossGapPx = crossGapToken ? getTokenValue(crossGapToken) : 8;
      const queryTable = unwrapString(props.query_table);

      if (queryTable) {
        return `FutureBuilder<List<Map<String, dynamic>>>(
          future: Supabase.instance.client.from('${queryTable}').select(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
            if (snapshot.hasError) return Center(child: Text('Error: \${snapshot.error}'));
            final data = snapshot.data ?? [];
            if (data.isEmpty) return const Center(child: Text('No records found'));
            
            return GridView.builder(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: ${cols},
                mainAxisSpacing: ${gapPx},
                crossAxisSpacing: ${crossGapPx},
              ),
              ${padding ? `padding: ${padding},` : ""}
              itemCount: data.length,
              itemBuilder: (context, index) {
                return ${renderedChildren.length > 0 ? renderedChildren[0] : "const SizedBox.shrink()"};
              },
            );
          }
        )`;
      }

      return `GridView.count(
        crossAxisCount: ${cols},
        mainAxisSpacing: ${gapPx},
        crossAxisSpacing: ${crossGapPx},
        ${padding ? `padding: ${padding},` : ""}
        children: [\n${indent(renderedChildren.join(",\n"), 1)}\n]
      )`;
    }

    case "Expanded": {
      const childExpr = renderedChildren.length
        ? renderedChildren.length === 1
          ? renderedChildren[0]
          : `Column(children: [\n${indent(renderedChildren.join(",\n"), 1)}\n])`
        : "const SizedBox.shrink()";
      return `Expanded(child: ${childExpr})`;
    }

    case "Center": {
      const childExpr = renderedChildren.length
        ? renderedChildren.length === 1
          ? renderedChildren[0]
          : `Column(children: [\n${indent(renderedChildren.join(",\n"), 1)}\n])`
        : "const SizedBox.shrink()";
      return `Center(child: ${childExpr})`;
    }

    case "SizedBox": {
      const w = pxToDart(props.width);
      const h = pxToDart(props.height);
      const childExpr = renderedChildren.length ? renderedChildren[0] : undefined;
      const parts: string[] = [];
      if (w) parts.push(`width: ${w}`);
      if (h) parts.push(`height: ${h}`);
      if (childExpr) parts.push(`child: ${childExpr}`);
      return parts.length ? `SizedBox(${parts.join(", ")})` : "const SizedBox.shrink()";
    }

    case "Spacer": {
      return `const Spacer()`;
    }

    case "Divider": {
      const color = colorPropToDart(props.color, spec.palette);
      return color ? `Divider(color: ${color})` : "const Divider()";
    }

    case "Text": {
      const content = unwrapString(props.content) ?? widget.label;
      const styleName = unwrapTextStyleName(props.style);
      const styleExpr = textStyleToDart(styleName, props, spec.palette);
      const textAlign = textAlignToDart(unwrapAlign(props.text_align));

      const parts: string[] = [dartStringLiteral(content)];
      if (styleExpr) parts.push(`style: ${styleExpr}`);
      if (textAlign) parts.push(`textAlign: ${textAlign}`);
      return `Text(${parts.join(", ")})`;
    }

    case "Icon": {
      const name = unwrapIconName(props.name) ?? "circle";
      const size = unwrapNumber(props.size);
      const color = colorPropToDart(props.color, spec.palette);
      const safeName = /^[a-z0-9_]+$/i.test(name) ? name : "circle";
      const parts: string[] = [`Icons.${safeName}`];
      if (size != null) parts.push(`size: ${size}`);
      if (color) parts.push(`color: ${color}`);
      return `Icon(${parts.join(", ")})`;
    }

    case "IconButton": {
      const name = unwrapIconName(props.name) ?? "circle";
      const size = unwrapNumber(props.size);
      const color = colorPropToDart(props.color, spec.palette);
      const safeName = /^[a-z0-9_]+$/i.test(name) ? name : "circle";
      const iconParts: string[] = [`Icons.${safeName}`];
      if (size != null) iconParts.push(`size: ${size}`);
      if (color) iconParts.push(`color: ${color}`);
      const onPressed = onPressedFromAction((widget as any).action, textFieldKeys);
      return `IconButton(onPressed: ${onPressed}, icon: Icon(${iconParts.join(", ")}))`;
    }

    case "TextField": {
      const label = unwrapString(props.label) ?? "";
      const hint = unwrapString(props.hint) ?? "";
      const iconName = unwrapString(props.icon) ?? (unwrapBool(props.is_password) ? "lock" : "");
      const obscure = unwrapBool(props.is_password) ?? false;
      const safeIcon = iconName && /^[a-z0-9_]+$/i.test(iconName) ? iconName : "circle";
      const safeKey = widget.key.replace(/[^a-zA-Z0-9_]/g, "_");
      const controllerRef = textFieldKeys.includes(safeKey) ? `controller: _${safeKey}Controller,` : "";

      return `TextField(\n${indent(
        [
          controllerRef,
          obscure ? "obscureText: true," : "",
          `style: TextStyle(color: ${hexToDartColor(spec.palette.textPrimary || "#F5F5F7")}),`,
          "decoration: InputDecoration(",
          indent(
            [
              label ? `labelText: ${dartStringLiteral(label)},` : "",
              hint ? `hintText: ${dartStringLiteral(hint)},` : "",
              iconName ? `prefixIcon: Icon(Icons.${safeIcon}),` : "",
              "border: const OutlineInputBorder(),",
              "filled: true,",
              `fillColor: ${hexToDartColor(spec.palette.surfaceElevated || "#1A1A1A")},`,
            ]
              .filter(Boolean)
              .join("\n"),
            1
          ),
          "),",
        ]
          .filter(Boolean)
          .join("\n"),
        1
      )}\n)`;
    }

    case "Button": {
      const content = unwrapString(props.content) ?? widget.label;
      const variant = unwrapString(props.variant) ?? "primary";
      const fullWidth = unwrapBool(props.full_width) ?? false;
      const size = unwrapString(props.size) ?? "large";
      const iconEnd = unwrapIconName(props.icon_end);
      const onPressed = onPressedFromAction((widget as any).action, textFieldKeys);

      const paddingExpr =
        size === "small" ? "const EdgeInsets.symmetric(horizontal: 16, vertical: 10)" : "const EdgeInsets.symmetric(horizontal: 18, vertical: 16)";

      const labelExpr = iconEnd
        ? `Row(mainAxisSize: MainAxisSize.min, children: [Text(${dartStringLiteral(content)}), const SizedBox(width: 8), Icon(Icons.${iconEnd}, size: 18)])`
        : `Text(${dartStringLiteral(content)})`;

      let buttonExpr = "";
      if (variant === "outlined") {
        buttonExpr = `OutlinedButton(onPressed: ${onPressed}, style: OutlinedButton.styleFrom(padding: ${paddingExpr}), child: ${labelExpr})`;
      } else if (variant === "ghost") {
        buttonExpr = `TextButton(onPressed: ${onPressed}, style: TextButton.styleFrom(padding: ${paddingExpr}), child: ${labelExpr})`;
      } else {
        const bg = variant === "secondary" ? spec.palette.secondary : spec.palette.primary;
        buttonExpr = `ElevatedButton(onPressed: ${onPressed}, style: ElevatedButton.styleFrom(padding: ${paddingExpr}, backgroundColor: ${hexToDartColor(bg)}), child: ${labelExpr})`;
      }

      if (fullWidth) return `SizedBox(width: double.infinity, child: ${buttonExpr})`;
      return buttonExpr;
    }

    case "SocialButton": {
      const label = unwrapString(props.label) ?? widget.label;
      const icon = unwrapString(props.icon) ?? "";
      const iconText = icon === "google" ? "G" : icon === "apple" ? "" : icon ? icon[0].toUpperCase() : "•";
      return `OutlinedButton(onPressed: () {}, child: Row(mainAxisSize: MainAxisSize.min, children: [Text(${dartStringLiteral(iconText)}), const SizedBox(width: 10), Text(${dartStringLiteral(label)})]))`;
    }

    case "Image": {
      const src =
        unwrapString(props.src) ??
        unwrapString(props.source) ??
        unwrapString(props.source_desc) ??
        "https://picsum.photos/seed/wiraflow/800/600";
      const fit = boxFitToDart(unwrapString(props.fit)) ?? "BoxFit.cover";
      const radius = radiusToDart(props.radius);

      const imageExpr = `Image.network(${dartStringLiteral(src)}, fit: ${fit})`;
      return radius ? `ClipRRect(borderRadius: ${radius}, child: ${imageExpr})` : imageExpr;
    }

    case "Progress": {
      const variant = unwrapString(props.variant) ?? "linear";
      const color = colorPropToDart(props.color, spec.palette);
      const size = unwrapNumber(props.size);
      if (variant === "circular") {
        const parts: string[] = [];
        if (color) parts.push(`color: ${color}`);
        const indicator = `CircularProgressIndicator(${parts.join(", ")})`;
        return size != null ? `SizedBox(width: ${size}, height: ${size}, child: ${indicator})` : indicator;
      }
      const parts: string[] = [];
      if (color) parts.push(`color: ${color}`);
      return `LinearProgressIndicator(${parts.join(", ")})`;
    }

    case "Chart": {
      usedImports.add("fl_chart");
      const chartType = unwrapString(props.chart_type) ?? unwrapString(props.variant) ?? "bar";
      const height = pxToDart(props.height) ?? "160";
      const data = props.data?.jsonVal?.value;
      const points =
        Array.isArray(data) && data.length > 0
          ? data
          : [
              { label: "Mon", value: 22 },
              { label: "Tue", value: 18 },
              { label: "Wed", value: 30 },
              { label: "Thu", value: 26 },
              { label: "Fri", value: 34 },
              { label: "Sat", value: 28 },
              { label: "Sun", value: 40 },
            ];

      // In code-view mode we generate a lightweight fl_chart scaffold.
      if (chartType === "line") {
        const spots = points
          .map((p: any, idx: number) => {
            const y = typeof p?.value === "number" ? p.value : 0;
            return `FlSpot(${idx.toFixed(1)}, ${y.toFixed(1)})`;
          })
          .join(", ");
        return `SizedBox(\n${indent(
          [
            `height: ${height},`,
            "child: LineChart(LineChartData(",
            indent(
              [
                "gridData: const FlGridData(show: false),",
                "titlesData: const FlTitlesData(show: false),",
                "borderData: FlBorderData(show: false),",
                "lineBarsData: [LineChartBarData(",
                indent(
                  [
                    `spots: [${spots}],`,
                    "isCurved: true,",
                    "dotData: const FlDotData(show: false),",
                  ].join("\n"),
                  1
                ),
                ")],",
              ].join("\n"),
              1
            ),
            ")),",
          ].join("\n"),
          1
        )}\n)`;
      }

      const bars = points
        .map((p: any, idx: number) => {
          const y = typeof p?.value === "number" ? p.value : 0;
          return `BarChartGroupData(x: ${idx}, barRods: [BarChartRodData(toY: ${y.toFixed(1)})])`;
        })
        .join(", ");

      return `SizedBox(\n${indent(
        [
          `height: ${height},`,
          "child: BarChart(BarChartData(",
          indent(
            [
              "gridData: const FlGridData(show: false),",
              "titlesData: const FlTitlesData(show: false),",
              "borderData: FlBorderData(show: false),",
              `barGroups: [${bars}],`,
            ].join("\n"),
            1
          ),
          ")),",
        ].join("\n"),
        1
      )}\n)`;
    }

    default: {
      // Fallback: render unknown widget types as a labeled container so the
      // code view doesn't go blank while we extend coverage.
      const label = widget.label || widget.type;
      return `Container(padding: const EdgeInsets.all(12), child: Text(${dartStringLiteral(label)}))`;
    }
  }
}

function pageClassName(page: DesignPageSpec): string {
  const base = page.name || page.key || "Page";
  const cleaned = base.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
  return pascal.endsWith("Page") ? pascal : `${pascal}Page`;
}

function routeFromPageKey(pageKey: string): string {
  const cleaned = String(pageKey || "page").replace(/[^a-zA-Z0-9]+/g, "_");
  const startsOk = /^[a-zA-Z_]/.test(cleaned) ? cleaned : `p_${cleaned}`;
  return `/${startsOk || "page"}`;
}

function onPressedFromAction(action: any, textFieldKeys: string[]): string {
  const op = String(action?.operation || "");
  if (op === "navigate" && action?.targetPageKey) {
    return `() { Navigator.of(context).pushNamed(${dartStringLiteral(routeFromPageKey(String(action.targetPageKey)))}); }`;
  }
  if (op === "mutation" || op === "submit") {
    // Generate a form validation + feedback flow
    if (textFieldKeys.length > 0) {
      const checks = textFieldKeys.map((k) => `_${k}Controller.text.isEmpty`).join(" || ");
      
      const emailKey = textFieldKeys.find(k => k.toLowerCase().includes("email"));
      const passKey = textFieldKeys.find(k => k.toLowerCase().includes("password") || k.toLowerCase().includes("pass"));
      
      if (emailKey && passKey) {
        return `() async {
          if (${checks}) {
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in all fields'), backgroundColor: Colors.redAccent));
            return;
          }
          final email = _${emailKey}Controller.text.trim();
          final password = _${passKey}Controller.text;
          
          try {
            // First try to sign in
            await Supabase.instance.client.auth.signInWithPassword(email: email, password: password);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Welcome back!'), backgroundColor: Colors.green));
              ${action?.targetPageKey ? `Navigator.of(context).pushNamed(${dartStringLiteral(routeFromPageKey(String(action.targetPageKey)))});` : ""}
            }
          } on AuthException catch (e) {
            if (e.message.contains('Invalid login credentials')) {
              // Try to register instead if account doesn't exist
              try {
                await Supabase.instance.client.auth.signUp(email: email, password: password);
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account created successfully!'), backgroundColor: Colors.green));
                  ${action?.targetPageKey ? `Navigator.of(context).pushNamed(${dartStringLiteral(routeFromPageKey(String(action.targetPageKey)))});` : ""}
                }
              } catch (e2) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Registration Failed: \${e2.toString()}'), backgroundColor: Colors.redAccent));
                }
              }
            } else {
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Auth Error: \${e.message}'), backgroundColor: Colors.redAccent));
              }
            }
          } catch (e) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: \${e.toString()}'), backgroundColor: Colors.redAccent));
            }
          }
        }`;
      }

      return `() {
        if (${checks}) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in all fields'), backgroundColor: Colors.redAccent));
          return;
        }
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Success! Processing...'), backgroundColor: Colors.green));
        ${action?.targetPageKey ? `Future.delayed(const Duration(seconds: 1), () { if (context.mounted) Navigator.of(context).pushNamed(${dartStringLiteral(routeFromPageKey(String(action.targetPageKey)))}); });` : ""}
      }`;
    }
    return `() { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action executed!'))); }`;
  }
  if (op === "open_url" && action?.url) {
    return "() {}";
  }
  return "() {}";
}

function collectTextFieldKeys(widgets: DesignWidgetSpec[]): string[] {
  const keys: string[] = [];
  for (const w of widgets) {
    if (w.type === "TextField") {
      const safe = w.key.replace(/[^a-zA-Z0-9_]/g, "_");
      keys.push(safe);
    }
  }
  return keys;
}

export function generateFlutterPageDart(spec: DesignSpec, pageKey: string): string {
  const page = spec.pages.find((p) => p.key === pageKey) ?? spec.pages[0];
  if (!page) {
    return [
      "// No pages in DesignSpec yet.",
      "// Generate a design first, then this panel will show Flutter code for the selected page.",
    ].join("\n");
  }

  const tree = buildWidgetTree(page.widgets);
  const usedImports = new Set<string>();

  // Detect TextFields to generate controllers
  const textFieldKeys = collectTextFieldKeys(page.widgets);
  const hasTextFields = textFieldKeys.length > 0;

  const roots = tree.roots;
  const rootWidget =
    roots.length === 1
      ? renderWidget(
          roots[0],
          tree.childrenByParent.get(roots[0].key) ?? [],
          tree.childrenByParent,
          spec,
          usedImports,
          0,
          textFieldKeys
        )
      : `Column(children: [\n${indent(
          roots
            .map((r) =>
              renderWidget(
                r,
                tree.childrenByParent.get(r.key) ?? [],
                tree.childrenByParent,
                spec,
                usedImports,
                0,
                textFieldKeys
              )
            )
            .join(",\n"),
          1
        )}\n])`;

  const className = pageClassName(page);
  const imports = [
    "import 'package:flutter/material.dart';",
    ...(usedImports.has("fl_chart") ? ["import 'package:fl_chart/fl_chart.dart';"] : []),
    "",
  ].join("\n");

  if (hasTextFields) {
    // Generate StatefulWidget with controllers
    const controllers = textFieldKeys.map((k) => `  final _${k}Controller = TextEditingController();`).join("\n");
    const disposes = textFieldKeys.map((k) => `    _${k}Controller.dispose();`).join("\n");

    return [
      imports,
      `class ${className} extends StatefulWidget {`,
      `  const ${className}({super.key});`,
      "",
      `  @override`,
      `  State<${className}> createState() => _${className}State();`,
      `}`,
      "",
      `class _${className}State extends State<${className}> {`,
      controllers,
      "",
      "  @override",
      "  void dispose() {",
      disposes,
      "    super.dispose();",
      "  }",
      "",
      "  @override",
      "  Widget build(BuildContext context) {",
      "    return " + rootWidget.replace(/\n/g, "\n" + "    ") + ";",
      "  }",
      "}",
      "",
    ].join("\n");
  }

  return [
    imports,
    `class ${className} extends StatelessWidget {`,
    indent(`const ${className}({super.key});`, 1),
    "",
    indent("@override", 1),
    indent("Widget build(BuildContext context) {", 1),
    indent("return " + rootWidget.replace(/\n/g, "\n" + "  "), 2) + ";",
    indent("}", 1),
    "}",
    "",
  ].join("\n");
}
