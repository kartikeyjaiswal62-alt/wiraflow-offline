"use client";

/**
 * Client Providers — wraps the app with the StoreProvider and Sidebar.
 * This is a client component because StoreProvider uses hooks.
 */

import { StoreProvider } from "../lib/store";
import { Sidebar } from "../components/layout/Sidebar";
import { ToastProvider } from "../components/ui/Toast";
import styles from "./layout.module.css";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ToastProvider>
        <div style={{ display: "flex", flex: 1, height: "100%", overflow: "hidden" }}>
          <Sidebar />
          <main className={styles.mainCanvas}>
            {children}
          </main>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
