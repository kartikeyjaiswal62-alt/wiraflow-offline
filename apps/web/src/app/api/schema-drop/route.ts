/**
 * Schema Drop API Route
 *
 * Executes a full reset of the public schema on Supabase.
 * Drops all tables in the public schema using CASCADE.
 */

import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

export async function POST(req: NextRequest) {
  try {
    const { connectionString } = await req.json();

    if (!connectionString) {
      return NextResponse.json(
        { error: "Missing connection string." },
        { status: 400 }
      );
    }

    // Create postgres connection
    const sql = postgres(connectionString, {
      ssl: "require",
      max: 1
    });

    // SQL to drop all tables and types in public schema
    const dropSql = `
      DO $$ DECLARE
          r RECORD;
      BEGIN
          -- Drop all tables
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
          
          -- Drop all custom types (enums)
          FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
              EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
          END LOOP;
      END $$;
    `;

    await sql.unsafe(dropSql);

    return NextResponse.json({ success: true, message: "All tables dropped successfully." });
  } catch (err: any) {
    console.error("[SchemaDrop] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to drop tables" },
      { status: 500 }
    );
  }
}
