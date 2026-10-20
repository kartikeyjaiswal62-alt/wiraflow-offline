import type { DesignFonts, DesignPalette, DesignSpec } from "./types";

export type ThemeMode = "dark" | "light";

export type DesignTheme = {
  id: string;
  name: string;
  description: string;
  palettes: Record<ThemeMode, DesignPalette>;
  fonts: DesignFonts;
};

export const DESIGN_THEMES: DesignTheme[] = [
  {
    id: "midnight-neon",
    name: "Midnight Neon",
    description: "Cyber-dark with electric cyan accents.",
    fonts: { heading: "Space Grotesk", body: "Inter" },
    palettes: {
      dark: {
        primary: "#22D3EE",
        onPrimary: "#001014",
        secondary: "#0B1020",
        accent: "#8B5CF6",
        background: "#03040A",
        surface: "#0B0E18",
        surfaceElevated: "#12162A",
        textPrimary: "#F8FAFC",
        textSecondary: "#C5CBD6",
        textMuted: "#8A94A6",
        divider: "#232A44",
        error: "#FB7185",
        success: "#34D399",
      },
      light: {
        primary: "#0E7490",
        onPrimary: "#FFFFFF",
        secondary: "#0F172A",
        accent: "#7C3AED",
        background: "#F7FAFF",
        surface: "#FFFFFF",
        surfaceElevated: "#F1F5FF",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D8E1F0",
        error: "#E11D48",
        success: "#059669",
      },
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Deep graphite with aurora gradients and lime pop.",
    fonts: { heading: "Outfit", body: "DM Sans" },
    palettes: {
      dark: {
        primary: "#A3E635",
        onPrimary: "#0A0F05",
        secondary: "#0B1020",
        accent: "#60A5FA",
        background: "#05060A",
        surface: "#0C101B",
        surfaceElevated: "#121A2D",
        textPrimary: "#F8FAFC",
        textSecondary: "#C7D2E1",
        textMuted: "#8A97B1",
        divider: "#232E4C",
        error: "#F43F5E",
        success: "#22C55E",
      },
      light: {
        primary: "#65A30D",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#2563EB",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        surfaceElevated: "#F1F5FF",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D8E1F0",
        error: "#E11D48",
        success: "#16A34A",
      },
    },
  },
  {
    id: "carbon",
    name: "Carbon",
    description: "Minimal premium monochrome with cobalt highlight.",
    fonts: { heading: "Sora", body: "Inter" },
    palettes: {
      dark: {
        primary: "#3B82F6",
        onPrimary: "#06162F",
        secondary: "#0D0D10",
        accent: "#F97316",
        background: "#060607",
        surface: "#101014",
        surfaceElevated: "#171821",
        textPrimary: "#FAFAFC",
        textSecondary: "#C7CBD6",
        textMuted: "#8A94A6",
        divider: "#2A2C38",
        error: "#EF4444",
        success: "#22C55E",
      },
      light: {
        primary: "#1E40AF",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#EA580C",
        background: "#FAFAFC",
        surface: "#FFFFFF",
        surfaceElevated: "#F4F6FB",
        textPrimary: "#0B0B10",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D9DEE8",
        error: "#DC2626",
        success: "#16A34A",
      },
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    description: "Elegant rose + charcoal for lifestyle apps.",
    fonts: { heading: "Poppins", body: "Inter" },
    palettes: {
      dark: {
        primary: "#FB7185",
        onPrimary: "#2A0811",
        secondary: "#111827",
        accent: "#F472B6",
        background: "#06050A",
        surface: "#100B14",
        surfaceElevated: "#181025",
        textPrimary: "#F8FAFC",
        textSecondary: "#C9C3D6",
        textMuted: "#978FA8",
        divider: "#2C2137",
        error: "#F43F5E",
        success: "#34D399",
      },
      light: {
        primary: "#E11D48",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#DB2777",
        background: "#FFF7FA",
        surface: "#FFFFFF",
        surfaceElevated: "#FFEAF4",
        textPrimary: "#111827",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#F0C9DE",
        error: "#BE123C",
        success: "#059669",
      },
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Professional teal/indigo for dashboards.",
    fonts: { heading: "Manrope", body: "Inter" },
    palettes: {
      dark: {
        primary: "#2DD4BF",
        onPrimary: "#001615",
        secondary: "#0B1020",
        accent: "#6366F1",
        background: "#040711",
        surface: "#0B1226",
        surfaceElevated: "#111C3D",
        textPrimary: "#F8FAFC",
        textSecondary: "#C7D2E1",
        textMuted: "#8A97B1",
        divider: "#24335F",
        error: "#F43F5E",
        success: "#22C55E",
      },
      light: {
        primary: "#0F766E",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#4338CA",
        background: "#F6FBFF",
        surface: "#FFFFFF",
        surfaceElevated: "#EEF6FF",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D7E4F3",
        error: "#E11D48",
        success: "#16A34A",
      },
    },
  },
  {
    id: "royal-violet",
    name: "Royal Violet",
    description: "Luxury violet with sapphire highlights.",
    fonts: { heading: "Sora", body: "Inter" },
    palettes: {
      dark: {
        primary: "#7C3AED",
        onPrimary: "#120026",
        secondary: "#0B1020",
        accent: "#38BDF8",
        background: "#05040A",
        surface: "#0C0B14",
        surfaceElevated: "#14102A",
        textPrimary: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#9AA4B2",
        divider: "#262246",
        error: "#FB7185",
        success: "#34D399",
      },
      light: {
        primary: "#5B21B6",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#0284C7",
        background: "#FBFAFF",
        surface: "#FFFFFF",
        surfaceElevated: "#F3F0FF",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D8D1FF",
        error: "#E11D48",
        success: "#059669",
      },
    },
  },
  {
    id: "emerald-pro",
    name: "Emerald Pro",
    description: "Clean emerald + graphite for enterprise apps.",
    fonts: { heading: "Manrope", body: "Inter" },
    palettes: {
      dark: {
        primary: "#10B981",
        onPrimary: "#001A12",
        secondary: "#0B1020",
        accent: "#22D3EE",
        background: "#05070A",
        surface: "#0C1116",
        surfaceElevated: "#111B24",
        textPrimary: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#9AA4B2",
        divider: "#223142",
        error: "#FB7185",
        success: "#34D399",
      },
      light: {
        primary: "#047857",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#0891B2",
        background: "#F6FFFB",
        surface: "#FFFFFF",
        surfaceElevated: "#ECFDF5",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#CFEFE3",
        error: "#E11D48",
        success: "#16A34A",
      },
    },
  },
  {
    id: "sunset-slate",
    name: "Sunset Slate",
    description: "Warm coral accents on modern slate.",
    fonts: { heading: "Outfit", body: "DM Sans" },
    palettes: {
      dark: {
        primary: "#FB923C",
        onPrimary: "#201006",
        secondary: "#0B1020",
        accent: "#F97316",
        background: "#07070A",
        surface: "#0E1016",
        surfaceElevated: "#151A25",
        textPrimary: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#9AA4B2",
        divider: "#263044",
        error: "#FB7185",
        success: "#34D399",
      },
      light: {
        primary: "#EA580C",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#F97316",
        background: "#FFF8F3",
        surface: "#FFFFFF",
        surfaceElevated: "#FFF1E8",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#F2D4C3",
        error: "#E11D48",
        success: "#16A34A",
      },
    },
  },
  {
    id: "cobalt-ice",
    name: "Cobalt Ice",
    description: "Crisp cobalt with icy surfaces for analytics.",
    fonts: { heading: "Space Grotesk", body: "Inter" },
    palettes: {
      dark: {
        primary: "#2563EB",
        onPrimary: "#071A3A",
        secondary: "#0B1020",
        accent: "#22D3EE",
        background: "#05070E",
        surface: "#0B1226",
        surfaceElevated: "#111C3D",
        textPrimary: "#F8FAFC",
        textSecondary: "#CBD5E1",
        textMuted: "#9AA4B2",
        divider: "#24335F",
        error: "#FB7185",
        success: "#34D399",
      },
      light: {
        primary: "#1D4ED8",
        onPrimary: "#FFFFFF",
        secondary: "#111827",
        accent: "#0891B2",
        background: "#F5FAFF",
        surface: "#FFFFFF",
        surfaceElevated: "#EEF6FF",
        textPrimary: "#0B1220",
        textSecondary: "#1F2A44",
        textMuted: "#5B6985",
        divider: "#D7E4F3",
        error: "#E11D48",
        success: "#16A34A",
      },
    },
  },
];

export function getThemeById(id: string | undefined | null): DesignTheme | null {
  if (!id) return null;
  return DESIGN_THEMES.find((t) => t.id === id) || null;
}

function buildHexToKeyMap(palette: DesignPalette) {
  const map = new Map<string, keyof DesignPalette>();
  (Object.keys(palette) as Array<keyof DesignPalette>).forEach((k) => {
    const v = palette[k];
    if (typeof v === "string" && v.startsWith("#")) map.set(v.toLowerCase(), k);
  });
  return map;
}

function isHexColor(s: unknown): s is string {
  return typeof s === "string" && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s.trim());
}

function tokenizeColorRef(value: any, hexToKey: Map<string, keyof DesignPalette>): any {
  if (typeof value === "string") {
    const s = value.trim();
    if (isHexColor(s)) {
      const key = hexToKey.get(s.toLowerCase());
      return key ? String(key) : value;
    }
    return value;
  }

  if (!value || typeof value !== "object") return value;

  // Common DSL wrapper: { color: { color: "..." } }
  if (value.color && typeof value.color === "object" && typeof value.color.color === "string") {
    const next = tokenizeColorRef(value.color.color, hexToKey);
    return { ...value, color: { ...value.color, color: next } };
  }

  // Border helper: { border: { width, color } } OR { border: { border: { width, color } } }
  if (value.border && typeof value.border === "object") {
    const b = value.border;
    if (typeof b.color === "string") {
      const next = tokenizeColorRef(b.color, hexToKey);
      return { ...value, border: { ...b, color: next } };
    }
    if (b.border && typeof b.border === "object" && typeof b.border.color === "string") {
      const next = tokenizeColorRef(b.border.color, hexToKey);
      return { ...value, border: { ...b, border: { ...b.border, color: next } } };
    }
    if (b.border && typeof b.border === "object" && b.border.color && typeof b.border.color === "object") {
      const nextBorderColor = tokenizeColorRef(b.border.color, hexToKey);
      return { ...value, border: { ...b, border: { ...b.border, color: nextBorderColor } } };
    }
  }

  // Gradient stops: { gradient: { stops: [ { color: { color: "..." } } ] } }
  if (value.gradient && typeof value.gradient === "object") {
    const g = value.gradient;
    if (g.stops && Array.isArray(g.stops)) {
      const nextStops = g.stops.map((s: any) => tokenizeColorRef(s, hexToKey));
      return { ...value, gradient: { ...g, stops: nextStops } };
    }
  }

  // Recurse shallowly through objects/arrays.
  if (Array.isArray(value)) return value.map((v) => tokenizeColorRef(v, hexToKey));
  const out: any = { ...value };
  for (const [k, v] of Object.entries(out)) {
    if (k === "content" || k === "label" || k === "hint") continue;
    out[k] = tokenizeColorRef(v, hexToKey);
  }
  return out;
}

export function applyDesignThemeToSpec(
  spec: DesignSpec,
  theme: DesignTheme,
  mode: ThemeMode
): DesignSpec {
  // Tokenize existing hex colors that match the previous palette so future theme swaps work.
  const hexToKey = buildHexToKeyMap(spec.palette);
  const nextPages = spec.pages.map((p) => ({
    ...p,
    widgets: p.widgets.map((w) => ({
      ...w,
      properties: tokenizeColorRef(w.properties || {}, hexToKey),
    })),
  }));

  return {
    ...spec,
    palette: theme.palettes[mode],
    fonts: theme.fonts,
    pages: nextPages,
    generatedAt: new Date().toISOString(),
  };
}
