import { ReactNode, CSSProperties } from "react";
import styles from "./GlassCard.module.css";

interface GlassCardProps {
  children: ReactNode;
  interactive?: boolean;
  active?: boolean;
  cyber?: boolean; /* Special state for AI inference nodes */
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

export function GlassCard({
  children,
  interactive = false,
  active = false,
  cyber = false,
  className = "",
  style,
  onClick,
}: GlassCardProps) {
  const classNames = [
    styles.card,
    interactive ? styles.interactive : "",
    active ? styles.active : "",
    cyber ? styles.cyber : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} style={style} onClick={onClick} role={onClick ? "button" : "region"}>
      {children}
    </div>
  );
}
