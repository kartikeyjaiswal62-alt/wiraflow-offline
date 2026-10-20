/**
 * Wiraflow Shared Types
 *
 * Central type definitions for the platform flow:
 * Design specs, projects, widgets, and AI pipeline payloads.
 */

// ---------------------------------------------------------------------------
// Design Spec — AI-generated output from the prompt pipeline
// ---------------------------------------------------------------------------

export interface DesignPalette {
  primary: string;
  onPrimary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  divider: string;
  error: string;
  success: string;
}

export interface DesignFonts {
  heading: string;
  body: string;
}

export interface DesignWidgetSpec {
  key: string;
  parentKey?: string | null;
  type: string; // Flutter widget type: Scaffold, Column, Row, Container, Text, Button, etc.
  label: string;
  semanticRole: string;
  interactive: boolean;
  action?: {
    operation: "navigate" | "mutation" | "open_url" | "none" | string;
    targetPageKey?: string;
    targetEntityKey?: string;
    url?: string;
  };
  properties: Record<string, any>;
}

export interface DesignPageSpec {
  key: string;
  name: string;
  purpose: string;
  pageType: "list" | "detail" | "form" | "dashboard" | "settings" | "profile" | "onboarding" | "explore" | "notifications" | "splash" | "activity" | "search";
  widgets: DesignWidgetSpec[];
}

export interface DesignSpec {
  appName: string;
  tagline: string;
  palette: DesignPalette;
  fonts: DesignFonts;
  pages: DesignPageSpec[];
  generatedAt: string;
  model: string;
}

// ---------------------------------------------------------------------------
// Backend Schema Configuration
// ---------------------------------------------------------------------------

export interface SchemaPlanColumn {
  key: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  defaultExpression?: string;
  references?: {
    table: string;
    column: string;
    onDelete: string;
  };
  comment?: string;
}

export interface SchemaPlanTable {
  key: string;
  name: string;
  columns: SchemaPlanColumn[];
  enableRls: boolean;
  comment?: string;
}

export interface MigrationStep {
  key: string;
  order: number;
  description: string;
  upSql: string;
  downSql: string;
}

export interface SchemaPlan {
  dialect?: "sqlite" | "postgres";
  tables: SchemaPlanTable[];
  migrationSteps: MigrationStep[];
  enums: { key: string; name: string; values: string[] }[];
  rlsPolicies: { key: string; name: string; tableName: string; operation: string; usingExpression: string }[];
}

// ---------------------------------------------------------------------------
// Project — Saved in local store
// ---------------------------------------------------------------------------

export type ProjectStage = "draft" | "designing" | "previewing" | "wired" | "deployed";

export interface Project {
  id: string;
  name: string;
  description: string;
  stage: ProjectStage;
  prompt: string;
  designSpec?: DesignSpec;
  designThemeId?: string;
  designThemeMode?: "dark" | "light";
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  widgetCount: number;

  // Supabase connection (per-project)
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  supabaseConnectionString?: string;

  // Generated DB schema
  schemaPlan?: SchemaPlan;

  // Agent workspace (optional, stored client-side)
  agentGuidelines?: string;
  // Prompt Lab (per-project addenda)
  promptLabGenerate?: string;
  promptLabEdit?: string;
  agentChatMessages?: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: string;
    meta?: {
      intent?: "generate_design" | "generate_schema" | "edit_ui" | "chat";
      processState?: "loading" | "done" | "error";
      processResult?: any;
      kind?: string;
      [key: string]: any;
    };
  }>;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface StoreState {
  apiKey: string;
  model: string;
  aiProvider?: "ollama" | "cloud";
  projects: Project[];
  primaryMode?: "design" | "backend" | "wiring";
}

// ---------------------------------------------------------------------------
// OpenAI pipeline
// ---------------------------------------------------------------------------

export interface GenerateDesignRequest {
  prompt: string;
  apiKey?: string;
  model: string;
  provider?: "ollama" | "cloud";
  imageDataUrl?: string;
  generationMode?: "quick" | "full";
}

export interface GenerateDesignResult {
  success: boolean;
  spec?: DesignSpec;
  error?: string;
}
