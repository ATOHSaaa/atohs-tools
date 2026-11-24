import { generateTanka } from "./phrases.js";

const $root = document.getElementById("tanka-app");
if (!$root) throw new Error("tanka-app not found");

const BATCH_SIZE = 5;

function tankaToLine(lines) {
  return lines.map((l) => l.text).join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function xShareUrl(text) {
  const params = new URLSearchParams({
    text,
    url: "https://tools.atohs.me/ginga/",
  });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

function renderBatch(tankaList) {
  const poemEl = $root.querySelector("[data-tanka-poem]");
  if (!poemEl) return;

  const rows = tankaList.map((lines) => tankaToLine(lines));
  poemEl.innerHTML = `
    <ol class="tanka-poem-list">
      ${rows
        .map(
          (text) => `
        <li class="tanka-row">
          <p class="tanka-poem__text">${escapeHtml(text)}</p>
          <a
            class="tanka-share"
            href="${xShareUrl(text)}"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="この短歌を X でポスト"
          >X</a>
        </li>
      `
        )
        .join("")}
    </ol>
  `;
}

function refreshTankas() {
  renderBatch(Array.from({ length: BATCH_SIZE }, () => generateTanka()));
}

$root.innerHTML = `
  <div class="tanka-panel">
    <div class="tanka-poem" data-tanka-poem aria-live="polite"></div>
    <p class="tanka-actions">
      <button type="button" class="button button--secondary" data-tanka-regen>
        再生成
      </button>
    </p>
  </div>
`;

$root.querySelector("[data-tanka-regen]")?.addEventListener("click", refreshTankas);

refreshTankas();