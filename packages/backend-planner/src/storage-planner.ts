/**
 * Storage Planner
 *
 * Infers Supabase storage bucket intents from AppIntentSpec file media needs.
 * Generates owner-scoped path templates and content type restrictions.
 */

import type { AppIntentSpec, FileMediaNeed } from "@wiraflow/contracts";
import type { StorageIntent } from "@wiraflow/contracts";

/**
 * Infer storage bucket intents from file media needs.
 */
export function inferStorageIntents(
  spec: AppIntentSpec
): StorageIntent[] {
  if (!spec.fileMediaNeeds?.length) return [];

  return spec.fileMediaNeeds.map((need) => {
    const accessScope = mapAccessScope(need.accessScope);
    const pathTemplate = buildPathTemplate(need, accessScope);

    return {
      key: need.key,
      bucketName: need.key.replace(/_/g, "-"),
      purpose: need.purpose,
      accessScope,
      allowedMimeTypes: need.allowedTypes ?? [],
      maxFileSizeMb: need.maxSizeMb,
      pathTemplate,
      relatedEntityKey: need.relatedEntity,
      confidence: "high" as const,
      sourceLinks: [],
    };
  });
}

function mapAccessScope(
  scope?: string
): StorageIntent["accessScope"] {
  switch (scope) {
    case "public":
      return "public";
    case "user_private":
      return "user_private";
    case "team_scoped":
      return "team_scoped";
    case "admin_only":
      return "admin_only";
    default:
      return "user_private";
  }
}

function buildPathTemplate(
  need: FileMediaNeed,
  accessScope: StorageIntent["accessScope"]
): string {
  const base = need.key.replace(/_/g, "-");

  switch (accessScope) {
    case "user_private":
      return `${base}/{user_id}/{filename}`;
    case "team_scoped":
      return `${base}/{team_id}/{user_id}/{filename}`;
    case "public":
      return `${base}/public/{filename}`;
    case "admin_only":
      return `${base}/admin/{filename}`;
    default:
      return `${base}/{user_id}/{filename}`;
  }
}
