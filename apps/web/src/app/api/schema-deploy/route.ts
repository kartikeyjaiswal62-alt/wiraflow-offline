/**
 * Schema Deploy API Route
 *
 * Receives SQL migration steps and executes them against Supabase
 * using the service role key. Each step runs independently and
 * returns success/error status.
 */

import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";

interface MigrationStep {
  key: string;
  order: number;
  description: string;
  upSql: string;
  downSql: string;
}

interface DeployRequest {
  supabaseUrl: string;
  connectionString: string;
  steps: MigrationStep[];
}

interface StepResult {
  key: string;
  order: number;
  description: string;
  success: boolean;
  error?: string;
  durationMs: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: DeployRequest & { atomic?: boolean } = await req.json();

    if (!body.supabaseUrl || !body.connectionString) {
      return NextResponse.json(
        { error: "Missing Supabase URL or connection string." },
        { status: 400 }
      );
    }

    if (!body.steps?.length) {
      return NextResponse.json(
        { error: "No migration steps provided." },
        { status: 400 }
      );
    }

    // Create postgres connection
    const sql = postgres(body.connectionString, {
      ssl: "require",
      max: 1 // only need 1 connection for deploy
    });

    const sortedSteps = body.steps.sort((a, b) => a.order - b.order);
    const results: StepResult[] = [];

    // --- ATOMIC MODE (Recommended) ---
    // Runs everything in a single transaction. If any step fails, the whole thing rolls back.
    if (body.atomic) {
      const start = Date.now();
      try {
        // Concatenate all SQL into one big script
        const fullScript = sortedSteps.map(s => `-- ${s.description}\n${s.upSql}`).join("\n\n");
        
        // Execute inside a transaction
        await sql.begin(async (tx) => {
          await tx.unsafe(fullScript);
        });

        const elapsed = Date.now() - start;
        return NextResponse.json({
          success: true,
          message: "Atomic deployment successful",
          durationMs: elapsed,
          results: sortedSteps.map(s => ({
            key: s.key,
            order: s.order,
            description: s.description,
            success: true,
            durationMs: Math.round(elapsed / sortedSteps.length),
          }))
        });
      } catch (err: any) {
        const elapsed = Date.now() - start;
        return NextResponse.json({
          error: `Atomic deployment failed: ${err.message}`,
          durationMs: elapsed,
        }, { status: 500 });
      }
    }

    // --- LEGACY STEP-BY-STEP MODE ---
    for (const step of sortedSteps) {
      const start = Date.now();
      try {
        // Execute the SQL directly against the Postgres database
        await sql.unsafe(step.upSql);

        const elapsed = Date.now() - start;
        results.push({
          key: step.key,
          order: step.order,
          description: step.description,
          success: true,
          durationMs: elapsed,
        });
      } catch (err: any) {
        const elapsed = Date.now() - start;
        let errorMessage = err.message || "Unknown error";
        
        // Intercept Supabase IPv6 connection issues to give a helpful hint
        if (errorMessage.includes("ECONNREFUSED") && errorMessage.includes(":")) {
          errorMessage = `${errorMessage} (Hint: Supabase direct connections use IPv6. If your network doesn't support IPv6, please use the IPv4 Connection Pooler string from your Supabase Dashboard settings instead of the direct database URL).`;
        }

        results.push({
          key: step.key,
          order: step.order,
          description: step.description,
          success: false,
          error: errorMessage,
          durationMs: elapsed,
        });
        // Continue with remaining steps even if one fails
      }
    }

    return NextResponse.json({
      results,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (err: any) {
    console.error("[schema-deploy] error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to deploy schema" },
      { status: 500 }
    );
  }
}
