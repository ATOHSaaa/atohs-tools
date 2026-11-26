import { PLAYGROUNDS, specifiedCss } from "./playgrounds.js";
import {
  BUILTIN_PREVIEW_TEXTS,
  defaultPreviewForProperty,
} from "./preview-texts.js";
import {
  applyGenericPreview,
  bindGenericHandlers,
  createDefaultGenericState,
  genericControlsHtml,
  setPreviewTextGetter,
} from "./generic-playground.js";

const STORAGE_KEY = "atohs-css-text-playground";

export function getPreviewText(/** @type {typeof state} */ st = state) {
  const id = st.property;
  if (Object.prototype.hasOwnProperty.call(st.previewTexts, id)) {
    return st.previewTexts[id];
  }
  return defaultPreviewForProperty(id);
}

/** @typedef {{ id: string, label: string, ready: boolean, group: string }} PropertyEntry */

/** @type {PropertyEntry[]} */
const PROPERTIES = [
  { id: "font-size", label: "font-size", ready: true, group: "font" },
  { id: "font-family", label: "font-family", ready: true, group: "font" },
  { id: "font-weight", label: "font-weight", ready: true, group: "font" },
  { id: "font-style", label: "font-style", ready: true, group: "font" },
  { id: "font-stretch", label: "font-stretch", ready: true, group: "font" },
  { id: "font-variant", label: "font-variant", ready: true, group: "font" },
  { id: "line-height", label: "line-height", ready: true, group: "text" },
  { id: "letter-spacing", label: "letter-spacing", ready: true, group: "text" },
  { id: "word-spacing", label: "word-spacing", ready: true, group: "text" },
  { id: "text-align", label: "text-align", ready: true, group: "text" },
  { id: "text-combine-upright", label: "text-combine-upright", ready: true, group: "text" },
  { id: "text-decoration", label: "text-decoration", ready: true, group: "text" },
  { id: "text-decoration-color", label: "text-decoration-color", ready: true, group: "text" },
  { id: "text-decoration-style", label: "text-decoration-style", ready: true, group: "text" },
  { id: "text-decoration-thickness", label: "text-decoration-thickness", ready: true, group: "text" },
  { id: "text-emphasis-color", label: "text-emphasis-color", ready: true, group: "text" },
  { id: "text-emphasis-position", label: "text-emphasis-position", ready: true, group: "text" },
  { id: "text-emphasis-style", label: "text-emphasis-style", ready: true, group: "text" },
  { id: "text-indent", label: "text-indent", ready: true, group: "text" },
  { id: "text-orientation", label: "text-orientation", ready: true, group: "text" },
  { id: "text-overflow", label: "text-overflow", ready: true, group: "text" },
  { id: "text-rendering", label: "text-rendering", ready: true, group: "text" },
  { id: "text-shadow", label: "text-shadow", ready: true, group: "text" },
  { id: "text-stroke", label: "text-stroke", ready: true, group: "text" },
  { id: "text-stroke-width", label: "text-stroke-width", ready: true, group: "text" },
  { id: "text-stroke-color", label: "text-stroke-color", ready: true, group: "text" },
  { id: "text-size-adjust", label: "text-size-adjust", ready: true, group: "text" },
  { id: "text-transform", label: "text-transform", ready: true, group: "text" },
  { id: "text-underline-offset", label: "text-underline-offset", ready: true, group: "text" },
  { id: "text-underline-position", label: "text-underline-position", ready: true, group: "text" },
  { id: "writing-mode", label: "writing-mode", ready: true, group: "text" },
  { id: "white-space", label: "white-space", ready: true, group: "text" },
  { id: "text-wrap", label: "text-wrap", ready: true, group: "text" },
  { id: "hyphens", label: "hyphens", ready: true, group: "text" },
  { id: "font-feature-settings", label: "font-feature-settings", ready: true, group: "open-type" },
  { id: "font-variant-east-asian", label: "font-variant-east-asian", ready: true, group: "open-type" },
];

const GROUP_LABELS = {
  font: "Font",
  text: "Text",
  "open-type": "OpenType",
};

const NUMERIC_UNITS = ["px", "rem", "em", "%", "vw", "vh", "ch", "ex", "lh", "rlh"];

/** CSS font-size の絶対サイズ・相対・全体キーワード */
const FONT_SIZE_KEYWORDS = [
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
  "smaller",
  "larger",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
];

const FONT_SIZE_ABSOLUTE_KEYWORDS = new Set([
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
]);

/** プレビュー内の親 font-size が効く指定 */
const FONT_SIZE_PARENT_AWARE = new Set(["em", "%", "inherit", "unset", "smaller", "larger"]);

const FONT_FAMILY_PRESETS = [
  { id: "noto-sans-jp", css: '"Noto Sans JP", sans-serif' },
  { id: "noto-serif-jp", css: '"Noto Serif JP", serif' },
  { id: "system-ui", css: "system-ui, sans-serif" },
  { id: "ui-serif", css: 'ui-serif, "New York", "Noto Serif JP", serif' },
  { id: "monospace", css: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
  { id: "custom", css: "" },
];

const FONT_FAMILY_PARENT_PRESETS = [
  {
    id: "parent-sans",
    css: '"Helvetica Neue", Arial, "Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif',
  },
  { id: "parent-serif", css: '"Noto Serif JP", Georgia, serif' },
  { id: "parent-mono", css: "ui-monospace, Menlo, Consolas, monospace" },
];

const FONT_FAMILY_KEYWORDS = ["inherit", "initial", "unset", "revert", "revert-layer"];

const FONT_FAMILY_PARENT_AWARE = new Set(["inherit", "unset"]);

const UNIT_BOUNDS = {
  px: { min: 8, max: 120, step: 1, default: 18 },
  rem: { min: 0.5, max: 6, step: 0.05, default: 1.125 },
  em: { min: 0.5, max: 6, step: 0.05, default: 1.125 },
  "%": { min: 50, max: 300, step: 5, default: 100 },
  vw: { min: 0.5, max: 20, step: 0.1, default: 2 },
  vh: { min: 0.5, max: 20, step: 0.1, default: 2 },
  ch: { min: 1, max: 80, step: 1, default: 20 },
  ex: { min: 1, max: 80, step: 1, default: 10 },
  lh: { min: 0.5, max: 6, step: 0.05, default: 1 },
  rlh: { min: 0.5, max: 6, step: 0.05, default: 1 },
};

const defaultFontSizeState = () => ({
  unit: "px",
  value: 18,
  parentFontSize: 16,
});

const defaultFontFamilyState = () => ({
  pick: "noto-sans-jp",
  customValue: '"Noto Sans JP", sans-serif',
  parentPick: "parent-sans",
});

const state = {
  property: "font-size",
  /** @type {Record<string, string>} */
  previewTexts: {},
  fontSize: defaultFontSizeState(),
  fontFamily: defaultFontFamilyState(),
  generic: createDefaultGenericState(),
};

const $root = document.getElementById("text-css-app");

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.previewTexts && typeof saved.previewTexts === "object") {
      Object.assign(state.previewTexts, saved.previewTexts);
    }
    const legacy = saved.previewText ?? saved.fontSize?.previewText;
    if (legacy && !Object.keys(state.previewTexts).length && !BUILTIN_PREVIEW_TEXTS.has(legacy)) {
      const prop = PROPERTIES.find((p) => p.id === saved.property && p.ready);
      state.previewTexts[prop?.id ?? state.property] = legacy;
    }
    if (saved.fontSize) Object.assign(state.fontSize, saved.fontSize);
    delete state.fontSize.previewText;
    if (saved.fontFamily) Object.assign(state.fontFamily, saved.fontFamily);
    if (saved.generic) {
      for (const [id, st] of Object.entries(saved.generic)) {
        if (state.generic[id] && st) Object.assign(state.generic[id], st);
      }
    }
    const prop = PROPERTIES.find((p) => p.id === saved.property && p.ready);
    if (prop) state.property = prop.id;
  } catch {
    /* ignore */
  }
}

function saveState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        property: state.property,
        previewTexts: state.previewTexts,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        generic: state.generic,
      })
    );
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

function isKeywordUnit(unit) {
  return FONT_SIZE_KEYWORDS.includes(unit);
}

function fontSizeCssValue() {
  const { unit, value } = state.fontSize;
  if (isKeywordUnit(unit)) return unit;
  const n = Number(value);
  if (unit === "px") return `${Math.round(n)}px`;
  if (unit === "%") return `${Math.round(n)}%`;
  return `${Number(n.toFixed(3)).toString()}${unit}`;
}

/**
 * @param {{
 *   unit: string,
 *   specified: string,
 *   parentComputed: string,
 *   computed: string,
 *   rootComputed: string,
 * }} ctx
 */
function fontSizeReferenceNoteHtml(ctx) {
  const { unit, specified, parentComputed, computed, rootComputed } = ctx;
  const parent = escapeHtml(parentComputed);
  const root = escapeHtml(rootComputed);
  const spec = escapeHtml(specified);
  const size = escapeHtml(computed);

  const numericLines = {
    px: `参照: CSS ピクセル（絶対長）。指定値 <code>${spec}</code> がそのまま長さになる。プレビュー上の計算後: <strong>${size}</strong>。`,
    rem: `参照: ルート要素（<code>html</code>）の計算後 <code>font-size</code>（${root}）。指定値 <code>${spec}</code> × ルート。プレビュー上の計算後: <strong>${size}</strong>。`,
    em: `参照: 親要素（プレビュー内ラッパー）の計算後 <code>font-size</code>（${parent}）。指定値 <code>${spec}</code> × 親。プレビュー上の計算後: <strong>${size}</strong>。`,
    "%": `参照: 親の計算後 <code>font-size</code>（${parent}）。指定値 <code>${spec}</code> は親に対する割合。プレビュー上の計算後: <strong>${size}</strong>。`,
    vw: `参照: ビューポートの幅（<code>1vw</code> = 幅の 1%）。指定値 <code>${spec}</code>。プレビュー上の計算後: <strong>${size}</strong>。`,
    vh: `参照: ビューポートの高さ（<code>1vh</code> = 高さの 1%）。指定値 <code>${spec}</code>。プレビュー上の計算後: <strong>${size}</strong>。`,
    ch: `参照: この要素のフォントにおける「0」（U+0030）の幅。指定値 <code>${spec}</code> × その幅。プレビュー上の計算後: <strong>${size}</strong>。`,
    ex: `参照: この要素のフォントの x-height（小文字の高さ）。指定値 <code>${spec}</code> × x-height。プレビュー上の計算後: <strong>${size}</strong>。`,
    lh: `参照: この要素の <code>line-height</code>（計算後）。指定値 <code>${spec}</code> × line-height。プレビュー上の計算後: <strong>${size}</strong>。`,
    rlh: `参照: ルート要素の <code>line-height</code>（${root} と同系）。指定値 <code>${spec}</code> × ルートの line-height。プレビュー上の計算後: <strong>${size}</strong>。`,
  };
  if (numericLines[unit]) return numericLines[unit];

  const lines = {
    inherit: `参照: 親要素（プレビュー内ラッパー）の計算後 <code>font-size</code>（${parent}）をそのまま継承。プレビュー上の計算後: <strong>${size}</strong>。`,
    initial: `参照: CSS の初期値 <code>medium</code>（UA が px に換算。多くの環境で 16px 付近）。プレビュー上の計算後: <strong>${size}</strong>。`,
    unset: `参照: <code>font-size</code> は継承プロパティのため、実質的に親の計算後（${parent}）を参照。プレビュー上の計算後: <strong>${size}</strong>。`,
    revert: `参照: ユーザーエージェントスタイルシート（ブラウザ既定）の <code>font-size</code>。プレビュー上の計算後: <strong>${size}</strong>。`,
    "revert-layer": `参照: カスケード層の一つ手前の値（このプレビューでは層を使っていないため <code>revert</code> に近い挙動）。プレビュー上の計算後: <strong>${size}</strong>。`,
    smaller: `参照: 親の計算後（${parent}）と UA の「font-size の相対キーワード」換算表で一段階小さいサイズ。プレビュー上の計算後: <strong>${size}</strong>。`,
    larger: `参照: 親の計算後（${parent}）と UA の換算表で一段階大きいサイズ。プレビュー上の計算後: <strong>${size}</strong>。`,
  };
  if (lines[unit]) return lines[unit];
  if (FONT_SIZE_ABSOLUTE_KEYWORDS.has(unit)) {
    return `参照: ブラウザの「絶対サイズ」キーワード換算表（<code>${escapeHtml(unit)}</code> → 多くの UA で固定の px）。プレビュー上の計算後: <strong>${size}</strong>。`;
  }
  return "";
}

function isFontFamilyKeyword(pick) {
  return FONT_FAMILY_KEYWORDS.includes(pick);
}

function fontFamilySpecifiedCss() {
  const { pick, customValue } = state.fontFamily;
  if (isFontFamilyKeyword(pick)) return pick;
  if (pick === "custom") {
    const custom = customValue.trim();
    return custom || '"Noto Sans JP", sans-serif';
  }
  const preset = FONT_FAMILY_PRESETS.find((p) => p.id === pick);
  return preset?.css ?? "sans-serif";
}

function fontFamilyParentCss() {
  const preset = FONT_FAMILY_PARENT_PRESETS.find((p) => p.id === state.fontFamily.parentPick);
  return preset?.css ?? FONT_FAMILY_PARENT_PRESETS[0].css;
}

/**
 * @param {{
 *   pick: string,
 *   specified: string,
 *   parentComputed: string,
 *   computed: string,
 * }} ctx
 */
function fontFamilyReferenceNoteHtml(ctx) {
  const { pick, specified, parentComputed, computed } = ctx;
  const parent = escapeHtml(parentComputed);
  const spec = escapeHtml(specified);
  const resolved = escapeHtml(computed);
  const keywordLines = {
    inherit: `参照: 親要素（プレビュー内ラッパー）の計算後 <code>font-family</code>（${parent}）をそのまま継承。プレビュー上の計算後: <strong>${resolved}</strong>。`,
    initial: `参照: CSS の初期値（多くのブラウザでは汎用セリフ）。指定 <code>${spec}</code>。プレビュー上の計算後: <strong>${resolved}</strong>。`,
    unset: `参照: <code>font-family</code> は継承プロパティのため、実質的に親の計算後（${parent}）を参照。プレビュー上の計算後: <strong>${resolved}</strong>。`,
    revert: `参照: ユーザーエージェントスタイルシートの <code>font-family</code>。プレビュー上の計算後: <strong>${resolved}</strong>。`,
    "revert-layer": `参照: カスケード層の一つ手前の値（このプレビューでは層なし）。プレビュー上の計算後: <strong>${resolved}</strong>。`,
  };
  if (keywordLines[pick]) return keywordLines[pick];
  return `参照: 指定したファミリーリスト <code>${spec}</code>。ブラウザは左から順に利用可能な書体を選ぶ。プレビュー上の計算後: <strong>${resolved}</strong>。`;
}

function previewTextFieldHtml() {
  return `
      <div class="font-sim__field">
        <label for="text-css-sample" class="font-sim__label">テキスト</label>
        <textarea id="text-css-sample" class="font-sim__input text-css__sample" rows="3" spellcheck="false">${escapeHtml(getPreviewText())}</textarea>
      </div>`;
}

function previewStageHtml() {
  return `
            <div class="text-css__stage">
              <div class="text-css__preview-context" id="text-css-preview-shell">
                <p class="text-css__preview-sample" id="text-css-preview">${escapeHtml(getPreviewText())}</p>
              </div>
            </div>`;
}

function sectionHtml(id, title, body) {
  return `
        <section class="text-css__section" aria-labelledby="${id}">
          <h2 class="text-css__section-title" id="${id}">${title}</h2>
          ${body}
        </section>`;
}

function playgroundBodyHtml(controlsHtml) {
  return `
      <div class="text-css__play-layout">
        ${previewTextFieldHtml()}
        ${sectionHtml("text-css-props-title", "プロパティ", controlsHtml)}
        ${sectionHtml("text-css-preview-title", "プレビュー", previewStageHtml())}
      </div>`;
}

function rangeRow(id, label, value, min, max, step, format) {
  const display = format(value);
  return `
    <div class="font-sim__field">
      <div class="font-sim__field-head">
        <label for="${id}">${label}</label>
        <output id="${id}-out" for="${id}" class="font-sim__value">${display}</output>
      </div>
      <input type="range" id="${id}" class="font-sim__range" min="${min}" max="${max}" step="${step}" value="${value}" />
    </div>`;
}

function propertyNavHtml() {
  const groups = ["font", "text", "open-type"];
  return groups
    .map((group) => {
      const items = PROPERTIES.filter((p) => p.group === group);
      if (!items.length) return "";
      return `
      <section class="text-css__nav-group">
        <h2 class="text-css__nav-heading">${GROUP_LABELS[group]}</h2>
        <ul class="text-css__nav-list">
          ${items
            .map((p) => {
              const active = state.property === p.id;
              if (p.ready) {
                return `
            <li>
              <a class="text-css__nav-link${active ? " is-active" : ""}" href="#${p.id}" data-property="${p.id}">
                <code>${p.label}</code>
              </a>
            </li>`;
              }
              return `
            <li>
              <span class="text-css__nav-link text-css__nav-link--soon" aria-disabled="true">
                <code>${p.label}</code>
                <span class="text-css__nav-badge">準備中</span>
              </span>
            </li>`;
            })
            .join("")}
        </ul>
      </section>`;
    })
    .join("");
}

function fontSizeControlsHtml() {
  const fs = state.fontSize;
  const numeric = !isKeywordUnit(fs.unit);
  const bounds = UNIT_BOUNDS[fs.unit] ?? { min: 1, max: 100, step: 1, default: 18 };
  const needsParent = FONT_SIZE_PARENT_AWARE.has(fs.unit);

  return `
    <div class="text-css__controls font-sim__controls">
      <div class="font-sim__field">
        <span class="font-sim__label" id="text-css-unit-label">単位</span>
        <div class="font-sim__seg text-css__unit-seg" role="group" aria-labelledby="text-css-unit-label">
          ${NUMERIC_UNITS.map(
            (u) => `
            <button type="button" class="font-sim__seg-btn${fs.unit === u ? " is-active" : ""}" data-unit="${u}">${u}</button>`
          ).join("")}
        </div>
      </div>

      ${
        needsParent
          ? rangeRow("text-css-parent-fs", "親要素の font-size", fs.parentFontSize, 10, 32, 1, (v) => `${v}px`)
          : ""
      }

      <div class="font-sim__field text-css__value-field">
        <div class="font-sim__seg text-css__keyword-seg" role="group" aria-label="font-size のキーワード値">
          ${FONT_SIZE_KEYWORDS.map(
            (u) => `
            <button type="button" class="font-sim__seg-btn${fs.unit === u ? " is-active" : ""}" data-unit="${u}">${u}</button>`
          ).join("")}
        </div>
        ${
          numeric
            ? `<div class="text-css__value-input">${rangeRow(
                "text-css-fs-value",
                "値",
                fs.value,
                bounds.min,
                bounds.max,
                bounds.step,
                (v) => fontSizeCssValue()
              )}</div>`
            : ""
        }
        <p class="text-css__ref-note" id="text-css-ref-note" hidden></p>
      </div>
    </div>`;
}

function fontSizePlaygroundHtml() {
  return `
    <article class="text-css__playground" aria-label="font-size">
      ${playgroundBodyHtml(fontSizeControlsHtml())}
    </article>`;
}

function fontFamilyControlsHtml() {
  const ff = state.fontFamily;
  const isCustom = ff.pick === "custom";
  const isKeyword = isFontFamilyKeyword(ff.pick);
  const showValue = isCustom || !isKeyword;
  const needsParent = FONT_FAMILY_PARENT_AWARE.has(ff.pick);
  const specified = fontFamilySpecifiedCss();

  const presetLabel = (id) => {
    if (id === "custom") return "自由入力";
    if (id === "noto-sans-jp") return "Noto Sans JP";
    if (id === "noto-serif-jp") return "Noto Serif JP";
    return id;
  };

  return `
    <div class="text-css__controls font-sim__controls">
      <div class="font-sim__field">
        <span class="font-sim__label" id="text-css-ff-preset-label">候補</span>
        <div class="font-sim__seg text-css__unit-seg" role="group" aria-labelledby="text-css-ff-preset-label">
          ${FONT_FAMILY_PRESETS.map((p) => {
            const activeClass = ff.pick === p.id ? " is-active" : "";
            return `
            <button type="button" class="font-sim__seg-btn${activeClass}" data-font-pick="${p.id}">${escapeHtml(presetLabel(p.id))}</button>`;
          }).join("")}
        </div>
      </div>

      <div class="font-sim__field text-css__value-field">
        <div class="font-sim__seg text-css__keyword-seg" role="group" aria-label="font-family のキーワード値">
          ${FONT_FAMILY_KEYWORDS.map(
            (k) => `
            <button type="button" class="font-sim__seg-btn${ff.pick === k ? " is-active" : ""}" data-font-pick="${k}">${k}</button>`
          ).join("")}
        </div>
        ${
          needsParent
            ? `
        <div class="text-css__parent-field">
          <span class="font-sim__label" id="text-css-ff-parent-label">親の font-family</span>
          <div class="font-sim__seg" role="group" aria-labelledby="text-css-ff-parent-label">
            ${FONT_FAMILY_PARENT_PRESETS.map(
              (p) => `
            <button type="button" class="font-sim__seg-btn${ff.parentPick === p.id ? " is-active" : ""}" data-font-parent="${p.id}">${escapeHtml(p.id.replace("parent-", ""))}</button>`
            ).join("")}
          </div>
        </div>`
            : ""
        }
        ${
          showValue
            ? `<div class="text-css__value-input">${
                isCustom
                  ? `
        <label for="text-css-font-custom" class="font-sim__label">値</label>
        <textarea id="text-css-font-custom" class="font-sim__input text-css__font-custom" rows="2" spellcheck="false">${escapeHtml(ff.customValue)}</textarea>`
                  : `
        <div class="font-sim__field-head">
          <span class="font-sim__label">値</span>
          <output class="font-sim__value text-css__ff-value-out"><code>${escapeHtml(specified)}</code></output>
        </div>`
              }</div>`
            : ""
        }
        <p class="text-css__ref-note" id="text-css-ref-note" hidden></p>
      </div>
    </div>`;
}

function fontFamilyPlaygroundHtml() {
  return `
    <article class="text-css__playground" aria-label="font-family">
      ${playgroundBodyHtml(fontFamilyControlsHtml())}
    </article>`;
}

function genericPlaygroundHtml(propId) {
  return `
    <article class="text-css__playground" aria-label="${escapeHtml(propId)}">
      ${playgroundBodyHtml(
        genericControlsHtml(propId, state, { escapeHtml, rangeRow })
      )}
    </article>`;
}

function playgroundHtml() {
  if (state.property === "font-size") return fontSizePlaygroundHtml();
  if (state.property === "font-family") return fontFamilyPlaygroundHtml();
  if (PLAYGROUNDS[state.property]) return genericPlaygroundHtml(state.property);
  return "";
}

function applyPreview() {
  if (state.property === "font-size") applyFontSizePreview();
  else if (state.property === "font-family") applyFontFamilyPreview();
  else if (PLAYGROUNDS[state.property]) applyGenericPreview(state.property, state);
}

function updatePropertyNavActive() {
  $root.querySelectorAll(".text-css__nav-link[data-property]").forEach((link) => {
    const id = link.getAttribute("data-property");
    link.classList.toggle("is-active", id === state.property);
  });
}

function render() {
  if (!$root) return;
  const scrollY = window.scrollY;
  const shell = $root.querySelector(".text-css__shell");
  if (shell) {
    const main = $root.querySelector(".text-css__main");
    if (main) main.innerHTML = playgroundHtml();
    updatePropertyNavActive();
  } else {
    $root.innerHTML = `
    <div class="text-css__shell">
      <nav class="text-css__sidebar" aria-label="CSS プロパティ一覧">
        ${propertyNavHtml()}
      </nav>
      <div class="text-css__main">${playgroundHtml()}</div>
    </div>`;
  }
  applyPreview();
  bindHandlers();
  window.scrollTo(0, scrollY);
}

function applyFontSizePreview() {
  const shell = document.getElementById("text-css-preview-shell");
  const sample = document.getElementById("text-css-preview");
  if (!shell || !sample) return;

  const { parentFontSize, unit } = state.fontSize;
  shell.style.fontFamily = "";
  shell.style.fontSize = `${parentFontSize}px`;
  sample.textContent = getPreviewText();
  sample.style.fontFamily = "";
  sample.style.fontSize = fontSizeCssValue();
  const out = document.getElementById("text-css-fs-value-out");
  if (out) out.textContent = fontSizeCssValue();
  const parentOut = document.getElementById("text-css-parent-fs-out");
  if (parentOut) parentOut.textContent = `${parentFontSize}px`;

  const refNote = document.getElementById("text-css-ref-note");
  if (refNote) {
    const parentComputed = getComputedStyle(shell).fontSize;
    const computed = getComputedStyle(sample).fontSize;
    const rootComputed = getComputedStyle(document.documentElement).fontSize;
    const html = fontSizeReferenceNoteHtml({
      unit,
      specified: fontSizeCssValue(),
      parentComputed,
      computed,
      rootComputed,
    });
    refNote.innerHTML = html;
    refNote.hidden = !html;
  }
}

function applyFontFamilyPreview() {
  const shell = document.getElementById("text-css-preview-shell");
  const sample = document.getElementById("text-css-preview");
  if (!shell || !sample) return;

  shell.style.fontFamily = fontFamilyParentCss();
  shell.style.fontSize = "";
  sample.textContent = getPreviewText();
  sample.style.fontSize = "";
  sample.style.fontFamily = fontFamilySpecifiedCss();

  const out = document.querySelector(".text-css__ff-value-out code");
  if (out) out.textContent = fontFamilySpecifiedCss();

  const refNote = document.getElementById("text-css-ref-note");
  if (refNote) {
    const parentComputed = getComputedStyle(shell).fontFamily;
    const computed = getComputedStyle(sample).fontFamily;
    const html = fontFamilyReferenceNoteHtml({
      pick: state.fontFamily.pick,
      specified: fontFamilySpecifiedCss(),
      parentComputed,
      computed,
    });
    refNote.innerHTML = html;
    refNote.hidden = !html;
  }
}

function bindRange(id, key, parser, parentKey, genericPropId) {
  const input = document.getElementById(id);
  const out = document.getElementById(`${id}-out`);
  if (!input) return;
  input.addEventListener("input", () => {
    /** @type {Record<string, unknown>} */
    let target = state.fontSize;
    if (parentKey === "generic" && genericPropId) {
      target = state.generic[genericPropId];
    } else if (parentKey) {
      target = state[parentKey];
    }
    target[key] = parser(input.value);
    saveState();
    if (out && key === "value" && parentKey === "fontSize") out.textContent = fontSizeCssValue();
    if (out && key === "parentFontSize") out.textContent = `${target[key]}px`;
    if (out && key === "value" && genericPropId && PLAYGROUNDS[genericPropId]) {
      out.textContent = specifiedCss(genericPropId, state.generic[genericPropId]);
    }
    applyPreview();
  });
}

function bindHandlers() {
  const sample = document.getElementById("text-css-sample");
  sample?.addEventListener("input", () => {
    state.previewTexts[state.property] = sample.value;
    saveState();
    applyPreview();
  });

  $root.querySelectorAll("[data-property]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("data-property");
      const entry = PROPERTIES.find((p) => p.id === id && p.ready);
      if (!entry) return;
      e.preventDefault();
      state.property = entry.id;
      saveState();
      render();
      history.replaceState(null, "", `#${entry.id}`);
    });
  });

  if (state.property === "font-size") bindFontSizeHandlers();
  else if (state.property === "font-family") bindFontFamilyHandlers();
  else if (PLAYGROUNDS[state.property]) {
    bindGenericHandlers(state.property, state, $root, {
      saveState,
      render,
      bindRange,
      applyPreview,
    });
  }
}

function bindFontSizeHandlers() {
  bindRange("text-css-fs-value", "value", Number, "fontSize");
  bindRange("text-css-parent-fs", "parentFontSize", Number, "fontSize");

  $root.querySelectorAll("[data-unit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const unit = btn.getAttribute("data-unit");
      if (!unit) return;
      const wasKeyword = isKeywordUnit(state.fontSize.unit);
      const nowKeyword = isKeywordUnit(unit);
      state.fontSize.unit = unit;
      if (!nowKeyword) {
        const bounds = UNIT_BOUNDS[unit];
        if (bounds && (wasKeyword || state.fontSize.value == null)) {
          state.fontSize.value = bounds.default;
        }
      }
      saveState();
      render();
    });
  });
}

function bindFontFamilyHandlers() {
  $root.querySelectorAll("[data-font-pick]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pick = btn.getAttribute("data-font-pick");
      if (!pick) return;
      state.fontFamily.pick = pick;
      if (pick !== "custom" && !isFontFamilyKeyword(pick)) {
        const preset = FONT_FAMILY_PRESETS.find((p) => p.id === pick);
        if (preset?.css) state.fontFamily.customValue = preset.css;
      }
      saveState();
      render();
    });
  });

  $root.querySelectorAll("[data-font-parent]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-font-parent");
      if (!id) return;
      state.fontFamily.parentPick = id;
      saveState();
      render();
    });
  });

  const custom = document.getElementById("text-css-font-custom");
  custom?.addEventListener("input", () => {
    state.fontFamily.customValue = custom.value;
    saveState();
    applyFontFamilyPreview();
  });
}

function initFromHash() {
  const id = location.hash.replace(/^#/, "");
  const entry = PROPERTIES.find((p) => p.id === id && p.ready);
  if (entry) state.property = entry.id;
}

function ensureGenericState() {
  const defaults = createDefaultGenericState();
  for (const [id, def] of Object.entries(defaults)) {
    if (!state.generic[id]) state.generic[id] = { ...def };
  }
}

function init() {
  if (!$root) return;
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  setPreviewTextGetter(() => getPreviewText());
  loadSavedState();
  ensureGenericState();
  initFromHash();
  render();
  window.addEventListener("hashchange", () => {
    const scrollY = window.scrollY;
    initFromHash();
    render();
    window.scrollTo(0, scrollY);
  });
}

init();