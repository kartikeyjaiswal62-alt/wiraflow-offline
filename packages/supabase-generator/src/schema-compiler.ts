/**
 * Schema Compiler
 *
 * Compiles a BackendIntentGraph into a SupabaseSchemaPlan.
 * Generates: tables, columns, indexes, enums, RLS policies,
 * storage buckets, functions, and ordered migration steps.
 */

import type {
  BackendIntentGraph,
  EntityIntent,
  EntityFieldIntent,
  AccessProfile,
  StorageIntent,
  FunctionIntent,
} from "@wiraflow/contracts";
import type {
  SupabaseSchemaPlan,
  TablePlan,
  ColumnPlan,
  IndexPlan,
  EnumPlan,
  RlsPolicyPlan,
  BucketPlan,
  FunctionPlan,
  MigrationStep,
  SchemaValidation,
} from "@wiraflow/contracts";

// ---------------------------------------------------------------------------
// Field → Column Type Mapping
// ---------------------------------------------------------------------------

const PG_TYPE_MAP: Record<string, string> = {
  uuid: "uuid",
  text: "text",
  varchar: "varchar(255)",
  integer: "integer",
  bigint: "bigint",
  float: "double precision",
  numeric: "numeric",
  boolean: "boolean",
  date: "date",
  timestamp: "timestamp",
  timestamptz: "timestamptz",
  jsonb: "jsonb",
  array: "text[]",
  bytea: "bytea",
  enum: "text", // Will be replaced by actual enum type
};

function pgType(fieldType: string): string {
  return PG_TYPE_MAP[fieldType] ?? "text";
}

// ---------------------------------------------------------------------------
// Enum Extraction
// ---------------------------------------------------------------------------

function extractEnums(graph: BackendIntentGraph): EnumPlan[] {
  const enums: EnumPlan[] = [];

  for (const entity of graph.entities) {
    for (const field of entity.fields) {
      if (field.type === "enum" && field.enumValues?.length) {
        const enumName = `${entity.key}_${field.key}_enum`;
        enums.push({
          key: enumName,
          name: enumName,
          schema: "public",
          values: field.enumValues,
          comment: `Enum for ${entity.label}.${field.label}`,
        });
      }
    }
  }

  return enums;
}

// ---------------------------------------------------------------------------
// Table Compilation
// ---------------------------------------------------------------------------

function compileTable(
  entity: EntityIntent,
  enums: EnumPlan[]
): TablePlan {
  const columns: ColumnPlan[] = [];
  const indexes: IndexPlan[] = [];

  // Audit fields
  if (entity.auditFields?.hasId) {
    columns.push({
      key: "id",
      name: "id",
      type: "uuid",
      nullable: false,
      defaultExpression: "gen_random_uuid()",
      isPrimaryKey: true,
      isIndexed: true,
      isUnique: true,
      isGenerated: true,
      comment: "Primary key",
    });
  }

  // Entity fields
  for (const field of entity.fields) {
    let colType = pgType(field.type);

    // Use enum type name if it's an enum field
    if (field.type === "enum") {
      const enumPlan = enums.find(
        (e) => e.key === `${entity.key}_${field.key}_enum`
      );
      if (enumPlan) {
        colType = enumPlan.name;
      }
    }

    const col: ColumnPlan = {
      key: field.key,
      name: field.key,
      type: colType,
      nullable: field.nullable ?? false,
      defaultExpression: field.defaultValue,
      isPrimaryKey: field.isPrimaryKey ?? false,
      isIndexed: field.isIndexed ?? false,
      isUnique: field.isUnique ?? false,
      isGenerated: false,
      comment: field.description,
    };

    // Add foreign key reference
    if (field.isForeignKey && field.foreignKeyTarget) {
      col.references = {
        table: field.foreignKeyTarget.entityKey,
        column: field.foreignKeyTarget.fieldKey,
        onDelete: "cascade",
      };
    }

    columns.push(col);

    // Create index for FK and indexed fields
    if (field.isIndexed || field.isForeignKey) {
      indexes.push({
        key: `idx-${entity.key}-${field.key}`,
        name: `idx_${entity.key}_${field.key}`,
        columns: [field.key],
        unique: field.isUnique ?? false,
        method: "btree",
      });
    }
  }

  // Audit timestamp fields
  if (entity.auditFields?.hasCreatedAt) {
    columns.push({
      key: "created_at",
      name: "created_at",
      type: "timestamptz",
      nullable: false,
      defaultExpression: "now()",
      isPrimaryKey: false,
      isIndexed: false,
      isUnique: false,
      isGenerated: true,
      comment: "Row creation timestamp",
    });
  }
  if (entity.auditFields?.hasUpdatedAt) {
    columns.push({
      key: "updated_at",
      name: "updated_at",
      type: "timestamptz",
      nullable: false,
      defaultExpression: "now()",
      isPrimaryKey: false,
      isIndexed: false,
      isUnique: false,
      isGenerated: true,
      comment: "Row last update timestamp",
    });
  }
  if (entity.auditFields?.hasCreatedBy) {
    columns.push({
      key: "created_by",
      name: "created_by",
      type: "uuid",
      nullable: false,
      defaultExpression: "auth.uid()",
      isPrimaryKey: false,
      isIndexed: true,
      isUnique: false,
      isGenerated: true,
      comment: "User who created this row",
      references: {
        table: "auth.users",
        column: "id",
        onDelete: "cascade",
      },
    });

    // Index on created_by for owner-scoped queries
    indexes.push({
      key: `idx-${entity.key}-created_by`,
      name: `idx_${entity.key}_created_by`,
      columns: ["created_by"],
      unique: false,
      method: "btree",
    });
  }

  return {
    key: entity.key,
    name: entity.key,
    schema: "public",
    columns,
    indexes,
    enableRls: true,
    comment: entity.description ?? `Table for ${entity.label}`,
    sourceLinks: entity.sourceLinks ?? [],
  };
}

// ---------------------------------------------------------------------------
// RLS Policy Compilation
// ---------------------------------------------------------------------------

function compileRlsPolicies(
  profiles: AccessProfile[]
): RlsPolicyPlan[] {
  const policies: RlsPolicyPlan[] = [];

  for (const profile of profiles) {
    const tableName = profile.entityKey;

    // Build USING expression based on visibility basis
    let usingExpr: string;
    switch (profile.rowVisibilityBasis) {
      case "owner_only":
        usingExpr = `(${profile.ownerColumn ?? "created_by"} = auth.uid())`;
        break;
      case "team_scoped":
        usingExpr = `(${profile.scopeColumn ?? "team_id"} IN (SELECT team_id FROM team_members WHERE user_id = auth.uid()))`;
        break;
      case "org_scoped":
        usingExpr = `(${profile.scopeColumn ?? "org_id"} IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))`;
        break;
      case "public":
        usingExpr = "true";
        break;
      case "admin_only":
        usingExpr = `(auth.jwt() ->> 'role' = 'admin')`;
        break;
      case "role_gated":
        usingExpr = `(auth.jwt() ->> 'role' = '${profile.requiredRole ?? "admin"}')`;
        break;
      default:
        usingExpr = "(false)";
    }

    // SELECT policy
    if (profile.operations.select) {
      policies.push({
        key: `${profile.key}-select`,
        name: `${tableName}_select_${profile.key.replace(/^access-[^-]+-/, "")}`,
        tableName,
        operation: "SELECT",
        usingExpression: usingExpr,
        role: "authenticated",
        comment: `SELECT policy: ${profile.rowVisibilityBasis}`,
        sourceLinks: profile.sourceLinks ?? [],
      });
    }

    // INSERT policy
    if (profile.operations.insert) {
      const withCheck =
        profile.rowVisibilityBasis === "owner_only"
          ? `(${profile.ownerColumn ?? "created_by"} = auth.uid())`
          : usingExpr;

      policies.push({
        key: `${profile.key}-insert`,
        name: `${tableName}_insert_${profile.key.replace(/^access-[^-]+-/, "")}`,
        tableName,
        operation: "INSERT",
        usingExpression: "true",
        withCheckExpression: withCheck,
        role: "authenticated",
        comment: `INSERT policy: ${profile.rowVisibilityBasis}`,
        sourceLinks: profile.sourceLinks ?? [],
      });
    }

    // UPDATE policy
    if (profile.operations.update) {
      policies.push({
        key: `${profile.key}-update`,
        name: `${tableName}_update_${profile.key.replace(/^access-[^-]+-/, "")}`,
        tableName,
        operation: "UPDATE",
        usingExpression: usingExpr,
        withCheckExpression: usingExpr,
        role: "authenticated",
        comment: `UPDATE policy: ${profile.rowVisibilityBasis}`,
        sourceLinks: profile.sourceLinks ?? [],
      });
    }

    // DELETE policy
    if (profile.operations.delete) {
      policies.push({
        key: `${profile.key}-delete`,
        name: `${tableName}_delete_${profile.key.replace(/^access-[^-]+-/, "")}`,
        tableName,
        operation: "DELETE",
        usingExpression: usingExpr,
        role: "authenticated",
        comment: `DELETE policy: ${profile.rowVisibilityBasis}`,
        sourceLinks: profile.sourceLinks ?? [],
      });
    }
  }

  return policies;
}

// ---------------------------------------------------------------------------
// Storage Bucket Compilation
// ---------------------------------------------------------------------------

function compileBuckets(
  intents: StorageIntent[]
): BucketPlan[] {
  return intents.map((intent) => {
    const pathPolicies: BucketPlan["pathPolicies"] = [];

    // Generate path-based policies
    if (intent.accessScope === "user_private") {
      pathPolicies.push(
        {
          operation: "SELECT",
          expression: `(bucket_id = '${intent.bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        },
        {
          operation: "INSERT",
          expression: `(bucket_id = '${intent.bucketName}' AND (storage.foldername(name))[1] = auth.uid()::text)`,
        }
      );
    } else if (intent.accessScope === "public") {
      pathPolicies.push({
        operation: "SELECT",
        expression: "true",
      });
    }

    return {
      key: intent.key,
      name: intent.bucketName,
      public: intent.accessScope === "public",
      allowedMimeTypes: intent.allowedMimeTypes ?? [],
      fileSizeLimit: intent.maxFileSizeMb
        ? intent.maxFileSizeMb * 1024 * 1024
        : undefined,
      pathPolicies,
      comment: intent.purpose,
      sourceLinks: intent.sourceLinks ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// Function Compilation
// ---------------------------------------------------------------------------

function compileFunctions(
  intents: FunctionIntent[]
): FunctionPlan[] {
  return intents.map((intent) => {
    const isEdge = intent.kind === "edge_function";

    return {
      key: intent.key,
      name: intent.key.replace(/-/g, "_"),
      kind: intent.kind,
      schema: "public",
      language: isEdge ? "typescript" : "plpgsql",
      params: intent.inputContract.map((p) => ({
        name: p.key,
        type: p.type,
      })),
      returnType: isEdge ? "jsonb" : "void",
      securityDefiner: intent.needsServiceRole,
      bodyStub: isEdge
        ? `// Edge function: ${intent.label}\n// TODO: Implement ${intent.description ?? ""}`
        : `-- RPC: ${intent.label}\n-- TODO: Implement ${intent.description ?? ""}`,
      comment: intent.description,
      sourceLinks: intent.sourceLinks ?? [],
    };
  });
}

// ---------------------------------------------------------------------------
// Migration Step Generation
// ---------------------------------------------------------------------------

function generateMigrations(
  enums: EnumPlan[],
  tables: TablePlan[],
  policies: RlsPolicyPlan[],
  buckets: BucketPlan[],
  functions: FunctionPlan[]
): MigrationStep[] {
  const steps: MigrationStep[] = [];
  let order = 0;

  // 1. Create enums
  for (const e of enums) {
    steps.push({
      key: `create-enum-${e.key}`,
      order: order++,
      description: `Create enum type ${e.name}`,
      upSql: `CREATE TYPE ${e.name} AS ENUM (${e.values.map((v) => `'${v}'`).join(", ")});`,
      downSql: `DROP TYPE IF EXISTS ${e.name};`,
    });
  }

  // 2. Create tables
  for (const t of tables) {
    const colDefs = t.columns.map((c) => {
      let def = `  ${c.name} ${c.type}`;
      if (c.isPrimaryKey) def += " PRIMARY KEY";
      if (!c.nullable && !c.isPrimaryKey) def += " NOT NULL";
      if (c.defaultExpression) def += ` DEFAULT ${c.defaultExpression}`;
      if (c.isUnique) def += " UNIQUE";
      if (c.references) {
        def += ` REFERENCES ${c.references.table}(${c.references.column}) ON DELETE ${c.references.onDelete ?? "no_action"}`;
      }
      return def;
    });

    steps.push({
      key: `create-table-${t.key}`,
      order: order++,
      description: `Create table ${t.name}`,
      upSql: `CREATE TABLE ${t.name} (\n${colDefs.join(",\n")}\n);`,
      downSql: `DROP TABLE IF EXISTS ${t.name} CASCADE;`,
    });

    // Enable RLS
    if (t.enableRls) {
      steps.push({
        key: `enable-rls-${t.key}`,
        order: order++,
        description: `Enable RLS on ${t.name}`,
        upSql: `ALTER TABLE ${t.name} ENABLE ROW LEVEL SECURITY;`,
        downSql: `ALTER TABLE ${t.name} DISABLE ROW LEVEL SECURITY;`,
      });
    }

    // Create indexes
    for (const idx of t.indexes) {
      steps.push({
        key: `create-index-${idx.key}`,
        order: order++,
        description: `Create index ${idx.name}`,
        upSql: `CREATE ${idx.unique ? "UNIQUE " : ""}INDEX ${idx.name} ON ${t.name} (${idx.columns.join(", ")});`,
        downSql: `DROP INDEX IF EXISTS ${idx.name};`,
      });
    }
  }

  // 3. Create RLS policies
  for (const p of policies) {
    let policySql = `CREATE POLICY "${p.name}" ON ${p.tableName} FOR ${p.operation} TO ${p.role} USING (${p.usingExpression})`;
    if (p.withCheckExpression) {
      policySql += ` WITH CHECK (${p.withCheckExpression})`;
    }
    policySql += ";";

    steps.push({
      key: `create-policy-${p.key}`,
      order: order++,
      description: `Create RLS policy ${p.name}`,
      upSql: policySql,
      downSql: `DROP POLICY IF EXISTS "${p.name}" ON ${p.tableName};`,
    });
  }

  // 4. Create storage buckets
  for (const b of buckets) {
    steps.push({
      key: `create-bucket-${b.key}`,
      order: order++,
      description: `Create storage bucket ${b.name}`,
      upSql: `INSERT INTO storage.buckets (id, name, public) VALUES ('${b.name}', '${b.name}', ${b.public});`,
      downSql: `DELETE FROM storage.buckets WHERE id = '${b.name}';`,
    });
  }

  // 5. Create functions
  for (const f of functions) {
    if (f.kind === "rpc") {
      const params = f.params.map((p) => `${p.name} ${p.type}`).join(", ");
      steps.push({
        key: `create-function-${f.key}`,
        order: order++,
        description: `Create RPC function ${f.name}`,
        upSql: `CREATE OR REPLACE FUNCTION ${f.name}(${params}) RETURNS ${f.returnType} LANGUAGE ${f.language} ${f.securityDefiner ? "SECURITY DEFINER " : ""}AS $$\nBEGIN\n  ${f.bodyStub ?? "-- TODO"}\nEND;\n$$;`,
        downSql: `DROP FUNCTION IF EXISTS ${f.name};`,
      });
    }
    // Edge functions are not created via SQL — they're Deno files
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Main Schema Compiler
// ---------------------------------------------------------------------------

/**
 * Compile a BackendIntentGraph into a SupabaseSchemaPlan.
 *
 * Generates all concrete Supabase resources: tables, enums, columns,
 * indexes, RLS policies, storage buckets, functions, and ordered migration steps.
 */
export function compileSupabaseSchema(
  graph: BackendIntentGraph,
  projectId: string
): SupabaseSchemaPlan {
  const now = new Date().toISOString();

  // Extract enums from entity fields
  const enums = extractEnums(graph);

  // Compile tables
  const tables = graph.entities
    .filter((e) => e.kind === "table")
    .map((e) => compileTable(e, enums));

  // Compile RLS policies
  const rlsPolicies = compileRlsPolicies(graph.accessProfiles);

  // Compile storage buckets
  const buckets = compileBuckets(graph.storageIntents);

  // Compile functions
  const functions = compileFunctions(graph.functionIntents);

  // Generate ordered migration steps
  const migrationSteps = generateMigrations(
    enums,
    tables,
    rlsPolicies,
    buckets,
    functions
  );

  // Validation summary
  const validation = {
    tableCount: tables.length,
    viewCount: 0,
    policyCount: rlsPolicies.length,
    enumCount: enums.length,
    bucketCount: buckets.length,
    functionCount: functions.length,
    blockingIssues: [] as string[],
    warnings: [] as SchemaValidation["warnings"],
    migrationReady: true,
  };

  // Check for blocking issues
  for (const table of tables) {
    const hasPk = table.columns.some((c) => c.isPrimaryKey);
    if (!hasPk) {
      validation.blockingIssues.push(
        `Table "${table.name}" has no primary key`
      );
      validation.migrationReady = false;
    }
  }

  return {
    version: "1.0.0",
    createdAt: now,
    updatedAt: now,
    generatedBy: "system",
    unknowns: [],
    projectId,
    enums,
    tables,
    views: [],
    rlsPolicies,
    buckets,
    functions,
    migrationSteps,
    validation,
  };
}
