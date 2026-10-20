/**
 * Access Planner
 *
 * Infers RLS access profiles for each entity based on ownership model,
 * roles, and data access patterns. Produces AccessProfile objects that
 * the schema compiler will turn into real RLS policy SQL.
 */

import type { AppIntentSpec } from "@wiraflow/contracts";
import type { AccessProfile, EntityIntent } from "@wiraflow/contracts";

/**
 * Infer access profiles from entities and roles.
 */
export function inferAccessProfiles(
  entities: EntityIntent[],
  spec: AppIntentSpec
): AccessProfile[] {
  const profiles: AccessProfile[] = [];
  const hasAdmin = spec.roles.some((r) => r.key === "admin");

  for (const entity of entities) {
    // Determine row visibility based on ownership model
    let rowVisibilityBasis: AccessProfile["rowVisibilityBasis"];
    let ownerColumn: string | undefined;
    let scopeColumn: string | undefined;

    switch (entity.ownershipModel) {
      case "user_owned":
        rowVisibilityBasis = "owner_only";
        ownerColumn = "created_by";
        break;
      case "team_owned":
        rowVisibilityBasis = "team_scoped";
        scopeColumn = "team_id";
        break;
      case "org_owned":
        rowVisibilityBasis = "org_scoped";
        scopeColumn = "org_id";
        break;
      case "public":
        rowVisibilityBasis = "public";
        break;
      case "system":
        rowVisibilityBasis = "admin_only";
        break;
      default:
        rowVisibilityBasis = "owner_only";
        ownerColumn = "created_by";
    }

    // Standard user profile — SELECT + INSERT for own data
    profiles.push({
      key: `access-${entity.key}-user`,
      entityKey: entity.key,
      rowVisibilityBasis,
      ownerColumn,
      scopeColumn,
      operations: {
        select: true,
        insert: true,
        update: rowVisibilityBasis === "owner_only" || rowVisibilityBasis === "team_scoped",
        delete: false,
      },
      confidence: "medium",
      sourceLinks: [],
    });

    // Admin profile — full access if admin role exists
    if (hasAdmin) {
      profiles.push({
        key: `access-${entity.key}-admin`,
        entityKey: entity.key,
        rowVisibilityBasis: "public",
        requiredRole: "admin",
        operations: {
          select: true,
          insert: true,
          update: true,
          delete: true,
        },
        confidence: "high",
        sourceLinks: [],
      });
    }
  }

  return profiles;
}
