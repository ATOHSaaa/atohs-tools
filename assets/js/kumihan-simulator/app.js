const STORAGE_KEY = "atohs-kumihan-simulator";

const SAMPLE_SOURCE = `## 組版のリズムを、ブラウザで確かめる

Web組版とは、画面の上で文字の行送り・字送り・段組・縦横の組み方まで含めて、読みやすい版を作ることです。紙の活字組版と違い、CSS のプロパティで大半を指定します。

### 禁則と約物

禁則処理は line-break や word-break、overflow-wrap の組み合わせで調整します。句読点や約物が行頭に来ないようにするのは、和文では特に効いてきます。hanging-punctuation を使うと、行頭の括弧類を少しはみ出させて、視覚的な揃えをよくできるブラウザもあります。

#### OpenType 機能

欧文や数字が混じる段落では、font-feature-settings の "palt"（プロポーショナルメトリクス）を有効にすると、全角と半角の間の余白が自然になることがあります。ただし書体やウェイトによって効き方は違うので、実際のテキストで確かめるのが確実です。

このツールではスライダーとボタンで組版を調整し、下の CSS スニペットをコピーして自分のプロジェクトに持ち込めます。`;

const FONT_FAMILIES = [
  '"Noto Sans JP", sans-serif',
  '"Noto Serif JP", serif',
];

/** @type {Record<2|3|4, number>} */
const HEADING_BASE_EM = { 2: 1.35, 3: 1.15, 4: 1.05 };

function themeColorVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function normalizeHexColor(value) {
  let s = String(value || "").trim();
  if (!s.startsWith("#")) s = `#${s}`;
  if (s.length === 4) {
    s = `#${s[1]}${s[1]}${s[2]}${s[2]}${s[3]}${s[3]}`;
  }
  return /^#[0-9a-f]{6}$/i.test(s) ? s.toLowerCase() : "#000000";
}

const defaultState = () => ({
  fontFamily: FONT_FAMILIES[0],
  boxBackgroundColor: themeColorVar("--color-bg", "#fffefa"),
  boxColor: themeColorVar("--color-text", "#0a0a37"),
  fontWeight: 400,
  fontSize: 18,
  lineHeight: 1.9,
  letterSpacing: 0,
  textIndent: 0,
  maxWidthCh: 42,
  columns: 1,
  columnGap: 2,
  writingMode: "horizontal-tb",
  textAlign: "start",
  lineBreak: "strict",
  wordBreak: "normal",
  overflowWrap: "anywhere",
  hangingPunctuation: "allow-end",
  textWrap: "pretty",
  fontFeatureSettings: "palt",
  headingScale: 1,
  heading2SizeOn: false,
  heading3SizeOn: false,
  heading4SizeOn: false,
  heading2Em: 1.35,
  heading3Em: 1.15,
  heading4Em: 1.05,
  heading2WeightOn: false,
  heading3WeightOn: false,
  heading4WeightOn: false,
  heading2Weight: 700,
  heading3Weight: 700,
  heading4Weight: 700,
  heading2LhOn: false,
  heading3LhOn: false,
  heading4LhOn: false,
  heading2Lh: 1.4,
  heading3Lh: 1.4,
  heading4Lh: 1.4,
  heading2LsOn: false,
  heading3LsOn: false,
  heading4LsOn: false,
  heading2Ls: 0,
  heading3Ls: 0,
  heading4Ls: 0,
  heading2Open: false,
  heading3Open: false,
  heading4Open: false,
  headingWeight: 700,
  headingLineHeight: 1.4,
  headingLetterSpacing: 0,
  source: SAMPLE_SOURCE,
});

const state = defaultState();

const $root = document.getElementById("kumi-sim-app");

/** @param {2|3|4} level */
function headingEm(level) {
  if (state[`heading${level}SizeOn`]) return state[`heading${level}Em`];
  return HEADING_BASE_EM[level] * (state.headingScale ?? 1);
}

/** @param {2|3|4} level */
function headingWeightOf(level) {
  return state[`heading${level}WeightOn`] ? state[`heading${level}Weight`] : state.headingWeight;
}

/** @param {2|3|4} level */
function headingLhOf(level) {
  return state[`heading${level}LhOn`] ? state[`heading${level}Lh`] : state.headingLineHeight;
}

/** @param {2|3|4} level */
function headingLsOf(level) {
  return state[`heading${level}LsOn`] ? state[`heading${level}Ls`] : state.headingLetterSpacing;
}

/** @param {2|3|4} level */
function headingStyleVars(level) {
  return [
    `--kumi-h${level}-size:${headingEm(level)}em`,
    `--kumi-h${level}-weight:${headingWeightOf(level)}`,
    `--kumi-h${level}-lh:${headingLhOf(level)}`,
    `--kumi-h${level}-ls:${headingLsOf(level)}em`,
  ];
}

function fontFeatureCss(id) {
  if (id === "palt") return '"palt" 1';
  if (id === "pkna") return '"pkna" 1';
  if (id === "palt-pkna") return '"palt" 1, "pkna" 1';
  return "normal";
}

function articleStyle() {
  const vertical = state.writingMode.startsWith("vertical");
  const measure = vertical ? "max-height" : "max-width";
  const measureUnit = `${state.maxWidthCh}ch`;
  return [
    `font-family:${state.fontFamily}`,
    `font-weight:${state.fontWeight}`,
    `font-size:${state.fontSize}px`,
    `line-height:${state.lineHeight}`,
    `letter-spacing:${state.letterSpacing}em`,
    `writing-mode:${state.writingMode}`,
    vertical ? "text-orientation:mixed" : "",
    `text-align:${state.textAlign}`,
    `line-break:${state.lineBreak}`,
    `word-break:${state.wordBreak}`,
    `overflow-wrap:${state.overflowWrap}`,
    `hanging-punctuation:${state.hangingPunctuation}`,
    `text-wrap:${state.textWrap}`,
    `font-feature-settings:${fontFeatureCss(state.fontFeatureSettings)}`,
    `${measure}:${measureUnit}`,
    state.columns > 1 ? `columns:${state.columns}` : "columns:auto",
    state.columns > 1 ? `column-gap:${state.columnGap}em` : "",
    ...headingStyleVars(2),
    ...headingStyleVars(3),
    ...headingStyleVars(4),
  ]
    .filter(Boolean)
    .join(";");
}

function paragraphStyle() {
  return state.textIndent ? `text-indent:${state.textIndent}em` : "text-indent:0";
}

function previewPaneStyle() {
  return [
    `background-color:${normalizeHexColor(state.boxBackgroundColor)}`,
    `color:${normalizeHexColor(state.boxColor)}`,
  ].join(";");
}

function buildCssSnippet() {
  const sel = ".article";
  const lines = [
    `${sel} {`,
    `  font-family: ${state.fontFamily};`,
    `  font-weight: ${state.fontWeight};`,
    `  font-size: ${state.fontSize}px;`,
    `  line-height: ${state.lineHeight};`,
    `  letter-spacing: ${state.letterSpacing}em;`,
    `  writing-mode: ${state.writingMode};`,
  ];
  if (state.writingMode.startsWith("vertical")) {
    lines.push(`  text-orientation: mixed;`);
  }
  lines.push(
    `  text-align: ${state.textAlign};`,
    `  line-break: ${state.lineBreak};`,
    `  word-break: ${state.wordBreak};`,
    `  overflow-wrap: ${state.overflowWrap};`,
    `  hanging-punctuation: ${state.hangingPunctuation};`,
    `  text-wrap: ${state.textWrap};`,
    `  font-feature-settings: ${fontFeatureCss(state.fontFeatureSettings)};`,
    `  color: ${normalizeHexColor(state.boxColor)};`,
    `  background-color: ${normalizeHexColor(state.boxBackgroundColor)};`
  );
  const vertical = state.writingMode.startsWith("vertical");
  lines.push(
    `  ${vertical ? "max-height" : "max-width"}: ${state.maxWidthCh}ch;`
  );
  if (state.columns > 1) {
    lines.push(`  columns: ${state.columns};`, `  column-gap: ${state.columnGap}em;`);
  }
  lines.push(
    `}`,
    `${sel} p {`,
    `  text-indent: ${state.textIndent}em;`,
    `}`,
    `${sel} :is(h2, h3, h4) {`,
    `  text-indent: 0;`,
    `}`,
    ...[2, 3, 4].flatMap((level) => [
      `${sel} h${level} {`,
      `  font-size: ${headingEm(level)}em;`,
      `  font-weight: ${headingWeightOf(level)};`,
      `  line-height: ${headingLhOf(level)};`,
      `  letter-spacing: ${headingLsOf(level)}em;`,
      `}`,
    ])
  );
  return lines.join("\n");
}

function buildPromptSnippet() {
  const vertical = state.writingMode.startsWith("vertical");
  const measure = vertical ? "max-height" : "max-width";
  const mark = (on) => (on ? "上書き" : "共通");
  const headingLines = [2, 3, 4].flatMap((level) => [
    `- h${level}`,
    `  - font-size: ${headingEm(level)}em（${mark(state[`heading${level}SizeOn`])}）`,
    `  - font-weight: ${headingWeightOf(level)}（${mark(state[`heading${level}WeightOn`])}）`,
    `  - line-height: ${headingLhOf(level)}（${mark(state[`heading${level}LhOn`])}）`,
    `  - letter-spacing: ${headingLsOf(level)}em（${mark(state[`heading${level}LsOn`])}）`,
  ]);

  return [
    "日本語の Web 組版を、次の仕様どおりに実装してください。",
    "",
    "## 記事コンテナ（.article）",
    `- color: ${normalizeHexColor(state.boxColor)}`,
    `- background-color: ${normalizeHexColor(state.boxBackgroundColor)}`,
    `- ${measure}: ${state.maxWidthCh}ch`,
    state.columns > 1
      ? `- columns: ${state.columns}; column-gap: ${state.columnGap}em`
      : "- columns: 1",
    `- font-family: ${state.fontFamily}`,
    `- writing-mode: ${state.writingMode}${vertical ? "; text-orientation: mixed" : ""}`,
    `- text-align: ${state.textAlign}`,
    `- line-break: ${state.lineBreak}`,
    `- word-break: ${state.wordBreak}`,
    `- overflow-wrap: ${state.overflowWrap}`,
    `- hanging-punctuation: ${state.hangingPunctuation}`,
    `- text-wrap: ${state.textWrap}`,
    `- font-feature-settings: ${fontFeatureCss(state.fontFeatureSettings)}`,
    "",
    "## 本文（p）",
    `- font-size: ${state.fontSize}px`,
    `- font-weight: ${state.fontWeight}`,
    `- line-height: ${state.lineHeight}`,
    `- letter-spacing: ${state.letterSpacing}em`,
    `- p の text-indent: ${state.textIndent}em`,
    "",
    "## 見出し（h2 / h3 / h4）",
    `- 見出し共通の既定: font-weight ${state.headingWeight}; line-height ${state.headingLineHeight}; letter-spacing ${state.headingLetterSpacing}em`,
    `- 見出しの font-size 倍率（一括）: ${state.headingScale ?? 1}（基準 h2 1.35 / h3 1.15 / h4 1.05 em、本文の font-size 基準の em）`,
    ...headingLines,
    "",
    "## マークアップ",
    "ルートは `.article`。h2–h4 と p。見出しは行頭の ## / ### / ####、段落は空行区切り。",
    "",
    "## 参考 CSS",
    "```css",
    buildCssSnippet(),
    "```",
  ].join("\n");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.source === undefined) {
      if (saved.title && saved.body) {
        saved.source = `## ${saved.title}\n\n${saved.body}`;
      } else if (saved.body != null) {
        saved.source = saved.body;
      }
      delete saved.title;
      delete saved.body;
    }
    if (saved.fontRole && !saved.fontFamily) {
      saved.fontFamily =
        saved.fontRole === "serif" ? FONT_FAMILIES[1] : FONT_FAMILIES[0];
      delete saved.fontRole;
    }
    if (saved.headingScale == null && saved.heading2Em != null) {
      saved.headingScale = 1;
      for (const level of /** @type {const} */ ([2, 3, 4])) {
        const em = saved[`heading${level}Em`];
        const key = `heading${level}OverrideEnabled`;
        if (em != null && Math.abs(em - HEADING_BASE_EM[level]) > 0.001) {
          saved[key] = true;
        } else if (saved[key] == null) {
          saved[key] = false;
        }
      }
    }
    for (const level of /** @type {const} */ ([2, 3, 4])) {
      if (saved[`heading${level}SizeOn`] == null && saved[`heading${level}OverrideEnabled`] != null) {
        saved[`heading${level}SizeOn`] = Boolean(saved[`heading${level}OverrideEnabled`]);
      }
      if (saved[`heading${level}Open`] == null) saved[`heading${level}Open`] = false;
      if (saved[`heading${level}Weight`] == null) saved[`heading${level}Weight`] = saved.headingWeight ?? 700;
      if (saved[`heading${level}Lh`] == null) saved[`heading${level}Lh`] = saved.headingLineHeight ?? 1.4;
      if (saved[`heading${level}Ls`] == null) saved[`heading${level}Ls`] = saved.headingLetterSpacing ?? 0;
    }
    Object.assign(state, saved);
    if (!FONT_FAMILIES.includes(state.fontFamily)) {
      state.fontFamily = FONT_FAMILIES[0];
    }
    if (state.boxBackgroundColor) {
      state.boxBackgroundColor = normalizeHexColor(state.boxBackgroundColor);
    }
    if (state.boxColor) {
      state.boxColor = normalizeHexColor(state.boxColor);
    }
  } catch {
    /* ignore */
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode */
  }
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

/** @returns {{ type: 'h2'|'h3'|'h4'|'p', text: string }[]} */
function parseSource(text) {
  const blocks = [];
  let para = [];

  const flushPara = () => {
    if (!para.length) return;
    blocks.push({ type: "p", text: para.join("\n") });
    para = [];
  };

  for (const line of String(text).split("\n")) {
    const hm = line.match(/^(#{2,4})\s+(.*)$/);
    if (hm) {
      flushPara();
      const level = hm[1].length;
      blocks.push({ type: /** @type {'h2'|'h3'|'h4'} */ (`h${level}`), text: hm[2].trim() });
      continue;
    }
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

function articleContentHtml(source) {
  return parseSource(source)
    .map((block) => {
      if (block.type === "p") {
        const inner = escapeHtml(block.text).replace(/\n/g, "<br>");
        return `<p class="kumi-sim__paragraph" style="${escapeAttr(paragraphStyle())}">${inner}</p>`;
      }
      const level = block.type.slice(1);
      return `<${block.type} class="kumi-sim__heading kumi-sim__heading--h${level}">${escapeHtml(block.text)}</${block.type}>`;
    })
    .join("");
}

function updateArticleContent() {
  const article = $root?.querySelector(".kumi-sim__article");
  if (!article) return;
  article.style.cssText = articleStyle();
  article.innerHTML = articleContentHtml(state.source);
}

function rangeRow(id, label, value, min, max, step, format, disabled = false) {
  const display = format(value);
  return `
    <div class="font-sim__field">
      <div class="font-sim__field-head">
        <label for="${id}">${label}</label>
        <output id="${id}-out" for="${id}" class="font-sim__value">${display}</output>
      </div>
      <input type="range" id="${id}" class="font-sim__range" min="${min}" max="${max}" step="${step}" value="${value}"${disabled ? " disabled" : ""} />
    </div>`;
}

/** @param {2|3|4} level */
function headingPropRow(level, prop) {
  const spec = {
    size: {
      on: "SizeOn",
      valueKey: "Em",
      id: "size",
      label: "font-size",
      min: { 2: 1, 3: 0.9, 4: 0.85 }[level],
      max: { 2: 2.5, 3: 1.8, 4: 1.5 }[level],
      step: 0.05,
      format: (v) => `${Number(v).toFixed(2)}em`,
    },
    weight: {
      on: "WeightOn",
      valueKey: "Weight",
      id: "weight",
      label: "font-weight",
      min: 300,
      max: 700,
      step: 100,
      format: String,
    },
    lh: {
      on: "LhOn",
      valueKey: "Lh",
      id: "lh",
      label: "line-height",
      min: 1,
      max: 2,
      step: 0.05,
      format: (v) => Number(v).toFixed(2),
    },
    ls: {
      on: "LsOn",
      valueKey: "Ls",
      id: "ls",
      label: "letter-spacing",
      min: -0.08,
      max: 0.2,
      step: 0.005,
      format: (v) => `${Number(v).toFixed(3)}em`,
    },
  }[prop];
  const enabled = Boolean(state[`heading${level}${spec.on}`]);
  return `
    <div class="kumi-sim__heading-override-row${enabled ? "" : " is-disabled"}" data-heading-prop="${prop}">
      <label class="kumi-sim__override-check">
        <input type="checkbox" id="kumi-h${level}-${spec.id}-on" data-heading-level="${level}" data-heading-prop="${prop}"${enabled ? " checked" : ""} />
        <span>${spec.label}</span>
      </label>
      ${rangeRow(
        `kumi-h${level}-${spec.id}`,
        spec.label,
        state[`heading${level}${spec.valueKey}`],
        spec.min,
        spec.max,
        spec.step,
        spec.format,
        !enabled
      )}
    </div>`;
}

/** @param {2|3|4} level */
function headingLevelGroup(level) {
  const open = Boolean(state[`heading${level}Open`]);
  return `
    <details class="kumi-sim__heading-details" id="kumi-h${level}-details" data-heading-level="${level}"${open ? " open" : ""}>
      <summary>h${level}</summary>
      <div class="kumi-sim__heading-details-body">
        ${headingPropRow(level, "size")}
        ${headingPropRow(level, "weight")}
        ${headingPropRow(level, "lh")}
        ${headingPropRow(level, "ls")}
      </div>
    </details>`;
}

function headingEffectiveSummary() {
  return `h2 ${headingEm(2).toFixed(2)}em · h3 ${headingEm(3).toFixed(2)}em · h4 ${headingEm(4).toFixed(2)}em`;
}

function controlPanel(id, title, innerHtml) {
  return `
    <section class="kumi-sim__panel" aria-labelledby="${id}">
      <h2 class="kumi-sim__panel-title" id="${id}">${escapeHtml(title)}</h2>
      ${innerHtml}
    </section>`;
}

function syncHeadingEffectiveLabel() {
  const el = document.getElementById("kumi-heading-effective");
  if (el) el.textContent = headingEffectiveSummary();
}

function colorField(id, label, value) {
  const hex = normalizeHexColor(value);
  return `
    <div class="font-sim__field kumi-sim__color-field">
      <div class="font-sim__field-head">
        <label for="${id}">${label}</label>
        <output id="${id}-out" for="${id}" class="font-sim__value">${hex}</output>
      </div>
      <input type="color" id="${id}" class="kumi-sim__color-input" value="${escapeAttr(hex)}" />
    </div>`;
}

function segGroup(labelId, label, attr, options, current) {
  return `
    <div class="font-sim__field">
      <span class="font-sim__label" id="${labelId}">${label}</span>
      <div class="font-sim__seg" role="group" aria-labelledby="${labelId}">
        ${options
          .map(
            (o) => `
          <button type="button" class="font-sim__seg-btn${current === o.id ? " is-active" : ""}" data-${attr}="${escapeAttr(o.id)}">
            ${escapeHtml(o.label)}
          </button>`
          )
          .join("")}
      </div>
    </div>`;
}

/** @type {number | undefined} */
let copyToastTimer;

function showCopyToast(message) {
  let toast = document.getElementById("kumi-sim-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "kumi-sim-toast";
    toast.className = "kumi-sim-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-visible");
  if (copyToastTimer != null) window.clearTimeout(copyToastTimer);
  copyToastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function applyPreview() {
  const pane = $root?.querySelector(".kumi-sim__preview-pane");
  if (pane) pane.style.cssText = previewPaneStyle();
  const article = $root?.querySelector(".kumi-sim__article");
  if (article) article.style.cssText = articleStyle();
  $root?.querySelectorAll(".kumi-sim__paragraph").forEach((p) => {
    p.style.cssText = paragraphStyle();
  });
  const cssCode = $root?.querySelector("#kumi-css-code");
  if (cssCode) cssCode.textContent = buildCssSnippet();
  const promptCode = $root?.querySelector("#kumi-prompt-code");
  if (promptCode) promptCode.textContent = buildPromptSnippet();
  syncHeadingEffectiveLabel();
  $root?.querySelector(".kumi-sim__preview-pane")?.classList.toggle(
    "kumi-sim__preview-pane--vertical",
    state.writingMode.startsWith("vertical")
  );
}

function render() {
  if (!$root) return;

  $root.innerHTML = `
  <div class="kumi-sim__layout font-sim__layout">
    <aside id="kumi-sidebar" class="kumi-sim__controls font-sim__controls" aria-label="組版の調整">
      <div class="font-sim__field kumi-sim__source-field">
        <label for="kumi-source" class="font-sim__label">原稿</label>
        <p class="kumi-sim__md-hint"><code>##</code>〜<code>####</code> で見出し。空行で段落。</p>
        <textarea id="kumi-source" class="font-sim__input kumi-sim__source-input" rows="3" spellcheck="false">${escapeHtml(state.source)}</textarea>
      </div>
      ${controlPanel(
        "kumi-panel-general",
        "general",
        `
      ${colorField("kumi-box-bg", "background-color", state.boxBackgroundColor)}
      ${colorField("kumi-box-color", "color", state.boxColor)}
      ${rangeRow("kumi-measure", state.writingMode.startsWith("vertical") ? "max-height (ch)" : "max-width (ch)", state.maxWidthCh, 20, 80, 1, (v) => `${v}ch`)}
      ${rangeRow("kumi-cols", "columns", state.columns, 1, 3, 1, String)}
      ${rangeRow("kumi-col-gap", "column-gap", state.columnGap, 1, 4, 0.25, (v) => `${Number(v).toFixed(2)}em`)}
      ${segGroup(
        "kumi-font-label",
        "font-family",
        "font-family",
        FONT_FAMILIES.map((family) => ({ id: family, label: family })),
        state.fontFamily
      )}
      ${segGroup(
        "kumi-wm-label",
        "writing-mode",
        "writing-mode",
        [
          { id: "horizontal-tb", label: "horizontal-tb" },
          { id: "vertical-rl", label: "vertical-rl" },
        ],
        state.writingMode
      )}
      ${segGroup(
        "kumi-align-label",
        "text-align",
        "text-align",
        [
          { id: "start", label: "start" },
          { id: "center", label: "center" },
          { id: "end", label: "end" },
          { id: "justify", label: "justify" },
        ],
        state.textAlign
      )}
      ${segGroup(
        "kumi-lb-label",
        "line-break",
        "line-break",
        [
          { id: "auto", label: "auto" },
          { id: "strict", label: "strict" },
          { id: "loose", label: "loose" },
        ],
        state.lineBreak
      )}
      ${segGroup(
        "kumi-wb-label",
        "word-break",
        "word-break",
        [
          { id: "normal", label: "normal" },
          { id: "keep-all", label: "keep-all" },
          { id: "break-all", label: "break-all" },
        ],
        state.wordBreak
      )}
      ${segGroup(
        "kumi-ow-label",
        "overflow-wrap",
        "overflow-wrap",
        [
          { id: "normal", label: "normal" },
          { id: "break-word", label: "break-word" },
          { id: "anywhere", label: "anywhere" },
        ],
        state.overflowWrap
      )}
      ${segGroup(
        "kumi-hp-label",
        "hanging-punctuation",
        "hanging-punctuation",
        [
          { id: "none", label: "none" },
          { id: "allow-end", label: "allow-end" },
          { id: "first allow-end", label: "first allow-end" },
        ],
        state.hangingPunctuation
      )}
      ${segGroup(
        "kumi-tw-label",
        "text-wrap",
        "text-wrap",
        [
          { id: "wrap", label: "wrap" },
          { id: "balance", label: "balance" },
          { id: "pretty", label: "pretty" },
        ],
        state.textWrap
      )}
      ${segGroup(
        "kumi-ffs-label",
        "font-feature-settings",
        "font-feature",
        [
          { id: "normal", label: "normal" },
          { id: "palt", label: "palt" },
          { id: "pkna", label: "pkna" },
          { id: "palt-pkna", label: '"palt" 1, "pkna" 1' },
        ],
        state.fontFeatureSettings
      )}
      `
      )}
      ${controlPanel(
        "kumi-panel-body",
        "body-text",
        `
      ${rangeRow("kumi-size", "font-size", state.fontSize, 13, 28, 1, (v) => `${v}px`)}
      ${rangeRow("kumi-weight", "font-weight", state.fontWeight, 300, 700, 100, String)}
      ${rangeRow("kumi-lh", "line-height", state.lineHeight, 1.2, 2.6, 0.05, (v) => Number(v).toFixed(2))}
      ${rangeRow("kumi-ls", "letter-spacing", state.letterSpacing, -0.08, 0.2, 0.005, (v) => `${Number(v).toFixed(3)}em`)}
      ${rangeRow("kumi-indent", "text-indent", state.textIndent, 0, 2, 0.25, (v) => `${Number(v).toFixed(2)}em`)}
      `
      )}
      ${controlPanel(
        "kumi-panel-heading",
        "heading-text",
        `
      ${rangeRow("kumi-heading-scale", "font-size scale", state.headingScale ?? 1, 0.75, 1.35, 0.01, (v) => Number(v).toFixed(2))}
      <p class="kumi-sim__heading-effective" id="kumi-heading-effective">${headingEffectiveSummary()}</p>
      <p class="kumi-sim__md-hint">一括は h2 1.35 / h3 1.15 / h4 1.05 em を基準に倍率します。チェックした項目だけ、そのレベルで上書きします。</p>
      ${rangeRow("kumi-h-weight", "font-weight", state.headingWeight, 300, 700, 100, String)}
      ${rangeRow("kumi-h-lh", "line-height", state.headingLineHeight, 1, 2, 0.05, (v) => Number(v).toFixed(2))}
      ${rangeRow("kumi-h-ls", "letter-spacing", state.headingLetterSpacing, -0.08, 0.2, 0.005, (v) => `${Number(v).toFixed(3)}em`)}
      ${headingLevelGroup(2)}
      ${headingLevelGroup(3)}
      ${headingLevelGroup(4)}
      `
      )}
    </aside>
    <div class="kumi-sim__preview-wrap font-sim__preview-wrap">
      <div class="kumi-sim__preview-pane" style="${escapeAttr(previewPaneStyle())}" aria-label="組版プレビュー">
        <article class="kumi-sim__article" style="${escapeAttr(articleStyle())}">
          ${articleContentHtml(state.source)}
        </article>
      </div>
      <div class="kumi-sim__code-wrap">
        <div class="kumi-sim__code-panel">
          <span class="kumi-sim__code-label">CSS</span>
          <button type="button" class="kumi-sim__copy-btn" id="kumi-copy-css" aria-label="CSS をコピー" title="コピー">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <pre class="font-sim__code kumi-sim__code"><code id="kumi-css-code">${escapeHtml(buildCssSnippet())}</code></pre>
        </div>
        <div class="kumi-sim__code-panel">
          <span class="kumi-sim__code-label">prompt</span>
          <button type="button" class="kumi-sim__copy-btn" id="kumi-copy-prompt" aria-label="プロンプトをコピー" title="コピー">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <pre class="font-sim__code kumi-sim__code kumi-sim__prompt"><code id="kumi-prompt-code">${escapeHtml(buildPromptSnippet())}</code></pre>
        </div>
      </div>
    </div>
  </div>`;

  bindHandlers();
}

function bindRange(id, key, parser, outputFormat) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  input?.addEventListener("input", () => {
    state[key] = parser(input.value);
    saveState();
    if (out) out.textContent = outputFormat(state[key]);
    if (key === "maxWidthCh" || key === "columns" || key === "writingMode") {
      const measureLabel = $root.querySelector('label[for="kumi-measure"]');
      if (measureLabel) {
        measureLabel.textContent = state.writingMode.startsWith("vertical")
          ? "max-height (ch)"
          : "max-width (ch)";
      }
    }
    applyPreview();
  });
}

function bindSeg(attr, key, allowed) {
  $root.querySelectorAll(`[data-${attr}]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute(`data-${attr}`);
      if (!value || (allowed && !allowed.includes(value))) return;
      state[key] = value;
      saveState();
      $root.querySelectorAll(`[data-${attr}]`).forEach((b) => {
        b.classList.toggle("is-active", b.getAttribute(`data-${attr}`) === value);
      });
      if (key === "writingMode") {
        const measureLabel = $root.querySelector('label[for="kumi-measure"]');
        if (measureLabel) {
          measureLabel.textContent = value.startsWith("vertical") ? "max-height (ch)" : "max-width (ch)";
        }
      }
      applyPreview();
    });
  });
}

function bindColor(id, key) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  input?.addEventListener("input", () => {
    state[key] = normalizeHexColor(input.value);
    saveState();
    if (out) out.textContent = state[key];
    applyPreview();
  });
}

function bindHandlers() {
  bindColor("kumi-box-bg", "boxBackgroundColor");
  bindColor("kumi-box-color", "boxColor");
  bindRange("kumi-size", "fontSize", Number, (v) => `${v}px`);
  bindRange("kumi-weight", "fontWeight", Number, String);
  bindRange("kumi-lh", "lineHeight", Number, (v) => Number(v).toFixed(2));
  bindRange("kumi-ls", "letterSpacing", Number, (v) => `${Number(v).toFixed(3)}em`);
  bindRange("kumi-heading-scale", "headingScale", Number, (v) => Number(v).toFixed(2));
  const headingFields = [
    ["size", "Em", (v) => `${Number(v).toFixed(2)}em`, (level) => headingEm(level)],
    ["weight", "Weight", String, (level) => headingWeightOf(level)],
    ["lh", "Lh", (v) => Number(v).toFixed(2), (level) => headingLhOf(level)],
    ["ls", "Ls", (v) => `${Number(v).toFixed(3)}em`, (level) => headingLsOf(level)],
  ];
  for (const level of /** @type {const} */ ([2, 3, 4])) {
    for (const [id, valueKey, format] of headingFields) {
      bindRange(`kumi-h${level}-${id}`, `heading${level}${valueKey}`, Number, format);
    }
    for (const [id, valueKey, format, current] of headingFields) {
      document.getElementById(`kumi-h${level}-${id}-on`)?.addEventListener("change", (e) => {
        const input = /** @type {HTMLInputElement} */ (e.currentTarget);
        const enabled = input.checked;
        const onKey = `heading${level}${id === "size" ? "Size" : id === "weight" ? "Weight" : id === "lh" ? "Lh" : "Ls"}On`;
        if (enabled) {
          state[`heading${level}${valueKey}`] = current(level);
          const slider = document.getElementById(`kumi-h${level}-${id}`);
          const out = document.getElementById(`kumi-h${level}-${id}-out`);
          if (slider) {
            slider.value = String(state[`heading${level}${valueKey}`]);
            slider.disabled = false;
          }
          if (out) out.textContent = format(state[`heading${level}${valueKey}`]);
        }
        state[onKey] = enabled;
        saveState();
        input.closest(".kumi-sim__heading-override-row")?.classList.toggle("is-disabled", !enabled);
        const slider = document.getElementById(`kumi-h${level}-${id}`);
        if (slider) slider.disabled = !enabled;
        applyPreview();
      });
    }
    document.getElementById(`kumi-h${level}-details`)?.addEventListener("toggle", (e) => {
      const details = /** @type {HTMLDetailsElement} */ (e.currentTarget);
      state[`heading${level}Open`] = details.open;
      saveState();
    });
  }
  bindRange("kumi-h-weight", "headingWeight", Number, String);
  bindRange("kumi-h-lh", "headingLineHeight", Number, (v) => Number(v).toFixed(2));
  bindRange("kumi-h-ls", "headingLetterSpacing", Number, (v) => `${Number(v).toFixed(3)}em`);
  bindRange("kumi-indent", "textIndent", Number, (v) => `${Number(v).toFixed(2)}em`);
  bindRange("kumi-measure", "maxWidthCh", Number, (v) => `${v}ch`);
  bindRange("kumi-cols", "columns", Number, String);
  bindRange("kumi-col-gap", "columnGap", Number, (v) => `${Number(v).toFixed(2)}em`);

  bindSeg("font-family", "fontFamily", FONT_FAMILIES);
  bindSeg("writing-mode", "writingMode", ["horizontal-tb", "vertical-rl"]);
  bindSeg("text-align", "textAlign", ["start", "center", "end", "justify"]);
  bindSeg("line-break", "lineBreak", ["auto", "strict", "loose"]);
  bindSeg("word-break", "wordBreak", ["normal", "keep-all", "break-all"]);
  bindSeg("overflow-wrap", "overflowWrap", ["normal", "break-word", "anywhere"]);
  bindSeg("hanging-punctuation", "hangingPunctuation", ["none", "allow-end", "first allow-end"]);
  bindSeg("text-wrap", "textWrap", ["wrap", "balance", "pretty"]);
  bindSeg("font-feature", "fontFeatureSettings", ["normal", "palt", "pkna", "palt-pkna"]);

  const sourceInput = document.getElementById("kumi-source");
  sourceInput?.addEventListener("input", () => {
    state.source = sourceInput.value;
    saveState();
    updateArticleContent();
  });

  const wireCopy = (id, getText, toastMessage) => {
    document.getElementById(id)?.addEventListener("click", async (e) => {
      const btn = /** @type {HTMLButtonElement} */ (e.currentTarget);
      const ok = await copyToClipboard(getText());
      if (ok) {
        showCopyToast(toastMessage);
        btn.classList.add("is-copied");
        window.setTimeout(() => btn.classList.remove("is-copied"), 1600);
      }
    });
  };
  wireCopy("kumi-copy-css", buildCssSnippet, "CSS をコピーしました");
  wireCopy("kumi-copy-prompt", buildPromptSnippet, "プロンプトをコピーしました");
}

function init() {
  if (!$root) return;
  loadSavedState();
  render();
}

init();