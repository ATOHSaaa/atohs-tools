const FALLBACK =
  "春は曙。やうやう白くなりゆく山際、少し明ろくなりて、紫だちたる雲の細く垂れほそたる。";

/** @type {Record<string, string>} */
export const PROPERTY_PREVIEW_DEFAULTS = {
  "font-size": FALLBACK,
  "font-family": "春は曙。The quick brown fox。0123456789",
  "font-weight":
    "太めと細め　font-weight の差が出やすい漢字かな混じり。Bold versus regular in Latin.",
  "font-style":
    "この文は直立体と斜体の違いを見るための文です。Italic style in English looks like this phrase.",
  "font-stretch":
    "CONDENSED vs EXPANDED — 欧文のフォント横幅（font-stretch）を比べるサンプルです。",
  "font-variant": "Normal and Small Caps: Typography OpenType FEATURES",
  "line-height":
    "第一段落。行送りは複数行あると変化が分かりやすい。句読点や約物の折り返しも一緒に確認できます。\n第二段落。改行を入れて、段落間のリズムと行間のバランスを見比べてください。",
  "letter-spacing": "字送り　あいうえお　ABCD 1234",
  "word-spacing": "The quick brown fox jumps over the lazy dog.",
  "text-align":
    "左揃え・両端揃え・中央を試すための長めの文です。In English, alignment also shows clearly when the line fills the box.",
  "text-indent":
    "最初の行だけ字下げされるかを見る段落です。続く文は同じ段落として繋げ、字下げの量を調整して比べてください。",
  "text-transform": "transform THIS line — MiXeD case と仮名 カナ",
  "text-decoration": "下線・上線・取り消し線の見え方を確かめる一行です。",
  "text-decoration-color": "Decoration color に応じて線の色が変わります。",
  "text-decoration-style": "Underline style: solid, dashed, dotted, wavy.",
  "text-decoration-thickness": "線の太さを変えると、同じ underline でも印象が変わります。",
  "text-underline-offset": "Underline offset — 文字と線の距離が変わります。",
  "text-underline-position": "あアｱA 下線の位置（gypjt など下降部も）",
  "text-emphasis-style": "傍点・圏点のスタイルを、和文で確かめます。",
  "text-emphasis-color": "傍点の色。強調の見え方が変わります。",
  "text-emphasis-position": "傍点を上に付けるか下に付けるか。",
  "text-overflow":
    "一行に収めきれない長い文を、ellipsis や clip でどう見せるか試します。",
  "text-shadow": "影の付き方で、文字の浮き上がりを見る。",
  "text-stroke": "Stroke outline — 縁取りの太さと色。",
  "text-stroke-width": "Outline width changes the letter edge.",
  "text-stroke-color": "Outline color on Latin and 日本語",
  "text-combine-upright": "令和5年10月26日",
  "text-orientation": "ABCD 1234 縦書き mixed 日本語",
  "text-rendering": "Rendering hints — 細い線やカーニングの違い。",
  "text-size-adjust": "100% text size on mobile — 漢字と Latin mix 123",
  "writing-mode": "縦書きの組み方向。春は曙。やうやう白くなりゆく山際。",
  "white-space": "    連続スペース　　と\n改行の扱いを確認",
  "text-wrap": `短い行が複数になる段落です。balance や pretty では行の切り方や余白の釣り合いが変わることがあります。Wrap properties need enough words in English too: rivers and line breaks.`,
  hyphens: "internationalization extraordinary hyphenation antidisestablishmentarianism",
  "font-feature-settings":
    "約物（）との間、0123 の数字、半角 AB と全角角ＡＢ — palt など",
  "font-variant-east-asian": "全角・半角・書体の東アジア字形バリエーション",
};

export const BUILTIN_PREVIEW_TEXTS = new Set([
  FALLBACK,
  "あいうえお　アイウエオ　Typography",
  "font-size は、要素の文字の大きさを決めます。親の font-size を基準に em や rem で指定することも多いです。",
  ...Object.values(PROPERTY_PREVIEW_DEFAULTS),
]);

export function defaultPreviewForProperty(propertyId) {
  return PROPERTY_PREVIEW_DEFAULTS[propertyId] ?? FALLBACK;
}