const THEME_KEY = "atohs-theme";
const LEGACY_THEME_KEY = "atohs-tools-theme";

function getPreferredTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.setAttribute(
      "aria-label",
      theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"
    );
  }
}

function cycleTheme() {
  const current = document.documentElement.dataset.theme || getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    /* private mode */
  }
}

function initTheme() {
  try {
    const saved =
      localStorage.getItem(THEME_KEY) ?? localStorage.getItem(LEGACY_THEME_KEY);
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
  } catch {
    /* ignore */
  }
  applyTheme(getPreferredTheme());
}

function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
}

initTheme();
initYear();

const toggle = document.getElementById("theme-toggle");
toggle?.addEventListener("click", cycleTheme);