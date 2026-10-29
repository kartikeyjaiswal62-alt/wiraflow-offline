"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Info,
  SlidersHorizontal,
  Wand2,
  Undo2,
  Redo2,
  Copy,
  ChevronDown,
  ChevronRight,
  Terminal,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import styles from "./AIAssistantSidebar.module.css";
import { useStore } from "../../lib/store";
import { generateDesignSpec } from "../../lib/openai";

interface AIAssistantSidebarProps {
  projectId: string;
  designSpec: any;
  selectedWidget: { key: string; label: string; flutterWidgetType: string } | null;
  selectedWidgetKeys?: string[];
  currentPageKey?: string;
  onSetSelectionKeys?: (keys: string[]) => void;
  onSetPreviewSpec?: (spec: any | null) => void;
  isPreviewingPatch?: boolean;
  onEdited: () => void;
}

export function AIAssistantSidebar({
  projectId,
  designSpec,
  selectedWidget,
  selectedWidgetKeys,
  currentPageKey,
  onSetSelectionKeys,
  onSetPreviewSpec,
  isPreviewingPatch,
  onEdited,
}: AIAssistantSidebarProps) {
  const { apiKey, model, aiProvider, updateProject, getProject } = useStore();
  const [tab, setTab] = useState<"chat" | "prompts">("chat");
  const [scope, setScope] = useState<"widget" | "selection" | "page">("widget");
  const [previewOnly, setPreviewOnly] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(true);


  const renderMessageContent = useCallback((content: unknown) => {
    if (typeof content === "string") return content;
    if (
      content &&
      typeof content === "object" &&
      "stringVal" in content &&
      typeof (content as any).stringVal?.value === "string"
    ) {
      return (content as any).stringVal.value as string;
    }
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }, []);

  const [guidelines, setGuidelines] = useState("");
  const [promptLabGenerate, setPromptLabGenerate] = useState("");
  const [promptLabEdit, setPromptLabEdit] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const project = useMemo(() => getProject(projectId), [getProject, projectId]);
  const [localMessages, setLocalMessages] = useState<any[]>(project?.agentChatMessages || []);

  const latestDesignSpec = project?.designSpec ?? designSpec;

  const pendingPatchKey = `wiraflow.agent.pendingPatch.${projectId}`;
  const undoSessionKey = `wiraflow.agent.session.undo.${projectId}`;
  const redoSessionKey = `wiraflow.agent.session.redo.${projectId}`;
  const [pendingPatch, setPendingPatch] = useState<{
    widgets: any[];
    scope: "widget" | "selection" | "page";
    createdAt: string;
    userPrompt: string;
    appliedKeys?: string[];
  } | null>(null);
  const [undoSpec, setUndoSpec] = useState<any | null>(null);
  const [redoSpec, setRedoSpec] = useState<any | null>(null);

  const showDetailsKey = `wiraflow.agent.showDetails.${projectId}`;

  // Sync messages to localStorage to persist chat history immediately
  const chatHistoryKey = `wiraflow.agent.chatHistory.${projectId}`;

  useEffect(() => {
    // Hydrate localMessages from localStorage or project on mount
    try {
      const local = localStorage.getItem(chatHistoryKey);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0 && localMessages.length === 0) {
          setLocalMessages(parsed);
        }
      } else if (project?.agentChatMessages?.length) {
        setLocalMessages(project.agentChatMessages);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatHistoryKey]);

  useEffect(() => {
    try {
      if (localMessages.length > 0) {
        localStorage.setItem(chatHistoryKey, JSON.stringify(localMessages));
        // Also sync back to project
        updateProject(projectId, { agentChatMessages: localMessages });
      }
    } catch {
      // ignore
    }
  }, [localMessages, projectId, chatHistoryKey, updateProject]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(showDetailsKey);
      if (raw) setShowDetails(raw === "1");
    } catch {
      // ignore
    }
  }, [showDetailsKey]);

  useEffect(() => {
    try {
      localStorage.setItem(showDetailsKey, showDetails ? "1" : "0");
    } catch {
      // ignore
    }
  }, [showDetails, showDetailsKey]);



  useEffect(() => {
    const legacy = project?.agentGuidelines || "";
    const edit = project?.promptLabEdit ?? "";
    const gen = project?.promptLabGenerate ?? "";
    // Back-compat: if older projects only have agentGuidelines, treat it as the edit addendum.
    setPromptLabEdit(edit.trim().length > 0 ? edit : legacy);
    setPromptLabGenerate(gen);
    setGuidelines(legacy);
  }, [project?.agentGuidelines, project?.promptLabEdit, project?.promptLabGenerate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(pendingPatchKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.widgets)) setPendingPatch(parsed);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    try {
      const u = sessionStorage.getItem(undoSessionKey);
      const r = sessionStorage.getItem(redoSessionKey);
      setUndoSpec(u ? JSON.parse(u) : null);
      setRedoSpec(r ? JSON.parse(r) : null);
    } catch {
      setUndoSpec(null);
      setRedoSpec(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    try {
      if (undoSpec) sessionStorage.setItem(undoSessionKey, JSON.stringify(undoSpec));
      else sessionStorage.removeItem(undoSessionKey);
      if (redoSpec) sessionStorage.setItem(redoSessionKey, JSON.stringify(redoSpec));
      else sessionStorage.removeItem(redoSessionKey);
    } catch {
      // ignore
    }
  }, [undoSpec, redoSpec, undoSessionKey, redoSessionKey]);

  useEffect(() => {
    // Default scope to widget when possible; otherwise fall back to page.
    const count = Array.isArray(selectedWidgetKeys) ? selectedWidgetKeys.length : 0;
    setScope(count >= 2 ? "selection" : selectedWidget ? "widget" : "page");
  }, [selectedWidget?.key]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ block: "end" });
  }, [localMessages.length, tab, isLoading]);

  const pageKeyForScope = useMemo(() => {
    if (currentPageKey) return currentPageKey;
    if (!latestDesignSpec || !selectedWidget) return "";
    const pages = Array.isArray(latestDesignSpec?.pages) ? latestDesignSpec.pages : [];
    for (const p of pages) {
      const widgets = Array.isArray(p?.widgets) ? p.widgets : [];
      if (widgets.some((w: any) => w?.key === selectedWidget.key)) return String(p.key);
    }
    return "";
  }, [currentPageKey, latestDesignSpec, selectedWidget?.key]);

  const appendMessage = (msg: { role: "user" | "assistant"; content: string; meta?: any }) => {
    setLocalMessages((prev) => {
      const next = [
        ...prev,
        {
          id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          role: msg.role,
          content: msg.content,
          createdAt: new Date().toISOString(),
          meta: msg.meta,
        },
      ].slice(-60);
      return next;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      appendMessage({ role: "assistant", content: "Copied to clipboard." });
    } catch {
      // ignore clipboard failures
    }
  };

  const speak = useCallback((text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Choose a nice voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Female")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied.");
      } else {
        setError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  }, [isListening]);

  const mergeProperties = (base: any, patch: any) => {
    const out: any = { ...(base && typeof base === "object" ? base : {}) };
    if (!patch || typeof patch !== "object") return out;
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      const baseVal = out[k];
      if (
        baseVal &&
        typeof baseVal === "object" &&
        !Array.isArray(baseVal) &&
        v &&
        typeof v === "object" &&
        !Array.isArray(v)
      ) {
        out[k] = mergeProperties(baseVal, v);
      } else {
        out[k] = v;
      }
    }
    return out;
  };

  const mergeWidget = (baseWidget: any, patchWidget: any) => {
    const merged = { ...baseWidget, ...patchWidget };
    merged.key = baseWidget.key;
    merged.parentKey = patchWidget.parentKey ?? baseWidget.parentKey;
    merged.type = patchWidget.type ?? baseWidget.type;
    merged.label = patchWidget.label ?? baseWidget.label;
    merged.semanticRole = patchWidget.semanticRole ?? baseWidget.semanticRole;
    merged.interactive =
      typeof patchWidget.interactive === "boolean" ? patchWidget.interactive : baseWidget.interactive;
    merged.properties = mergeProperties(baseWidget.properties, patchWidget.properties);
    return merged;
  };

  const validatePatchWidgets = (spec: any, widgets: any[]) => {
    const next = JSON.parse(JSON.stringify(spec));
    const pages = Array.isArray(next?.pages) ? next.pages : [];
    const widgetIndex = new Map<string, { page: any; idx: number; widget: any }>();
    for (const p of pages) {
      const ws = Array.isArray(p?.widgets) ? p.widgets : [];
      ws.forEach((w: any, idx: number) => {
        if (w?.key) widgetIndex.set(String(w.key), { page: p, idx, widget: w });
      });
    }

    const errors: string[] = [];
    const seenPatchKeys = new Set<string>();

    for (const patch of widgets) {
      const key = String(patch?.key || "");
      if (!key) {
        errors.push("Patch contains a widget with no `key`.");
        continue;
      }
      if (seenPatchKeys.has(key)) {
        errors.push(`Patch contains duplicate widget key "${key}".`);
        continue;
      }
      seenPatchKeys.add(key);

      const hit = widgetIndex.get(key);
      if (!hit) {
        errors.push(`Patch references unknown widget key "${key}".`);
        continue;
      }

      // Block obvious destructive edits.
      if (Object.prototype.hasOwnProperty.call(patch, "type") && (patch.type == null || patch.type === "")) {
        errors.push(`Patch attempted to clear required field "type" for "${key}".`);
      }
      if (Object.prototype.hasOwnProperty.call(patch, "label") && patch.label == null) {
        errors.push(`Patch attempted to clear required field "label" for "${key}".`);
      }
      if (Object.prototype.hasOwnProperty.call(patch, "semanticRole") && patch.semanticRole == null) {
        errors.push(`Patch attempted to clear required field "semanticRole" for "${key}".`);
      }
      if (
        Object.prototype.hasOwnProperty.call(patch, "properties") &&
        patch.properties != null &&
        typeof patch.properties !== "object"
      ) {
        errors.push(`Patch has invalid "properties" for "${key}" (must be an object).`);
      }
      if (Object.prototype.hasOwnProperty.call(patch, "parentKey") && patch.parentKey != null) {
        const parentKey = String(patch.parentKey);
        if (parentKey && !widgetIndex.has(parentKey)) {
          errors.push(`Patch set parentKey of "${key}" to unknown widget "${parentKey}".`);
        }
      }
    }

    // Validate parent references after applying the patch (avoid orphan graphs).
    if (errors.length === 0) {
      for (const patch of widgets) {
        const key = String(patch?.key || "");
        if (!key) continue;
        const hit = widgetIndex.get(key);
        if (!hit) continue;
        hit.page.widgets[hit.idx] = mergeWidget(hit.widget, patch);
      }

      const finalIndex = new Map<string, any>();
      for (const p of pages) {
        const ws = Array.isArray(p?.widgets) ? p.widgets : [];
        for (const w of ws) {
          const k = String(w?.key || "");
          if (!k) continue;
          if (finalIndex.has(k)) errors.push(`Spec contains duplicate widget key "${k}" after patch.`);
          finalIndex.set(k, w);
        }
      }

      for (const w of finalIndex.values()) {
        const k = String(w?.key || "");
        const parent = w?.parentKey;
        if (parent == null) continue;
        const pk = String(parent);
        if (!finalIndex.has(pk)) errors.push(`Widget "${k}" became orphaned (missing parent "${pk}") after patch.`);
        if (pk === k) errors.push(`Widget "${k}" has parentKey pointing to itself after patch.`);
      }
    }

    return { ok: errors.length === 0, errors };
  };

  const applyPatchWidgets = (spec: any, widgets: any[]) => {
    const next = JSON.parse(JSON.stringify(spec));
    const pages = Array.isArray(next?.pages) ? next.pages : [];
    const widgetIndex = new Map<string, { page: any; idx: number; widget: any }>();
    for (const p of pages) {
      const ws = Array.isArray(p?.widgets) ? p.widgets : [];
      ws.forEach((w: any, idx: number) => {
        if (w?.key) widgetIndex.set(String(w.key), { page: p, idx, widget: w });
      });
    }
    const appliedKeys: string[] = [];
    for (const patch of widgets) {
      const key = String(patch?.key || "");
      if (!key) continue;
      const hit = widgetIndex.get(key);
      if (!hit) continue;
      const merged = mergeWidget(hit.widget, patch);
      const before = JSON.stringify(hit.widget);
      const after = JSON.stringify(merged);
      if (before !== after) {
        hit.page.widgets[hit.idx] = merged;
        appliedKeys.push(key);
      }
    }
    next.generatedAt = new Date().toISOString();
    return { spec: next, appliedKeys };
  };

  const clearPendingPatch = () => {
    setPendingPatch(null);
    try {
      localStorage.removeItem(pendingPatchKey);
    } catch {
      // ignore
    }
  };

  const expandToolCommand = (raw: string): { expanded: string; tool?: string } => {
    const t = String(raw || "").trim();
    if (!t.startsWith("/")) return { expanded: raw };
    const m = t.match(/^\/([a-zA-Z][a-zA-Z0-9_-]*)(?:\s+([\s\S]*))?$/);
    if (!m) return { expanded: raw };
    const cmd = String(m[1] || "").toLowerCase();
    const rest = String(m[2] || "").trim();

    const withRest = (base: string) => (rest ? `${base}\n\nExtra constraints:\n- ${rest}` : base);

    switch (cmd) {
      case "polish":
        return {
          tool: "polish",
          expanded: withRest(
            [
              "Polish the UI to feel premium.",
              "- Improve spacing, alignment, and hierarchy.",
              "- Use consistent padding tokens, better card structure, and clearer sections.",
              "- Make CTAs more prominent and reduce visual clutter.",
              "- Keep changes minimal and coherent (no unnecessary new widgets).",
            ].join("\n")
          ),
        };
      case "typography":
        return {
          tool: "typography",
          expanded: withRest(
            [
              "Upgrade typography quality.",
              "- Strengthen type scale: headings vs body vs captions.",
              "- Improve line heights and spacing between text blocks.",
              "- Increase contrast for readability while preserving style.",
              "- Keep text realistic; avoid placeholder copy.",
            ].join("\n")
          ),
        };
      case "charts":
        return {
          tool: "charts",
          expanded: withRest(
            [
              "Add or improve data visualization with Chart widgets (when relevant).",
              "- Prefer bar or line charts; use pie only when it makes sense.",
              "- Provide realistic data (7–12 points) with labels.",
              "- Put charts inside a premium card (Container with radius, border, subtle background).",
              "- Use accent/primary color and ensure it looks good in dark + light themes.",
              "- Avoid adding images unless absolutely necessary.",
            ].join("\n")
          ),
        };
      case "light-mode":
      case "light":
        return {
          tool: "light-mode",
          expanded: withRest(
            [
              "Improve light theme support for this UI.",
              "- Ensure strong contrast and clean surfaces (no muddy grays).",
              "- Adjust accent usage so it feels premium, not neon-overload.",
              "- Fix any awkward elements in light mode (island contrast, borders, shadows).",
            ].join("\n")
          ),
        };
      case "accessibility":
      case "a11y":
        return {
          tool: "accessibility",
          expanded: withRest(
            [
              "Improve accessibility without changing the visual style too much.",
              "- Ensure readable contrast for text and controls.",
              "- Use consistent semantic roles and clearer interactive affordances.",
              "- Increase tap target sizes for small icon buttons and chips.",
              "- Reduce reliance on opacity alone to convey meaning.",
            ].join("\n")
          ),
        };
      default:
        return { expanded: raw };
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError("");
    clearPendingPatch();

    let intent = aiProvider === "ollama" && !latestDesignSpec ? "generate_design" : "edit_ui";
    let cleanPrompt = prompt;
    if (aiProvider === "ollama" && latestDesignSpec && /\b(start over|new app|new design|generate (a )?(new )?(app|design)|create (a )?(new )?(app|design))\b/i.test(prompt)) {
      intent = "generate_design";
    }
    if (aiProvider === "ollama" && /\b(schema|database|migration|supabase|postgres|sql)\b/i.test(prompt)) {
      intent = "generate_schema";
    }
    if (aiProvider === "cloud") {
      try {
        const routeRes = await fetch("/api/agent-router", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, apiKey, model, hasDesignSpec: !!latestDesignSpec }),
        });
        if (routeRes.ok) {
          const routeData = await routeRes.json();
          intent = routeData.intent || "edit_ui";
          cleanPrompt = routeData.cleanPrompt || prompt;
        }
      } catch {
        console.warn("Router failed, falling back to edit_ui");
      }
    }

    if (intent === "edit_ui" && !latestDesignSpec) {
      setError("No design loaded for this project yet. Ask the agent to generate a design first!");
      setIsLoading(false);
      return;
    }

    if (intent === "edit_ui" && scope === "widget" && !selectedWidget) {
      setError("Select a widget first, or switch scope to Page.");
      setIsLoading(false);
      return;
    }

    if (intent === "edit_ui" && scope === "selection") {
      const count = Array.isArray(selectedWidgetKeys) ? selectedWidgetKeys.length : 0;
      if (count < 2) {
        setError("Select 2+ widgets (Shift-click) to use Selection scope.");
        setIsLoading(false);
        return;
      }
    }

    if (intent === "edit_ui" && scope === "page" && !pageKeyForScope) {
      setError("No page context found. Select a page/frame first.");
      setIsLoading(false);
      return;
    }

    const toolExpanded = expandToolCommand(cleanPrompt);
    const selectionCount = Array.isArray(selectedWidgetKeys) ? selectedWidgetKeys.length : 0;
    appendMessage({
      role: "user",
      content: prompt,
      meta: {
        intent,
        scope,
        tool: toolExpanded.tool || null,
        preview: previewOnly,
        model,
        selectionCount,
        widgetKey: selectedWidget?.key || null,
        pageKey: pageKeyForScope || null,
      },
    });
    setPrompt("");
    
    try {
      if (intent === "chat") {
        appendMessage({ role: "assistant", content: "I'm your Wiraflow AI agent. You can ask me to generate a new app design, edit your UI, or compile a database schema!" });
        setIsLoading(false);
        return;
      }

      if (intent === "generate_design") {
        appendMessage({ role: "assistant", content: "Generating completely new app design...", meta: { intent: "generate_design", processState: "loading" } });
        const result = await generateDesignSpec({ prompt: cleanPrompt, apiKey, model, provider: aiProvider || "ollama" });
        if (!result.success || !result.spec) {
          throw new Error(result.error || "Generation failed");
        }
        updateProject(projectId, { 
          designSpec: result.spec,
          name: typeof result.spec.appName === "string" ? result.spec.appName : ((result.spec.appName as any)?.stringVal?.value || "Untitled"),
          description: typeof result.spec.tagline === "string" ? result.spec.tagline : ((result.spec.tagline as any)?.stringVal?.value || ""),
          pageCount: result.spec.pages.length,
          widgetCount: result.spec.pages.reduce((s, p) => s + p.widgets.length, 0),
        });
        appendMessage({ role: "assistant", content: `Design generated successfully! Created ${result.spec.pages.length} pages.`, meta: { intent: "generate_design", processState: "done" } });
        onEdited();
        setIsLoading(false);
        return;
      }

      if (intent === "generate_schema") {
        if (!latestDesignSpec) throw new Error("Cannot generate schema without a UI design.");
        appendMessage({ role: "assistant", content: "Compiling relational Postgres schema from UI...", meta: { intent: "generate_schema", processState: "loading" } });
        const response = await fetch("/api/generate-schema", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spec: latestDesignSpec,
            prompt: project?.description || "A professional web app",
            model: model,
            provider: aiProvider || "ollama",
            ...(aiProvider === "cloud" ? { apiKey } : {}),
          }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Failed to generate schema");
        updateProject(projectId, { schemaPlan: result.schemaPlan });
        appendMessage({ role: "assistant", content: `Schema generated successfully with ${result.schemaPlan.tables.length} tables and ${result.schemaPlan.migrationSteps.length} migration steps. Go to the Database tab to view/deploy.`, meta: { intent: "generate_schema", processState: "done" } });
        onEdited();
        setIsLoading(false);
        return;
      }

      // Fallthrough: edit_ui
      const basePrompt = toolExpanded.expanded;
      const effectivePrompt =
        (promptLabEdit.trim().length > 0 || guidelines.trim().length > 0)
          ? `${basePrompt}${
              promptLabEdit.trim().length > 0
                ? `\n\nPROMPT LAB (EDITOR) ADDENDUM:\n${promptLabEdit.trim()}`
                : ""
            }${
              guidelines.trim().length > 0
                ? `\n\nPROJECT GUIDELINES:\n${guidelines.trim()}`
                : ""
            }`
          : basePrompt;

      const localMode = aiProvider === "ollama";
      const res =
        scope === "widget" && !localMode
          ? await fetch("/api/edit-design", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: effectivePrompt,
                ...(aiProvider === "cloud" ? { apiKey } : {}),
                model,
                designSpec: latestDesignSpec,
                targetWidgetKey: selectedWidget!.key,
                dryRun: previewOnly,
              }),
            })
          : await fetch("/api/agent-edit", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: effectivePrompt,
                ...(aiProvider === "cloud" ? { apiKey } : {}),
                model,
                provider: aiProvider || "ollama",
                designSpec: latestDesignSpec,
                ...(scope === "widget"
                  ? { scope: { type: "widget", targetWidgetKey: selectedWidget!.key } }
                  : scope === "page"
                  ? { scope: { type: "page", pageKey: pageKeyForScope } }
                  : { scope: { type: "app" } }),
                ...(scope === "selection"
                  ? { allowedKeys: (selectedWidgetKeys || []).slice(0, 24) }
                  : null),
                dryRun: previewOnly,
              }),
            });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit design.");

      if (previewOnly) {
        const patchWidgets = data?.patch?.widgets;
        if (!Array.isArray(patchWidgets) || patchWidgets.length === 0) {
          throw new Error("Agent returned no patch widgets.");
        }
        const patch = {
          widgets: patchWidgets,
          scope,
          createdAt: new Date().toISOString(),
          userPrompt: prompt,
          appliedKeys: Array.isArray(data.appliedKeys) ? data.appliedKeys : undefined,
        };
        setPendingPatch(patch);
        try {
          localStorage.setItem(pendingPatchKey, JSON.stringify(patch));
        } catch {
          // ignore
        }
        
        const preview = applyPatchWidgets(latestDesignSpec, patchWidgets);
        onSetPreviewSpec?.(preview.spec || null);

        appendMessage({
          role: "assistant",
          content: `Preview ready: ${patchWidgets.length} widget updates. Review and click Apply or Reject.`,
          meta: {
            kind: "patch_preview",
            patchWidgetCount: patchWidgets.length,
            appliedKeys: data.appliedKeys || null,
          },
        });
      } else {
        // Apply already done by server (legacy mode)
        updateProject(projectId, { designSpec: data.spec });
        setPrompt("");
        appendMessage({
          role: "assistant",
          content:
            scope === "widget"
              ? `Applied changes to ${selectedWidget?.flutterWidgetType || "widget"} (${selectedWidget?.key}).`
              : `Applied page-level refinements (${Array.isArray(data.appliedKeys) ? data.appliedKeys.length : "some"} widgets updated).`,
          meta: { kind: "applied", appliedKeys: data.appliedKeys || null },
        });
        onEdited();
      }
    } catch (err: any) {
      setError(err.message);
      appendMessage({ role: "assistant", content: `Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicPolish = () => {
    setPrompt("/polish");
    // We'll let the user click send to confirm, or we could auto-send.
    // Auto-sending is more "magical".
    setTimeout(() => {
      const btn = document.getElementById("agent-send-btn");
      btn?.click();
    }, 100);
  };

  const handleApplyPatch = () => {
    if (!pendingPatch || !latestDesignSpec) return;
    const validation = validatePatchWidgets(latestDesignSpec, pendingPatch.widgets);
    if (!validation.ok) {
      appendMessage({
        role: "assistant",
        content: `Blocked unsafe patch:\n- ${validation.errors.slice(0, 6).join("\n- ")}${
          validation.errors.length > 6 ? `\n- …and ${validation.errors.length - 6} more` : ""
        }`,
        meta: { kind: "patch_blocked", errorCount: validation.errors.length },
      });
      return;
    }
    onSetPreviewSpec?.(null);
    setUndoSpec(latestDesignSpec);
    setRedoSpec(null);
    const applied = applyPatchWidgets(latestDesignSpec, pendingPatch.widgets);
    updateProject(projectId, { designSpec: applied.spec });
    clearPendingPatch();
    appendMessage({
      role: "assistant",
      content: `Applied patch (${applied.appliedKeys.length} widgets updated).`,
      meta: { kind: "applied", appliedKeys: applied.appliedKeys },
    });
    onEdited();
  };

  const handleRejectPatch = () => {
    if (!pendingPatch) return;
    onSetPreviewSpec?.(null);
    clearPendingPatch();
    appendMessage({ role: "assistant", content: "Rejected preview patch (no changes applied).", meta: { kind: "rejected" } });
  };

  const handleUndo = () => {
    onSetPreviewSpec?.(null);
    if (!undoSpec || !latestDesignSpec) {
      appendMessage({ role: "assistant", content: "Nothing to undo (this session).", meta: { kind: "undo_empty" } });
      return;
    }
    setRedoSpec(latestDesignSpec);
    updateProject(projectId, { designSpec: undoSpec });
    setUndoSpec(null);
    appendMessage({ role: "assistant", content: "Undo applied.", meta: { kind: "undo" } });
    onEdited();
  };

  const handleRedo = () => {
    onSetPreviewSpec?.(null);
    if (!redoSpec || !latestDesignSpec) {
      appendMessage({ role: "assistant", content: "Nothing to redo.", meta: { kind: "redo_empty" } });
      return;
    }
    setUndoSpec(latestDesignSpec);
    updateProject(projectId, { designSpec: redoSpec });
    setRedoSpec(null);
    appendMessage({ role: "assistant", content: "Redo applied.", meta: { kind: "redo" } });
    onEdited();
  };

  const diffPaths = (base: any, next: any, limit = 24): string[] => {
    const out: string[] = [];
    const seen = new Set<any>();

    const walk = (a: any, b: any, path: string) => {
      if (out.length >= limit) return;
      if (Object.is(a, b)) return;
      const aObj = a && typeof a === "object";
      const bObj = b && typeof b === "object";
      if (!aObj || !bObj || Array.isArray(a) || Array.isArray(b)) {
        out.push(path || "(value)");
        return;
      }
      if (seen.has(a) || seen.has(b)) return;
      seen.add(a);
      seen.add(b);
      const keys = new Set<string>([...Object.keys(a || {}), ...Object.keys(b || {})]);
      for (const k of keys) {
        if (out.length >= limit) break;
        walk(a?.[k], b?.[k], path ? `${path}.${k}` : k);
      }
    };

    walk(base, next, "");
    return out;
  };

  const patchDiff = useMemo(() => {
    if (!pendingPatch || !latestDesignSpec) return [];
    const pages = Array.isArray(latestDesignSpec?.pages) ? latestDesignSpec.pages : [];
    const index = new Map<string, any>();
    for (const p of pages) {
      const ws = Array.isArray(p?.widgets) ? p.widgets : [];
      ws.forEach((w: any) => {
        if (w?.key) index.set(String(w.key), w);
      });
    }
    return pendingPatch.widgets
      .map((patch) => {
        const key = String(patch?.key || "");
        const base = index.get(key);
        if (!key || !base) return null;
        const merged = mergeWidget(base, patch);
        const paths = diffPaths(base, merged, 30);
        return {
          key,
          type: merged.type || base.type,
          changedPaths: paths,
        };
      })
      .filter(Boolean) as Array<{ key: string; type: string; changedPaths: string[] }>;
  }, [pendingPatch, latestDesignSpec]);

  const handleViewPatch = () => {
    if (!pendingPatch || !latestDesignSpec) return;
    if (isPreviewingPatch) {
      onSetPreviewSpec?.(null);
      return;
    }
    const validation = validatePatchWidgets(latestDesignSpec, pendingPatch.widgets);
    if (!validation.ok) {
      appendMessage({
        role: "assistant",
        content: `Can't preview this patch because it is unsafe:\n- ${validation.errors
          .slice(0, 6)
          .join("\n- ")}${validation.errors.length > 6 ? `\n- …and ${validation.errors.length - 6} more` : ""}`,
        meta: { kind: "patch_blocked", errorCount: validation.errors.length },
      });
      return;
    }
    const preview = applyPatchWidgets(latestDesignSpec, pendingPatch.widgets);
    onSetPreviewSpec?.(preview.spec || null);
  };

  const selectionCount = Array.isArray(selectedWidgetKeys) ? selectedWidgetKeys.length : 0;

  const lastMsgMeta = useMemo(() => {
    for (let i = localMessages.length - 1; i >= 0; i--) {
      const m = localMessages[i] as any;
      if (m?.meta && typeof m.meta === "object") return m.meta;
    }
    return null;
  }, [localMessages]);

  const renderMetaPills = (meta: any) => {
    if (!meta || typeof meta !== "object") return null;
    const pills: Array<{ label: string; tone?: "dim" | "accent" | "warn" }> = [];
    if (meta.scope) pills.push({ label: String(meta.scope).toUpperCase(), tone: "accent" });
    if (meta.tool) pills.push({ label: `/${String(meta.tool)}`, tone: "accent" });
    if (typeof meta.preview === "boolean") pills.push({ label: meta.preview ? "PREVIEW" : "APPLY", tone: "dim" });
    if (typeof meta.selectionCount === "number" && meta.selectionCount >= 2) {
      pills.push({ label: `SEL:${meta.selectionCount}`, tone: "dim" });
    }
    if (meta.widgetKey) pills.push({ label: `W:${String(meta.widgetKey)}`, tone: "dim" });
    if (meta.pageKey) pills.push({ label: `P:${String(meta.pageKey)}`, tone: "dim" });
    if (Array.isArray(meta.appliedKeys)) pills.push({ label: `Δ ${meta.appliedKeys.length}`, tone: "warn" });
    if (meta.kind && typeof meta.kind === "string") pills.push({ label: String(meta.kind).replace(/_/g, " "), tone: "dim" });
    if (pills.length === 0) return null;
    return (
      <div className={styles.metaPills}>
        {pills.slice(0, 8).map((p, idx) => (
          <span
            key={`${p.label}-${idx}`}
            className={`${styles.metaPill} ${
              p.tone === "accent" ? styles.metaPillAccent : p.tone === "warn" ? styles.metaPillWarn : styles.metaPillDim
            }`}
          >
            {p.label}
          </span>
        ))}
      </div>
    );
  };

  const [smartScope, setSmartScope] = useState<"page" | "app">("page");
  const [smartType, setSmartType] = useState<string>("");
  const [smartRole, setSmartRole] = useState<string>("");

  const smartOptions = useMemo(() => {
    const spec = latestDesignSpec;
    const pages = Array.isArray(spec?.pages) ? spec.pages : [];
    const targetPages =
      smartScope === "page" && currentPageKey
        ? pages.filter((p: any) => String(p?.key) === String(currentPageKey))
        : pages;
    const widgets: any[] = [];
    for (const p of targetPages) {
      const ws = Array.isArray(p?.widgets) ? p.widgets : [];
      widgets.push(...ws);
    }
    const typeSet = new Set<string>();
    const roleSet = new Set<string>();
    for (const w of widgets) {
      if (typeof w?.type === "string") typeSet.add(w.type);
      if (typeof w?.semanticRole === "string") roleSet.add(w.semanticRole);
    }
    const types = Array.from(typeSet).sort();
    const roles = Array.from(roleSet).sort();
    return { widgets, types, roles };
  }, [latestDesignSpec, smartScope, currentPageKey]);

  const computeSmartKeys = useCallback(() => {
    const list = smartOptions.widgets;
    const out: string[] = [];
    for (const w of list) {
      if (!w?.key) continue;
      if (smartType && String(w.type) !== smartType) continue;
      if (smartRole && String(w.semanticRole) !== smartRole) continue;
      out.push(String(w.key));
    }
    return out;
  }, [smartOptions.widgets, smartType, smartRole]);

  const applySmartSelection = (mode: "replace" | "add" | "clear") => {
    if (!onSetSelectionKeys) return;
    if (mode === "clear") {
      onSetSelectionKeys([]);
      return;
    }
    const keys = computeSmartKeys();
    if (mode === "replace") {
      onSetSelectionKeys(keys);
      return;
    }
    // add
    const prev = Array.isArray(selectedWidgetKeys) ? selectedWidgetKeys : [];
    const set = new Set<string>(prev.map(String));
    keys.forEach((k) => set.add(String(k)));
    onSetSelectionKeys(Array.from(set));
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Sparkles size={16} color="var(--accent-cyber)" />
        <h3 className={styles.headerTitle}>Agent Studio</h3>
        <div className={styles.headerRight}>
          <div className={styles.headerActions}>
            <button
              className={styles.headerActionBtn}
              title="Magic Polish"
              onClick={handleMagicPolish}
              disabled={isLoading || !latestDesignSpec}
            >
              <Wand2 size={14} />
            </button>
            <button
              className={styles.headerActionBtn}
              onClick={handleUndo}
              disabled={!undoSpec || isLoading}
              title="Undo last apply"
            >
              <Undo2 size={14} />
            </button>
            <button
              className={styles.headerActionBtn}
              onClick={handleRedo}
              disabled={!redoSpec || isLoading}
              title="Redo last undo"
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>
        <div className={styles.headerTabs}>
          <button
            className={`${styles.headerTab} ${tab === "chat" ? styles.headerTabActive : ""}`}
            onClick={() => setTab("chat")}
          >
            Chat
          </button>
          <button
            className={`${styles.headerTab} ${tab === "prompts" ? styles.headerTabActive : ""}`}
            onClick={() => setTab("prompts")}
          >
            Prompts
          </button>
        </div>
      </div>

      {tab === "chat" ? (
        <div className={styles.chatArea}>
          <div className={styles.contextRow}>
            <div className={styles.scopePills}>
              <button
                className={`${styles.pill} ${scope === "widget" ? styles.pillActive : ""}`}
                onClick={() => setScope("widget")}
                disabled={!selectedWidget}
                title={!selectedWidget ? "Select a widget to enable widget-scope edits" : "Edit selected widget"}
              >
                <Wand2 size={14} />
                Widget
              </button>
              <button
                className={`${styles.pill} ${scope === "selection" ? styles.pillActive : ""}`}
                onClick={() => setScope("selection")}
                disabled={selectionCount < 2}
                title="Edit multiple selected widgets (Shift-click to select)"
              >
                <Wand2 size={14} />
                Selection{selectionCount >= 2 ? ` (${selectionCount})` : ""}
              </button>
              <button
                className={`${styles.pill} ${scope === "page" ? styles.pillActive : ""}`}
                onClick={() => setScope("page")}
                title="Apply page-level refinements (multiple widgets)"
              >
                <SlidersHorizontal size={14} />
                Page
              </button>
            </div>
            <div className={styles.contextActions}>
              <button
                className={styles.detailsBtn}
                onClick={() => setShowDetails((v) => !v)}
                title={showDetails ? "Hide process details" : "Show process details"}
              >
                <Terminal size={14} />
                {showDetails ? "Hide details" : "Show details"}
              </button>
              <label className={styles.previewToggle}>
                <input
                  type="checkbox"
                  checked={previewOnly}
                  onChange={(e) => setPreviewOnly(e.target.checked)}
                />
                Preview
              </label>
            </div>
          </div>

          {!selectedWidget ? (
            <div className={styles.emptyState}>
              <Info size={24} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
              Select a widget to enable Widget-scope edits. Page-scope works without selection.
            </div>
          ) : (
            <div className={styles.contextCard}>
              <span className={styles.contextLabel}>CONTEXT</span>
              <div className={styles.contextHeader}>
                <span className={styles.contextTitle}>{selectedWidget.label}</span>
                <span className={styles.badge}>{selectedWidget.flutterWidgetType}</span>
              </div>
              <code className={styles.contextCode}>{typeof selectedWidget.key === "string" ? selectedWidget.key : ((selectedWidget.key as any)?.stringVal?.value || "unknown")}</code>
            </div>
          )}

          <div className={styles.quickRow}>
            <button className={styles.quickBtn} onClick={() => setPrompt("Improve spacing, alignment, and hierarchy. Make it feel premium.")}>
              Polish layout
            </button>
            <button className={styles.quickBtn} onClick={() => setPrompt("Improve typography scale and contrast. Make text more readable.")}>
              Typography
            </button>
            <button className={styles.quickBtn} onClick={() => setPrompt("Improve color usage for light theme. Ensure strong contrast and consistency.")}>
              Light theme
            </button>
          </div>

          {onSetSelectionKeys && (
            <div className={styles.smartSelect}>
              <div className={styles.smartHeader}>
                <div className={styles.smartTitle}>Smart Select</div>
                <div className={styles.smartMeta}>
                  {smartScope === "page" ? "Page" : "App"} • {smartOptions.widgets.length} widgets
                </div>
              </div>
              <div className={styles.smartRow}>
                <select
                  className={styles.smartSelectInput}
                  value={smartScope}
                  onChange={(e) => setSmartScope(e.target.value === "app" ? "app" : "page")}
                  title="Search scope"
                >
                  <option value="page">Current page</option>
                  <option value="app">Whole app</option>
                </select>
                <select
                  className={styles.smartSelectInput}
                  value={smartType}
                  onChange={(e) => setSmartType(e.target.value)}
                  title="Filter by widget type"
                >
                  <option value="">Type: Any</option>
                  {smartOptions.types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={styles.smartSelectInput}
                  value={smartRole}
                  onChange={(e) => setSmartRole(e.target.value)}
                  title="Filter by semantic role"
                >
                  <option value="">Role: Any</option>
                  {smartOptions.roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.smartActions}>
                <button className={styles.smartBtn} onClick={() => applySmartSelection("replace")}>
                  Replace
                </button>
                <button className={styles.smartBtn} onClick={() => applySmartSelection("add")}>
                  Add
                </button>
                <button className={styles.smartBtnSecondary} onClick={() => applySmartSelection("clear")}>
                  Clear
                </button>
                <span className={styles.smartCount}>
                  Match: {computeSmartKeys().length} • Selected: {selectionCount}
                </span>
              </div>
            </div>
          )}

          {showDetails && (
            <div className={styles.processPanel}>
              <div className={styles.processHeader}>
                <span className={styles.processTitle}>Process</span>
                <span className={styles.processSub}>
                  Context + trace for the latest message
                </span>
              </div>
              <div className={styles.processBody}>
                <div className={styles.processRow}>
                  <span className={styles.processKey}>Scope</span>
                  <span className={styles.processVal}>{scope}</span>
                </div>
                <div className={styles.processRow}>
                  <span className={styles.processKey}>Preview</span>
                  <span className={styles.processVal}>{previewOnly ? "on (dry-run patch)" : "off (server applies)"}</span>
                </div>
                <div className={styles.processRow}>
                  <span className={styles.processKey}>Selection</span>
                  <span className={styles.processVal}>{selectionCount}</span>
                </div>
                {selectedWidget?.key && (
                  <div className={styles.processRow}>
                    <span className={styles.processKey}>Widget</span>
                    <span className={styles.processValMono}>{selectedWidget.key}</span>
                  </div>
                )}
                {currentPageKey && (
                  <div className={styles.processRow}>
                    <span className={styles.processKey}>Page</span>
                    <span className={styles.processValMono}>{currentPageKey}</span>
                  </div>
                )}
                {lastMsgMeta && (
                  <div className={styles.processRow}>
                    <span className={styles.processKey}>Latest</span>
                    <div className={styles.processValWrap}>{renderMetaPills(lastMsgMeta)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.messages}>
            {localMessages.length === 0 && (
              <div className={styles.hint}>
                Ask for changes like: “Reduce padding, add a chart card, make CTA more prominent”.
              </div>
            )}
            {localMessages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? styles.messageUser : styles.messageAssistant}
              >
                <div className={styles.messageTop}>
                  <span className={styles.messageLabel}>{m.role === "user" ? "YOU" : "AGENT"}</span>
                  <span className={styles.messageTime}>
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {showDetails && renderMetaPills((m as any).meta)}
                <div className={styles.messageBody}>{renderMessageContent((m as any).content)}</div>
                {showDetails && (m as any).meta && (
                  <details className={styles.messageDetails}>
                    <summary className={styles.messageDetailsSummary}>
                      <span className={styles.messageDetailsIcon}>
                        <ChevronRight size={14} className={styles.messageDetailsChevronRight} />
                        <ChevronDown size={14} className={styles.messageDetailsChevronDown} />
                      </span>
                      Details
                      <button
                        className={styles.copyBtn}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyToClipboard(JSON.stringify((m as any).meta, null, 2));
                        }}
                        title="Copy details JSON"
                      >
                        <Copy size={14} />
                      </button>
                    </summary>
                    <pre className={styles.messageDetailsBody}>
                      {JSON.stringify((m as any).meta, null, 2)}
                    </pre>
                  </details>
                )}
                {showDetails && m.role === "assistant" && (
                  <div className={styles.messageActions}>
                    <button
                      className={styles.copyBtn}
                      onClick={() => speak(renderMessageContent(m.content))}
                      title={isSpeaking ? "Stop speaking" : "Read aloud"}
                    >
                      {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <button
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(String(m.content || ""))}
                      title="Copy message"
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {pendingPatch && (
              <div className={styles.patchCard}>
                <div className={styles.patchTop}>
                  <div className={styles.patchTitle}>Preview Patch</div>
                  <div className={styles.patchMeta}>
                    {pendingPatch.scope.toUpperCase()} • {pendingPatch.widgets.length} widgets
                  </div>
                </div>
                <div className={styles.patchKeys}>
                  {(pendingPatch.appliedKeys || pendingPatch.widgets.map((w) => w?.key).filter(Boolean))
                    .slice(0, 12)
                    .map((k) => (
                      <span key={k} className={styles.patchKey}>
                        {k}
                      </span>
                    ))}
                </div>
                {patchDiff.length > 0 && (
                  <div className={styles.patchDiff}>
                    {patchDiff.slice(0, 10).map((d) => (
                      <details key={d.key} className={styles.patchDiffItem}>
                        <summary className={styles.patchDiffSummary}>
                          <span className={styles.patchDiffKey}>{d.key}</span>
                          <span className={styles.patchDiffType}>{d.type}</span>
                          <span className={styles.patchDiffCount}>{d.changedPaths.length} changes</span>
                        </summary>
                        <div className={styles.patchDiffBody}>
                          {d.changedPaths.slice(0, 18).map((p) => (
                            <div key={p} className={styles.patchDiffPath}>
                              {p}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
                <div className={styles.patchActions}>
                  <button
                    className={styles.patchView}
                    onClick={handleViewPatch}
                    title="Temporarily preview this patch on the canvas (does not apply changes)"
                  >
                    {isPreviewingPatch ? "Hide" : "View"}
                  </button>
                  <button className={styles.patchApply} onClick={handleApplyPatch}>
                    Apply
                  </button>
                  <button className={styles.patchReject} onClick={handleRejectPatch}>
                    Reject
                  </button>
                  <button className={styles.patchUndo} onClick={handleUndo} title="Undo last applied patch">
                    Undo
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className={styles.messageAssistant}>
                <div className={styles.messageTop}>
                  <span className={styles.messageLabel}>AGENT</span>
                </div>
                <div className={styles.messageBody}>
                  <Loader2 size={14} className={styles.spin} /> Editing…
                </div>
              </div>
            )}
            {error && <div className={styles.errorBox}>{error}</div>}
            <div ref={chatEndRef} />
          </div>
        </div>
      ) : (
        <div className={styles.promptsArea}>
          <div className={styles.promptCard}>
            <div className={styles.promptTitle}>Prompt Lab</div>
            <div className={styles.promptSub}>
              Store project-specific addenda for generation and edits. Keep it short and directive.
            </div>
            <div className={styles.promptTitle} style={{ marginTop: 12 }}>Generator addendum</div>
            <textarea
              className={styles.promptTextarea}
              value={promptLabGenerate}
              onChange={(e) => setPromptLabGenerate(e.target.value)}
              placeholder={
                "Example:\n- Prefer charts on dashboards (bar/line).\n- Use more Flutter widgets (Tabs, BottomNav).\n- Avoid images unless essential."
              }
            />
            <div className={styles.promptTitle} style={{ marginTop: 12 }}>Editor addendum</div>
            <textarea
              className={styles.promptTextarea}
              value={promptLabEdit}
              onChange={(e) => setPromptLabEdit(e.target.value)}
              placeholder={
                "Example:\n- Minimize images.\n- Use Material 3 components.\n- Add charts where relevant.\n- Keep spacing tight, typography strong."
              }
            />
            <button
              className={styles.saveBtn}
              onClick={() =>
                updateProject(projectId, {
                  promptLabGenerate,
                  promptLabEdit,
                  // Keep legacy field in sync for older codepaths.
                  agentGuidelines: promptLabEdit,
                })
              }
            >
              Save Prompt Lab
            </button>
          </div>
        </div>
      )}

      <div className={styles.inputArea}>
        <div className={styles.inputInner}>
          <textarea
            className={styles.textarea}
            placeholder={isListening ? "Listening..." : (
              tab !== "chat"
                ? "Switch back to Chat to send instructions…"
                : scope === "widget"
                  ? selectedWidget
                    ? "e.g., Make this button more premium with better spacing and shadow"
                    : "Select a widget, or switch scope to Page…"
                  : "e.g., Improve the whole page spacing, hierarchy, and chart styling"
            )}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={tab !== "chat" || isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          {isListening && (
            <div className={styles.waveform}>
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
              <div className={styles.waveBar} />
            </div>
          )}
          <div className={styles.inputActions}>
            <button
              className={`${styles.micBtn} ${isListening ? styles.micBtnActive : ""}`}
              onClick={toggleListening}
              title="Voice Control"
              disabled={isLoading}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button 
              id="agent-send-btn"
              className={styles.sendBtn} 
              onClick={handleSend}
              disabled={tab !== "chat" || isLoading || !prompt.trim()}
              title="Send instruction"
            >
              {isLoading ? (
                <Loader2 size={16} className={styles.spin} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
