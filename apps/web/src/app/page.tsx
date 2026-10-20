"use client";

/**
 * Wiraflow Home — Project Selection
 *
 * Redesigned premium landing with project grid, stats, and "New Project" CTA.
 */

import styles from "./page.module.css";
import Link from "next/link";
import {
  Plus,
  FolderGit2,
  Layers,
  Activity,
  ArrowRight,
  Settings,
  Sparkles,
  LayoutGrid,
  Rocket,
  AlertTriangle,
  BookOpen,
  Zap,
} from "lucide-react";
import { useStore } from "../lib/store";

const STAGE_CLASS_MAP: Record<string, string> = {
  draft: "stageDraft",
  designing: "stageDesigning",
  previewing: "stagePreviewing",
  wired: "stageWired",
  deployed: "stageDeployed",
};

export default function Home() {
  const { projects, apiKey, aiProvider } = useStore();

  const totalPages = projects.reduce((s, p) => s + p.pageCount, 0);
  const wiredCount = projects.filter((p) => p.stage === "wired" || p.stage === "deployed").length;

  return (
    <div className={styles.homeContainer}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroInfo}>
          <div className={styles.brand}>
            <div className={styles.brandIcon}>
              <Layers size={22} />
            </div>
            <span className={styles.brandName}>Wiraflow</span>
          </div>
          <h1 className={`${styles.heroTitle} text-gradient`}>
            Your App Workspace
          </h1>
          <p className={styles.heroSubtitle}>
            Describe a mobile app and draft its blueprint with local Ollama.
            Review the interactive design preview, then export Flutter source.
          </p>
        </div>

        <div className={styles.heroActions}>
          <Link href="/new-project" className={styles.newProjectBtn}>
            <Plus size={18} />
            New Project
          </Link>
          <Link href="/transition-preview" className={styles.settingsBtn}>
            <Activity size={16} />
            Motion Preview
          </Link>
          <Link href="/docs" className={styles.settingsBtn}>
            <BookOpen size={16} />
            Documentation
          </Link>
          <Link href="/settings" className={styles.settingsBtn}>
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </div>

      {/* API Warning */}
      {aiProvider === "cloud" && !apiKey && (
        <div className={styles.apiWarning}>
          <AlertTriangle size={16} />
          <span>No API key configured — AI design generation won't work until you add one.</span>
          <Link href="/settings" className={styles.apiWarningLink}>
            Configure →
          </Link>
        </div>
      )}

      {aiProvider !== "cloud" && (
        <div className={styles.localModeBadge}>
          <Zap size={15} />
          <span>Local blueprint generation and UI edits · Ollama on this computer · no API key</span>
          <Link href="/settings" className={styles.apiWarningLink}>Ollama settings</Link>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <div className={styles.statIconBlue}>
            <FolderGit2 size={16} />
          </div>
          <div>
            <div className={styles.statValue}>{projects.length}</div>
            <div className={styles.statLabel}>Projects</div>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIconPurple}>
            <LayoutGrid size={16} />
          </div>
          <div>
            <div className={styles.statValue}>{totalPages}</div>
            <div className={styles.statLabel}>Pages Designed</div>
          </div>
        </div>
        <div className={styles.statItem}>
          <div className={styles.statIconGreen}>
            <Rocket size={16} />
          </div>
          <div>
            <div className={styles.statValue}>{wiredCount}</div>
            <div className={styles.statLabel}>Wired & Ready</div>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      {projects.length > 0 ? (
        <>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Projects</h2>
          </div>
          <div className={styles.projectGrid}>
            {projects.map((project) => {
              const stageClass =
                STAGE_CLASS_MAP[project.stage] || "stageDraft";
              const href =
                project.stage === "previewing" && project.designSpec
                  ? `/design-preview/${project.id}`
                  : `/project?id=${project.id}`;

              return (
                <Link
                  key={project.id}
                  href={href}
                  className={styles.projectCard}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>
                      <FolderGit2 size={18} />
                    </div>
                      <span className={styles.stageBadge}>
                        {typeof project.stage === "string" ? project.stage : ((project.stage as any)?.stringVal?.value || "previewing")}
                      </span>
                  </div>
                  <div className={styles.cardName}>
                    {typeof project.name === "string" ? project.name : ((project.name as any)?.stringVal?.value || "Untitled Project")}
                  </div>
                  <div className={styles.cardDesc}>
                    {typeof project.description === "string" ? project.description : ((project.description as any)?.stringVal?.value || "")}
                  </div>
                  <div className={styles.cardMeta}>
                    <div className={styles.metaItem}>
                      <LayoutGrid size={13} />
                      {project.pageCount} pages
                    </div>
                    <div className={styles.metaItem}>
                      <Activity size={13} />
                      {project.widgetCount} widgets
                    </div>
                    <div className={styles.cardAction}>
                      Open <ArrowRight size={13} />
                    </div>
                  </div>
                </Link>
              );
            })}
            {/* New Project — dashed card */}
            <Link href="/new-project" className={styles.newProjectCard}>
              <div className={styles.newCardIcon}>
                <Plus size={24} />
              </div>
              <div className={styles.newCardTitle}>New Project</div>
              <div className={styles.newCardSub}>Start from a prompt</div>
            </Link>
          </div>

          <div className={styles.sectionHeader} style={{ marginTop: 20 }}>
            <h2 className={styles.sectionTitle}>App Gallery</h2>
            <div className={styles.viewAllBtn}>
              Explore Templates <Sparkles size={14} />
            </div>
          </div>
          <p className={styles.sectionSub}>Start with a pre-designed template to accelerate your development.</p>
          
          <div className={styles.galleryGrid}>
            <div className={styles.galleryCard}>
               <div className={styles.galleryPreview} style={{ background: "linear-gradient(135deg, #8B5CF6, #6366F1)" }}>
                  <Activity size={32} />
               </div>
               <div className={styles.galleryInfo}>
                  <div className={styles.galleryTitle}>FitTrack Pro</div>
                  <div className={styles.galleryDesc}>Fitness dashboard with workout logs, progress charts, and goals.</div>
                  <button className={styles.cloneBtn}>
                    <Plus size={14} /> Clone Template
                  </button>
               </div>
            </div>

            <div className={styles.galleryCard}>
               <div className={styles.galleryPreview} style={{ background: "linear-gradient(135deg, #22D3EE, #0EA5E9)" }}>
                  <Layers size={32} />
               </div>
               <div className={styles.galleryInfo}>
                  <div className={styles.galleryTitle}>CryptoPulse</div>
                  <div className={styles.galleryDesc}>Real-time market tracker, portfolio analytics, and wallet.</div>
                  <button className={styles.cloneBtn}>
                    <Plus size={14} /> Clone Template
                  </button>
               </div>
            </div>

            <div className={styles.galleryCard}>
               <div className={styles.galleryPreview} style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                  <LayoutGrid size={32} />
               </div>
               <div className={styles.galleryInfo}>
                  <div className={styles.galleryTitle}>SaaSBoard</div>
                  <div className={styles.galleryDesc}>Business analytics dashboard for teams and project tracking.</div>
                  <button className={styles.cloneBtn}>
                    <Plus size={14} /> Clone Template
                  </button>
               </div>
            </div>
          </div>
        </>
      ) : (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Sparkles size={32} />
          </div>
          <div className={styles.emptyTitle}>Your first project starts here</div>
          <p className={styles.emptySub}>
            Click "New Project" to describe what you want to build. Wiraflow's AI
            will generate a complete, professional design for you to preview and
            approve.
          </p>
          <Link href="/new-project" className={styles.newProjectBtn}>
            <Plus size={18} />
            Create Your First Project
          </Link>
        </div>
      )}
    </div>
  );
}
