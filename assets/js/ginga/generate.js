import { countMora } from "./mora.js";
import {
  hasBrokenChunkJoin,
  isNaturalPhrase,
  canCloseTanka,
  isSegmentJoinOk,
  lineDefects,
  scoreTanka,
} from "./naturalness.js";
import { TEMPLATES_5, TEMPLATES_7 } from "./syntax.js";
import { INUZARU_RECIPES, parseInuzaruRecipe } from "./inuzaru-recipes.js";
import { CHUNK_KANJI, CHUNK_ROLES, CHUNK_READINGS } from "./phrase-chunks.js";

/** @typedef {{ text: string, reading: string }} Phrase */

/**
 * @typedef {Record<string, string[]>} PhraseRolesMap
 * @typedef {Record<string, Record<number, string[]>>} RoleIndex
 * @typedef {'noun' | 'mod' | 'pred' | 'whole'} PhraseRole
 */

const GENERATE_TRIES = 280;
const ACCEPT_SCORE = 96;
const MORA_PATTERN = [5, 7, 5, 7, 7];
function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * @param {PhraseRolesMap} phraseRoles
 * @param {Record<string, string>} kanji
 * @param {string[]} readings
 * @returns {RoleIndex}
 */
export function buildRoleIndex(phraseRoles, kanji, readings) {
  /** @type {RoleIndex} */
  const index = { noun: {}, mod: {}, pred: {}, whole: {} };
  for (const reading of readings) {
    const mora = countMora(reading);
    const roles = phraseRoles[reading] ?? ["whole"];
    for (const role of roles) {
      if (!index[role][mora]) index[role][mora] = [];
      index[role][mora].push(reading);
    }
    if (!index.whole[mora]) index.whole[mora] = [];
    if (!index.whole[mora].includes(reading)) index.whole[mora].push(reading);
  }
  return index;
}

/**
 * @param {RoleIndex} index
 * @param {PhraseRole} role
 * @param {number} mora
 * @param {Record<string, string>} kanji
 */
function pickReading(index, role, mora, kanji) {
  const tryRoles = role === "whole" ? ["whole", "noun", "pred", "mod"] : [role, "whole"];
  for (const r of tryRoles) {
    const list = index[r][mora];
    if (list?.length) {
      const reading = sample(list);
      return { reading, text: kanji[reading] ?? reading };
    }
  }
  return null;
}

/**
 * @param {{ text: string, reading: string, mora: number }[]} segments
 * @returns {Phrase[] | null}
 */
function packSegmentsIntoLines(segments) {
  /** @type {Phrase[]} */
  const lines = [];
  let segIdx = 0;
  for (const target of MORA_PATTERN) {
    let mora = 0;
    let text = "";
    let reading = "";
    while (mora < target && segIdx < segments.length) {
      const seg = segments[segIdx];
      if (mora + seg.mora > target) return null;
      if (!isSegmentJoinOk(reading, seg.reading)) return null;
      text += seg.text;
      reading += seg.reading;
      mora += seg.mora;
      segIdx += 1;
    }
    if (mora !== target) return null;
    if (hasBrokenChunkJoin(reading)) return null;
    lines.push({ text, reading });
  }
  return segIdx === segments.length ? lines : null;
}

/**
 * @param {RoleIndex} index
 * @param {Record<string, string>} kanji
 * @returns {Phrase[] | null}
 */
function generateFromInuzaruRecipe(index, kanji) {
  const recipe = sample(INUZARU_RECIPES);
  const parsed = parseInuzaruRecipe(recipe);
  /** @type {{ text: string, reading: string, mora: number }[]} */
  const segments = [];
  for (const piece of parsed) {
    if ("literal" in piece) {
      if (piece.literal === "　") {
        segments.push({ text: "　", reading: "", mora: 0 });
        continue;
      }
      segments.push({
        text: piece.literal,
        reading: piece.literal,
        mora: countMora(piece.literal),
      });
      continue;
    }
    const picked = pickReading(index, piece.role, piece.mora, kanji);
    if (!picked) return null;
    segments.push({
      text: picked.text,
      reading: picked.reading,
      mora: piece.mora,
    });
  }
  const total = segments.reduce((s, x) => s + x.mora, 0);
  if (total !== 31) return null;
  return packSegmentsIntoLines(segments);
}

/**
 * @param {import('./syntax.js').LineTemplate} template
 * @param {RoleIndex} index
 * @param {Record<string, string>} kanji
 */
function fillTemplate(template, index, kanji) {
  const parts = [];
  for (const slot of template.slots) {
    const part = pickReading(index, slot.role, slot.mora, kanji);
    if (!part) return null;
    parts.push(part);
  }
  const reading = parts.map((p) => p.reading).join("");
  if (hasBrokenChunkJoin(reading)) return null;
  for (let i = 1; i < parts.length; i++) {
    if (!isSegmentJoinOk(parts[i - 1].reading, parts[i].reading)) return null;
  }
  return {
    reading,
    text: parts.map((p) => p.text).join(""),
  };
}

function generateLine(mora, index, kanji) {
  const templates = mora === 5 ? TEMPLATES_5 : TEMPLATES_7;
  for (let t = 0; t < 40; t++) {
    const template = sample(templates);
    const line = fillTemplate(template, index, kanji);
    if (line) return line;
  }
  return pickReading(index, "whole", mora, kanji);
}

function generateLineByLine(index5, index7, kanji) {
  const lines = MORA_PATTERN.map((m) => {
    const line = generateLine(m, m === 5 ? index5 : index7, kanji);
    return line ?? null;
  });
  if (lines.some((l) => !l)) return [];
  if (lines.some((l, i) => countMora(l.reading) !== MORA_PATTERN[i])) return [];
  return lines;
}

/**
 * @param {{
 *   kanji: Record<string, string>;
 *   phrases5: string[];
 *   phrases7: string[];
 *   phraseRoles: PhraseRolesMap;
 * }} ctx
 * @returns {Phrase[]}
 */
function usableWhole(reading, kanji, mora) {
  if (countMora(reading) !== mora) return false;
  const text = kanji[reading] ?? reading;
  if (!isNaturalPhrase(text, reading)) return false;
  if (lineDefects(text, reading).length) return false;
  if (startsWithBadSymbol(text, reading)) return false;
  return true;
}

function startsWithBadSymbol(text, reading) {
  return /[0-9A-Za-z@＠○]/.test(text) || /[0-9A-Za-z@＠○]/.test(reading);
}

/**
 * 切り出し済みの五・七をそのまま並べ、スコアが上がるまで引き直す。
 * @param {string[]} fives
 * @param {string[]} sevens
 * @param {string[]} predSevens
 * @param {Record<string, string>} kanji
 */
function sampleWholeTanka(fives, sevens, predSevens, kanji) {
  if (fives.length < 2 || sevens.length < 2 || predSevens.length < 1) return null;
  const picked = [
    sample(fives),
    sample(sevens),
    sample(fives),
    sample(sevens),
    sample(predSevens),
  ];
  if (new Set(picked).size < 5) return null;
  return picked.map((reading) => ({
    reading,
    text: kanji[reading] ?? reading,
  }));
}

export function generateTankaFromSyntax(ctx) {
  const kanji = ctx.kanji;
  const fives = ctx.phrases5.filter((r) => usableWhole(r, kanji, 5));
  const sevens = ctx.phrases7.filter((r) => usableWhole(r, kanji, 7));
  const predSevens = sevens.filter((r) => canCloseTanka(r, ctx.phraseRoles));

  const mergedKanji = { ...kanji, ...CHUNK_KANJI };
  const mergedRoles = { ...ctx.phraseRoles, ...CHUNK_ROLES };
  const chunkOk = CHUNK_READINGS.filter((r) => {
    const text = mergedKanji[r] ?? r;
    return (
      countMora(r) >= 4 &&
      isNaturalPhrase(text, r) &&
      lineDefects(text, r).length === 0
    );
  });
  const index = buildRoleIndex(mergedRoles, mergedKanji, [
    ...new Set([...fives, ...sevens, ...chunkOk]),
  ]);

  /** @type {Phrase[] | null} */
  let best = null;
  let bestScore = -1;

  function consider(lines) {
    if (!lines || lines.length !== 5) return false;
    if (!canCloseTanka(lines[4].reading, ctx.phraseRoles)) return false;
    const { score } = scoreTanka(lines);
    if (score > bestScore) {
      bestScore = score;
      best = lines;
    }
    return score >= ACCEPT_SCORE;
  }

  for (let t = 0; t < GENERATE_TRIES; t++) {
    if (consider(sampleWholeTanka(fives, sevens, predSevens, kanji))) return best;
    if (t % 4 === 0) {
      const stitched = generateFromInuzaruRecipe(index, mergedKanji);
      if (consider(stitched)) return best;
    }
  }
  return bestScore >= 60 ? best : best ?? [];
}