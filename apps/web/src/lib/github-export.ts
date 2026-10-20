/**
 * GitHub API Export Utility
 * 
 * Handles creating repositories and pushing files using the GitHub REST API.
 * Uses the Repository Contents API for maximum reliability.
 */

export interface GitHubConfig {
  token: string;
  owner?: string;
}

export interface GitHubPushOptions {
  repoName: string;
  files: Record<string, string>; // path -> content
  commitMessage: string;
}

/**
 * Pushes a set of files to a GitHub repository using the Contents API.
 * This is the most reliable method for smaller projects.
 */
export async function pushToGitHub(config: GitHubConfig, options: GitHubPushOptions) {
  const { token } = config;
  const { repoName, files, commitMessage } = options;

  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };

  // 1. Get user info
  console.log("[GitHub Export] Authenticating...");
  const userRes = await fetch("https://api.github.com/user", { headers });
  if (!userRes.ok) throw new Error("Failed to authenticate with GitHub. Check your token.");
  const userData = await userRes.json();
  const owner = userData.login;

  // 2. Create repository if it doesn't exist
  console.log(`[GitHub Export] Checking repository: ${owner}/${repoName}`);
  let repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
  
  if (repoRes.status === 404) {
    console.log("[GitHub Export] Creating new repository...");
    const createRes = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: repoName,
        private: true,
        auto_init: true,
      }),
    });
    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(`Failed to create repository: ${err.message}`);
    }
    console.log("[GitHub Export] Repository created successfully.");
    // Wait for GitHub to stabilize
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // 3. Single Commit using Git Data API
  try {
    console.log("[GitHub Export] Batching files into a single commit...");
    const branch = "main";
    
    // A. Get current reference (SHA of the latest commit on main)
    let refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, { headers });
    if (!refRes.ok) {
      // Try 'master' if 'main' fails
      refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/master`, { headers });
      if (!refRes.ok) throw new Error("Could not find default branch (main/master).");
    }
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // B. Get the latest commit's tree SHA
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers });
    const commitData = await commitRes.json();
    const baseTreeSha = commitData.tree.sha;

    // C. Create the tree objects
    const tree = Object.entries(files).map(([path, content]) => ({
      path,
      mode: "100644", // normal file
      type: "blob",
      content,
    }));

    // D. Create new tree
    const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree,
      }),
    });
    if (!newTreeRes.ok) {
      const err = await newTreeRes.json();
      throw new Error(`Failed to create tree: ${err.message}`);
    }
    const newTreeData = await newTreeRes.json();
    const newTreeSha = newTreeData.sha;

    // E. Create the commit
    const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });
    const newCommitData = await newCommitRes.json();
    const newCommitSha = newCommitData.sha;

    // F. Update the reference
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: true,
      }),
    });
    if (!updateRefRes.ok) throw new Error("Failed to update branch reference.");

    console.log("[GitHub Export] Atomic commit successful!");
  } catch (err: any) {
    console.error("[GitHub Export] Batch push failed, falling back to sequential push...", err);
    // Fallback logic removed for brevity as single commit is primary goal, 
    // but in a real app you might want to keep the old logic as a backup.
    throw err;
  }

  console.log("[GitHub Export] Export successful!");
  return {
    url: `https://github.com/${owner}/${repoName}`,
    fullName: `${owner}/${repoName}`,
    owner,
    repo: repoName,
  };
}

/**
 * Fetches the latest artifact (APK) from GitHub Actions.
 */
export async function getLatestArtifact(config: GitHubConfig, repoFullName: string) {
  const { token } = config;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/actions/artifacts`, { headers });
    if (!res.ok) return null;
    
    const data = await res.json();
    const artifacts = data.artifacts || [];
    // Find the newest APK artifact
    const apkArtifact = artifacts.find((a: any) => a.name.includes("apk") && !a.expired);
    
    if (!apkArtifact) return null;

    return {
      id: apkArtifact.id,
      name: apkArtifact.name,
      size: apkArtifact.size_in_bytes,
      createdAt: apkArtifact.created_at,
      downloadUrl: apkArtifact.archive_download_url,
    };
  } catch (err) {
    console.error("[GitHub Export] Failed to fetch artifacts:", err);
    return null;
  }
}

/**
 * Downloads an artifact blob using the GitHub API.
 */
export async function downloadArtifact(config: GitHubConfig, repoFullName: string, artifactId: number) {
  const { token } = config;
  const res = await fetch(`https://api.github.com/repos/${repoFullName}/actions/artifacts/${artifactId}/zip`, {
    headers: {
      Authorization: `token ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to download artifact");
  return await res.blob();
}

/**
 * Check the latest workflow run status for a repository.
 */
export async function getWorkflowRunStatus(config: GitHubConfig, repoFullName: string) {
  const { token } = config;
  const headers = {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
  };

  try {
    const res = await fetch(`https://api.github.com/repos/${repoFullName}/actions/runs?per_page=1`, { headers });
    if (!res.ok) return null;
    
    const data = await res.json();
    const run = data.workflow_runs?.[0];
    if (!run) return null;

    return {
      id: run.id,
      status: run.status as string,           // "queued" | "in_progress" | "completed"
      conclusion: run.conclusion as string | null, // "success" | "failure" | "cancelled" | null
      htmlUrl: run.html_url as string,
      createdAt: run.created_at as string,
    };
  } catch (err) {
    console.error("[GitHub Export] Failed to fetch workflow status:", err);
    return null;
  }
}

export function getFlutterBuildWorkflow(appName: string, sbUrl = "", sbKey = "") {
  const artifactName = appName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "wiraflow-app";
  return `name: Build Flutter APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  build:
    name: Build APK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
          
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'
          channel: 'stable'

      - name: Scaffold Android project
        run: |
          flutter create --project-name wiraflow_export --org com.wiraflow --platforms android ./_scaffold
          cp -r _scaffold/android ./android
          cp -r _scaffold/test ./test 2>/dev/null || true
          rm -rf _scaffold
          
      - name: Add Internet Permission
        run: |
          sed -i '/<manifest/a \    <uses-permission android:name="android.permission.INTERNET"/>' android/app/src/main/AndroidManifest.xml
          

      - name: Get dependencies
        run: flutter pub get
        
      - name: Build APK
        run: flutter build apk --release --no-tree-shake-icons --dart-define=SUPABASE_URL="\${{ secrets.SUPABASE_URL || '${sbUrl}' }}" --dart-define=SUPABASE_ANON_KEY="\${{ secrets.SUPABASE_ANON_KEY || '${sbKey}' }}"
        
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: ${artifactName}-release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
`;
}

