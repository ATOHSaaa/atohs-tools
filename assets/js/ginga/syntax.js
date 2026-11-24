/**
 * 五・七拍行の構文テンプレート（スロットは mora 合計が拍数になる）。
 *
 * @typedef {'noun' | 'mod' | 'pred' | 'whole'} PhraseRole
 * @typedef {{ role: PhraseRole, mora: number }} SyntaxSlot
 * @typedef {{ id: string, slots: SyntaxSlot[] }} LineTemplate
 */

/** @param {number} total @param {[PhraseRole, PhraseRole]} pair */
function twoSlotTemplates(total, pair) {
  /** @type {LineTemplate[]} */
  const out = [];
  for (let a = 1; a < total; a++) {
    const b = total - a;
    out.push({
      id: `${pair[0]}${a}-${pair[1]}${b}`,
      slots: [
        { role: pair[0], mora: a },
        { role: pair[1], mora: b },
      ],
    });
  }
  return out;
}

/** @param {number} total */
function threeSlotTemplates(total) {
  /** @type {LineTemplate[]} */
  const out = [];
  const triples = [
    ["mod", "noun", "pred"],
    ["mod", "mod", "noun"],
    ["noun", "mod", "pred"],
  ];
  for (const [r0, r1, r2] of triples) {
    for (let a = 1; a < total - 1; a++) {
      for (let b = 1; b < total - a; b++) {
        const c = total - a - b;
        if (c < 1) continue;
        out.push({
          id: `${r0}${a}${r1}${b}${r2}${c}`,
          slots: [
            { role: /** @type {PhraseRole} */ (r0), mora: a },
            { role: /** @type {PhraseRole} */ (r1), mora: b },
            { role: /** @type {PhraseRole} */ (r2), mora: c },
          ],
        });
      }
    }
  }
  return out;
}

/** @param {number} mora */
export function templatesForMora(mora) {
  /** @type {LineTemplate[]} */
  const all = [{ id: "whole", slots: [{ role: "whole", mora }] }];
  all.push(...twoSlotTemplates(mora, ["mod", "noun"]));
  all.push(...twoSlotTemplates(mora, ["noun", "pred"]));
  all.push(...twoSlotTemplates(mora, ["mod", "pred"]));
  if (mora >= 6) all.push(...threeSlotTemplates(mora));
  return all;
}

export const TEMPLATES_5 = templatesForMora(5);
export const TEMPLATES_7 = templatesForMora(7);