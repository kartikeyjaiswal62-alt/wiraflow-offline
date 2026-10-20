import type { Metadata } from "next";
import "./globals.css";
import styles from "./layout.module.css";
import { ClientProviders } from "./providers";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Wiraflow | Platform Intelligence",
  description: "AI-driven app assembly and debugging platform for FlutterFlow + Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-ui-theme="dark" suppressHydrationWarning>
      <body>
        <div className={styles.appContainer}>
          <div className={styles.ambientGlowPrimary} />
          <div className={styles.ambientGlowSecondary} />
          <ClientProviders>{children}</ClientProviders>
        </div>
        <Script id="wiraflow-ui-theme" strategy="beforeInteractive">
          {`(()=>{try{var v=localStorage.getItem("wiraflow.ui.theme");if(v==="light"||v==="dark"){document.documentElement.dataset.uiTheme=v}}catch(e){}})();`}
        </Script>
      </body>
    </html>
  );
}
