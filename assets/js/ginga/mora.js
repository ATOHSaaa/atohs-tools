/** ひらがな・カタカナのおおよそのモーラ数（短歌の拍数チェック用） */
export function countMora(text) {
  const s = String(text)
    .normalize("NFKC")
    .replace(/[・\s\u3000]/g, "");

  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "っ" || c === "ッ") {
      n += 1;
      continue;
    }
    if (c === "ー" || c === "〜" || c === "−") continue;
    if ("ゃゅょぁぃぅぇぉゎゕゖャュョァィゥェォヮ".includes(c)) continue;
    n += 1;
  }
  return n;
}