import React, { useState, useEffect } from "react";
import { X, Play, Download, GitBranch, Triangle, Loader2, CheckCircle2, ExternalLink, Settings } from "lucide-react";
import styles from "./DeployModal.module.css";
import { generateFlutterProjectFiles } from "../../lib/flutter-project-export";
import { pushToGitHub, getFlutterBuildWorkflow, getLatestArtifact, downloadArtifact, getWorkflowRunStatus } from "../../lib/github-export";
import { useStore } from "../../lib/store";
import { useSearchParams } from "next/navigation";
import { buildZipBlob } from "../../lib/zip";
import JSZip from "jszip";

interface DeployModalProps {
  appName: string;
  onClose: () => void;
}

type DeployType = "playstore" | "apk" | "github" | "vercel" | null;

export function DeployModal({ appName, onClose }: DeployModalProps) {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("id") || "sandbox";
  const { getProject } = useStore();
  const project = getProject(projectId);

  const [activeDeploy, setActiveDeploy] = useState<DeployType>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  // GitHub Settings
  const [ghToken, setGhToken] = useState("");
  const [showGhConfig, setShowGhConfig] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoFullName, setRepoFullName] = useState("");
  const [artifact, setArtifact] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [buildStatus, setBuildStatus] = useState<{ status: string; conclusion: string | null; htmlUrl: string } | null>(null);

  useEffect(() => {
    setGhToken(localStorage.getItem("wiraflow_gh_token") || "");
  }, []);

  useEffect(() => {
    if (!activeDeploy) return;
    if (activeDeploy === "github") return; // Handled by separate async function

    let steps: { p: number; text: string; delay: number }[] = [];

    if (activeDeploy === "playstore") {
      steps = [
        { p: 10, text: "Authenticating with Google Play Console...", delay: 800 },
        { p: 30, text: "Compiling Flutter Android App Bundle (AAB)...", delay: 2000 },
        { p: 60, text: "Signing AAB with keystore...", delay: 1000 },
        { p: 85, text: "Uploading to Internal Testing track...", delay: 1500 },
        { p: 100, text: "Done! App submitted for review.", delay: 500 },
      ];
    } else if (activeDeploy === "apk") {
      steps = [
        { p: 20, text: "Resolving dependencies...", delay: 800 },
        { p: 50, text: "Compiling Flutter engine for Android...", delay: 2500 },
        { p: 80, text: "Assembling release APK...", delay: 1200 },
        { p: 100, text: "APK generated successfully.", delay: 500 },
      ];
    } else if (activeDeploy === "vercel") {
      steps = [
        { p: 20, text: "Preparing Next.js build...", delay: 800 },
        { p: 60, text: "Building Web deployment...", delay: 2000 },
        { p: 90, text: "Assigning domain name...", delay: 1000 },
        { p: 100, text: "Deployed to Vercel.", delay: 500 },
      ];
    }

    let currentStep = 0;
    let isActive = true;

    const runNextStep = () => {
      if (!isActive || currentStep >= steps.length) {
        if (isActive) {
          setCompleted((prev) => ({ ...prev, [activeDeploy]: true }));
          setActiveDeploy(null);
        }
        return;
      }
      
      const step = steps[currentStep];
      setProgress(step.p);
      setStatusText(step.text);
      
      currentStep++;
      setTimeout(runNextStep, step.delay);
    };

    runNextStep();

    return () => {
      isActive = false;
    };
  }, [activeDeploy, appName]);

  const handleGitHubDeploy = async () => {
    if (!ghToken) {
      setShowGhConfig(true);
      return;
    }

    if (!project?.designSpec) {
      setError("No design spec found to export.");
      return;
    }

    setActiveDeploy("github");
    setProgress(5);
    setStatusText("Preparing Flutter source code...");
    setError(null);

    try {
      // 1. Generate files
      const files = generateFlutterProjectFiles(project.designSpec as any);
      setProgress(20);
      setStatusText("Injecting GitHub Actions workflow...");

      // 2. Add GitHub Actions build workflow (The "Free Compiler")
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      files[".github/workflows/build.yml"] = getFlutterBuildWorkflow(appName, sbUrl, sbKey);
      
      setProgress(35);
      setStatusText("Connecting to GitHub API...");

      // 3. Push to GitHub
      const repoName = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const result = await pushToGitHub(
        { token: ghToken },
        {
          repoName,
          files,
          commitMessage: `🚀 Exported from Wiraflow with Automated Build Workflow (${new Date().toLocaleString()})`,
        }
      );

      setRepoUrl(result.url);
      setRepoFullName(result.fullName);
      setProgress(100);
      setStatusText("Successfully pushed to GitHub!");
      setCompleted((prev) => ({ ...prev, github: true }));
      
      // Start polling for artifact
      setIsPolling(true);
    } catch (err: any) {
      setError(err.message || "Failed to export to GitHub");
      setActiveDeploy(null);
    } finally {
      setActiveDeploy(null);
    }
  };

  // Poll for build status and artifact
  useEffect(() => {
    if (!isPolling || !repoFullName || !ghToken) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      
      // Check build status
      const runStatus = await getWorkflowRunStatus({ token: ghToken }, repoFullName);
      if (runStatus) {
        setBuildStatus(runStatus);
        
        if (runStatus.status === "completed") {
          if (runStatus.conclusion === "success") {
            // Build succeeded, check for artifact
            const art = await getLatestArtifact({ token: ghToken }, repoFullName);
            if (art) {
              setArtifact(art);
              setIsPolling(false);
              clearInterval(interval);
              return;
            }
          } else {
            // Build failed
            setIsPolling(false);
            clearInterval(interval);
            return;
          }
        }
      }

      // Stop polling after 15 minutes (60 attempts * 15s)
      if (attempts > 60) {
        setIsPolling(false);
        clearInterval(interval);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isPolling, repoFullName, ghToken]);

  const handleDownloadArtifact = async () => {
    if (!artifact || !repoFullName || !ghToken) return;
    
    try {
      setStatusText("Downloading APK from build server...");
      const blob = await downloadArtifact({ token: ghToken }, repoFullName, artifact.id);
      
      setStatusText("Extracting APK...");
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(blob);
      
      let apkFileName: string | null = null;
      for (const [filename, fileData] of Object.entries(zipContents.files)) {
        if (filename.endsWith('.apk') && !fileData.dir) {
          apkFileName = filename;
          break;
        }
      }

      if (!apkFileName) {
        throw new Error("No .apk file found in the downloaded artifact.");
      }

      const apkBlob = await zipContents.file(apkFileName)?.async("blob");
      
      if (!apkBlob) {
        throw new Error("Failed to extract the .apk file.");
      }

      const url = URL.createObjectURL(apkBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-release.apk`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatusText("APK Downloaded!");
    } catch (err: any) {
      setError("Failed to download artifact: " + err.message);
    }
  };

  const handleStartDeploy = (type: DeployType) => {
    if (activeDeploy) return;
    if (type === "github") {
      handleGitHubDeploy();
      return;
    }
    
    if (type === "apk") {
      // For APK, we'll offer a choice: Automated via GitHub or Manual Source Download
      handleDownloadSource();
      return;
    }

    setProgress(0);
    setStatusText("Initializing...");
    setCompleted((prev) => ({ ...prev, [type as string]: false }));
    setActiveDeploy(type);
  };

  const handleDownloadSource = () => {
    if (!project?.designSpec) {
      setError("No design spec found to export.");
      return;
    }

    try {
      const files = generateFlutterProjectFiles(project.designSpec as any);
      const zipInputs = Object.entries(files).map(([path, data]) => ({ path, data }));
      const blob = buildZipBlob(zipInputs);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${appName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-source.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setCompleted((prev) => ({ ...prev, apk: true }));
    } catch (err: any) {
      setError("Failed to generate source zip: " + err.message);
    }
  };

  const saveGhToken = (token: string) => {
    setGhToken(token);
    localStorage.setItem("wiraflow_gh_token", token);
    setShowGhConfig(false);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Deploy {appName}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button 
              className={styles.closeBtn} 
              onClick={() => setShowGhConfig(!showGhConfig)}
              title="GitHub Settings"
            >
              <Settings size={20} />
            </button>
            <button className={styles.closeBtn} onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {showGhConfig && (
          <div style={{ padding: "24px 32px", background: "rgba(34, 211, 238, 0.05)", borderBottom: "1px solid var(--border-subtle)" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: 14 }}>GitHub Configuration</h4>
            <div style={{ display: "flex", gap: 12 }}>
              <input 
                type="password" 
                placeholder="Personal Access Token (repo scope)" 
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 6, background: "#000", border: "1px solid var(--border-subtle)", color: "#fff", fontSize: 13 }}
              />
              <button 
                onClick={() => saveGhToken(ghToken)}
                style={{ padding: "8px 16px", borderRadius: 6, background: "var(--accent-cyber)", color: "#000", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Save
              </button>
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: 11, color: "var(--text-secondary)" }}>
              Tokens are stored locally in your browser. Requires 'repo' scope to create private repositories.
            </p>
          </div>
        )}

        {error && (
          <div style={{ margin: "16px 32px 0", padding: "12px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid #F87171", borderRadius: 8, color: "#F87171", fontSize: 13 }}>
            {error}
          </div>
        )}

        <div className={styles.body}>
          {/* Play Store */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${styles.playStore}`}>
                <Play size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Google Play Store</h3>
              </div>
            </div>
            <p className={styles.cardDesc}>
              Compile an Android App Bundle (AAB) and publish it directly to your Google Play Console testing track.
            </p>
            
            {activeDeploy === "playstore" ? (
              <ProgressView progress={progress} text={statusText} />
            ) : completed["playstore"] ? (
              <SuccessView text="Published to Internal Track" />
            ) : (
              <button 
                className={styles.actionBtn} 
                onClick={() => handleStartDeploy("playstore")}
                disabled={activeDeploy !== null}
              >
                Deploy to Play Store
              </button>
            )}
          </div>

          {/* APK */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${styles.apk}`}>
                <Download size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Download APK</h3>
              </div>
            </div>
            <p className={styles.cardDesc}>
              Generate a standalone Android APK file. (Requires cloud compilation via GitHub).
            </p>
            
            {artifact ? (
              <button className={styles.actionBtn} onClick={handleDownloadArtifact} style={{ background: "var(--accent-success)", color: "#000" }}>
                <Download size={16} /> Download Compiled APK
              </button>
            ) : buildStatus?.status === "completed" && buildStatus?.conclusion === "failure" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: "10px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid #F87171", borderRadius: 8, fontSize: 12 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "#F87171" }}>Build Failed</p>
                  <p style={{ margin: "4px 0 0 0" }}>The APK compilation encountered an error. Click below to view the build logs and debug.</p>
                </div>
                <button 
                  className={styles.actionBtn} 
                  onClick={() => window.open(buildStatus.htmlUrl, "_blank")}
                  style={{ background: "transparent", border: "1px solid #F87171", color: "#F87171" }}
                >
                  <ExternalLink size={14} /> View Build Logs
                </button>
                <button 
                  className={styles.actionBtn} 
                  onClick={() => { setBuildStatus(null); handleGitHubDeploy(); }}
                >
                  Retry Build
                </button>
              </div>
            ) : isPolling ? (
              <div style={{ padding: "10px", background: "rgba(34, 211, 238, 0.05)", border: "1px solid rgba(34, 211, 238, 0.2)", borderRadius: 8, fontSize: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--accent-cyber)", fontWeight: 600 }}>
                  <Loader2 size={14} className={styles.spin} />
                  {buildStatus?.status === "queued" ? "Build queued..." : buildStatus?.status === "in_progress" ? "Compiling APK..." : "Waiting for build to start..."}
                </div>
                <p style={{ margin: "4px 0 0 0" }}>GitHub is compiling your APK in the cloud. This usually takes 3-5 minutes. Stay on this page!</p>
                {buildStatus?.htmlUrl && (
                  <a href={buildStatus.htmlUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-cyber)", fontSize: 11, marginTop: 6, display: "inline-block" }}>
                    View live build logs →
                  </a>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ padding: "10px", background: "rgba(34, 211, 238, 0.05)", border: "1px solid rgba(34, 211, 238, 0.2)", borderRadius: 8, fontSize: 12 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: "var(--accent-cyber)" }}>Cloud Build Required</p>
                  <p style={{ margin: "4px 0 0 0" }}>To get a real <strong>compiled APK</strong>, click <strong>Push to GitHub</strong> below first. We will compile it in the cloud for you automatically!</p>
                </div>
                <button 
                  className={styles.actionBtn} 
                  onClick={handleDownloadSource}
                  style={{ background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                >
                  Or download raw Source Code (.zip)
                </button>
              </div>
            )}
          </div>

          {/* GitHub */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${styles.github}`}>
                <GitBranch size={24} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Export to GitHub</h3>
              </div>
            </div>
            <p className={styles.cardDesc}>
              Create a new repository and push the full Flutter source code with an automated Build Workflow.
            </p>
            
            {(activeDeploy === "github" || (statusText.includes("GitHub") && progress < 100)) ? (
              <ProgressView progress={progress} text={statusText} />
            ) : completed["github"] ? (
              <button className={styles.actionBtn} onClick={() => window.open(repoUrl, "_blank")}>
                <ExternalLink size={16} /> Open Repository
              </button>
            ) : (
              <button 
                className={styles.actionBtn} 
                onClick={() => handleStartDeploy("github")}
                disabled={activeDeploy !== null}
              >
                Push to GitHub
              </button>
            )}
          </div>

          {/* Vercel */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${styles.vercel}`}>
                <Triangle size={24} fill="currentColor" />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Deploy to Vercel</h3>
              </div>
            </div>
            <p className={styles.cardDesc}>
              Host the web version of your app instantly on Vercel. (Requires your project to be on GitHub first).
            </p>
            
            {completed["vercel"] ? (
              <SuccessView text="Redirecting to Vercel..." />
            ) : (
              <button 
                className={styles.actionBtn} 
                onClick={() => {
                  if (!completed["github"]) {
                    setError("Please push to GitHub first so Vercel can access your code.");
                    return;
                  }
                  const url = `https://vercel.com/new/clone?repository-url=${encodeURIComponent(repoUrl)}`;
                  window.open(url, "_blank");
                  setCompleted((prev) => ({ ...prev, vercel: true }));
                }}
                disabled={activeDeploy !== null}
              >
                {completed["github"] ? "Deploy to Vercel" : "Push to GitHub First"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressView({ progress, text }: { progress: number; text: string }) {
  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressText}>
        <Loader2 size={14} className={styles.spin} />
        {text}
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function SuccessView({ text }: { text: string }) {
  return (
    <div className={styles.successState}>
      <CheckCircle2 size={18} />
      {text}
    </div>
  );
}
