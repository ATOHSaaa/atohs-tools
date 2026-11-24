/** @typedef {'noun' | 'mod' | 'pred' | 'whole'} PhraseRole */

/**
 * 形態素列から語句の文法ロールを推定する（kuromoji トークン前提）。
 *
 * @typedef {import('./morph.js').MorphToken} MorphToken
 */

import { closesAsNounPhrase } from "./morph.js";

/** @param {MorphToken} t */
function isRentaiForm(t) {
  if (t.pos === "形容詞") return true;
  if (t.pos === "動詞" && (t.conjugated_form ?? "").includes("連体形")) return true;
  if (t.pos === "助詞" && t.pos_detail_1 === "連体化") return true;
  return false;
}

/** @param {MorphToken} t */
function isPredicateTail(t) {
  if (t.pos === "形容詞") {
    const cf = t.conjugated_form ?? "";
    if (/基本形|終止形/.test(cf)) return true;
  }
  if (t.pos === "動詞" && t.pos_detail_1 === "自立") {
    const cf = t.conjugated_form ?? "";
    if (/基本形|終止形|命令形|仮定形/.test(cf) || cf === "未然形") return true;
  }
  if (t.pos === "助動詞") return true;
  if (t.pos === "助詞" && ["終助詞", "副助詞"].includes(t.pos_detail_1)) return true;
  return false;
}

/**
 * @param {MorphToken[]} tokens
 * @returns {PhraseRole[]}
 */
export function classifyPhraseRoles(tokens) {
  if (!tokens?.length) return [];
  const last = tokens[tokens.length - 1];
  /** @type {Set<PhraseRole>} */
  const roles = new Set();

  if (closesAsNounPhrase(tokens) || last.pos === "名詞" || last.pos === "代名詞") {
    roles.add("noun");
  }
  if (isRentaiForm(last) || (tokens.length === 1 && last.pos === "形容詞")) {
    roles.add("mod");
  }
  if (isPredicateTail(last)) {
    roles.add("pred");
  }

  if (roles.size === 0) roles.add("whole");
  if (roles.size > 1) roles.add("whole");

  return [...roles];
}