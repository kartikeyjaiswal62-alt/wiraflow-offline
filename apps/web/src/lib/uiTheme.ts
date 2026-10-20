export type UiThemeMode = "dark" | "light";

const STORAGE_KEY = "wiraflow.ui.theme";

export function getStoredUiTheme(): UiThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setStoredUiTheme(mode: UiThemeMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export function applyUiThemeToDom(mode: UiThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.uiTheme = mode;
}

