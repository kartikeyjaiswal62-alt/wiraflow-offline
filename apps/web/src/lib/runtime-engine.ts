/**
 * Wiraflow App Runtime Engine
 *
 * Manages the interactive state for Test Mode:
 * - Current page navigation and history
 * - Form field values per page
 * - Toast notification queue
 * - Action execution pipeline
 */

export interface RuntimeToast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  createdAt: number;
}

export interface RuntimeEvent {
  id: string;
  timestamp: string;
  type: "navigate" | "action" | "field_change" | "form_submit" | "mutation" | "error";
  summary: string;
  payload?: Record<string, any>;
}

export interface RuntimeState {
  currentPageKey: string;
  navigationHistory: string[];
  formState: Record<string, Record<string, string>>; // pageKey -> fieldKey -> value
  toasts: RuntimeToast[];
  events: RuntimeEvent[];
  isAuthenticated: boolean;
  user?: { email: string; id: string };
}

export function createInitialState(firstPageKey: string): RuntimeState {
  return {
    currentPageKey: firstPageKey,
    navigationHistory: [firstPageKey],
    formState: {},
    toasts: [],
    events: [],
    isAuthenticated: false,
  };
}

export function setAuthenticated(state: RuntimeState, isAuthenticated: boolean, user?: RuntimeState["user"]): RuntimeState {
  return {
    ...state,
    isAuthenticated,
    user,
  };
}

export function navigate(state: RuntimeState, targetPageKey: string): RuntimeState {
  const event: RuntimeEvent = {
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "navigate",
    summary: `Navigated to "${targetPageKey}"`,
    payload: { from: state.currentPageKey, to: targetPageKey },
  };
  return {
    ...state,
    currentPageKey: targetPageKey,
    navigationHistory: [...state.navigationHistory, targetPageKey],
    events: [...state.events, event],
  };
}

export function goBack(state: RuntimeState): RuntimeState {
  if (state.navigationHistory.length <= 1) return state;
  const newHistory = state.navigationHistory.slice(0, -1);
  const previousPage = newHistory[newHistory.length - 1];
  const event: RuntimeEvent = {
    id: `evt-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: "navigate",
    summary: `Back to "${previousPage}"`,
  };
  return {
    ...state,
    currentPageKey: previousPage,
    navigationHistory: newHistory,
    events: [...state.events, event],
  };
}

export function setField(state: RuntimeState, pageKey: string, fieldKey: string, value: string): RuntimeState {
  const pageFields = state.formState[pageKey] || {};
  return {
    ...state,
    formState: {
      ...state.formState,
      [pageKey]: { ...pageFields, [fieldKey]: value },
    },
  };
}

export function addToast(state: RuntimeState, message: string, type: RuntimeToast["type"] = "info"): RuntimeState {
  const toast: RuntimeToast = {
    id: `toast-${Date.now()}`,
    message,
    type,
    createdAt: Date.now(),
  };
  return {
    ...state,
    toasts: [...state.toasts, toast],
  };
}

export function dismissToast(state: RuntimeState, toastId: string): RuntimeState {
  return {
    ...state,
    toasts: state.toasts.filter((t) => t.id !== toastId),
  };
}

export function addEvent(state: RuntimeState, type: RuntimeEvent["type"], summary: string, payload?: Record<string, any>): RuntimeState {
  const event: RuntimeEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    type,
    summary,
    payload,
  };
  return {
    ...state,
    events: [...state.events, event],
  };
}

export function clearEvents(state: RuntimeState): RuntimeState {
  return { ...state, events: [] };
}
