import path from "node:path";
import { fileURLToPath } from "node:url";
import kuromoji from "kuromoji";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DICT_PATH = path.join(__dirname, "../node_modules/kuromoji/dict");

/** @type {Promise<import("kuromoji").Tokenizer> | null} */
let tokenizerPromise = null;

export function loadKuromojiTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: DICT_PATH }).build((err, tokenizer) => {
        if (err) reject(err);
        else resolve(tokenizer);
      });
    });
  }
  return tokenizerPromise;
}

/** @param {import("kuromoji").Tokenizer} tokenizer @param {string} text */
export function tokenizeDisplay(tokenizer, text) {
  return tokenizer.tokenize(text.trim());
}