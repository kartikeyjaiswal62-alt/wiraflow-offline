"use client";

/**
 * Wiraflow Global Store
 *
 * Lightweight React Context store backed by localStorage.
 * Holds: API key, model name, and project list.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import type { Project, StoreState } from "./types";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const STORAGE_KEY = "wiraflow-store";

const DEFAULT_STATE: StoreState = {
  apiKey: "",
  model: "gemini-3.8-flash",
  aiProvider: "cloud",
  projects: [],
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface StoreContextValue extends StoreState {
  setApiKey: (key: string) => void;
  setModel: (model: string) => void;
  setAiProvider: (provider: "ollama" | "cloud") => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  setPrimaryMode: (mode: "design" | "backend" | "wiring") => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function loadState(): StoreState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<StoreState>;
    const provider = parsed.aiProvider || "cloud";
    let model = parsed.model || DEFAULT_STATE.model;
    if (provider === "cloud") {
      if (!model || model.startsWith("gemma") || model.includes("2.0-flash") || model.includes("1.5")) {
        model = "gemini-3.8-flash";
      }
    } else {
      if (!model || model.startsWith("gemini")) {
        model = "gemma4:e2b-it-q4_K_M";
      }
    }

    return {
      ...DEFAULT_STATE,
      ...parsed,
      aiProvider: provider,
      model,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: StoreState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or blocked — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setState(loadState());
    setLoaded(true);
  }, []);

  // Persist on every change (after initial hydration)
  useEffect(() => {
    if (loaded) saveState(state);
  }, [state, loaded]);

  const setApiKey = useCallback((apiKey: string) => {
    setState((s) => ({ ...s, apiKey }));
  }, []);

  const setModel = useCallback((model: string) => {
    setState((s) => ({ ...s, model }));
  }, []);

  const setAiProvider = useCallback((aiProvider: "ollama" | "cloud") => {
    setState((s) => ({
      ...s,
      aiProvider,
      model: aiProvider === "ollama" ? "gemma4:e2b-it-q4_K_M" : "gemini-2.0-flash",
    }));
  }, []);

  const addProject = useCallback((project: Project) => {
    setState((s) => ({ ...s, projects: [...s.projects, project] }));
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      ),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
    }));
  }, []);

  const getProject = useCallback(
    (id: string) => state.projects.find((p) => p.id === id),
    [state.projects]
  );

  const setPrimaryMode = useCallback((primaryMode: "design" | "backend" | "wiring") => {
    setState((s) => ({ ...s, primaryMode }));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ...state,
        setApiKey,
        setModel,
        setAiProvider,
        addProject,
        updateProject,
        deleteProject,
        getProject,
        setPrimaryMode,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
