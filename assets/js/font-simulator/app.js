const STORAGE_KEY = "atohs-font-simulator";
const GOOGLE_FONTS_METADATA = "https://fonts.google.com/metadata/fonts";
const FONTSOURCE_API = "https://api.fontsource.org/v1/fonts";

const PINNED_FAMILIES = [
  "Noto Sans JP",
  "Noto Serif JP",
  "M PLUS 1p",
  "Zen Kaku Gothic New",
  "Shippori Mincho",
  "M PLUS Rounded 1c",
  "IBM Plex Sans JP",
];

const SAMPLE_JA =
  "そこのけ、そこのけ、おとうとは通る。\nタイポグラフィは、読みやすさとリズムのバランスです。";
const SAMPLE_EN =
  "The quick brown fox jumps over the lazy dog.\nPack my box with five dozen liquor jugs.";
const SAMPLE_GALLERY = "夢食う本の虫";

const GALLERY_BATCH = 15;

/** @typedef {{ id: string, family: string, subsets: string[], weights: number[], styles: string[], variable: boolean, category: string, type: string }} FontEntry */

/** @type {FontEntry[]} */
let allFonts = [];

/** @type {"google-metadata"|"fontsource"|"pinned"} */
let fontCatalogSource = "fontsource";

const state = {
  weight: 400,
  fontSize: 26,
  lineHeight: 1.75,
  letterSpacing: 0,
  writingMode: "horizontal-tb",
  fontFeatureSettings: "normal",
  textAlign: "start",
  categoryFilter: "all",
  sample: "gallery",
  previewText: SAMPLE_GALLERY,
};

const $root = document.getElementById("font-sim-app");

function loadSavedState() {
  state.categoryFilter = "all";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    for (const key of [
      "weight",
      "fontSize",
      "lineHeight",
      "letterSpacing",
      "writingMode",
      "fontFeatureSettings",
      "textAlign",
      "sample",
      "previewText",
    ]) {
      if (saved[key] !== undefined) state[key] = saved[key];
    }
    if (saved.galleryFontSize != null && saved.fontSize == null) {
      state.fontSize = saved.galleryFontSize;
    }
  } catch {
    /* ignore */
  }
}

function sortFonts(list) {
  const pinned = new Set(PINNED_FAMILIES.map((n) => n.toLowerCase()));
  return [...list].sort((a, b) => {
    const ap = pinned.has(a.family.toLowerCase()) ? 0 : 1;
    const bp = pinned.has(b.family.toLowerCase()) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return a.family.localeCompare(b.family, "en");
  });
}

function isSerifFont(entry) {
  return normalizeCategory(entry.category) === "serif";
}

function filteredFonts() {
  let list = allFonts.filter((f) => f.type === "google" && f.subsets.includes("japanese"));
  if (state.categoryFilter === "serif") {
    list = list.filter(isSerifFont);
  } else if (state.categoryFilter === "sans-serif") {
    list = list.filter((f) => !isSerifFont(f));
  }
  return sortFonts(list);
}

function normalizeCategory(label) {
  const s = String(label || "sans-serif").toLowerCase();
  if (s.includes("serif") && !s.includes("sans")) return "serif";
  if (s.includes("mono")) return "monospace";
  if (s.includes("display")) return "display";
  if (s.includes("hand")) return "handwriting";
  return "sans-serif";
}

/** @param {{ family: string, category?: string, subsets?: string[], fonts?: Record<string, unknown>, axes?: { tag: string, min?: number, max?: number }[] }} item */
function mapGoogleFamilyMetadata(item) {
  const weights = new Set();
  for (const key of Object.keys(item.fonts || {})) {
    const n = parseInt(key.replace(/\D/g, ""), 10);
    if (!Number.isNaN(n)) weights.add(n);
  }
  const wghtAxis = item.axes?.find((a) => a.tag === "wght");
  const variable = Boolean(wghtAxis || (item.axes?.length ?? 0) > 0);
  let weightList = [...weights].sort((a, b) => a - b);
  if (!weightList.length) {
    weightList = wghtAxis
      ? [Math.round(wghtAxis.min ?? 100), Math.round(wghtAxis.max ?? 900)]
      : [400];
  }
  const subsets = (item.subsets || []).filter((s) => s !== "menu");
  const hasItalic = Object.keys(item.fonts || {}).some((k) => /i$/.test(k));
  return {
    id: item.family.toLowerCase().replace(/\s+/g, "-"),
    family: item.family,
    subsets,
    weights: weightList,
    styles: hasItalic ? ["italic", "normal"] : ["normal"],
    variable,
    category: normalizeCategory(item.category),
    type: "google",
  };
}

async function fetchGoogleFontsMetadata() {
  const res = await fetch(GOOGLE_FONTS_METADATA);
  if (!res.ok) throw new Error(`google metadata ${res.status}`);
  const data = await res.json();
  const list = data.familyMetadataList;
  if (!Array.isArray(list) || !list.length) throw new Error("google metadata empty");
  return list.map(mapGoogleFamilyMetadata);
}

async function fetchFontsourceCatalog() {
  const res = await fetch(FONTSOURCE_API);
  if (!res.ok) throw new Error(`fontsource ${res.status}`);
  return res.json();
}

async function loadFontCatalog() {
  try {
    allFonts = await fetchGoogleFontsMetadata();
    fontCatalogSource = "google-metadata";
    return;
  } catch (err) {
    console.info("[font-simulator] Google 公式一覧の取得に失敗（CORS 等の可能性）:", err);
  }
  try {
    allFonts = await fetchFontsourceCatalog();
    fontCatalogSource = "fontsource";
  } catch (err) {
    console.warn("[font-simulator] Fontsource の取得にも失敗:", err);
    throw err;
  }
}

function galleryTypographyStyle(family) {
  return [
    `font-family:${JSON.stringify(family)},system-ui,sans-serif`,
    `font-weight:${state.weight}`,
    `font-size:${state.fontSize}px`,
    `line-height:${state.lineHeight}`,
    `letter-spacing:${state.letterSpacing}em`,
    `writing-mode:${state.writingMode}`,
    `font-feature-settings:${state.fontFeatureSettings === "palt" ? '"palt" 1' : "normal"}`,
    `text-align:${state.textAlign}`,
    state.writingMode.startsWith("vertical") ? "text-orientation:mixed" : "",
  ]
    .filter(Boolean)
    .join(";");
}

function weightBounds(entry) {
  const weights = entry?.weights?.length ? entry.weights : [400];
  return { min: Math.min(...weights), max: Math.max(...weights), weights };
}

function clearGalleryStylesheets() {
  document.querySelectorAll("link[data-font-sim-gallery]").forEach((el) => el.remove());
}

function buildBatchGoogleFontsHref(fonts) {
  const parts = fonts.map((entry) => {
    const enc = encodeURIComponent(entry.family).replace(/%20/g, "+");
    const { min, max } = weightBounds(entry);
    if (entry.variable && max > min) {
      return `family=${enc}:wght@${min}..${max}`;
    }
    const uniq = [...new Set(entry.weights ?? [400])].sort((a, b) => a - b);
    return `family=${enc}:wght@${uniq.join(";")}`;
  });
  return `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap`;
}

function applyGalleryStylesheets(fonts) {
  clearGalleryStylesheets();
  for (let i = 0; i < fonts.length; i += GALLERY_BATCH) {
    const batch = fonts.slice(i, i + GALLERY_BATCH);
    const el = document.createElement("link");
    el.rel = "stylesheet";
    el.dataset.fontSimGallery = String(i / GALLERY_BATCH);
    el.href = buildBatchGoogleFontsHref(batch);
    document.head.appendChild(el);
  }
}

function saveState() {
  const { categoryFilter: _, ...toSave } = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    /* private mode */
  }
}

function setState(patch) {
  Object.assign(state, patch);
  saveState();
  applyGalleryStylesheets(filteredFonts());
  render();
}

function rangeRow(id, label, value, min, max, step, unit, format) {
  const display = format ? format(value) : `${value}${unit}`;
  return `
    <div class="font-sim__field">
      <div class="font-sim__field-head">
        <label for="${id}">${label}</label>
        <output id="${id}-out" for="${id}" class="font-sim__value">${display}</output>
      </div>
      <input type="range" id="${id}" class="font-sim__range" min="${min}" max="${max}" step="${step}" value="${value}" />
    </div>`;
}

function render() {
  if (!$root) return;
  const fonts = filteredFonts();
  $root.innerHTML = `
  <section class="font-sim__gallery" aria-label="複数書体プレビュー">
    <div class="font-sim__gallery-head">
      <label for="font-sim-gallery-text" class="visually-hidden">プレビュー文言</label>
      <textarea
        id="font-sim-gallery-text"
        class="font-sim__gallery-input"
        rows="3"
        spellcheck="false"
        autocomplete="off"
      >${escapeHtml(state.previewText)}</textarea>
    </div>
    <div class="font-sim__gallery-bar">
      ${rangeRow("font-sim-weight", "font-weight", state.weight, 100, 900, 100, "", String)}
      ${rangeRow("font-sim-size", "font-size", state.fontSize, 14, 48, 1, "px", String)}
      ${rangeRow("font-sim-lh", "line-height", state.lineHeight, 0.8, 3, 0.05, "", (v) => Number(v).toFixed(2))}
      ${rangeRow("font-sim-ls", "letter-spacing", state.letterSpacing, -0.12, 0.4, 0.005, "em", (v) => `${Number(v).toFixed(3)}em`)}
      <div class="font-sim__gallery-bar-seg-row">
        <div class="font-sim__field font-sim__gallery-bar-seg">
          <span class="font-sim__label" id="font-sim-writing-mode-label">writing-mode</span>
          <div class="font-sim__seg" role="group" aria-labelledby="font-sim-writing-mode-label">
            ${["horizontal-tb", "vertical-rl", "vertical-lr"]
              .map(
                (m) => `
              <button type="button" class="font-sim__seg-btn${state.writingMode === m ? " is-active" : ""}" data-writing-mode="${m}">
                ${m}
              </button>`
              )
              .join("")}
          </div>
        </div>
        <div class="font-sim__field font-sim__gallery-bar-seg">
          <span class="font-sim__label" id="font-sim-ffs-label">font-feature-settings</span>
          <div class="font-sim__seg" role="group" aria-labelledby="font-sim-ffs-label">
            ${[
              { id: "normal", label: "normal" },
              { id: "palt", label: '"palt" 1' },
            ]
              .map(
                (o) => `
              <button type="button" class="font-sim__seg-btn${state.fontFeatureSettings === o.id ? " is-active" : ""}" data-font-feature="${o.id}">
                ${o.label}
              </button>`
              )
              .join("")}
          </div>
        </div>
        <div class="font-sim__field font-sim__gallery-bar-seg">
          <span class="font-sim__label" id="font-sim-align-label">text-align</span>
          <div class="font-sim__seg" role="group" aria-labelledby="font-sim-align-label">
            ${["start", "center", "end", "justify"]
              .map(
                (a) => `
              <button type="button" class="font-sim__seg-btn${state.textAlign === a ? " is-active" : ""}" data-align="${a}">
                ${a}
              </button>`
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="font-sim__category">
      <div class="font-sim__seg" role="group" aria-label="category">
        ${["all", "sans-serif", "serif"]
          .map(
            (c) => `
          <button type="button" class="font-sim__seg-btn${state.categoryFilter === c ? " is-active" : ""}" data-category="${c}">
            ${c}
          </button>`
          )
          .join("")}
      </div>
    </div>
    <div class="font-sim__grid${isVerticalWriting() ? " font-sim__grid--vertical" : ""}">
      ${fonts
        .map(
          (f) => `
        <article class="font-sim__card" data-family="${escapeAttr(f.family)}">
          <span class="font-sim__card-sample" style="${escapeAttr(galleryTypographyStyle(f.family))}">${escapeHtml(state.previewText)}</span>
          <span class="font-sim__card-name">${escapeHtml(f.family)}</span>
        </article>`
        )
        .join("")}
    </div>
  </section>`;

  bindHandlers();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function isVerticalWriting() {
  return state.writingMode.startsWith("vertical");
}

function syncGridVerticalLayout() {
  $root.querySelector(".font-sim__grid")?.classList.toggle("font-sim__grid--vertical", isVerticalWriting());
}

function applyTypographyToGallery() {
  syncGridVerticalLayout();
  $root.querySelectorAll(".font-sim__card").forEach((card) => {
    const family = card.getAttribute("data-family");
    const sample = card.querySelector(".font-sim__card-sample");
    if (family && sample) {
      sample.style.cssText = galleryTypographyStyle(family);
    }
  });
}

function bindRange(id, key, parser, outputFormat) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  if (!input) return;
  input.addEventListener("input", () => {
    state[key] = parser(input.value);
    saveState();
    if (out && outputFormat) {
      out.textContent = outputFormat(state[key]);
    }
    applyTypographyToGallery();
  });
}

function bindHandlers() {
  const input = document.getElementById("font-sim-gallery-text");
  input?.addEventListener("input", () => {
    state.previewText = input.value;
    state.sample = "custom";
    saveState();
    $root.querySelectorAll(".font-sim__card-sample").forEach((el) => {
      el.textContent = state.previewText;
    });
  });

  bindRange("font-sim-weight", "weight", Number, String);
  bindRange("font-sim-size", "fontSize", Number, (v) => `${v}px`);
  bindRange("font-sim-lh", "lineHeight", Number, (v) => Number(v).toFixed(2));
  bindRange("font-sim-ls", "letterSpacing", Number, (v) => `${Number(v).toFixed(3)}em`);
  $root.querySelectorAll("[data-writing-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mode = btn.getAttribute("data-writing-mode");
      if (!mode) return;
      state.writingMode = mode;
      saveState();
      syncGridVerticalLayout();
      applyTypographyToGallery();
      $root.querySelectorAll("[data-writing-mode]").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-writing-mode") === mode);
      });
    });
  });

  $root.querySelectorAll("[data-font-feature]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const feature = btn.getAttribute("data-font-feature");
      if (feature !== "normal" && feature !== "palt") return;
      state.fontFeatureSettings = feature;
      saveState();
      applyTypographyToGallery();
      $root.querySelectorAll("[data-font-feature]").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-font-feature") === feature);
      });
    });
  });

  $root.querySelectorAll("[data-align]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const align = btn.getAttribute("data-align") || "start";
      state.textAlign = align;
      saveState();
      applyTypographyToGallery();
      $root.querySelectorAll("[data-align]").forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute("data-align") === align);
      });
    });
  });

  $root.querySelectorAll("[data-category]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const category = btn.getAttribute("data-category");
      if (category === "all" || category === "sans-serif" || category === "serif") {
        setState({ categoryFilter: category });
      }
    });
  });

}

async function init() {
  if (!$root) return;
  loadSavedState();
  $root.innerHTML = `<p class="font-sim__loading">フォント一覧を読み込み中…</p>`;
  try {
    await loadFontCatalog();
    applyGalleryStylesheets(filteredFonts());
    render();
    if (fontCatalogSource !== "google-metadata") {
      console.info("[font-simulator] 一覧は Fontsource API 経由です（公式 metadata はブラウザ直 fetch 不可のことが多い）");
    }
  } catch {
    fontCatalogSource = "pinned";
    allFonts = PINNED_FAMILIES.map((family) => ({
      id: family.toLowerCase().replace(/\s+/g, "-"),
      family,
      subsets: ["japanese", "latin"],
      weights: [400, 700],
      styles: ["normal"],
      variable: true,
      category: "sans-serif",
      type: "google",
    }));
    $root.innerHTML = `<p class="font-sim__error" role="alert">フォント一覧の取得に失敗しました。ピン留めフォントのみ利用できます。</p>`;
    applyGalleryStylesheets(filteredFonts());
    render();
  }
}

init();