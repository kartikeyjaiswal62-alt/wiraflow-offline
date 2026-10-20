/**
 * Entity Inferrer
 *
 * Transforms AppIntentSpec entities into BackendIntentGraph entities with:
 * - Proper database field types (uuid, timestamptz, etc.)
 * - Audit fields (id, created_at, updated_at, created_by)
 * - Foreign key fields for relationships
 * - Status machines for lifecycle entities
 * - Ownership model mapping
 */

import type {
  AppIntentSpec,
  DomainEntity,
} from "@wiraflow/contracts";
import type {
  EntityIntent,
  EntityFieldIntent,
  EntityRelationIntent,
  EntityStatusMachine,
} from "@wiraflow/contracts";

// ---------------------------------------------------------------------------
// Field Type Mapping (AppIntentSpec types → Postgres types)
// ---------------------------------------------------------------------------

const FIELD_TYPE_MAP: Record<string, EntityFieldIntent["type"]> = {
  string: "varchar",
  text: "text",
  integer: "integer",
  float: "numeric",
  boolean: "boolean",
  date: "date",
  datetime: "timestamptz",
  timestamp: "timestamptz",
  uuid: "uuid",
  email: "varchar",
  url: "varchar",
  phone: "varchar",
  enum: "enum",
  json: "jsonb",
  array: "array",
};

function mapFieldType(appType: string): EntityFieldIntent["type"] {
  return FIELD_TYPE_MAP[appType] ?? "varchar";
}

// ---------------------------------------------------------------------------
// Entity Field Conversion
// ---------------------------------------------------------------------------

function convertFields(
  entity: DomainEntity,
  allEntityKeys: string[]
): EntityFieldIntent[] {
  const fields: EntityFieldIntent[] = [];

  for (const f of entity.fields) {
    // Detect foreign key fields
    const isFk =
      f.key.endsWith("_id") &&
      allEntityKeys.some(
        (ek) => ek === f.key.replace(/_id$/, "") || ek === f.key.replace(/_id$/, "s")
      );

    const targetEntity = isFk
      ? allEntityKeys.find(
          (ek) => ek === f.key.replace(/_id$/, "") || ek === f.key.replace(/_id$/, "s")
        )
      : undefined;

    const field: EntityFieldIntent = {
      key: f.key,
      label: f.label,
      type: f.type === "uuid" || isFk ? "uuid" : mapFieldType(f.type),
      nullable: !f.required,
      isPrimaryKey: false,
      isForeignKey: isFk,
      foreignKeyTarget: targetEntity
        ? { entityKey: targetEntity, fieldKey: "id" }
        : undefined,
      isIndexed: isFk, // Foreign keys should be indexed
      isUnique: false,
      enumValues: f.enumValues,
      description: f.label,
    };

    fields.push(field);
  }

  return fields;
}

// ---------------------------------------------------------------------------
// Status Machine Builder
// ---------------------------------------------------------------------------

function buildStatusMachine(
  entity: DomainEntity
): EntityStatusMachine | undefined {
  if (!entity.lifecycle?.hasStatusField || !entity.lifecycle.statusValues?.length) {
    return undefined;
  }

  const values = entity.lifecycle.statusValues;
  const states = values.map((v, i) => ({
    value: v,
    label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " "),
    isInitial: i === 0,
    isTerminal: i === values.length - 1,
  }));

  // Build sequential transitions
  const transitions = values.slice(0, -1).map((from, i) => ({
    from,
    to: values[i + 1],
    trigger: `advance_to_${values[i + 1]}`,
  }));

  return {
    entityKey: entity.key,
    statusFieldKey: "status",
    states,
    transitions,
  };
}

// ---------------------------------------------------------------------------
// Relation Inference
// ---------------------------------------------------------------------------

function inferRelations(
  spec: AppIntentSpec
): EntityRelationIntent[] {
  const relations: EntityRelationIntent[] = [];

  for (const entity of spec.entities) {
    if (!entity.relationships) continue;

    for (const rel of entity.relationships) {
      const fkFieldKey = `${rel.targetEntity.replace(/s$/, "")}_id`;
      const inverseKey = `${entity.key.replace(/s$/, "")}_id`;

      if (rel.type === "one_to_many") {
        // The "many" side gets the FK column
        relations.push({
          key: `rel-${entity.key}-${rel.targetEntity}`,
          fromEntityKey: entity.key,
          toEntityKey: rel.targetEntity,
          type: "one_to_many",
          foreignKeyFieldKey: `${entity.key.replace(/s$/, "")}_id`,
          cascadeDelete: rel.ownershipImplied ?? false,
          description: `${entity.label} has many ${rel.targetEntity}`,
        });
      } else if (rel.type === "many_to_many") {
        const joinKey = `${entity.key}_${rel.targetEntity}`;
        relations.push({
          key: `rel-${entity.key}-${rel.targetEntity}`,
          fromEntityKey: entity.key,
          toEntityKey: rel.targetEntity,
          type: "many_to_many",
          foreignKeyFieldKey: inverseKey,
          cascadeDelete: rel.ownershipImplied ?? false,
          joinTableKey: joinKey,
          description: `${entity.label} ↔ ${rel.targetEntity}`,
        });
      }
    }
  }

  return relations;
}

// ---------------------------------------------------------------------------
// Main Entity Inferrer
// ---------------------------------------------------------------------------

export interface EntityInferenceResult {
  entities: EntityIntent[];
  relations: EntityRelationIntent[];
}

/**
 * Infer backend entities from AppIntentSpec.
 * Converts high-level domain entities to database-ready entity intents
 * with proper types, audit fields, foreign keys, and status machines.
 */
export function inferEntities(spec: AppIntentSpec): EntityInferenceResult {
  const allEntityKeys = spec.entities.map((e) => e.key);
  const entities: EntityIntent[] = [];

  for (const domainEntity of spec.entities) {
    const fields = convertFields(domainEntity, allEntityKeys);
    const statusMachine = buildStatusMachine(domainEntity);

    // Add FK fields for inbound relationships (where this entity is the "many" side)
    for (const otherEntity of spec.entities) {
      if (!otherEntity.relationships) continue;
      for (const rel of otherEntity.relationships) {
        if (rel.targetEntity === domainEntity.key && rel.type === "one_to_many") {
          const fkKey = `${otherEntity.key.replace(/s$/, "")}_id`;
            if (!fields.some((f) => f.key === fkKey)) {
              fields.push({
                key: fkKey,
                label: `${otherEntity.label ?? otherEntity.key} ID`,
                type: "uuid",
                nullable: false,
                isPrimaryKey: false,
                isForeignKey: true,
                foreignKeyTarget: {
                  entityKey: otherEntity.key,
                  fieldKey: "id",
                },
                isIndexed: true,
                isUnique: false,
                description: `References ${otherEntity.key}.id`,
              });
            }
          }
        }
    }

    const entity: EntityIntent = {
      key: domainEntity.key,
      label: domainEntity.label ?? domainEntity.key,
      description: domainEntity.description,
      kind: "table",
      fields,
      auditFields: {
        hasId: true,
        hasCreatedAt: true,
        hasUpdatedAt: true,
        hasCreatedBy: domainEntity.ownershipModel === "user_owned",
      },
      ownershipModel: (domainEntity.ownershipModel as EntityIntent["ownershipModel"]) ?? "user_owned",
      routeLookupMode:
        domainEntity.ownershipModel === "user_owned" ? "by_owner" : "by_id",
      statusMachine,
      confidence: (domainEntity.confidence as EntityIntent["confidence"]) ?? "medium",
      sourceLinks: domainEntity.sourceLinks ?? [],
    };

    entities.push(entity);
  }

  const relations = inferRelations(spec);

  return { entities, relations };
}
