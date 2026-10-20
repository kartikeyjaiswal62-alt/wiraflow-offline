/**
 * @wiraflow/preview-runtime — Event Bus
 *
 * A lightweight typed pub/sub system that connects the ActionExecutor
 * to the frontend UI (DebugRail, RightInspector).
 *
 * The bus emits DebugEvent objects as defined in @wiraflow/contracts.
 */

import type { DebugEvent, DebugEventType } from "@wiraflow/contracts";

export type EventHandler = (event: DebugEvent) => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private allHandlers = new Set<EventHandler>();

  /** Subscribe to a specific event type. */
  on(eventType: DebugEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  /** Subscribe to ALL events (used by DebugRail). */
  onAny(handler: EventHandler): () => void {
    this.allHandlers.add(handler);
    return () => {
      this.allHandlers.delete(handler);
    };
  }

  /** Emit an event to all matching subscribers. */
  emit(event: DebugEvent): void {
    // Notify type-specific handlers
    const typeHandlers = this.handlers.get(event.eventType);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(event);
        } catch (e) {
          console.error(`[EventBus] Handler error for ${event.eventType}:`, e);
        }
      }
    }

    // Notify wildcard handlers
    for (const handler of this.allHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error(`[EventBus] Wildcard handler error:`, e);
      }
    }
  }

  /** Remove all subscribers. */
  clear(): void {
    this.handlers.clear();
    this.allHandlers.clear();
  }
}
