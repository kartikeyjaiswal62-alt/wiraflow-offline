/**
 * @wiraflow/preview-runtime — State Manager
 *
 * A lightweight reactive store that mirrors FlutterFlow's three state scopes:
 *   - App State (global, persists across pages)
 *   - Page State (per-page, resets on navigation)
 *   - Widget State (per-widget, e.g. TextField value, Checkbox checked)
 *
 * The store is intentionally simple — no external dependencies.
 * React components will subscribe via useSyncExternalStore or polling.
 */

export type StateScope = "app" | "page" | "widget";

export interface StateEntry {
  key: string;
  scope: StateScope;
  value: unknown;
  type: string; // e.g. "String", "Boolean", "List<String>"
  updatedAt: string;
}

type StateListener = () => void;

export class StateManager {
  private store = new Map<string, StateEntry>();
  private listeners = new Set<StateListener>();

  /** Get a state value by scoped key (e.g. "widget:email_field"). */
  get(scopedKey: string): unknown {
    return this.store.get(scopedKey)?.value;
  }

  /** Get the full entry for inspection. */
  getEntry(scopedKey: string): StateEntry | undefined {
    return this.store.get(scopedKey);
  }

  /** Set or update a state value. */
  set(scope: StateScope, key: string, value: unknown, type = "dynamic"): void {
    const scopedKey = `${scope}:${key}`;
    this.store.set(scopedKey, {
      key,
      scope,
      value,
      type,
      updatedAt: new Date().toISOString(),
    });
    this.notify();
  }

  /** Delete a single key. */
  delete(scope: StateScope, key: string): void {
    this.store.delete(`${scope}:${key}`);
    this.notify();
  }

  /** Clear all state within a specific scope (e.g. on page navigation). */
  clearScope(scope: StateScope): void {
    for (const [scopedKey] of this.store) {
      if (scopedKey.startsWith(`${scope}:`)) {
        this.store.delete(scopedKey);
      }
    }
    this.notify();
  }

  /** Return a snapshot of all state entries. */
  snapshot(): StateEntry[] {
    return Array.from(this.store.values());
  }

  /** Return a snapshot as a plain object (for trace payloads). */
  snapshotRecord(): Record<string, unknown> {
    const record: Record<string, unknown> = {};
    for (const [key, entry] of this.store) {
      record[key] = entry.value;
    }
    return record;
  }

  /** Subscribe to state changes (for React useSyncExternalStore). */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}
