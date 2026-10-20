"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Focus, Hand, Minus, Move, Plus } from "lucide-react";
import { readStr } from "../../lib/utils";
import { WidgetTree } from "./WidgetTree";
import styles from "./PagesStrip.module.css";

type Size = { w: number; h: number };
type Viewport = { x: number; y: number; scale: number };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function PagesStrip({
  uiGraph,
  selectedPageKey,
  onSelectPageKey,
  selectedWidgetKey = null,
  selectedWidgetKeys,
  onSelectWidget,
  palette,
  fonts,
  deviceSize = { w: 390, h: 844 },
  storageKey,
}: {
  uiGraph: any;
  selectedPageKey: string;
  onSelectPageKey: (key: string) => void;
  selectedWidgetKey?: string | null;
  selectedWidgetKeys?: string[];
  onSelectWidget?: (key: string) => void;
  palette?: any;
  fonts?: any;
  deviceSize?: Size;
  storageKey?: string;
}) {
  const DEVICE_PRESETS = useMemo(
    () => [
      { id: "iphone-se", label: "iPhone SE", w: 375, h: 667 },
      { id: "iphone-13-mini", label: "iPhone 13 mini", w: 375, h: 812 },
      { id: "iphone-14", label: "iPhone 14", w: 390, h: 844 },
      { id: "iphone-15-pro", label: "iPhone 15 Pro", w: 393, h: 852 },
      { id: "iphone-14-pro-max", label: "iPhone 14 Pro Max", w: 430, h: 932 },
      { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max (Mock)", w: 440, h: 956 },
    ],
    []
  );

  const containerRef = useRef<HTMLDivElement | null>(null);
  const spaceDownRef = useRef(false);
  const pageElsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [panLocked, setPanLocked] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [deviceId, setDeviceId] = useState<string>(() => {
    if (typeof window === "undefined") return "iphone-16-pro-max";
    if (!storageKey) return "iphone-16-pro-max";
    const parsed = safeParse<any>(localStorage.getItem(storageKey));
    return typeof parsed?.deviceId === "string" ? parsed.deviceId : "iphone-16-pro-max";
  });
  const devicePreset = DEVICE_PRESETS.find((d) => d.id === deviceId);
  const effectiveDeviceSize = devicePreset ? { w: devicePreset.w, h: devicePreset.h } : deviceSize;

  const [contentHeight, setContentHeight] = useState<number>(effectiveDeviceSize.h);
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const viewportRef = useRef<Viewport>(viewport);
  const panLockedRef = useRef<boolean>(panLocked);
  const hasRestoredViewportRef = useRef(false);

  useEffect(() => {
    viewportRef.current = viewport;
  }, [viewport]);

  useEffect(() => {
    panLockedRef.current = panLocked;
  }, [panLocked]);

  const pages = useMemo(() => {
    const list = uiGraph?.pages;
    return Array.isArray(list) ? list : [];
  }, [uiGraph]);

  const effectivePalette = palette ?? uiGraph?.palette;
  const effectiveFonts = fonts ?? uiGraph?.fonts;

  const pageByKey = useMemo(() => {
    const map = new Map<string, any>();
    pages.forEach((p: any) => map.set(String(p.key), p));
    return map;
  }, [pages]);

  useEffect(() => {
    // Initialize order from storage (or fall back to spec order).
    if (!storageKey) {
      setOrderedKeys(pages.map((p: any) => String(p.key)));
      return;
    }
    const saved = safeParse<{ order?: string[] }>(
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    );
    const savedOrder = Array.isArray(saved?.order) ? saved!.order!.map(String) : [];
    const current = pages.map((p: any) => String(p.key));
    const merged = [
      ...savedOrder.filter((k) => current.includes(k)),
      ...current.filter((k) => !savedOrder.includes(k)),
    ];
    setOrderedKeys(merged);
  }, [pages, storageKey]);

  // Restore last pan/zoom state (design preview)
  useEffect(() => {
    if (!storageKey) return;
    const parsed = safeParse<any>(localStorage.getItem(storageKey));
    hasRestoredViewportRef.current = false;
    if (parsed?.viewport && typeof parsed.viewport === "object") {
      const v = parsed.viewport as Partial<Viewport>;
      if (typeof v.x === "number" && typeof v.y === "number" && typeof v.scale === "number") {
        setViewport({ x: v.x, y: v.y, scale: clamp(v.scale, 0.15, 2) });
        hasRestoredViewportRef.current = true;
      }
    }
    if (typeof parsed?.panLocked === "boolean") setPanLocked(parsed.panLocked);
    if (typeof parsed?.deviceId === "string") setDeviceId(parsed.deviceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist last pan/zoom state
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ viewport, panLocked, order: orderedKeys, deviceId }));
    } catch {
      // ignore
    }
  }, [storageKey, viewport, panLocked, orderedKeys, deviceId]);

  const fitAll = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const count = Math.max(1, orderedKeys.length || pages.length);
    const gap = 28;
    const contentW = count * effectiveDeviceSize.w + (count - 1) * gap;
    const contentH = Math.max(1, contentHeight || effectiveDeviceSize.h);
    const pad = 56;
    const s = clamp(
      Math.min(1, (rect.width - pad) / contentW, (rect.height - pad) / contentH),
      0.15,
      1
    );
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldCx = contentW / 2;
    const worldCy = contentH / 2;
    setViewport({ scale: s, x: cx - worldCx * s, y: cy - worldCy * s });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // If we restored a previous viewport, don't override it.
    if (!hasRestoredViewportRef.current) fitAll();
    const ro = new ResizeObserver(fitAll);
    ro.observe(el);
    window.addEventListener("resize", fitAll);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fitAll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, effectiveDeviceSize.w, effectiveDeviceSize.h, storageKey]);

  // Measure page heights so "fit" shows entire UI (no internal scrolling).
  useEffect(() => {
    if (pages.length === 0) return;
    const measure = () => {
      let maxH = 0;
      for (const p of pages) {
        const key = String(p.key);
        const el = pageElsRef.current[key];
        if (!el) continue;
        // offsetHeight is layout height (not affected by parent transforms)
        const h = el.offsetHeight || 0;
        if (h > maxH) maxH = h;
      }
      const next = Math.max(effectiveDeviceSize.h, maxH);
      setContentHeight(next);
    };
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [pages, effectiveDeviceSize.h]);

  useEffect(() => {
    setContentHeight((h) => Math.max(effectiveDeviceSize.h, h || 0));
  }, [effectiveDeviceSize.h]);

  // When measured height changes and we don't restore a previous viewport, refit.
  useEffect(() => {
    if (storageKey) return;
    fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentHeight]);

  // Pan by dragging the background
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let panning = false;
    const base = { startX: 0, startY: 0, x: 0, y: 0, scale: 1 };
    const latest = { dx: 0, dy: 0 };
    let raf = 0;

    const flush = () => {
      raf = 0;
      if (!panning) return;
      const dx = latest.dx;
      const dy = latest.dy;
      const s = base.scale || 1;
      // transform is `translate(x,y) scale(s)` so translate is scaled; compensate for 1:1 cursor pan.
      setViewport((v) => ({ ...v, x: base.x + dx / s, y: base.y + dy / s }));
    };

    const onDown = (e: PointerEvent) => {
      const panEnabled = panLockedRef.current || spaceDownRef.current;
      if (!panEnabled) {
        const target = e.target as HTMLElement | null;
        if (target?.closest?.(`.${styles.pageViewport}`)) return;
      }
      if (panEnabled) e.preventDefault();
      panning = true;
      setIsPanning(true);
      const v = viewportRef.current;
      base.startX = e.clientX;
      base.startY = e.clientY;
      base.x = v.x;
      base.y = v.y;
      base.scale = v.scale || 1;
      latest.dx = 0;
      latest.dy = 0;
      (e.target as any)?.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!panning) return;
      latest.dx = e.clientX - base.startX;
      latest.dy = e.clientY - base.startY;
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onUp = () => {
      panning = false;
      setIsPanning(false);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Spacebar-to-pan (Figma-style)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const isTypingTarget =
        tag === "input" || tag === "textarea" || (target as any)?.isContentEditable === true;
      if (isTypingTarget) return;
      if (e.code === "Space") {
        e.preventDefault();
        spaceDownRef.current = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceDownRef.current = false;
      }
    };
    window.addEventListener("keydown", onKeyDown, { passive: false } as any);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown as any);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Zoom with wheel (keeps cursor position stable)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 0.01) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const worldX = (mx - viewport.x) / viewport.scale;
      const worldY = (my - viewport.y) / viewport.scale;
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      const nextScale = clamp(viewport.scale * (1 + delta), 0.15, 2);
      const nextX = mx - worldX * nextScale;
      const nextY = my - worldY * nextScale;
      setViewport({ scale: nextScale, x: nextX, y: nextY });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [viewport]);

  const setScale = (next: number) => {
    setViewport((v) => ({ ...v, scale: clamp(next, 0.15, 2) }));
  };

  return (
    <div
      className={`${styles.root} ${(panLocked || spaceDownRef.current) ? styles.panReady : ""} ${isPanning ? styles.panning : ""}`}
      ref={containerRef}
    >
      <div className={styles.toolbar}>
        <select
          className={styles.deviceSelect}
          value={deviceId}
          onChange={(e) => {
            setDeviceId(e.target.value);
            // Refocus on the content after resize so it feels stable.
            requestAnimationFrame(() => fitAll());
          }}
          title="Device size"
        >
          {DEVICE_PRESETS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <button className={styles.btn} onClick={() => fitAll()} title="Fit all pages">
          <Focus size={14} /> Fit
        </button>
        <button
          className={`${styles.btn} ${panLocked ? styles.btnActive : ""}`}
          onClick={() => setPanLocked((v) => !v)}
          title="Pan tool (or hold Space)"
        >
          <Hand size={14} /> Pan
        </button>
        <button
          className={styles.btn}
          onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          title="Reset zoom + pan"
        >
          <Move size={14} /> Reset
        </button>
        <button className={styles.btn} onClick={() => setScale(viewport.scale - 0.1)} title="Zoom out">
          <Minus size={14} />
        </button>
        <button className={styles.btn} onClick={() => setScale(viewport.scale + 0.1)} title="Zoom in">
          <Plus size={14} />
        </button>
        <span className={styles.zoomLabel}>{Math.round(viewport.scale * 100)}%</span>
      </div>

      <div
        className={styles.strip}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          ["--page-w" as any]: `${effectiveDeviceSize.w}px`,
          ["--page-h" as any]: `${effectiveDeviceSize.h}px`,
        }}
      >
        {(orderedKeys.length ? orderedKeys : pages.map((p: any) => String(p.key))).map((key) => {
          const p = pageByKey.get(key);
          const label = readStr(p?.label || p?.name || key);
          return (
            <div
              key={key}
              ref={(el) => {
                pageElsRef.current[key] = el;
              }}
              className={`${styles.pageViewport} ${selectedPageKey === key ? styles.pageViewportActive : ""}`}
              onMouseDown={() => onSelectPageKey(key)}
            >
              <div
                className={styles.pageHeader}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", key);
                  e.dataTransfer.effectAllowed = "move";
                  setDraggingKey(key);
                }}
                onDragEnd={() => setDraggingKey(null)}
                onDragOver={(e) => {
                  if (!draggingKey || draggingKey === key) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = e.dataTransfer.getData("text/plain") || draggingKey;
                  if (!from || from === key) return;
                  setOrderedKeys((prev) => {
                    const list = prev.length ? [...prev] : pages.map((pp: any) => String(pp.key));
                    const fromIdx = list.indexOf(from);
                    const toIdx = list.indexOf(key);
                    if (fromIdx === -1 || toIdx === -1) return list;
                    list.splice(fromIdx, 1);
                    list.splice(toIdx, 0, from);
                    return list;
                  });
                }}
                title="Drag to reorder"
              >
                <div className={styles.pageTitle}>{label}</div>
                <div className={styles.pageKey}>{key}</div>
              </div>
              <WidgetTree
                pages={uiGraph.pages as any}
                widgets={uiGraph.widgets as any}
                selectedWidgetKey={selectedWidgetKey}
                selectedWidgetKeys={selectedWidgetKeys}
                onSelectWidget={(widgetKey) => {
                  onSelectPageKey(key);
                  onSelectWidget?.(widgetKey);
                }}
                currentPageKey={key}
                renderMode="content"
                showControls={false}
                embedded
                palette={effectivePalette as any}
                fonts={effectiveFonts as any}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
