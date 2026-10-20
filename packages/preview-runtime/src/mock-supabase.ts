/**
 * @wiraflow/preview-runtime — Mock Supabase Client
 *
 * Simulates Supabase operations (select, insert, update, delete, rpc, storage)
 * during preview mode. All operations resolve with synthetic data and
 * emit appropriate events to the EventBus for debug tracing.
 */

import type { DebugEvent } from "@wiraflow/contracts";
import { EventBus } from "./event-bus.js";

let eventCounter = 0;
function nextEventId(): string {
  return `mock-evt-${++eventCounter}`;
}

export interface MockQueryResult {
  data: Record<string, unknown>[] | null;
  error: { message: string; code: string } | null;
  count: number;
}

export class MockSupabaseClient {
  private tables = new Map<string, Record<string, unknown>[]>();
  private bus: EventBus;
  private sessionId: string;

  constructor(bus: EventBus, sessionId: string) {
    this.bus = bus;
    this.sessionId = sessionId;
  }

  /** Seed a table with initial mock data. */
  seed(table: string, rows: Record<string, unknown>[]): void {
    this.tables.set(table, [...rows]);
  }

  /** SELECT — returns all rows from the mock table. */
  async select(table: string, filters?: Record<string, unknown>): Promise<MockQueryResult> {
    const start = Date.now();
    this.emitEvent("query_started", `SELECT from ${table}`, { table, filters });

    await delay(randomLatency());

    const rows = this.tables.get(table) ?? [];
    let filtered = rows;

    if (filters) {
      filtered = rows.filter((row) =>
        Object.entries(filters).every(([k, v]) => row[k] === v)
      );
    }

    this.emitEvent("query_completed", `Returned ${filtered.length} rows from ${table}`, {
      table,
      rowCount: filtered.length,
      durationMs: Date.now() - start,
    });

    return { data: filtered, error: null, count: filtered.length };
  }

  /** INSERT — adds a row to the mock table. */
  async insert(table: string, row: Record<string, unknown>): Promise<MockQueryResult> {
    const start = Date.now();
    this.emitEvent("mutation_started", `INSERT into ${table}`, { table, row });

    await delay(randomLatency());

    if (!this.tables.has(table)) {
      this.tables.set(table, []);
    }
    const withId = { id: crypto.randomUUID?.() ?? `mock-${Date.now()}`, ...row };
    this.tables.get(table)!.push(withId);

    this.emitEvent("mutation_completed", `Inserted 1 row into ${table}`, {
      table,
      insertedRow: withId,
      durationMs: Date.now() - start,
    });

    return { data: [withId], error: null, count: 1 };
  }

  /** UPDATE — update matching rows. */
  async update(
    table: string,
    match: Record<string, unknown>,
    updates: Record<string, unknown>
  ): Promise<MockQueryResult> {
    const start = Date.now();
    this.emitEvent("mutation_started", `UPDATE ${table}`, { table, match, updates });

    await delay(randomLatency());

    const rows = this.tables.get(table) ?? [];
    let count = 0;
    for (const row of rows) {
      const isMatch = Object.entries(match).every(([k, v]) => row[k] === v);
      if (isMatch) {
        Object.assign(row, updates);
        count++;
      }
    }

    this.emitEvent("mutation_completed", `Updated ${count} rows in ${table}`, {
      table,
      updatedCount: count,
      durationMs: Date.now() - start,
    });

    return { data: null, error: null, count };
  }

  /** DELETE — remove matching rows. */
  async remove(table: string, match: Record<string, unknown>): Promise<MockQueryResult> {
    const start = Date.now();
    this.emitEvent("mutation_started", `DELETE from ${table}`, { table, match });

    await delay(randomLatency());

    const rows = this.tables.get(table) ?? [];
    const before = rows.length;
    const kept = rows.filter(
      (row) => !Object.entries(match).every(([k, v]) => row[k] === v)
    );
    this.tables.set(table, kept);
    const removed = before - kept.length;

    this.emitEvent("mutation_completed", `Deleted ${removed} rows from ${table}`, {
      table,
      deletedCount: removed,
      durationMs: Date.now() - start,
    });

    return { data: null, error: null, count: removed };
  }

  /** RPC — simulate a stored procedure call. */
  async rpc(functionName: string, args?: Record<string, unknown>): Promise<MockQueryResult> {
    const start = Date.now();
    this.emitEvent("function_called", `RPC: ${functionName}`, { functionName, args });

    await delay(randomLatency());

    this.emitEvent("function_response", `RPC ${functionName} completed`, {
      functionName,
      result: { success: true },
      durationMs: Date.now() - start,
    });

    return { data: [{ result: "ok" }], error: null, count: 1 };
  }

  private emitEvent(
    eventType: DebugEvent["eventType"],
    summary: string,
    payload: Record<string, unknown>
  ): void {
    this.bus.emit({
      eventId: nextEventId(),
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      summary,
      payload,
      sourceLinks: [],
    });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(): number {
  return 50 + Math.random() * 150; // 50–200ms simulated latency
}
