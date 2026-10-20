"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus, Focus, Move } from "lucide-react";
import { WidgetTree } from "./WidgetTree";
import styles from "./PageBoard.module.css";

type BoardViewport = { x: number; y: number; scale: number };
type PagePos = { x: number; y: number };

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

export function PageBoard({
  sessionId,
  uiGraph,
  currentPageKey,
  onSetCurrentPageKey,
}: {
  sessionId: string;
  uiGraph: any;
  currentPageKey: string;
  onSetCurrentPageKey: (key: string) => void;
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const positionsRef = useRef<Record<string, PagePos>>({});
  const [viewport, setViewport] = useState<BoardViewport>({ x: 140, y: 120, scale: 0.7 });
  const [positions, setPositions] = useState<Record<string, PagePos>>({});

  const storageKey = `wiraflow.board.${sessionId}`;

  const pageKeys: string[] = useMemo(() => {
    const pages = uiGraph?.pages;
    return Array.isArray(pages) ? pages.map((p: any) => String(p.key)) : [];
  }, [uiGraph]);

  useEffect(() => {
    const saved = safeParse<{ viewport: BoardViewport; positions: Record<string, PagePos> }>(
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null
    );
    if (saved?.viewport) setViewport(saved.viewport);
    if (saved?.positions) setPositions(saved.positions);
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ viewport, positions }));
    } catch {
      // ignore
    }
  }, [storageKey, viewport, positions]);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      const tileW = 560;
      const tileH = 1040;
      const gapX = 80;
      const gapY = 80;
      pageKeys.forEach((k, i) => {
        if (next[k]) return;
        const col = i % 3;
        const row = Math.floor(i / 3);
        next[k] = { x: col * (tileW + gapX), y: row * (tileH + gapY) };
      });
      return next;
    });
  }, [pageKeys]);

  const setScale = (nextScale: number) => {
    setViewport((v) => ({ ...v, scale: clamp(nextScale, 0.25, 2) }));
  };

  const fitAll = () => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const keys = pageKeys;
    if (keys.length === 0) return;
    const tileW = 560;
    const tileH = 1040;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    keys.forEach((k) => {
      const p = positionsRef.current[k] || { x: 0, y: 0 };
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + tileW);
      maxY = Math.max(maxY, p.y + tileH);
    });
    const pad = 80;
    const contentW = Math.max(1, (maxX - minX) + pad * 2);
    const contentH = Math.max(1, (maxY - minY) + pad * 2);
    const s = clamp(Math.min(rect.width / contentW, rect.height / contentH), 0.25, 1);
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const worldCx = minX + (maxX - minX) / 2;
    const worldCy = minY + (maxY - minY) / 2;
    setViewport({ scale: s, x: cx - worldCx * s, y: cy - worldCy * s });
  };

  // Fit pages into view (no scrollbars) on mount + resize.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const run = () => fitAll();
    // allow positions/layout to settle
    const raf = requestAnimationFrame(run);

    const ro = new ResizeObserver(run);
    ro.observe(el);
    window.addEventListener("resize", run);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKeys.length]);

  // Pan
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let panning = false;
    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;

    const onDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(`[data-page-tile]`)) return;
      panning = true;
      startX = e.clientX;
      startY = e.clientY;
      baseX = viewport.x;
      baseY = viewport.y;
      (e.target as any)?.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!panning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      setViewport((v) => ({ ...v, x: baseX + dx, y: baseY + dy }));
    };
    const onUp = () => {
      panning = false;
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [viewport.x, viewport.y]);

  // Zoom (wheel) keeping cursor position stable (no native scrollbars).
  useEffect(() => {
    const el = viewportRef.current;
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
      const nextScale = clamp(viewport.scale * (1 + delta), 0.25, 2);
      const nextX = mx - worldX * nextScale;
      const nextY = my - worldY * nextScale;
      setViewport({ scale: nextScale, x: nextX, y: nextY });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, [viewport, pageKeys.length]);

  const startTileDrag = (pageKey: string, pointerId: number, startClientX: number, startClientY: number) => {
    const startPos = positions[pageKey] || { x: 0, y: 0 };
    const base = { ...startPos };
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const dx = (e.clientX - startClientX) / viewport.scale;
      const dy = (e.clientY - startClientY) / viewport.scale;
      setPositions((prev) => ({ ...prev, [pageKey]: { x: base.x + dx, y: base.y + dy } }));
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const tileStyle = (k: string): React.CSSProperties => {
    const p = positions[k] || { x: 0, y: 0 };
    return { transform: `translate(${p.x}px, ${p.y}px)` };
  };

  return (
    <div className={styles.viewport} ref={viewportRef}>
      <div className={styles.toolbar}>
        <button className={styles.btn} onClick={() => setViewport({ x: 140, y: 120, scale: 0.7 })} title="Reset view">
          <Move size={14} style={{ marginRight: 6, display: "inline" }} />
          Reset
        </button>
        <button className={styles.btn} onClick={fitAll} title="Fit all pages">
          <Focus size={14} style={{ marginRight: 6, display: "inline" }} />
          Fit all
        </button>
        <button className={styles.btn} onClick={() => setScale(viewport.scale - 0.1)} title="Zoom out">
          <Minus size={14} />
        </button>
        <button className={styles.btn} onClick={() => setScale(viewport.scale + 0.1)} title="Zoom in">
          <Plus size={14} />
        </button>
        <span className={styles.zoomLabel}>{Math.round(viewport.scale * 100)}%</span>
        <span className={styles.zoomLabel}>Drag background to pan • Drag headers to move</span>
      </div>

      <div className={styles.world} style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` }}>
        {pageKeys.map((k) => {
          const page = uiGraph?.pages?.find((p: any) => String(p.key) === k);
          const label = page?.label || k;
          return (
            <div
              key={k}
              data-page-tile
              className={`${styles.tile} ${currentPageKey === k ? styles.tileActive : ""}`}
              style={tileStyle(k)}
              onMouseDown={() => onSetCurrentPageKey(k)}
            >
              <div
                className={styles.tileHeader}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSetCurrentPageKey(k);
                  startTileDrag(k, e.pointerId, e.clientX, e.clientY);
                }}
              >
                <div className={styles.tileTitle}>{label}</div>
                <div className={styles.tileMeta}>{k}</div>
              </div>
              <div className={styles.tileBody}>
                <div className={styles.tileBodyInner}>
                  <WidgetTree
                    pages={uiGraph.pages as any}
                    widgets={uiGraph.widgets as any}
                    selectedWidgetKey={null}
                    onSelectWidget={() => {}}
                    currentPageKey={k}
                    defaultFrameMode="device"
                    defaultDeviceSkin="clean"
                    showControls={false}
                    embedded
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
