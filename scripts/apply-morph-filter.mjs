/**
 * 既存 phrases.js を形態素解析で再フィルタし、PHRASES を焼き込む。
 * npm run ginga:morph-filter
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMorphologicallyNatural } from "../assets/js/ginga/morph.js";
import { isNaturalPhrase } from "../assets/js/ginga/naturalness.js";
import { loadKuromojiTokenizer, tokenizeDisplay } from "./kuromoji-tokenizer.mjs";
import { renderPhrasesJs } from "./build-ginga-phrases.mjs";
import { KANJI, READINGS_5, READINGS_7 } from "../assets/js/ginga/phrases.js";

const root = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const tokenizer = await loadKuromojiTokenizer();
  const kanji = new Map();
  for (const k of [...READINGS_5, ...READINGS_7]) {
    kanji.set(k, KANJI[k] ?? k);
  }

  /** @param {string} reading */
  function keep(reading) {
    const display = kanji.get(reading) ?? reading;
    if (!isNaturalPhrase(display, reading)) return false;
    const tokens = tokenizeDisplay(tokenizer, display);
    return isMorphologicallyNatural(tokens, { phraseEnd: true });
  }

  const morph5 = READINGS_5.filter(keep);
  const morph7 = READINGS_7.filter(keep);

  const outPath = path.join(root, "../assets/js/ginga/phrases.js");
  fs.writeFileSync(outPath, renderPhrasesJs(kanji, READINGS_5, READINGS_7, morph5, morph7));
  console.log(`Wrote ${outPath}`);
  console.log(`morph 5: ${morph5.length}/${READINGS_5.length}, 7: ${morph7.length}/${READINGS_7.length}`);

  const { execSync } = await import("node:child_process");
  execSync("node scripts/build-phrase-roles.mjs", { cwd: path.join(root, ".."), stdio: "inherit" });
  execSync("node scripts/build-phrase-chunks.mjs", { cwd: path.join(root, ".."), stdio: "inherit" });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});