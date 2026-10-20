/**
 * Intent Compiler
 *
 * Converts a ParsedDesignerExport into an AppIntentSpec.
 * This extracts product intent from the combination of:
 * - The original user prompt
 * - Page definitions and their prompts
 * - Widget analysis (text content, actions, inputs, custom components)
 *
 * Uses deterministic extraction for known patterns.
 * Items that can't be determined get pushed to the unknowns channel.
 */

import type {
  AppIntentSpec,
  PageCatalogEntry,
  DomainEntity,
  EntityField,
  Role,
  Workflow,
  WorkflowStep,
  AsyncJob,
  FileMediaNeed,
  Constraint,
} from "@wiraflow/contracts";
import type { UnknownEntry } from "@wiraflow/contracts";
import type { ParsedDesignerExport, FlatWidget } from "./dsl-types.js";
import { flattenDslTree, extractAllTextContent } from "./dsl-tree-parser.js";

// ---------------------------------------------------------------------------
// Domain Keywords for Entity Extraction
// ---------------------------------------------------------------------------

const ENTITY_KEYWORDS: Record<
  string,
  { label: string; fields: EntityField[] }
> = {
  meeting: {
    label: "Meeting",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "text", required: false },
      { key: "duration_seconds", label: "Duration", type: "integer", required: false },
      { key: "status", label: "Status", type: "enum", enumValues: ["scheduled", "recording", "processing", "completed", "failed"], required: true },
      { key: "meeting_date", label: "Meeting Date", type: "datetime", required: false },
    ],
  },
  transcript: {
    label: "Transcript Segment",
    fields: [
      { key: "speaker", label: "Speaker", type: "string", required: false },
      { key: "content", label: "Content", type: "text", required: true },
      { key: "start_time", label: "Start Time", type: "float", required: true },
      { key: "end_time", label: "End Time", type: "float", required: true },
      { key: "sequence_order", label: "Sequence", type: "integer", required: true },
    ],
  },
  task: {
    label: "Task",
    fields: [
      { key: "title", label: "Title", type: "string", required: true },
      { key: "description", label: "Description", type: "text", required: false },
      { key: "assignee", label: "Assignee", type: "string", required: false },
      { key: "due_date", label: "Due Date", type: "date", required: false },
      { key: "status", label: "Status", type: "enum", enumValues: ["pending", "in_progress", "done"], required: true },
    ],
  },
  action_item: {
    label: "Action Item",
    fields: [
      { key: "description", label: "Description", type: "text", required: true },
      { key: "assignee", label: "Assignee", type: "string", required: false },
      { key: "due_date", label: "Due Date", type: "date", required: false },
      { key: "status", label: "Status", type: "enum", enumValues: ["pending", "in_progress", "done"], required: true },
    ],
  },
  user: {
    label: "User",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "role", label: "Role", type: "string", required: false },
    ],
  },
  audio: {
    label: "Audio File",
    fields: [
      { key: "file_url", label: "File URL", type: "url", required: true },
      { key: "file_name", label: "File Name", type: "string", required: true },
      { key: "file_size_bytes", label: "File Size", type: "integer", required: false },
      { key: "duration_seconds", label: "Duration", type: "integer", required: false },
    ],
  },
  attendee: {
    label: "Attendee",
    fields: [
      { key: "name", label: "Name", type: "string", required: true },
      { key: "email", label: "Email", type: "email", required: false },
      { key: "role_in_meeting", label: "Role", type: "string", required: false },
    ],
  },
  score: {
    label: "Score",
    fields: [
      { key: "value", label: "Value", type: "float", required: true },
      { key: "label", label: "Label", type: "string", required: true },
      { key: "category", label: "Category", type: "string", required: false },
    ],
  },
};

// ---------------------------------------------------------------------------
// Entity Extraction from Prompt + Widget Text
// ---------------------------------------------------------------------------

function extractEntities(
  prompt: string,
  allText: string[]
): DomainEntity[] {
  const combined = (prompt + " " + allText.join(" ")).toLowerCase();
  const found: DomainEntity[] = [];
  const usedKeys = new Set<string>();

  for (const [keyword, config] of Object.entries(ENTITY_KEYWORDS)) {
    if (combined.includes(keyword) && !usedKeys.has(keyword)) {
      usedKeys.add(keyword);
      found.push({
        key: keyword + "s",
        label: config.label,
        fields: config.fields,
        relationships: [],
        ownershipModel: "user_owned",
        sourceLinks: [
          {
            sourceType: "user_brief",
            sourceKey: keyword,
            reason: `Keyword "${keyword}" found in prompt or UI text`,
          },
        ],
        confidence: "medium",
      });
    }
  }

  // If we found meetings + transcripts, add the relationship
  const meetingsEntity = found.find((e) => e.key === "meetings");
  const transcriptsEntity = found.find((e) => e.key === "transcripts");
  if (meetingsEntity && transcriptsEntity) {
    meetingsEntity.relationships = [
      {
        targetEntity: "transcripts",
        type: "one_to_many",
        ownershipImplied: true,
      },
    ];
  }

  // If we found meetings + action_items
  const actionItemsEntity = found.find((e) => e.key === "action_items");
  if (meetingsEntity && actionItemsEntity) {
    meetingsEntity.relationships.push({
      targetEntity: "action_items",
      type: "one_to_many",
      ownershipImplied: true,
    });
  }

  // If we found meetings + attendees
  const attendeesEntity = found.find((e) => e.key === "attendees");
  if (meetingsEntity && attendeesEntity) {
    meetingsEntity.relationships.push({
      targetEntity: "attendees",
      type: "one_to_many",
      ownershipImplied: true,
    });
  }

  return found;
}

// ---------------------------------------------------------------------------
// Role Extraction
// ---------------------------------------------------------------------------

function extractRoles(prompt: string): Role[] {
  const promptLower = prompt.toLowerCase();
  const roles: Role[] = [
    {
      key: "user",
      label: "User",
      description: "Standard user with access to their own data.",
      permissions: ["view_own", "create", "update_own"],
      isDefault: true,
      sourceLinks: [],
    },
  ];

  if (promptLower.includes("admin")) {
    roles.push({
      key: "admin",
      label: "Admin",
      description: "Administrator with full access.",
      permissions: ["manage_all", "manage_users", "view_analytics"],
      isDefault: false,
      sourceLinks: [],
    });
  }

  return roles;
}

// ---------------------------------------------------------------------------
// Page Catalog Extraction
// ---------------------------------------------------------------------------

function extractPageCatalog(
  parsed: ParsedDesignerExport,
  entities: DomainEntity[]
): PageCatalogEntry[] {
  return parsed.pages.map((page) => {
    const promptLower = (page.pagePrompt + " " + page.pageName).toLowerCase();
    let pageType: PageCatalogEntry["pageType"] = "custom";

    if (promptLower.includes("record") || promptLower.includes("transcri") || promptLower.includes("live")) {
      pageType = "detail";
    } else if (promptLower.includes("list") || promptLower.includes("feed")) {
      pageType = "list";
    } else if (promptLower.includes("dashboard") || promptLower.includes("overview")) {
      pageType = "dashboard";
    } else if (promptLower.includes("upload")) {
      pageType = "upload_process";
    } else if (promptLower.includes("form") || promptLower.includes("create")) {
      pageType = "form";
    } else if (promptLower.includes("setting")) {
      pageType = "settings";
    }

    // Find related entities by keyword matching
    const relatedEntities = entities
      .filter((e) => promptLower.includes(e.key.replace(/_/g, " ").replace(/s$/, "")))
      .map((e) => e.key);

    return {
      key: `page-${page.pageName.toLowerCase().replace(/\s+/g, "-")}`,
      label: page.pageName,
      purpose: page.pagePrompt || `${page.pageName} page`,
      pageType,
      relatedEntities,
      requiredRoles: ["user"],
      sourceLinks: [
        {
          sourceType: "designer_markdown",
          sourceKey: page.frameId,
          reason: `Page "${page.pageName}" extracted from Designer export`,
        },
      ],
    };
  });
}

// ---------------------------------------------------------------------------
// Workflow & Async Job Extraction
// ---------------------------------------------------------------------------

function extractWorkflows(
  prompt: string,
  pages: ParsedDesignerExport["pages"],
  flatWidgets: FlatWidget[]
): { workflows: Workflow[]; asyncJobs: AsyncJob[] } {
  const promptLower = prompt.toLowerCase();
  const workflows: Workflow[] = [];
  const asyncJobs: AsyncJob[] = [];

  // Detect audio processing workflow
  if (
    promptLower.includes("audio") &&
    (promptLower.includes("transcri") || promptLower.includes("analysis"))
  ) {
    workflows.push({
      key: "audio_analysis",
      label: "Audio Analysis Workflow",
      description:
        "User uploads audio, system processes it to generate transcript, attendees, action items.",
      triggerType: "user_initiated",
      steps: [
        {
          key: "upload_audio",
          label: "Upload Audio File",
          type: "user_action",
          nextStepKeys: ["create_record"],
        },
        {
          key: "create_record",
          label: "Create Meeting Record",
          type: "system_action",
          nextStepKeys: ["process_audio"],
        },
        {
          key: "process_audio",
          label: "Process Audio",
          type: "background_job",
          nextStepKeys: ["show_results"],
        },
        {
          key: "show_results",
          label: "Display Analysis Results",
          type: "system_action",
          nextStepKeys: [],
        },
      ],
      relatedEntities: ["meetings", "transcripts"],
      relatedPages: pages.map(
        (p) => `page-${p.pageName.toLowerCase().replace(/\s+/g, "-")}`
      ),
      sourceLinks: [],
    });

    asyncJobs.push({
      key: "process_audio",
      label: "Process Audio Recording",
      description:
        "Transcribes audio, identifies speakers, extracts action items and generates analysis.",
      triggerType: "user_action",
      inputEntities: ["meetings"],
      outputEntities: ["transcripts", "action_items", "attendees"],
      estimatedDuration: "minutes",
      requiresExternalApi: true,
      sourceLinks: [],
    });
  }

  // Detect analyze button in widgets → implies async processing
  const analyzeButton = flatWidgets.find(
    (w) =>
      w.type === "@std.button" &&
      w.buttonLabel?.toLowerCase().includes("analyz")
  );
  if (analyzeButton && asyncJobs.length === 0) {
    asyncJobs.push({
      key: "analyze_content",
      label: "Analyze Content",
      description: `Triggered by "${analyzeButton.buttonLabel}" button.`,
      triggerType: "user_action",
      inputEntities: [],
      outputEntities: [],
      estimatedDuration: "minutes",
      requiresExternalApi: true,
      sourceLinks: [],
    });
  }

  return { workflows, asyncJobs };
}

// ---------------------------------------------------------------------------
// File/Media Need Extraction
// ---------------------------------------------------------------------------

function extractFileNeeds(
  prompt: string,
  flatWidgets: FlatWidget[]
): FileMediaNeed[] {
  const promptLower = prompt.toLowerCase();
  const needs: FileMediaNeed[] = [];

  // Audio file upload
  if (promptLower.includes("audio") || promptLower.includes("recording")) {
    needs.push({
      key: "audio_files",
      label: "Audio Recordings",
      purpose: "Meeting audio recordings uploaded for processing.",
      allowedTypes: [
        "audio/mp3",
        "audio/wav",
        "audio/m4a",
        "audio/webm",
        "audio/ogg",
      ],
      maxSizeMb: 500,
      relatedEntity: "meetings",
      accessScope: "user_private",
    });
  }

  // Check for upload icons/buttons in widgets
  const hasUploadWidget = flatWidgets.some(
    (w) => w.iconName?.includes("upload") || w.buttonLabel?.toLowerCase().includes("upload")
  );
  if (hasUploadWidget && needs.length === 0) {
    needs.push({
      key: "file_uploads",
      label: "File Uploads",
      purpose: "User-uploaded files.",
      allowedTypes: [],
      accessScope: "user_private",
    });
  }

  return needs;
}

// ---------------------------------------------------------------------------
// Main Compiler
// ---------------------------------------------------------------------------

/**
 * Compile a ParsedDesignerExport into an AppIntentSpec.
 *
 * @param parsed - The parsed Designer export.
 * @param projectId - Project identifier.
 * @param appName - Application name (optional, will infer from prompt).
 * @returns A fully populated AppIntentSpec.
 */
export function compileAppIntentSpec(
  parsed: ParsedDesignerExport,
  projectId: string,
  appName?: string
): AppIntentSpec {
  const now = new Date().toISOString();
  const unknowns: UnknownEntry[] = [];

  // Flatten all page trees to extract text content
  const allFlatWidgets = parsed.pages.flatMap((p) =>
    flattenDslTree(p.dslRoot)
  );
  const allText = extractAllTextContent(allFlatWidgets);

  // Extract intent components
  const entities = extractEntities(parsed.originalPrompt, allText);
  const roles = extractRoles(parsed.originalPrompt);
  const pageCatalog = extractPageCatalog(parsed, entities);
  const { workflows, asyncJobs } = extractWorkflows(
    parsed.originalPrompt,
    parsed.pages,
    allFlatWidgets
  );
  const fileMediaNeeds = extractFileNeeds(
    parsed.originalPrompt,
    allFlatWidgets
  );

  // Infer app name from prompt if not provided
  const inferredName =
    appName ??
    parsed.originalPrompt
      .split(/\s+/)
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

  // Constraints
  const constraints: Constraint[] = [
    {
      key: "owner_isolation",
      description:
        "Users can only see and manage their own data unless they have admin privileges.",
      type: "security",
      relatedEntities: entities.map((e) => e.key),
      sourceLinks: [],
    },
  ];

  // Flag unknowns
  if (entities.length === 0) {
    unknowns.push({
      key: "no-entities-detected",
      category: "missing_data",
      severity: "blocking",
      summary: "No domain entities could be inferred from the prompt or UI.",
      suggestedAction:
        "Provide a more detailed product brief or add entity annotations.",
      affectedKeys: [],
      sourceLinks: [],
    });
  }

  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    generatedBy: "system",
    unknowns,
    projectId,
    originalPrompt: parsed.originalPrompt,
    appName: inferredName,
    appDescription: parsed.originalPrompt,
    domain: inferDomain(parsed.originalPrompt),
    appGoal: parsed.originalPrompt,
    roles,
    entities,
    pageCatalog,
    workflows,
    asyncJobs,
    fileMediaNeeds,
    integrationNeeds: [],
    constraints,
    nonGoals: [],
    assumptions: [
      "Users will interact with a mobile-first UI.",
      "Data is private by default and scoped to the creating user.",
    ],
  };
}

function inferDomain(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("meeting") || lower.includes("transcri"))
    return "meeting-intelligence";
  if (lower.includes("task") || lower.includes("project"))
    return "project-management";
  if (lower.includes("e-commerce") || lower.includes("shop"))
    return "e-commerce";
  if (lower.includes("social") || lower.includes("feed"))
    return "social";
  if (lower.includes("health") || lower.includes("medical"))
    return "healthcare";
  return "general";
}
