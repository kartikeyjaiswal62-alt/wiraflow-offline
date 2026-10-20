"use client";

/**
 * DebugRail — Bottom Console Panel
 *
 * Shows real-time execution traces when action flows are triggered.
 * Each DebugEvent appears as a timestamped log line, colour-coded
 * by event type (query, mutation, navigation, error, etc.).
 */

import { useEffect, useState } from "react";
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Database,
  ArrowRight,
  Zap,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Upload,
  Clock,
} from "lucide-react";
import styles from "./DebugRail.module.css";

interface DebugEventDisplay {
  eventId: string;
  timestamp: string;
  eventType: string;
  summary: string;
  flowKey?: string;
  stepKey?: string;
  payload?: Record<string, unknown>;
  error?: { message: string };
}

interface DebugRailProps {
  events: DebugEventDisplay[];
  onClear: () => void;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  query_started: <Database size={12} />,
  query_completed: <Database size={12} />,
  mutation_started: <Zap size={12} />,
  mutation_completed: <Zap size={12} />,
  mutation_failed: <AlertCircle size={12} />,
  navigation_triggered: <ArrowRight size={12} />,
  guard_passed: <ShieldCheck size={12} />,
  guard_failed: <AlertCircle size={12} />,
  flow_started: <Zap size={12} />,
  flow_completed: <CheckCircle2 size={12} />,
  flow_failed: <AlertCircle size={12} />,
  action_step_started: <Clock size={12} />,
  action_step_completed: <CheckCircle2 size={12} />,
  upload_started: <Upload size={12} />,
  upload_completed: <Upload size={12} />,
  variable_changed: <Zap size={12} />,
  function_called: <Zap size={12} />,
  function_response: <CheckCircle2 size={12} />,
};

const EVENT_COLORS: Record<string, string> = {
  query_started: "#3b82f6",
  query_completed: "#3b82f6",
  mutation_started: "#8b5cf6",
  mutation_completed: "#10b981",
  mutation_failed: "#ef4444",
  navigation_triggered: "#f59e0b",
  guard_passed: "#10b981",
  guard_failed: "#ef4444",
  flow_started: "#06b6d4",
  flow_completed: "#10b981",
  flow_failed: "#ef4444",
  action_step_started: "#64748b",
  action_step_completed: "#64748b",
  upload_started: "#f59e0b",
  upload_completed: "#10b981",
  variable_changed: "#8b5cf6",
  function_called: "#06b6d4",
  function_response: "#10b981",
};

export function DebugRail({ events, onClear }: DebugRailProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setIsExpanded(window.innerWidth >= 1200);
  }, []);

  return (
    <div className={`${styles.rail} ${isExpanded ? styles.expanded : styles.collapsed}`}>
      {/* Header */}
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.headerLeft}>
          <Terminal size={14} color="var(--accent-cyber)" />
          <span className={styles.headerTitle}>Debug Trace</span>
          <span className={styles.eventCount}>{events.length} events</span>
        </div>
        <div className={styles.headerRight}>
          {events.length > 0 && (
            <button
              className={styles.clearBtn}
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Event Log */}
      {isExpanded && (
        <div className={styles.logContainer}>
          {events.length === 0 ? (
            <div className={styles.emptyLog}>
              Trigger an action on the canvas to see execution traces here.
            </div>
          ) : (
            events.map((evt) => {
              const color = EVENT_COLORS[evt.eventType] ?? "#64748b";
              const icon = EVENT_ICONS[evt.eventType] ?? <Zap size={12} />;
              const time = new Date(evt.timestamp).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                fractionalSecondDigits: 3,
              });

              return (
                <div key={evt.eventId} className={styles.logLine}>
                  <span className={styles.logTime}>{time}</span>
                  <span className={styles.logIcon} style={{ color }}>
                    {icon}
                  </span>
                  <span
                    className={styles.logType}
                    style={{ color }}
                  >
                    {evt.eventType.replace(/_/g, ".")}
                  </span>
                  <span className={styles.logSummary}>{evt.summary}</span>
                  {evt.error && (
                    <span className={styles.logError}>⚠ {evt.error.message}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
