/**
 * @shino140nov の投稿から 5・7 モーラ語句を抽出し phrases.js を生成する。
 * 用法: node scripts/build-ginga-phrases.mjs <tweets.json>
 *
 * tweets.json: get_users_posts の data 配列（複数ページを結合した JSON 配列）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji from "kuromoji";
import { countMora } from "../assets/js/ginga/mora.js";
import { hasBalancedCornerQuotes, isClauseFragment, isNaturalPhrase } from "../assets/js/ginga/naturalness.js";
import { isMorphologicallyNatural } from "../assets/js/ginga/morph.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_PATH = path.join(__dirname, "../node_modules/kuromoji/dict");

/** @param {string} kat */
function katakanaToHiragana(kat) {
  return kat.replace(/[\u30a1-\u30f6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * @param {import("kuromoji").Tokenizer} tokenizer
 * @param {string} text
 */
function tokenizeSurface(text, tokenizer) {
  const tokens = tokenizer.tokenize(text);
  /** @type {{ surface: string, reading: string, mora: number, start: number, end: number }[]} */
  const spans = [];
  let pos = 0;
  for (const t of tokens) {
    const surface = t.surface_form;
    const start = text.indexOf(surface, pos);
    if (start === -1) continue;
    const end = start + surface.length;
    pos = end;
    const reading = katakanaToHiragana(t.reading || t.pronunciation || surface);
    spans.push({ surface, reading, mora: countMora(reading), start, end });
  }
  return spans;
}

const TANKA_MORA = [5, 7, 5, 7, 7];

/**
 * @param {string} display
 * @param {string} reading
 * @param {Map<string, string>} found
 * @param {import("kuromoji").Tokenizer} tokenizer
 */
function addPhrase(found, reading, display, tokenizer) {
  const mora = countMora(reading);
  if (mora !== 5 && mora !== 7) return;
  const d = display.trim();
  if (!isNaturalPhrase(d, reading)) return;
  const tokens = tokenizer.tokenize(d);
  if (!isMorphologicallyNatural(tokens, { phraseEnd: true })) return;
  if (!found.has(reading)) found.set(reading, d);
}

export { hasBalancedCornerQuotes, isClauseFragment };

/**
 * 投稿先頭からの 5-7-5-7-7 分解（先頭一首分のみ）。
 * @param {ReturnType<typeof tokenizeSurface>} spans
 * @param {string} clean
 * @param {Map<string, string>} found
 * @param {import("kuromoji").Tokenizer} tokenizer
 */
function extractTankaFromStart(spans, clean, found, tokenizer) {
  let tokenIdx = 0;
  /** @type {{ reading: string, display: string }[]} */
  const lines = [];
  for (const target of TANKA_MORA) {
    if (tokenIdx >= spans.length) return;
    const begin = tokenIdx;
    let mora = 0;
    while (tokenIdx < spans.length && mora < target) {
      mora += spans[tokenIdx].mora;
      tokenIdx++;
    }
    if (mora !== target) return;
    const display = clean.slice(spans[begin].start, spans[tokenIdx - 1].end);
    const reading = spans
      .slice(begin, tokenIdx)
      .map((s) => s.reading)
      .join("");
    lines.push({ reading, display });
  }
  for (const { reading, display } of lines) addPhrase(found, reading, display, tokenizer);
}

/**
 * 句点区切りの節全体、または節の先頭/末尾の 5・7 モーラ。
 * @param {string} clause
 * @param {import("kuromoji").Tokenizer} tokenizer
 * @param {Map<string, string>} found
 */
function extractClausePhrases(clause, tokenizer, found) {
  const text = clause.trim();
  if (text.length < 2) return;

  const spans = tokenizeSurface(text, tokenizer);
  if (!spans.length) return;

  const fullReading = spans.map((s) => s.reading).join("");
  addPhrase(found, fullReading, text, tokenizer);

  let mora = 0;
  for (let j = 0; j < spans.length; j++) {
    mora += spans[j].mora;
    if (mora > 7) break;
    if (mora === 5 || mora === 7) {
      const display = text.slice(spans[0].start, spans[j].end);
      const reading = spans
        .slice(0, j + 1)
        .map((s) => s.reading)
        .join("");
      addPhrase(found, reading, display, tokenizer);
    }
  }

}

/**
 * @param {string} text
 * @param {import("kuromoji").Tokenizer} tokenizer
 */
function extractPhrases(text, tokenizer) {
  const clean = text
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!clean || clean.length < 2) return [];

  const spans = tokenizeSurface(clean, tokenizer);
  if (!spans.length) return [];

  /** @type {Map<string, string>} */
  const found = new Map();

  extractTankaFromStart(spans, clean, found, tokenizer);

  const clauses = clean
    .split(/[。、\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const clause of clauses) extractClausePhrases(clause, tokenizer, found);

  return [...found.entries()].map(([reading, text]) => ({
    reading,
    text,
    mora: countMora(reading),
  }));
}

function isPoetryTweet(text) {
  if (/https?:\/\//.test(text) && text.replace(/https?:\/\/\S+/g, "").length < 40) return false;
  if (/(COMITIA|頒布|インタビュー|お知らせ|よろしくお願い)/.test(text)) return false;
  return true;
}

function quoteJs(s) {
  return JSON.stringify(s);
}

/**
 * @param {Map<string, string>} kanji
 * @param {string[]} readings5
 * @param {string[]} readings7
 */
/**
 * @param {Map<string, string>} kanji
 * @param {string[]} readings5
 * @param {string[]} readings7
 * @param {string[] | null} [phrases5]
 * @param {string[] | null} [phrases7]
 */
export function renderPhrasesJs(kanji, readings5, readings7, phrases5 = null, phrases7 = null) {
  const kanjiLines = [...kanji.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "ja"))
    .map(([k, v]) => `  ${quoteJs(k)}: ${quoteJs(v)},`)
    .join("\n");

  const list5 = readings5.map((k) => quoteJs(k)).join(",\n  ");
  const list7 = readings7.map((k) => quoteJs(k)).join(",\n  ");

  const p5json = phrases5 ? JSON.stringify(phrases5, null, 2) : null;
  const p7json = phrases7 ? JSON.stringify(phrases7, null, 2) : null;
  const phraseSection =
    p5json && p7json
      ? `export const PHRASES_5 = ${p5json};

export const PHRASES_7 = ${p7json};`
      : `import { filterNaturalPool } from "./naturalness.js";

const { readings5: PHRASES_5, readings7: PHRASES_7 } = filterNaturalPool(
  READINGS_5,
  READINGS_7,
  KANJI
);`;

  return `import { generateTankaFromSyntax } from "./generate.js";
import { PHRASE_ROLES } from "./phrase-roles.js";

/** @typedef {{ text: string, reading: string }} Phrase */

/**
 * 語彙出典: 篠原歩 (@shino140nov) の X 投稿から抽出（自動生成: scripts/build-ginga-phrases.mjs）
 * https://x.com/shino140nov
 */

/** @type {Record<string, string>} */
export const KANJI = {
${kanjiLines}
};

export const READINGS_5 = ${JSON.stringify(readings5, null, 2)};

export const READINGS_7 = ${JSON.stringify(readings7, null, 2)};

${phraseSection}

/** @returns {Phrase[]} */
export function generateTanka() {
  return generateTankaFromSyntax({
    kanji: KANJI,
    phrases5: PHRASES_5,
    phrases7: PHRASES_7,
    phraseRoles: PHRASE_ROLES,
  });
}
${p5json ? "" : "\nexport { PHRASES_5, PHRASES_7 };"}
`;
}

function loadTokenizer() {
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
      if (err) reject(err);
      else resolve(tokenizer);
    });
  });
}

async function main() {
  const inPath = process.argv[2];
  if (!inPath) {
    console.error("Usage: node scripts/build-ginga-phrases.mjs <tweets.json>");
    process.exit(1);
  }
  const raw = JSON.parse(fs.readFileSync(inPath, "utf8"));
  /** @type {{ text: string }[]} */
  const tweets = Array.isArray(raw) ? raw : raw.data ?? [];

  const tokenizer = await loadTokenizer();
  /** @type {Map<string, string>} */
  const kanji = new Map();
  /** @type {Map<string, 5 | 7>} */
  const moraOf = new Map();

  for (const tw of tweets) {
    const text = tw.text;
    if (!text || !isPoetryTweet(text)) continue;
    for (const { reading, text: display, mora } of extractPhrases(text, tokenizer)) {
      if (mora !== 5 && mora !== 7) continue;
      kanji.set(reading, display);
      moraOf.set(reading, mora);
    }
  }

  const readings5 = [...moraOf.entries()]
    .filter(([, m]) => m === 5)
    .map(([k]) => k)
    .sort((a, b) => a.localeCompare(b, "ja"));
  const readings7 = [...moraOf.entries()]
    .filter(([, m]) => m === 7)
    .map(([k]) => k)
    .sort((a, b) => a.localeCompare(b, "ja"));

  if (readings5.length === 0 || readings7.length === 0) {
    console.error("No phrases extracted. 5:", readings5.length, "7:", readings7.length);
    process.exit(1);
  }

  const outPath = path.join(__dirname, "../assets/js/ginga/phrases.js");
  fs.writeFileSync(outPath, renderPhrasesJs(kanji, readings5, readings7));
  console.log(`Wrote ${outPath}`);
  console.log(`5-mora: ${readings5.length}, 7-mora: ${readings7.length}, unique keys: ${kanji.size}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}