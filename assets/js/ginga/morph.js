/**
 * 形態素列から語句が「独立した一句」として自然かを判定する。
 * kuromoji の Ipadic トークン（または同形のプレーンオブジェクト）に対応。
 *
 * @typedef {{ surface_form: string, pos: string, pos_detail_1: string, conjugated_form?: string, conjugated_type?: string }} MorphToken
 */

/** @param {MorphToken} t */
function isCaseParticle(t) {
  return t.pos === "助詞" && ["格助詞", "係助詞", "接続助詞"].includes(t.pos_detail_1);
}

/** @param {MorphToken} t */
function isParticleLead(t) {
  return t.pos === "助詞" && ["格助詞", "係助詞", "接続助詞", "副助詞"].includes(t.pos_detail_1);
}

/** @param {MorphToken} t */
function isAuxiliaryTailHead(t) {
  return (
    t.pos === "動詞" &&
    t.pos_detail_1 === "接尾" &&
    /^(られ|され|れ|せ|させ|でき)/.test(t.surface_form)
  );
}

/** 連用タ接続の次が動詞なのに「て」が無い（書いあって 等） */
/** @param {MorphToken[]} tokens */
function hasMissingTeBetweenVerbs(tokens) {
  for (let i = 0; i < tokens.length - 1; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a.pos !== "動詞" && a.pos !== "助動詞") continue;
    const cf = a.conjugated_form ?? "";
    if (!cf.includes("連用")) continue;
    if (tokens[i + 1]?.surface_form === "て" && tokens[i + 1]?.pos === "助詞") continue;
    if (b.pos === "動詞" || b.pos === "助動詞") return true;
  }
  return false;
}

/** 末尾が文の続きになりやすい品詞 */
/** @param {MorphToken} t */
function isOpenEndedTail(t) {
  if (t.pos === "助詞") {
    if (["格助詞", "係助詞", "連体化", "接続助詞"].includes(t.pos_detail_1)) return true;
  }
  if (t.pos === "動詞") {
    const cf = t.conjugated_form ?? "";
    if (cf === "連用形" || cf === "連用タ接続") return true;
  }
  return false;
}

/** 名詞＋について／として など名詞句としての言い切り */
/** @param {MorphToken[]} tokens */
export function closesAsNounPhrase(tokens) {
  if (tokens.length < 2) return false;
  const last = tokens[tokens.length - 1];
  const first = tokens[0];
  if (first.pos !== "名詞" && first.pos !== "代名詞") return false;
  if (last.pos !== "助詞" || last.pos_detail_1 !== "格助詞") return false;
  return /^(について|にとって|として|から|まで|より|への|へ|の)$/u.test(last.surface_form);
}

/** 末尾が言い切れるか */
/** @param {MorphToken} t */
function isClosedTail(t) {
  if (t.pos === "助詞" && ["終助詞", "副助詞", "間投助詞"].includes(t.pos_detail_1)) return true;
  if (t.pos === "助動詞") {
    const cf = t.conjugated_form ?? "";
    if (/基本形|終止形|連体形|命令形|仮定形/.test(cf)) return true;
  }
  if (t.pos === "動詞" && t.pos_detail_1 === "自立") {
    const cf = t.conjugated_form ?? "";
    if (/基本形|終止形|連体形|命令形|仮定形/.test(cf)) return true;
    if (cf === "未然形") return true;
  }
  if (t.pos === "名詞" || t.pos === "副詞" || t.pos === "形容詞" || t.pos === "感動詞") return true;
  if (t.pos === "記号" && /[！？。]/.test(t.surface_form)) return true;
  return false;
}

/** 未然形・語幹だけで終わる述語（少しも動か・少しも優し 等） */
/** @param {MorphToken[]} tokens */
function endsWithOpenPredicate(tokens) {
  const last = tokens[tokens.length - 1];
  if (!last) return false;
  const vcf = last.conjugated_form ?? "";
  if (last.pos === "動詞" && /^(未然形|連用形|連用タ接続)$/.test(vcf)) return true;
  if (last.pos === "形容詞") {
    const cf = last.conjugated_form ?? "";
    if (cf === "文語基本形" || cf === "連用テ接続") return true;
    if (/^(優し|怪し|惜し|近し|敏し)/.test(last.surface_form)) return true;
  }
  return false;
}

/** 促音だけで終わる未完了（ちぢみきっ） */
/** @param {MorphToken[]} tokens */
function endsWithSokuonTruncation(tokens) {
  const last = tokens[tokens.length - 1];
  if (!last) return false;
  const s = last.surface_form;
  if (!/っ$/.test(s)) return false;
  if (s === "よっぱらっ") return false;
  if (last.pos === "動詞" && (last.conjugated_form ?? "").includes("連用")) return true;
  if (last.pos === "形容詞" && /っ$/.test(s)) return true;
  return /っ$/.test(s);
}

/**
 * 形態素解析結果から語句として自然か。
 * @param {MorphToken[]} tokens
 * @param {{ phraseEnd?: boolean }} [options] phraseEnd=false は中間行用（やや緩い）
 */
export function isMorphologicallyNatural(tokens, options = {}) {
  if (!tokens?.length) return false;
  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const phraseEnd = options.phraseEnd !== false;

  if (isParticleLead(first) || isCaseParticle(first)) return false;
  if (first.pos === "助詞" && first.pos_detail_1 === "終助詞") return false;
  if (isAuxiliaryTailHead(first)) return false;

  if (hasMissingTeBetweenVerbs(tokens)) return false;
  if (endsWithOpenPredicate(tokens)) return false;
  if (endsWithSokuonTruncation(tokens)) return false;

  if (phraseEnd && isOpenEndedTail(last)) {
    if (!closesAsNounPhrase(tokens)) return false;
  }
  if (phraseEnd && !closesAsNounPhrase(tokens) && !isClosedTail(last)) {
    if (last.pos === "動詞" && last.pos_detail_1 === "非自立") return false;
    return false;
  }

  return true;
}

/**
 * 短歌5行の末尾・中間の形態素妥当性。
 * @param {MorphToken[][]} lineTokens 各行のトークン列（表示文で解析）
 */
export function isMorphologicallyNaturalTanka(lineTokens) {
  if (lineTokens.length !== 5) return false;
  for (let i = 0; i < lineTokens.length; i++) {
    const opts = { phraseEnd: i < 4 ? false : true };
    const natural = isMorphologicallyNatural(lineTokens[i], opts);
    if (!natural) return false;
    if (i < 4) {
      const last = lineTokens[i][lineTokens[i].length - 1];
      if (last && isOpenEndedTail(last)) return false;
    }
  }
  return true;
}