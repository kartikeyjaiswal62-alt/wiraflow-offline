"use client";

import { useEffect, useState } from "react";
import { Database, Key, Check, EyeOff, Eye, Save } from "lucide-react";
import { useStore } from "../../lib/store";
import styles from "./ProjectDatabaseConfig.module.css";

export function ProjectDatabaseConfig({ projectId }: { projectId: string }) {
  const { getProject, updateProject } = useStore();
  const readStr = (val: any, fallback = "") => {
    if (typeof val === "string") return val;
    if (val && typeof val === "object") {
      if (val.stringVal && typeof val.stringVal.value === "string") return val.stringVal.value;
      if (typeof val.value === "string") return val.value;
    }
    return fallback;
  };

  const project = getProject(projectId);

  const [localSbUrl, setLocalSbUrl] = useState("");
  const [localSbAnonKey, setLocalSbAnonKey] = useState("");
  const [localSbConnectionString, setLocalSbConnectionString] = useState("");
  
  const [showSbAnonKey, setShowSbAnonKey] = useState(false);
  const [showSbConnectionString, setShowSbConnectionString] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setLocalSbUrl(project.supabaseUrl || "");
      setLocalSbAnonKey(project.supabaseAnonKey || "");
      setLocalSbConnectionString(project.supabaseConnectionString || "");
    }
  }, [project]);

  const handleSave = () => {
    updateProject(projectId, {
      supabaseUrl: localSbUrl.trim(),
      supabaseAnonKey: localSbAnonKey.trim(),
      supabaseConnectionString: localSbConnectionString.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!project) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Database size={16} />
        <div>
          <h3>Database Settings</h3>
          <p>Configure Supabase for {readStr(project.name)}</p>
        </div>
      </div>

      <div className={styles.field}>
        <label>Supabase Project URL</label>
        <input
          type="text"
          placeholder="https://your-project.supabase.co"
          value={localSbUrl}
          onChange={(e) => setLocalSbUrl(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label>Anon / Public Key</label>
        <div className={styles.inputRow}>
          <input
            type={showSbAnonKey ? "text" : "password"}
            placeholder="eyJhbGciOi..."
            value={localSbAnonKey}
            onChange={(e) => setLocalSbAnonKey(e.target.value)}
          />
          <button onClick={() => setShowSbAnonKey(!showSbAnonKey)}>
            {showSbAnonKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label>Database Connection String (Required for Deployment)</label>
        <div className={styles.inputRow}>
          <input
            type={showSbConnectionString ? "text" : "password"}
            placeholder="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
            value={localSbConnectionString}
            onChange={(e) => setLocalSbConnectionString(e.target.value)}
          />
          <button onClick={() => setShowSbConnectionString(!showSbConnectionString)}>
            {showSbConnectionString ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      <button className={styles.saveBtn} onClick={handleSave}>
        <Save size={14} /> {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}
