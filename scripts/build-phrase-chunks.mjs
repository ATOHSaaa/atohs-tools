/**
 * 形態素境界で 2〜8 拍のサブ語句を抽出し phrase-chunks.js を書く。
 * npm run ginga:chunks
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { countMora } from "../assets/js/ginga/mora.js";
import { isNaturalPhrase } from "../assets/js/ginga/naturalness.js";
import { isMorphologicallyNatural } from "../assets/js/ginga/morph.js";
import { classifyPhraseRoles } from "../assets/js/ginga/phrase-role.js";
import { loadKuromojiTokenizer, tokenizeDisplay } from "./kuromoji-tokenizer.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const CHUNK_MORA = new Set([2, 3, 4, 5, 6, 7, 8]);

async function main() {
  const phrasesPath = path.join(root, "../assets/js/ginga/phrases.js");
  const { KANJI, PHRASES_5, PHRASES_7 } = await import(
    `${pathToFileURL(phrasesPath).href}?t=${Date.now()}`
  );
  const tokenizer = await loadKuromojiTokenizer();
  const pool = [...new Set([...PHRASES_5, ...PHRASES_7])];

  /** @type {Map<string, string>} */
  const kanji = new Map();
  /** @type {Record<string, string[]>} */
  const roles = {};

  for (const parent of pool) {
    const display = KANJI[parent] ?? parent;
    const tokens = tokenizeDisplay(tokenizer, display);
  if (!tokens.length) continue;
    let pos = 0;
    for (let i = 0; i < tokens.length; i++) {
      const end = display.indexOf(tokens[i].surface_form, pos);
      if (end === -1) continue;
      pos = end + tokens[i].surface_form.length;
      const subDisplay = display.slice(0, pos);
      const subTokens = tokens.slice(0, i + 1);
      const reading = subTokens
        .map((t) =>
          (t.reading || t.pronunciation || t.surface_form)
            .replace(/[\u30a1-\u30f6]/g, (ch) =>
              String.fromCharCode(ch.charCodeAt(0) - 0x60)
            )
        )
        .join("");
      const mora = countMora(reading);
      if (!CHUNK_MORA.has(mora) || mora === countMora(parent)) continue;
      if (!isNaturalPhrase(subDisplay, reading)) continue;
      if (!isMorphologicallyNatural(subTokens, { phraseEnd: true })) continue;
      if (!kanji.has(reading)) {
        kanji.set(reading, subDisplay);
        roles[reading] = classifyPhraseRoles(subTokens);
      }
    }
  }

  const outPath = path.join(root, "../assets/js/ginga/phrase-chunks.js");
  const kanjiObj = Object.fromEntries(kanji);
  fs.writeFileSync(
    outPath,
    `/** @type {Record<string, string>} */
export const CHUNK_KANJI = ${JSON.stringify(kanjiObj, null, 2)};

/** @type {Record<string, import('./phrase-role.js').PhraseRole[]>} */
export const CHUNK_ROLES = ${JSON.stringify(roles, null, 2)};

export const CHUNK_READINGS = ${JSON.stringify([...kanji.keys()], null, 2)};
`
  );
  console.log(`Wrote ${outPath} (${kanji.size} chunks)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});