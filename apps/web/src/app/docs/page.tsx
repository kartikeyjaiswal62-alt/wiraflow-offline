import fs from "fs";
import path from "path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, BookOpen } from "lucide-react";
import styles from "./page.module.css";

// Extract headers for the table of contents
function extractHeaders(markdown: string) {
  const lines = markdown.split("\n");
  const headers = [];
  
  for (const line of lines) {
    // Only match h2 headers for the sidebar to keep it clean
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      const text = match[1].trim();
      // Generate ID the same way remark-gfm/github does
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headers.push({ text, id });
    }
  }
  
  return headers;
}

export default async function DocsPage() {
  // Read the documentation file directly from the workspace root
  let markdown = "";
  try {
    const docPath = path.join(process.cwd(), "../../DOCUMENTATION.md");
    markdown = fs.readFileSync(docPath, "utf8");
  } catch (error) {
    console.error("Failed to read DOCUMENTATION.md", error);
    markdown = "# Documentation Not Found\n\nThe documentation file could not be loaded.";
  }

  const headers = extractHeaders(markdown);

  return (
    <div className={styles.docsPage}>
      <div className={styles.header}>
        <Link href="/" className={styles.backLink}>
          <ArrowLeft size={14} />
          Back to workspace
        </Link>
      </div>

      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <BookOpen size={14} style={{ display: "inline", marginRight: 8, verticalAlign: "text-bottom" }} />
            Table of Contents
          </div>
          <ul className={styles.sidebarList}>
            {headers.map((header, index) => (
              <li key={index}>
                <a href={`#${header.id}`} className={styles.sidebarLink}>
                  {header.text}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.content}>
          <div className={styles.markdown}>
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({node, ...props}) => {
                  // Add IDs to h2 elements so the sidebar links work
                  const text = String(props.children);
                  const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                  return <h2 id={id} {...props} />;
                }
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </main>
      </div>
    </div>
  );
}
