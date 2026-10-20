const LINK_ATTR = "data-wiraflow-font";

function toGoogleFamily(family: string) {
  return String(family || "").trim().replace(/\s+/g, "+");
}

function buildHref(family: string) {
  const fam = toGoogleFamily(family);
  if (!fam) return "";
  // Broad weight coverage. Browser will only download what it needs.
  return `https://fonts.googleapis.com/css2?family=${fam}:wght@200;300;400;500;600;700;800;900&display=swap`;
}

export function ensureGoogleFontsLoaded(families: string[]) {
  if (typeof document === "undefined") return;
  const uniq = Array.from(
    new Set(
      families
        .map((f) => String(f || "").trim())
        .filter(Boolean)
        .slice(0, 4)
    )
  );

  // Preconnect once.
  if (!document.querySelector('link[rel="preconnect"][href="https://fonts.googleapis.com"]')) {
    const pre = document.createElement("link");
    pre.rel = "preconnect";
    pre.href = "https://fonts.googleapis.com";
    document.head.appendChild(pre);
  }
  if (!document.querySelector('link[rel="preconnect"][href="https://fonts.gstatic.com"]')) {
    const pre = document.createElement("link");
    pre.rel = "preconnect";
    pre.href = "https://fonts.gstatic.com";
    pre.crossOrigin = "anonymous";
    document.head.appendChild(pre);
  }

  for (const family of uniq) {
    const href = buildHref(family);
    if (!href) continue;
    if (document.querySelector(`link[${LINK_ATTR}="${CSS.escape(family)}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute(LINK_ATTR, family);
    document.head.appendChild(link);
  }
}

