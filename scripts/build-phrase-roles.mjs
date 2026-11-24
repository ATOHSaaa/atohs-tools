/**
 * PHRASES を kuromoji でロール分類し phrase-roles.js を出力する。
 * npm run ginga:roles
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPhraseRoles } from "../assets/js/ginga/phrase-role.js";
import { loadKuromojiTokenizer, tokenizeDisplay } from "./kuromoji-tokenizer.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const { KANJI, PHRASES_5, PHRASES_7 } = await import("../assets/js/ginga/phrases.js");
  const tokenizer = await loadKuromojiTokenizer();
  const pool = [...new Set([...PHRASES_5, ...PHRASES_7])];

  /** @type {Record<string, string[]>} */
  const phraseRoles = {};
  for (const reading of pool) {
    const display = KANJI[reading] ?? reading;
    const tokens = tokenizeDisplay(tokenizer, display);
    phraseRoles[reading] = classifyPhraseRoles(tokens);
  }

  const outPath = path.join(root, "../assets/js/ginga/phrase-roles.js");
  const body = `/** 形態素解析による語句ロール（build: npm run ginga:roles） */

/** @type {Record<string, import('./phrase-role.js').PhraseRole[]>} */
export const PHRASE_ROLES = ${JSON.stringify(phraseRoles, null, 2)};
`;
  fs.writeFileSync(outPath, body);
  console.log(`Wrote ${outPath} (${pool.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});