/** @typedef {{ id: string, label?: string, css: string }} PlayOption */

export const GLOBAL_KEYWORDS = ["inherit", "initial", "unset", "revert", "revert-layer"];

const STROKE_COLOR_OPTIONS = [
  { id: "currentColor", css: "currentColor", label: "currentColor" },
  { id: "ink", css: "#0a0a37", label: "ink" },
  { id: "red", css: "#c0392b", label: "red" },
  { id: "blue", css: "#1e4f8a", label: "blue" },
  { id: "green", css: "#2d6a4f", label: "green" },
];

/**
 * @typedef {{
 *   styleProp: string,
 *   defaultPick: string,
 *   options: PlayOption[],
 *   numeric?: { key: string, min: number, max: number, step: number, default: number, unit: string, format: (n: number) => string },
 *   parentStyle?: { prop: string, presets: { id: string, css: string, label?: string }[] },
 *   previewShellClass?: (pick: string) => string | null,
 *   previewSetup?: (sample: HTMLElement, previewText: string) => void,
 *   colorOptions?: { id: string, css: string, label?: string }[],
 *   defaultColorPick?: string,
 *   customApply?: (sample: HTMLElement, specified: string, st: PlaygroundState, def: PlaygroundDef) => void,
 *   computedStyleProp?: string,
 *   refNote?: (ctx: RefCtx) => string,
 * }} PlaygroundDef
 */

/** @typedef {{ pick: string, value?: number, parentPick?: string, colorPick?: string }} PlaygroundState */

/**
 * @typedef {{
 *   propId: string,
 *   pick: string,
 *   specified: string,
 *   parentComputed: string,
 *   computed: string,
 *   rootComputed?: string,
 * }} RefCtx
 */

/** @type {Record<string, PlaygroundDef>} */
export const PLAYGROUNDS = {
  "font-weight": {
    styleProp: "fontWeight",
    defaultPick: "400",
    options: [
      { id: "100", css: "100" },
      { id: "200", css: "200" },
      { id: "300", css: "300" },
      { id: "400", css: "400" },
      { id: "500", css: "500" },
      { id: "600", css: "600" },
      { id: "700", css: "700" },
      { id: "800", css: "800" },
      { id: "900", css: "900" },
      { id: "normal", css: "normal" },
      { id: "bold", css: "bold" },
      { id: "bolder", css: "bolder" },
      { id: "lighter", css: "lighter" },
    ],
    parentStyle: {
      prop: "fontWeight",
      presets: [
        { id: "p400", css: "400", label: "400" },
        { id: "p700", css: "700", label: "700" },
      ],
    },
    refNote: refInheritOrSpecified("font-weight"),
  },
  "font-style": {
    styleProp: "fontStyle",
    defaultPick: "normal",
    options: [
      { id: "normal", css: "normal" },
      { id: "italic", css: "italic" },
      { id: "oblique", css: "oblique" },
      { id: "oblique-20", css: "oblique 20deg" },
    ],
    refNote: refInheritOrSpecified("font-style"),
  },
  "font-stretch": {
    styleProp: "fontStretch",
    defaultPick: "normal",
    options: [
      { id: "ultra-condensed", css: "ultra-condensed" },
      { id: "extra-condensed", css: "extra-condensed" },
      { id: "condensed", css: "condensed" },
      { id: "semi-condensed", css: "semi-condensed" },
      { id: "normal", css: "normal" },
      { id: "semi-expanded", css: "semi-expanded" },
      { id: "expanded", css: "expanded" },
      { id: "extra-expanded", css: "extra-expanded" },
      { id: "ultra-expanded", css: "ultra-expanded" },
    ],
    refNote: refInheritOrSpecified("font-stretch"),
  },
  "font-variant": {
    styleProp: "fontVariant",
    defaultPick: "normal",
    options: [
      { id: "normal", css: "normal" },
      { id: "small-caps", css: "small-caps" },
      { id: "all-small-caps", css: "all-small-caps" },
      { id: "petite-caps", css: "petite-caps" },
      { id: "all-petite-caps", css: "all-petite-caps" },
      { id: "unicase", css: "unicase" },
      { id: "titling-caps", css: "titling-caps" },
    ],
    refNote: refInheritOrSpecified("font-variant"),
  },
  "line-height": {
    styleProp: "lineHeight",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "normal", css: "normal" },
    ],
    numeric: {
      key: "value",
      min: 0.8,
      max: 3,
      step: 0.05,
      default: 1.65,
      unit: "",
      format: (n) => String(Number(n.toFixed(2))),
    },
    refNote: (ctx) => {
      if (ctx.pick === "normal") return keywordRef(ctx, "normal（UA の既定行送り）");
      return `参照: 指定値 <code>${esc(ctx.specified)}</code>（倍率または長さ）。プレビュー上の計算後: <strong>${esc(ctx.computed)}</strong>。`;
    },
  },
  "letter-spacing": {
    styleProp: "letterSpacing",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "normal", css: "normal" },
    ],
    numeric: {
      key: "value",
      min: -0.12,
      max: 0.4,
      step: 0.005,
      default: 0,
      unit: "em",
      format: (n) => `${Number(n.toFixed(3))}em`,
    },
    refNote: refInheritOrSpecified("letter-spacing"),
  },
  "word-spacing": {
    styleProp: "wordSpacing",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "normal", css: "normal" },
    ],
    numeric: {
      key: "value",
      min: -0.2,
      max: 1,
      step: 0.01,
      default: 0,
      unit: "em",
      format: (n) => `${Number(n.toFixed(3))}em`,
    },
    refNote: refInheritOrSpecified("word-spacing"),
  },
  "text-align": {
    styleProp: "textAlign",
    defaultPick: "start",
    options: [
      { id: "start", css: "start" },
      { id: "end", css: "end" },
      { id: "left", css: "left" },
      { id: "right", css: "right" },
      { id: "center", css: "center" },
      { id: "justify", css: "justify" },
      { id: "match-parent", css: "match-parent" },
    ],
    refNote: refInheritOrSpecified("text-align"),
  },
  "text-indent": {
    styleProp: "textIndent",
    defaultPick: "num",
    options: [{ id: "num", css: "" }],
    numeric: {
      key: "value",
      min: 0,
      max: 4,
      step: 0.25,
      default: 0,
      unit: "em",
      format: (n) => `${Number(n.toFixed(2))}em`,
    },
    refNote: refInheritOrSpecified("text-indent"),
  },
  "text-transform": {
    styleProp: "textTransform",
    defaultPick: "none",
    options: [
      { id: "none", css: "none" },
      { id: "capitalize", css: "capitalize" },
      { id: "uppercase", css: "uppercase" },
      { id: "lowercase", css: "lowercase" },
      { id: "full-width", css: "full-width" },
      { id: "full-size-kana", css: "full-size-kana" },
    ],
    refNote: refInheritOrSpecified("text-transform"),
  },
  "text-decoration": {
    styleProp: "textDecorationLine",
    defaultPick: "none",
    options: [
      { id: "none", css: "none" },
      { id: "underline", css: "underline" },
      { id: "overline", css: "overline" },
      { id: "line-through", css: "line-through" },
      { id: "underline-overline", css: "underline overline" },
    ],
    refNote: refInheritOrSpecified("text-decoration-line"),
  },
  "text-decoration-color": {
    styleProp: "textDecorationColor",
    defaultPick: "currentColor",
    options: [
      { id: "currentColor", css: "currentColor" },
      { id: "red", css: "#c0392b" },
      { id: "blue", css: "#1e4f8a" },
      { id: "green", css: "#2d6a4f" },
    ],
    previewSetup: (sample) => {
      sample.style.textDecorationLine = "underline";
      sample.style.textDecorationThickness = "2px";
    },
    refNote: refInheritOrSpecified("text-decoration-color"),
  },
  "text-decoration-style": {
    styleProp: "textDecorationStyle",
    defaultPick: "solid",
    options: [
      { id: "solid", css: "solid" },
      { id: "double", css: "double" },
      { id: "dotted", css: "dotted" },
      { id: "dashed", css: "dashed" },
      { id: "wavy", css: "wavy" },
    ],
    previewSetup: (sample) => {
      sample.style.textDecorationLine = "underline";
      sample.style.textDecorationThickness = "2px";
    },
    refNote: refInheritOrSpecified("text-decoration-style"),
  },
  "text-decoration-thickness": {
    styleProp: "textDecorationThickness",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "auto", css: "auto" },
      { id: "from-font", css: "from-font" },
    ],
    numeric: {
      key: "value",
      min: 1,
      max: 8,
      step: 0.5,
      default: 2,
      unit: "px",
      format: (n) => `${Number(n.toFixed(1))}px`,
    },
    previewSetup: (sample) => {
      sample.style.textDecorationLine = "underline";
    },
    refNote: refInheritOrSpecified("text-decoration-thickness"),
  },
  "text-underline-offset": {
    styleProp: "textUnderlineOffset",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "auto", css: "auto" },
    ],
    numeric: {
      key: "value",
      min: 0,
      max: 12,
      step: 1,
      default: 3,
      unit: "px",
      format: (n) => `${Math.round(n)}px`,
    },
    previewSetup: (sample) => {
      sample.style.textDecorationLine = "underline";
      sample.style.textDecorationThickness = "2px";
    },
    refNote: refInheritOrSpecified("text-underline-offset"),
  },
  "text-underline-position": {
    styleProp: "textUnderlinePosition",
    defaultPick: "auto",
    options: [
      { id: "auto", css: "auto" },
      { id: "from-font", css: "from-font" },
      { id: "under", css: "under" },
      { id: "left", css: "left" },
      { id: "right", css: "right" },
    ],
    previewSetup: (sample) => {
      sample.style.textDecorationLine = "underline";
    },
    refNote: refInheritOrSpecified("text-underline-position"),
  },
  "text-emphasis-style": {
    styleProp: "textEmphasisStyle",
    defaultPick: "none",
    options: [
      { id: "none", css: "none" },
      { id: "filled", css: "filled" },
      { id: "open", css: "open" },
      { id: "dot", css: "dot" },
      { id: "circle", css: "circle" },
      { id: "sesame", css: "sesame" },
    ],
    refNote: refInheritOrSpecified("text-emphasis-style"),
  },
  "text-emphasis-color": {
    styleProp: "textEmphasisColor",
    defaultPick: "currentColor",
    options: [
      { id: "currentColor", css: "currentColor" },
      { id: "red", css: "#c0392b" },
      { id: "blue", css: "#1e4f8a" },
    ],
    previewSetup: (sample) => {
      sample.style.textEmphasisStyle = "filled sesame";
    },
    refNote: refInheritOrSpecified("text-emphasis-color"),
  },
  "text-emphasis-position": {
    styleProp: "textEmphasisPosition",
    defaultPick: "over",
    options: [
      { id: "over", css: "over" },
      { id: "under", css: "under" },
      { id: "over-right", css: "over right" },
      { id: "under-left", css: "under left" },
    ],
    previewSetup: (sample) => {
      sample.style.textEmphasisStyle = "filled sesame";
    },
    refNote: refInheritOrSpecified("text-emphasis-position"),
  },
  "text-overflow": {
    styleProp: "textOverflow",
    defaultPick: "clip",
    options: [
      { id: "clip", css: "clip" },
      { id: "ellipsis", css: "ellipsis" },
    ],
    previewSetup: (sample, previewText) => {
      sample.textContent = `${previewText}　連続する長い文を一行に収めて、はみ出した端の扱いを確かめます。`;
      sample.style.overflow = "hidden";
      sample.style.whiteSpace = "nowrap";
      sample.style.maxWidth = "16em";
    },
    refNote: refInheritOrSpecified("text-overflow"),
  },
  "text-shadow": {
    styleProp: "textShadow",
    defaultPick: "soft",
    options: [
      { id: "none", css: "none" },
      { id: "soft", css: "1px 2px 6px rgba(10, 10, 55, 0.35)" },
      { id: "hard", css: "2px 2px 0 #0a0a37" },
      { id: "glow", css: "0 0 12px rgba(30, 79, 138, 0.55)" },
    ],
    refNote: refInheritOrSpecified("text-shadow"),
  },
  "text-stroke": {
    defaultPick: "thin",
    options: [
      { id: "none", css: "0 transparent" },
      { id: "thin", css: "1px currentColor" },
      { id: "medium", css: "2px currentColor" },
      { id: "bold", css: "3px #0a0a37" },
      { id: "accent", css: "2px #c0392b" },
      { id: "num", css: "" },
    ],
    numeric: {
      key: "value",
      min: 0,
      max: 6,
      step: 0.5,
      default: 2,
      unit: "px",
      format: (n) => `${Number(n.toFixed(1))}px`,
    },
    colorOptions: STROKE_COLOR_OPTIONS,
    defaultColorPick: "currentColor",
    customApply: (sample, specified, st, def) => {
      if (st.pick === "num") {
        const w = `${Number((st.value ?? 2).toFixed(1))}px`;
        const c = strokeColorCss(st, def);
        sample.style.webkitTextStroke = `${w} ${c}`;
        return;
      }
      sample.style.webkitTextStroke = specified;
    },
    computedStyleProp: "webkitTextStrokeWidth",
    refNote: webkitStrokeRef("-webkit-text-stroke"),
  },
  "text-stroke-width": {
    styleProp: "webkitTextStrokeWidth",
    defaultPick: "num",
    options: [
      { id: "num", css: "" },
      { id: "none", css: "0px" },
    ],
    numeric: {
      key: "value",
      min: 0,
      max: 6,
      step: 0.5,
      default: 2,
      unit: "px",
      format: (n) => `${Number(n.toFixed(1))}px`,
    },
    colorOptions: STROKE_COLOR_OPTIONS,
    defaultColorPick: "currentColor",
    computedStyleProp: "webkitTextStrokeWidth",
    refNote: webkitStrokeRef("-webkit-text-stroke-width"),
  },
  "text-stroke-color": {
    styleProp: "webkitTextStrokeColor",
    defaultPick: "currentColor",
    options: STROKE_COLOR_OPTIONS.map((o) => ({ id: o.id, css: o.css, label: o.label })),
    previewSetup: (sample) => {
      sample.style.webkitTextStrokeWidth = "2px";
    },
    computedStyleProp: "webkitTextStrokeColor",
    refNote: webkitStrokeRef("-webkit-text-stroke-color"),
  },
  "text-combine-upright": {
    styleProp: "textCombineUpright",
    defaultPick: "none",
    options: [
      { id: "none", css: "none" },
      { id: "all", css: "all" },
    ],
    previewSetup: (sample) => {
      sample.style.writingMode = "vertical-rl";
      sample.style.textOrientation = "mixed";
    },
    refNote: refInheritOrSpecified("text-combine-upright"),
  },
  "text-orientation": {
    styleProp: "textOrientation",
    defaultPick: "mixed",
    options: [
      { id: "mixed", css: "mixed" },
      { id: "upright", css: "upright" },
      { id: "sideways", css: "sideways" },
      { id: "sideways-right", css: "sideways-right" },
    ],
    previewSetup: (sample) => {
      sample.style.writingMode = "vertical-rl";
    },
    refNote: refInheritOrSpecified("text-orientation"),
  },
  "text-rendering": {
    styleProp: "textRendering",
    defaultPick: "auto",
    options: [
      { id: "auto", css: "auto" },
      { id: "optimizeSpeed", css: "optimizeSpeed" },
      { id: "optimizeLegibility", css: "optimizeLegibility" },
      { id: "geometricPrecision", css: "geometricPrecision" },
    ],
    refNote: refInheritOrSpecified("text-rendering"),
  },
  "text-size-adjust": {
    styleProp: "textSizeAdjust",
    defaultPick: "auto",
    options: [
      { id: "auto", css: "auto" },
      { id: "none", css: "none" },
      { id: "num", css: "" },
    ],
    numeric: {
      key: "value",
      min: 80,
      max: 120,
      step: 5,
      default: 100,
      unit: "%",
      format: (n) => `${Math.round(n)}%`,
    },
    refNote: refInheritOrSpecified("text-size-adjust"),
  },
  "writing-mode": {
    styleProp: "writingMode",
    defaultPick: "horizontal-tb",
    options: [
      { id: "horizontal-tb", css: "horizontal-tb" },
      { id: "vertical-rl", css: "vertical-rl" },
      { id: "vertical-lr", css: "vertical-lr" },
      { id: "sideways-rl", css: "sideways-rl" },
      { id: "sideways-lr", css: "sideways-lr" },
    ],
    previewShellClass: (pick) => (pick.startsWith("vertical") ? "text-css__stage--vertical" : null),
    refNote: refInheritOrSpecified("writing-mode"),
  },
  "white-space": {
    styleProp: "whiteSpace",
    defaultPick: "normal",
    options: [
      { id: "normal", css: "normal" },
      { id: "nowrap", css: "nowrap" },
      { id: "pre", css: "pre" },
      { id: "pre-wrap", css: "pre-wrap" },
      { id: "pre-line", css: "pre-line" },
      { id: "break-spaces", css: "break-spaces" },
    ],
    refNote: refInheritOrSpecified("white-space"),
  },
  "text-wrap": {
    styleProp: "textWrap",
    defaultPick: "wrap",
    options: [
      { id: "wrap", css: "wrap" },
      { id: "nowrap", css: "nowrap" },
      { id: "balance", css: "balance" },
      { id: "pretty", css: "pretty" },
      { id: "stable", css: "stable" },
    ],
    refNote: refInheritOrSpecified("text-wrap"),
  },
  hyphens: {
    styleProp: "hyphens",
    defaultPick: "manual",
    options: [
      { id: "none", css: "none" },
      { id: "manual", css: "manual" },
      { id: "auto", css: "auto" },
    ],
    refNote: refInheritOrSpecified("hyphens"),
  },
  "font-feature-settings": {
    styleProp: "fontFeatureSettings",
    defaultPick: "normal",
    options: [
      { id: "normal", css: "normal" },
      { id: "palt", css: '"palt" 1' },
      { id: "pkna", css: '"pkna" 1' },
      { id: "palt-pkna", css: '"palt" 1, "pkna" 1' },
      { id: "liga-off", css: '"liga" 0' },
    ],
    refNote: refInheritOrSpecified("font-feature-settings"),
  },
  "font-variant-east-asian": {
    styleProp: "fontVariantEastAsian",
    defaultPick: "normal",
    options: [
      { id: "normal", css: "normal" },
      { id: "jis78", css: "jis78" },
      { id: "jis83", css: "jis83" },
      { id: "jis90", css: "jis90" },
      { id: "jis04", css: "jis04" },
      { id: "simplified", css: "simplified" },
      { id: "traditional", css: "traditional" },
      { id: "full-width", css: "full-width" },
      { id: "proportional-width", css: "proportional-width" },
    ],
    refNote: refInheritOrSpecified("font-variant-east-asian"),
  },
};

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function webkitStrokeRef(propName) {
  return (ctx) => {
    if (GLOBAL_KEYWORDS.includes(ctx.pick)) {
      return `参照: <code>${esc(propName)}</code> のキーワード <code>${esc(ctx.pick)}</code>。プレビュー上（WebKit）: <strong>${esc(ctx.computed)}</strong>。`;
    }
    return `参照: <code>${esc(propName)}</code> に <code>${esc(ctx.specified)}</code> を指定（<code>-webkit-text-stroke*</code>）。プレビュー上の計算後: <strong>${esc(ctx.computed)}</strong>。`;
  };
}

export function strokeColorCss(/** @type {PlaygroundState} */ st, /** @type {PlaygroundDef} */ def) {
  const pick = st.colorPick ?? def.defaultColorPick ?? def.colorOptions?.[0]?.id;
  const opt = def.colorOptions?.find((o) => o.id === pick);
  return opt?.css ?? "currentColor";
}

export function displaySpecified(propId, /** @type {PlaygroundState} */ st) {
  const def = PLAYGROUNDS[propId];
  const base = specifiedCss(propId, st);
  if (!def?.colorOptions || isKeywordPick(st.pick) || st.pick === "none") return base;
  if (st.pick === "num" || def.styleProp === "webkitTextStrokeWidth") {
    return `${base} ${strokeColorCss(st, def)}`;
  }
  if (propId === "text-stroke" && st.pick === "num") {
    return `${base} ${strokeColorCss(st, def)}`;
  }
  return base;
}

function keywordRef(ctx, detail) {
  return `参照: ${detail}。指定 <code>${esc(ctx.specified)}</code>。プレビュー上の計算後: <strong>${esc(ctx.computed)}</strong>。`;
}

function refInheritOrSpecified(propName) {
  return (ctx) => {
    if (GLOBAL_KEYWORDS.includes(ctx.pick)) {
      const map = {
        inherit: `親要素の計算後 <code>${propName}</code>（${esc(ctx.parentComputed)}）を継承。`,
        initial: `CSS 初期値にリセット。`,
        unset: `継承プロパティなら親（${esc(ctx.parentComputed)}）、そうでなければ初期値。`,
        revert: `ユーザーエージェントスタイルに戻す。`,
        "revert-layer": `カスケード層の一つ前（プレビューでは層なし）。`,
      };
      return `参照: ${map[ctx.pick] ?? ""} プレビュー上の計算後: <strong>${esc(ctx.computed)}</strong>。`;
    }
    return `参照: 指定 <code>${esc(ctx.specified)}</code>。プレビュー上の計算後: <strong>${esc(ctx.computed)}</strong>。`;
  };
}

export function defaultPlayState(def) {
  /** @type {PlaygroundState} */
  const s = { pick: def.defaultPick };
  if (def.numeric) s.value = def.numeric.default;
  if (def.parentStyle) s.parentPick = def.parentStyle.presets[0].id;
  if (def.colorOptions) {
    s.colorPick = def.defaultColorPick ?? def.colorOptions[0]?.id;
  }
  return s;
}

export function isKeywordPick(pick) {
  return GLOBAL_KEYWORDS.includes(pick);
}

export function specifiedCss(propId, /** @type {PlaygroundState} */ st) {
  const def = PLAYGROUNDS[propId];
  if (!def) return "";
  if (isKeywordPick(st.pick)) return st.pick;
  const opt = def.options.find((o) => o.id === st.pick);
  if (st.pick === "num" && def.numeric) {
    return def.numeric.format(st.value ?? def.numeric.default);
  }
  if (opt?.css) return opt.css;
  return opt?.id ?? st.pick;
}

export function parentCss(propId, /** @type {PlaygroundState} */ st) {
  const def = PLAYGROUNDS[propId];
  if (!def?.parentStyle) return null;
  const preset = def.parentStyle.presets.find((p) => p.id === st.parentPick);
  return preset?.css ?? def.parentStyle.presets[0].css;
}

export function needsParentRow(propId, pick) {
  const def = PLAYGROUNDS[propId];
  if (!def?.parentStyle) return false;
  return pick === "inherit" || pick === "unset" || pick === "bolder" || pick === "lighter";
}