/**
 * 「犬猿」再録レシピ（MIT: paithiov909/baboon src/recipe.js）
 * m=名詞 s=修飾部 j=述部、数字は拍数。+ は連結、の・は・　はリテラル。
 */
export const INUZARU_RECIPES = [
  "m4+の+m3+j4+s5+s4+m2+j6+m2",
  "s5+m3+の+m2+j6+m3+j4+s4+m3",
  "m4+j5+s3+m4+は+m6+の+m3+j4",
  "m4+j5+s3+m4+j4+s4+m4+j3",
  "m4+j4+m3+の+m4+j5+s3+m4+j3",
  "s5+m6+j6+s3+m3+j6+m2",
  "m4+j5+s3+m4+j8+s5+m2",
  "m4+j4+m3+j6+s7+s3+m4",
  "s5+m6+j6+s7+m2+j5",
  "s5+m2+j5+m4+は+s4+m2+j8",
  "s5+s7+m2+j3+m6+j8",
  "m2+j3+s3+m3+j6+m2+の+m3+j8",
  "m4+j6+m2+　+s5+m2+j5+s3+m4",
  "s5+m3+j4+s5+m3+の+m2+j5+m3",
  "m4+は+m6+の+m2+j3+s4+m2+j6+m2",
  "m4+j4+s4+m4+は+s7+m4+j3",
  "s5+s4+m2+の+m4+j5+s3+m3+j4",
  "s5+m4+j3+m4+j4+s4+m4+j3",
  "m4+j8+s5+m3+の+m2+j4+m4",
  "s5+m2+の+m3+j6+m6+は+s4+m3",
];

/** @typedef {{ role: 'noun' | 'mod' | 'pred', mora: number } | { literal: string }} RecipePiece */

/**
 * @param {string} recipe
 * @returns {RecipePiece[]}
 */
export function parseInuzaruRecipe(recipe) {
  return recipe.split("+").map((el) => {
    if (/^[msj]\d$/.test(el)) {
      const role =
        el[0] === "s" ? "mod" : el[0] === "j" ? "pred" : "noun";
      return { role, mora: Number(el[1]) };
    }
    return { literal: el };
  });
}