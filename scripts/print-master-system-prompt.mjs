import fs from "node:fs/promises";
import path from "node:path";

const repoRoot = path.resolve(process.cwd());
const routePath = path.join(
  repoRoot,
  "apps/web/src/app/api/generate-design/route.ts"
);

const src = await fs.readFile(routePath, "utf8");
const prefix = "const SYSTEM_PROMPT = `";
const start = src.indexOf(prefix);
if (start === -1) {
  throw new Error(`SYSTEM_PROMPT not found in ${routePath}`);
}

const bodyStart = start + prefix.length;
const end = src.indexOf("`;", bodyStart);
if (end === -1) {
  throw new Error(`SYSTEM_PROMPT closing \`;\` not found in ${routePath}`);
}

process.stdout.write(src.slice(bodyStart, end));

