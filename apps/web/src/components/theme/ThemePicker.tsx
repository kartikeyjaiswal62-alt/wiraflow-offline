"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import type { DesignTheme, ThemeMode } from "../../lib/designThemes";
import styles from "./ThemePicker.module.css";

function pickSwatches(theme: DesignTheme, mode: ThemeMode) {
  const p = theme.palettes[mode];
  return [p.primary, p.accent, p.background, p.surface];
}

export function ThemePicker({
  themes,
  value,
  mode,
  onChange,
  onModeChange,
}: {
  themes: DesignTheme[];
  value: string;
  mode: ThemeMode;
  onChange: (themeId: string) => void;
  onModeChange: (mode: ThemeMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 340,
  });

  const selected = useMemo(() => themes.find((t) => t.id === value) || themes[0], [themes, value]);
  const swatches = selected ? pickSwatches(selected, mode) : [];

  const computeMenuPos = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const preferredWidth = 340;
    const width = Math.min(preferredWidth, Math.max(260, rect.width));
    const margin = 10;
    // Right-align to the trigger by default (prevents the menu from "jumping" to the left edge in narrow sidebars).
    const preferredLeft = rect.right - width;
    const left = Math.max(margin, Math.min(window.innerWidth - width - margin, preferredLeft));
    const top = rect.bottom + 8;
    setMenuPos({ top, left, width });
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      const menu = menuRef.current;
      if (!el) return;
      if (e.target instanceof Node && (el.contains(e.target) || (menu && menu.contains(e.target)))) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    computeMenuPos();
    const onScroll = () => computeMenuPos();
    const onResize = () => computeMenuPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const menu = menuRef.current;
      const btn = buttonRef.current;
      if (!menu || !btn) return;
      const rect = btn.getBoundingClientRect();
      const mRect = menu.getBoundingClientRect();
      const margin = 10;
      const fitsBelow = rect.bottom + 8 + mRect.height < window.innerHeight - margin;
      const top = fitsBelow ? rect.bottom + 8 : Math.max(margin, rect.top - 8 - mRect.height);
      const left = Math.max(margin, Math.min(window.innerWidth - mRect.width - margin, menuPos.left));
      setMenuPos((p) => ({ ...p, top, left }));
    });
    return () => cancelAnimationFrame(raf);
  }, [open, menuPos.left]);

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.button}
        onClick={() => {
          setOpen((v) => {
            const next = !v;
            if (next) computeMenuPos(); // prevent 0,0 flash before effects run
            return next;
          });
        }}
        title="Select design theme"
        ref={buttonRef}
      >
        <span className={styles.left}>
          <span className={styles.name}>{selected?.name || "Theme"}</span>
          <span className={styles.swatches} aria-hidden>
            {swatches.map((c, i) => (
              <span key={i} className={styles.swatch} style={{ background: c }} />
            ))}
          </span>
        </span>
        <span className={styles.chev}>
          <ChevronDown size={14} />
        </span>
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.menu}
            role="dialog"
            aria-label="Theme picker"
            ref={menuRef}
            style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
          >
            <div className={styles.menuHeader}>
              <div className={styles.modeToggle}>
                <button
                  type="button"
                  className={mode === "dark" ? styles.modeBtnActive : styles.modeBtn}
                  onClick={() => onModeChange("dark")}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={mode === "light" ? styles.modeBtnActive : styles.modeBtn}
                  onClick={() => onModeChange("light")}
                >
                  Light
                </button>
              </div>
            </div>

            <div className={styles.list}>
              {themes.map((t) => {
                const isActive = t.id === selected?.id;
                const s = pickSwatches(t, mode);
                return (
                  <div
                    key={t.id}
                    className={`${styles.item} ${isActive ? styles.itemActive : ""}`}
                    onClick={() => {
                      onChange(t.id);
                      setOpen(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      onChange(t.id);
                      setOpen(false);
                    }}
                  >
                    <div className={styles.meta}>
                      <div className={styles.itemName}>{t.name}</div>
                      <div className={styles.desc}>{t.description}</div>
                      <div className={styles.fonts}>
                        {t.fonts.heading} / {t.fonts.body}
                      </div>
                    </div>
                    <div className={styles.rightSwatches} aria-hidden>
                      {s.map((c, i) => (
                        <span key={i} className={styles.bigSwatch} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
