"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Play, Pause, Sparkles, Wand2 } from "lucide-react";
import styles from "./page.module.css";

type ScreenId = "onboarding" | "signin" | "home" | "details";
type TransitionStyle = "slide" | "fade" | "shared";

type ScreenDef = {
  id: ScreenId;
  name: string;
  hint: string;
  heroTitle: string;
  heroText: string;
  primaryCta: string;
  secondaryCta: string;
};

const SCREENS: ScreenDef[] = [
  {
    id: "onboarding",
    name: "Onboarding",
    hint: "First impression",
    heroTitle: "Welcome to Wiraflow",
    heroText: "Generate a polished UI + wiring in minutes, then iterate with instant previews.",
    primaryCta: "Get Started",
    secondaryCta: "Skip",
  },
  {
    id: "signin",
    name: "Sign In",
    hint: "Identity gate",
    heroTitle: "Sign in to continue",
    heroText: "Your projects, prompts, and previews sync across devices.",
    primaryCta: "Continue",
    secondaryCta: "Back",
  },
  {
    id: "home",
    name: "Home",
    hint: "Workspace hub",
    heroTitle: "Your workspace",
    heroText: "Pick a project, inspect pages, and ship updates with confidence.",
    primaryCta: "New Project",
    secondaryCta: "Settings",
  },
  {
    id: "details",
    name: "Project",
    hint: "Deep dive",
    heroTitle: "Project overview",
    heroText: "Preview flows, validate transitions, and keep motion consistent across screens.",
    primaryCta: "Open Preview",
    secondaryCta: "Share",
  },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function TransitionPreviewPage() {
  const prefersReducedMotion = useReducedMotion();

  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>("shared");
  const [speed, setSpeed] = useState<number>(0.7);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);
  const [current, setCurrent] = useState<ScreenId>("onboarding");
  const [direction, setDirection] = useState<1 | -1>(1);

  const currentIndex = useMemo(() => SCREENS.findIndex((s) => s.id === current), [current]);
  const currentDef = useMemo(() => SCREENS[currentIndex] || SCREENS[0], [currentIndex]);

  const duration = prefersReducedMotion ? 0 : speed;
  const spring = useMemo(() => {
    // A tighter spring at higher speeds keeps things crisp.
    const stiffness = clamp(520 - speed * 220, 260, 520);
    const damping = clamp(34 - speed * 10, 18, 34);
    return { type: "spring" as const, stiffness, damping, mass: 0.9 };
  }, [speed]);

  const goTo = (id: ScreenId) => {
    if (id === current) return;
    const nextIndex = SCREENS.findIndex((s) => s.id === id);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setCurrent(id);
  };

  const goNext = () => {
    const nextIndex = (currentIndex + 1) % SCREENS.length;
    setDirection(1);
    setCurrent(SCREENS[nextIndex].id);
  };

  const goPrev = () => {
    const nextIndex = (currentIndex - 1 + SCREENS.length) % SCREENS.length;
    setDirection(-1);
    setCurrent(SCREENS[nextIndex].id);
  };

  useEffect(() => {
    if (!autoPlay) return;
    if (prefersReducedMotion) return;
    const t = window.setInterval(goNext, 2400);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay, prefersReducedMotion, currentIndex]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === " ") {
        e.preventDefault();
        setAutoPlay((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const variants = useMemo(() => {
    if (transitionStyle === "fade") {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration } },
        exit: { opacity: 0, transition: { duration } },
      } as const;
    }

    if (transitionStyle === "slide") {
      const x = direction * 24;
      return {
        initial: { opacity: 0, x, scale: 0.99 },
        animate: { opacity: 1, x: 0, scale: 1, transition: spring },
        exit: { opacity: 0, x: -x, scale: 0.99, transition: spring },
      } as const;
    }

    // shared
    const x = direction * 18;
    return {
      initial: { opacity: 0, x, filter: "blur(1.5px)" },
      animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: spring },
      exit: { opacity: 0, x: -x, filter: "blur(1.5px)", transition: spring },
    } as const;
  }, [direction, duration, spring, transitionStyle]);

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <div className={styles.title}>Wireflow Motion Preview</div>
          <div className={styles.subtitle}>
            Smooth page-to-page movement, shared elements, and consistent easing.
            Use this as a baseline for Wiraflow&apos;s generated flows.
          </div>
        </div>

        <div className={styles.headerActions}>
          <Link className={styles.actionBtn} href="/">
            <ArrowLeft size={16} />
            Back
          </Link>
          <button
            className={styles.actionBtn}
            onClick={() => setAutoPlay((v) => !v)}
            type="button"
            aria-pressed={autoPlay}
          >
            {autoPlay ? <Pause size={16} /> : <Play size={16} />}
            {autoPlay ? "Pause" : "Play"}
          </button>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <Wand2 size={16} />
              Wireflow
            </div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.flowList} role="list">
              <LayoutGroup id="flow">
                {SCREENS.map((s) => {
                  const active = s.id === current;
                  return (
                    <motion.div
                      key={s.id}
                      className={styles.flowItem}
                      role="listitem"
                      onClick={() => goTo(s.id)}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") goTo(s.id);
                      }}
                      aria-current={active ? "step" : undefined}
                    >
                      {active ? (
                        <motion.div
                          className={styles.activeOutline}
                          layoutId="activeOutline"
                          transition={spring}
                        />
                      ) : null}
                      <div className={styles.flowNameRow}>
                        <div className={styles.flowName}>{s.name}</div>
                        <div className={styles.flowMeta}>{s.hint}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </LayoutGroup>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>
              <Sparkles size={16} />
              Preview
            </div>
          </div>
          <div className={styles.previewWrap}>
            <div className={styles.phone} aria-label="Phone preview">
              <div className={styles.phoneChrome} />

              <LayoutGroup id="screens">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentDef.id}
                    className={styles.screen}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                  >
                    <div className={styles.screenTop}>
                      <div className={styles.statusPills}>
                        <div className={styles.pill} />
                        <div className={styles.pill} style={{ width: 26 }} />
                      </div>
                      <div className={styles.pill} style={{ width: 64 }} />
                    </div>

                    <motion.div
                      className={styles.heroCard}
                      layout={transitionStyle === "shared"}
                      transition={spring}
                    >
                      <motion.div
                        className={styles.heroTitle}
                        layoutId={transitionStyle === "shared" ? "heroTitle" : undefined}
                      >
                        {currentDef.heroTitle}
                      </motion.div>
                      <motion.div
                        className={styles.heroText}
                        layoutId={transitionStyle === "shared" ? "heroText" : undefined}
                      >
                        {currentDef.heroText}
                      </motion.div>
                    </motion.div>

                    <motion.div
                      className={styles.contentCard}
                      layout={transitionStyle === "shared"}
                      transition={spring}
                    >
                      <div className={styles.row}>
                        <div className={styles.input} />
                        <div className={styles.input} style={{ flex: 0.7 }} />
                      </div>
                      <div className={styles.row}>
                        <div className={styles.input} style={{ flex: 0.55 }} />
                        <div className={styles.input} />
                      </div>
                      <div className={styles.row}>
                        <div className={styles.input} />
                      </div>
                    </motion.div>

                    <div className={styles.ctaRow}>
                      <motion.div
                        className={styles.ctaPrimary}
                        layoutId={transitionStyle === "shared" ? "primaryCta" : undefined}
                        transition={spring}
                      >
                        {currentDef.primaryCta}
                      </motion.div>
                      <motion.div
                        className={styles.ctaGhost}
                        layoutId={transitionStyle === "shared" ? "secondaryCta" : undefined}
                        transition={spring}
                      >
                        {currentDef.secondaryCta}
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </LayoutGroup>
            </div>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Controls</div>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.controls}>
              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>Transition</div>
                <div className={styles.segmented} role="tablist" aria-label="Transition style">
                  {(["shared", "slide", "fade"] as const).map((v) => {
                    const active = v === transitionStyle;
                    return (
                      <button
                        key={v}
                        className={`${styles.segment} ${active ? styles.segmentActive : ""}`}
                        onClick={() => setTransitionStyle(v)}
                        type="button"
                        role="tab"
                        aria-selected={active}
                      >
                        {v === "shared" ? "Shared" : v === "slide" ? "Slide" : "Fade"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>Speed</div>
                <div className={styles.sliderRow}>
                  <input
                    className={styles.slider}
                    type="range"
                    min={0.25}
                    max={1.2}
                    step={0.05}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    aria-label="Transition speed"
                  />
                  <div className={styles.sliderValue}>{speed.toFixed(2)}s</div>
                </div>
              </div>

              <div className={styles.controlGroup}>
                <div className={styles.controlLabel}>Playback</div>
                <div className={styles.toggleRow}>
                  <div className={styles.toggleText}>Auto-play</div>
                  <button
                    className={styles.actionBtn}
                    onClick={() => setAutoPlay((v) => !v)}
                    type="button"
                    aria-pressed={autoPlay}
                  >
                    {autoPlay ? <Pause size={16} /> : <Play size={16} />}
                    {autoPlay ? "On" : "Off"}
                  </button>
                </div>
                <div className={styles.kbdHint}>
                  Keyboard: <b>←</b>/<b>→</b> to step, <b>Space</b> to toggle autoplay.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

