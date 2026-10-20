/**
 * Schema Fetch API Route
 *
 * Queries the Supabase database's information_schema to return
 * the current schema (tables, columns, types, constraints).
 * Used to verify deployed schema matches the plan.
 */

import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

interface SchemaTable {
  name: string;
  schema: string;
  columns: SchemaColumn[];
  rlsEnabled: boolean;
}

interface SchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { connectionString } = body;

    if (!connectionString) {
      return NextResponse.json(
        { error: "Missing Postgres connection string." },
        { status: 400 }
      );
    }

    // Initialize postgres
    const sql = postgres(connectionString, { ssl: "require", max: 1 });

    let tables: SchemaTable[] = [];

    // Use the exec_sql helper to query information_schema
    const tablesQuery = `
      SELECT 
        t.table_name,
        t.table_schema,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'name', c.column_name,
            'type', c.data_type,
            'nullable', c.is_nullable = 'YES',
            'defaultValue', c.column_default,
            'isPrimaryKey', EXISTS(
              SELECT 1 FROM information_schema.key_column_usage kcu
              JOIN information_schema.table_constraints tc
                ON kcu.constraint_name = tc.constraint_name
                AND tc.constraint_type = 'PRIMARY KEY'
              WHERE kcu.table_name = c.table_name
                AND kcu.column_name = c.column_name
                AND kcu.table_schema = c.table_schema
            )
          ) ORDER BY c.ordinal_position)
          FROM information_schema.columns c
          WHERE c.table_name = t.table_name
            AND c.table_schema = t.table_schema
          ), '[]'::json
        ) as columns,
        EXISTS(
          SELECT 1 FROM pg_tables pt
          WHERE pt.tablename = t.table_name
            AND pt.schemaname = t.table_schema
            AND pt.rowsecurity = true
        ) as rls_enabled
      FROM information_schema.tables t
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name;
    `;

    try {
      const queryResult = await sql.unsafe(tablesQuery);

      tables = queryResult.map(
        (row: any) => ({
          name: row.table_name,
          schema: row.table_schema,
          columns: typeof row.columns === "string"
            ? JSON.parse(row.columns)
            : row.columns || [],
          rlsEnabled: row.rls_enabled ?? false,
        })
      );
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        tables: [],
        message: err.message,
      });
    }

    return NextResponse.json({
      success: true,
      tables,
      tableCount: tables.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
