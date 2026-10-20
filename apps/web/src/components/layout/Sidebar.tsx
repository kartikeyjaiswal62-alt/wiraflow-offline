"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, Layers, MonitorSmartphone, Database, Network } from "lucide-react";
import { useStore } from "../../lib/store";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  activeMode?: "design" | "backend" | "wiring";
  onModeChange?: (mode: "design" | "backend" | "wiring") => void;
}

export function Sidebar() {
  const pathname = usePathname();
  const { apiKey, primaryMode, setPrimaryMode } = useStore();

  const isActive = (path: string) => pathname === path;
  const isProjectPage = pathname?.startsWith("/project") || pathname?.startsWith("/design-preview");

  return (
    <nav className={styles.sidebar}>
      <Link href="/" className={styles.logo} title="Wiraflow Workspace">
        <Layers size={24} />
      </Link>

      <div className={styles.navGroup}>
        <Link
          href="/"
          className={`${styles.navItem} ${isActive("/") ? styles.activeNavItem : ""}`}
          title="Home Dashboard"
        >
          <LayoutDashboard size={20} />
        </Link>
        
        {isProjectPage && (
          <>
            <div className={styles.divider} />
            
            <div
              className={`${styles.navItem} ${primaryMode === "design" ? styles.activeNavItem : ""}`}
              onClick={() => setPrimaryMode("design")}
              title="UI Design & Layout"
            >
              <MonitorSmartphone size={22} />
            </div>

            <div
              className={`${styles.navItem} ${primaryMode === "backend" ? styles.activeNavItem : ""}`}
              onClick={() => setPrimaryMode("backend")}
              title="Backend & Schema"
            >
              <Database size={22} />
            </div>

            <div
              className={`${styles.navItem} ${primaryMode === "wiring" ? styles.activeNavItem : ""}`}
              onClick={() => setPrimaryMode("wiring")}
              title="Logic & Data Flow"
            >
              <Network size={22} />
            </div>
          </>
        )}
      </div>

      <Link
        href="/settings"
        className={`${styles.navItem} ${styles.bottomNav} ${
          isActive("/settings") ? styles.activeNavItem : ""
        }`}
        title="Settings"
      >
        <div className={styles.settingsWrap}>
          <Settings size={20} />
          {!apiKey && <span className={styles.warningDot} />}
        </div>
      </Link>
    </nav>
  );
}
