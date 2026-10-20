/**
 * Golden Fixture: TaskBoard Sample App Intent Spec
 *
 * A simple project management app used purely as a test fixture
 * to validate Wiraflow contract schemas. Not related to any real project.
 */

import type { AppIntentSpec } from "../../src/app-intent-spec.js";

const now = new Date().toISOString();

export const SAMPLE_APP_INTENT_SPEC: AppIntentSpec = {
  version: "1.0.0",
  createdAt: now,
  updatedAt: now,
  generatedBy: "system",
  unknowns: [],

  projectId: "taskboard-001",
  originalPrompt:
    "Build a task management app where teams can create projects, add tasks, assign them to members, and track progress. Admins manage everything, members manage their own tasks.",

  appName: "TaskBoard",
  appDescription:
    "A collaborative task management app for small teams to organize projects, assign tasks, and track progress.",
  domain: "project-management",
  appGoal:
    "Enable small teams to manage projects and tasks with clear ownership, status tracking, and file attachments.",

  roles: [
    {
      key: "admin",
      label: "Admin",
      description: "Full access to all projects, tasks, and team management.",
      permissions: ["manage_all_projects", "manage_users", "view_analytics"],
      isDefault: false,
      sourceLinks: [],
    },
    {
      key: "member",
      label: "Member",
      description: "Can create tasks, update assigned tasks, and view team projects.",
      permissions: ["create_task", "update_own_tasks", "view_team_projects"],
      isDefault: true,
      sourceLinks: [],
    },
  ],

  entities: [
    {
      key: "projects",
      label: "Project",
      description: "A container for related tasks.",
      fields: [
        { key: "name", label: "Name", type: "string", required: true },
        { key: "description", label: "Description", type: "text", required: false },
        {
          key: "status",
          label: "Status",
          type: "enum",
          enumValues: ["active", "archived", "completed"],
          required: true,
        },
      ],
      relationships: [
        { targetEntity: "tasks", type: "one_to_many", ownershipImplied: true },
      ],
      lifecycle: {
        hasStatusField: true,
        statusValues: ["active", "archived", "completed"],
      },
      ownershipModel: "team_owned",
      sourceLinks: [],
      confidence: "high",
    },
    {
      key: "tasks",
      label: "Task",
      description: "A unit of work within a project.",
      fields: [
        { key: "project_id", label: "Project ID", type: "uuid", required: true },
        { key: "title", label: "Title", type: "string", required: true },
        { key: "description", label: "Description", type: "text", required: false },
        { key: "assignee_id", label: "Assignee", type: "uuid", required: false },
        {
          key: "priority",
          label: "Priority",
          type: "enum",
          enumValues: ["low", "medium", "high", "urgent"],
          required: true,
        },
        {
          key: "status",
          label: "Status",
          type: "enum",
          enumValues: ["todo", "in_progress", "review", "done"],
          required: true,
        },
        { key: "due_date", label: "Due Date", type: "date", required: false },
      ],
      relationships: [
        { targetEntity: "task_attachments", type: "one_to_many", ownershipImplied: true },
      ],
      lifecycle: {
        hasStatusField: true,
        statusValues: ["todo", "in_progress", "review", "done"],
      },
      ownershipModel: "team_owned",
      sourceLinks: [],
      confidence: "high",
    },
    {
      key: "task_attachments",
      label: "Task Attachment",
      description: "A file attached to a task.",
      fields: [
        { key: "task_id", label: "Task ID", type: "uuid", required: true },
        { key: "file_url", label: "File URL", type: "url", required: true },
        { key: "file_name", label: "File Name", type: "string", required: true },
        { key: "file_size_bytes", label: "File Size", type: "integer", required: false },
      ],
      relationships: [],
      ownershipModel: "team_owned",
      sourceLinks: [],
      confidence: "high",
    },
    {
      key: "comments",
      label: "Comment",
      description: "A comment on a task.",
      fields: [
        { key: "task_id", label: "Task ID", type: "uuid", required: true },
        { key: "body", label: "Body", type: "text", required: true },
      ],
      relationships: [],
      ownershipModel: "user_owned",
      sourceLinks: [],
      confidence: "high",
    },
  ],

  pageCatalog: [
    {
      key: "project_list",
      label: "Projects",
      purpose: "Browse all team projects with status filters.",
      pageType: "list",
      relatedEntities: ["projects"],
      requiredRoles: ["member", "admin"],
      sourceLinks: [],
    },
    {
      key: "project_detail",
      label: "Project Detail",
      purpose: "View a project's tasks with kanban-style status columns.",
      pageType: "detail",
      relatedEntities: ["projects", "tasks"],
      requiredRoles: ["member", "admin"],
      sourceLinks: [],
    },
    {
      key: "task_form",
      label: "Create / Edit Task",
      purpose: "Create a new task or edit an existing one with file attachments.",
      pageType: "form",
      relatedEntities: ["tasks", "task_attachments"],
      requiredRoles: ["member", "admin"],
      sourceLinks: [],
    },
    {
      key: "dashboard",
      label: "Dashboard",
      purpose: "Overview of active projects, tasks due soon, and team activity.",
      pageType: "dashboard",
      relatedEntities: ["projects", "tasks"],
      requiredRoles: ["member", "admin"],
      sourceLinks: [],
    },
  ],

  workflows: [
    {
      key: "create_task_with_attachment",
      label: "Create Task with Attachment",
      description: "User creates a task and optionally attaches a file.",
      triggerType: "user_initiated",
      steps: [
        {
          key: "fill_form",
          label: "Fill Task Form",
          type: "user_action",
          nextStepKeys: ["create_task"],
        },
        {
          key: "create_task",
          label: "Create Task Record",
          type: "system_action",
          nextStepKeys: ["upload_attachment"],
        },
        {
          key: "upload_attachment",
          label: "Upload Attachment (optional)",
          type: "user_action",
          nextStepKeys: ["save_attachment"],
        },
        {
          key: "save_attachment",
          label: "Save Attachment Metadata",
          type: "system_action",
          nextStepKeys: [],
        },
      ],
      relatedEntities: ["tasks", "task_attachments"],
      relatedPages: ["task_form", "project_detail"],
      sourceLinks: [],
    },
  ],

  asyncJobs: [],

  fileMediaNeeds: [
    {
      key: "task_files",
      label: "Task Attachments",
      purpose: "Files attached to tasks — documents, screenshots, etc.",
      allowedTypes: ["image/png", "image/jpeg", "application/pdf", "text/plain"],
      maxSizeMb: 50,
      relatedEntity: "task_attachments",
      accessScope: "team_scoped",
    },
  ],

  integrationNeeds: [],

  constraints: [
    {
      key: "team_isolation",
      description: "Team members can only see projects and tasks within their team.",
      type: "security",
      relatedEntities: ["projects", "tasks", "task_attachments", "comments"],
      sourceLinks: [],
    },
  ],

  nonGoals: [
    "Time tracking or billing",
    "Gantt charts or resource planning",
    "External integrations with Jira, Asana, etc.",
  ],

  assumptions: [
    "Teams are small (under 20 people).",
    "All team members can see all projects within their team.",
    "File attachments are scoped to the team, not individual users.",
  ],
};
