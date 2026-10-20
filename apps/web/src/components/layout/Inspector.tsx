import { SearchCode } from "lucide-react";
import styles from "./Inspector.module.css";

interface InspectorProps {
  children?: React.ReactNode;
}

export function Inspector({ children }: InspectorProps) {
  return (
    <aside className={styles.inspectorPanel}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Context Inspector</h3>
        <SearchCode size={16} color="var(--text-muted)" />
      </div>
      
      <div className={styles.content}>
        {children || (
          <div className={styles.emptyState}>
            Select a canvas node to inspect its AI reasoning, UI semantics, or Backend mapping.
          </div>
        )}
      </div>
    </aside>
  );
}
