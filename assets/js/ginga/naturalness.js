/**
 * 語句・短歌としての「自然さ」ヒューリスティクス（ブラウザ／ビルド共通）。
 * 完全な文法解析ではなく、tweet 切り出し断片を除外する。
 */

import { countMora } from "./mora.js";

/** 短歌各行の拍数 */
export const TANKA_MORA_PATTERN = [5, 7, 5, 7, 7];

/** 先頭が助詞・接続（単独モーラ） */
const FRAGMENT_START =
  /^(?:[をが]|に(?:は|も|っ)|は(?:じめ|ずかし)|で(?:も|き|し|は)|と(?:き|ころ|て|いう)|て(?:も|き|は)|へ(?:ん|い|ど)|や(?:っ|む)|、|。|[「」｢｣]|\u2014|っ)/u;

/** のみ残った「の〜」続き（例: の練習だと） */
const FRAGMENT_NOMINAL =
  /^の(?!むき|そば|どおり|ように|ような|ほう|うえ|した|あと|まえ|なか|そこ|ここ|そら|とも|どけ|むこ)/u;

/** 連体形・形容詞語幹の続き（例: な気が、いない夜） */
const FRAGMENT_CONTINUATION =
  /^(?:な(?=きが|かだ|かも|かに|んて|んだ|んだけ|れた|がら)|い(?=いだ|たい|ない|なく|ざい|く|やす|ませ)|え(?=ない)|お(?=それ)|だ(?=けで|った|から)|く(?=て|なく)|し(?=て|た)|ち(?=ゃ)|て(?=い|お|き|る|は|も|もっ|くれ|ある|あげ)|で(?=も|き|し)|と(?=き|て|も)|っ(?=て|た|ち)|ま(?=た|だ)|も(?=う|し)|よ(?=う)|る(?=だけ))/u;

/** 動詞語尾＋助動詞だけが残った読み（例: られないなんて） */
const AUXILIARY_HEAD = /^(?:られ|され(?=て|る|ない|られ)|れ(?=ないなんて|なくなっ))/u;

/** 名詞の「〜さ」＋格助詞の続き（例: さに包まれた） */
const FRAGMENT_SA_NI = /^さに/u;

/** 日本・日曜など「に」が語頭の語（助詞ではない） */
const NI_AS_WORD =
  /^に(?:ち[ようさく]?|ほん|ん|げ|じ|せん|ゅう|ちょう|こう|ほう|しき|がて|たま|しち|ごろ|んじん|がく|っこ|じゃく|そう)/u;

/** 助動詞「た」＋名詞「気」など、前語と付くと壊れる切れ端（例: 丁寧＋た気） */
const FRAGMENT_TA_HEAD = /^た(?:き|がす|がる|と(?=き|ころ|し|っ)|っ?て)/u;

/** い形容詞語幹の直後に「た気」等が付いた誤結合 */
const BROKEN_I_TA_KI = /いたき/u;

/** 連体形を欠いた形容詞句の直後接続 */
const BROKEN_ADJ_CHAIN = /ていねい(?:そんな|た(?=[きが]))/u;

/** 辞書形動詞＋「ない」の誤結合（食べるない 等） */
const BROKEN_RU_NAI =
  /(?:[べめでぎびぴみりえきしちぬ]る|きる|ぎる|じる|する)ない(?![ぜんと]|んて)/u;

/** い形容詞が「く」なく「なる」に続く */
const BROKEN_I_NARU = /(?:ぬるい|あかい|あつい|くらい|うすい|おもい|つよい|よわい)なる/u;

/** 形容詞語幹「〜し」+ 名詞（悲しい＝悲し+い が欠ける） */
const BROKEN_SHI_STEM_NOUN =
  /(?:かなし|うれし|さびし|おもし|たのし|くやし|こわ|はげし)なか|かなしじめん|うれしな(?![いくせさ])|さびしな(?![いくせさ])/u;

/** 同語の直結スタッター */
const BROKEN_STUTTER = /しようしよう|みたい(?=みたい|だね|ひと)|いい(?=きれい|こん|かん|じょうじょ)/u;

/** 1首内で2回以上はノイズになりやすい語 */
const NOISY_REPEAT_WORDS = [
  "ぬるい",
  "あかい",
  "くろい",
  "しろい",
  "あつい",
  "さむい",
  "きいろ",
  "しよう",
  "みたい",
];

/** 終句にしてよい言い切り */
const PREDICATE_END =
  /(?:ない|たい|ます|です|だよ|だね|だな|んだ|のだ|てる|てた|ている|てない|ちゃう|だろう|でしょう|かな|よね|かも|らしい|る|た|だ|よ|ね|い|う|く)$/u;

/** 語幹・接続で切れている終端 */
const OPEN_PREDICATE_TAIL = /(?:なけれ|なくて|ないで|たり|れば|なら|て|で)$/u;

/** display として明らかな誤切り出し */
const BAD_DISPLAY = /^本日[一二三四五六七八九十\d五五]$|^書いあって$/u;

/** 助詞だけで終わる（次が続く前提） */
const INCOMPLETE_END = /[をがのにはでへと]$/u;

/** 接続形で終わる（中間行向けに短歌で弾く） */
const CONNECTIVE_END = /(?:くて|して|たり|ながら|ないと)$/u;

/** 述語・終助詞っぽく終わる（一句として読める） */
const CLOSED_END =
  /(?:[るたいむぶぬすくんよねかなわさづじぜだですますれるけめて]|[！？。])$/u;

/** @param {string} reading */
export function startsAsFragment(reading) {
  const r = String(reading);
  if (FRAGMENT_START.test(r)) return true;
  if (FRAGMENT_NOMINAL.test(r)) return true;
  if (/^たこと/u.test(r)) return true;
  if (FRAGMENT_CONTINUATION.test(r)) return true;
  if (AUXILIARY_HEAD.test(r)) return true;
  if (FRAGMENT_SA_NI.test(r)) return true;
  if (FRAGMENT_TA_HEAD.test(r)) return true;
  return false;
}

/** @param {string} reading */
export function endsIncomplete(reading) {
  return INCOMPLETE_END.test(String(reading));
}

/** @param {string} reading */
export function endsClosed(reading) {
  return CLOSED_END.test(String(reading));
}

/** @param {string} display @param {string} reading */
export function isNiParticleLead(display, reading) {
  const d = display.trim();
  const r = String(reading);
  if (!d.startsWith("に") && !r.startsWith("に")) return false;
  if (NI_AS_WORD.test(r)) return false;
  if (/^煮|^虹|^偽|^二/u.test(d)) return false;
  return d.startsWith("に") || r.startsWith("に");
}

/**
 * チャンク境界の誤接続（1行ぶんの読みを結合済みで検査）。
 * @param {string} reading
 */
export function hasBrokenChunkJoin(reading) {
  const r = String(reading);
  if (BROKEN_I_TA_KI.test(r)) return true;
  if (BROKEN_ADJ_CHAIN.test(r)) return true;
  if (BROKEN_RU_NAI.test(r)) return true;
  if (BROKEN_I_NARU.test(r)) return true;
  if (BROKEN_SHI_STEM_NOUN.test(r)) return true;
  if (BROKEN_STUTTER.test(r)) return true;
  return false;
}

/** @param {string} display */
function hasBrokenDisplayJoin(display) {
  const d = String(display);
  if (/食べるない|見るない|聞くない|話すない/u.test(d)) return true;
  if (/悲し(?=[中上照場気味]|$)/u.test(d)) return true;
  if (/ぬるいなる|あかいなる/u.test(d)) return true;
  if (/しようしよう/u.test(d)) return true;
  return false;
}

/** @param {{ text: string, reading: string }[]} lines */
function hasNoisyWordRepeat(lines) {
  const full = lines.map((l) => l.reading).join("");
  for (const w of NOISY_REPEAT_WORDS) {
    const n = (full.match(new RegExp(w, "g")) || []).length;
    if (n >= 2) return true;
  }
  return false;
}

/**
 * 1行に残る、結合・語幹切れの欠陥。
 * @param {string} display
 * @param {string} reading
 * @returns {string[]}
 */
export function lineDefects(display, reading) {
  const r = String(reading);
  const d = String(display).trim();
  /** @type {string[]} */
  const issues = [];
  if (/[0-9０-９A-Za-z@＠○]/.test(d) || /[0-9０-９A-Za-z@＠○]/.test(r)) issues.push("symbol");
  if (/るいい$|いいい$|しいい$|いいかい$/u.test(r)) issues.push("extra-i");
  if (/しょうじょいい|いいきれい/u.test(r)) issues.push("ii-glue");
  if (/な$/u.test(r) && !/(?:かな|だな|よな|なんだ|だな)$/u.test(r)) issues.push("dangling-na");
  if (/(?<![がはもにて])いる$/u.test(r) && !/ている$/u.test(r)) issues.push("bare-iru");
  if (/(?<!て)(?:くれ|とれ|やれ|みろ|しろ)$/u.test(r)) issues.push("bare-command");
  if (/(?:よわ|つよ|かなし|うれし|さびし|おもし|たのし)$/u.test(r)) issues.push("adj-stem");
  if (/(?:破壊|壊れ|消え|出せ|作れ)さ$/u.test(d) || /はかいさ$/u.test(r)) issues.push("verb-stem");
  if (/(?:よわ|つよ|めた)(?:あか|くろ|しろ|あお)/u.test(r)) issues.push("stem-color");
  if (
    /^(?:たんだ|たあま|たって|たみたい|たちの|する(?!ど)|ばとる|いるみたい|いるだけ|いると|だって|たんじゃ|ことだろう|あるという|そうになる|ままに|で(?!す|き|も|は|しょ|こ)|たり|なるだけ|ないと|たのだろう|たのは|ずに|てて|あって|そうやって|ぞい|ももう)/u.test(
      r,
    )
  ) {
    issues.push("cut-head");
  }
  if (/^[たをがにはての][\u4e00-\u9fff]/u.test(d)) issues.push("kana-kanji-cut");
  if (/(?:ではきょう|ではいま|ではここ|ほどそれ|ほどこれ|ほどあれ)$/u.test(r)) {
    issues.push("cutoff-tail");
  }
  if (/(?:しら|みら|こら|をつか|をいか|するよう)$/u.test(r)) issues.push("mizen-stem");
  if (/(?<!も)かしれない$/u.test(r)) issues.push("kamo-cut");
  if (/は(?:そこ|ここ|そう|こう)$|にへんか$/u.test(r)) issues.push("dangling-topic");
  if (/(?:をきみ|がぼく|がきみ|できみ)$/u.test(r)) issues.push("dangling-end");
  if (/^まるで(?:それ|これ|あれ)/u.test(r)) issues.push("dangling-end");
  if (
    /(?:はきみ|はだれ|はまだだれ|はあお|はあか|とけっこん|をせいかつ|をひてい|はあるしゅ|はぜったい|ってうそ)$/u.test(
      r,
    )
  ) {
    issues.push("dangling-end");
  }
  if (/[ァ-ヴ]ウ$/u.test(d) || /余命[一二三四五六七八九十]/u.test(d)) issues.push("cutoff-tail");
  if (/^沿い/u.test(d) || /[遅早熱愛]$/u.test(d)) issues.push("cutoff-tail");
  if (/^そんな[\u4e00-\u9fff]/u.test(d) || /^さが[\u4e00-\u9fff]/u.test(d) || /で[一二三四五六七八九十]$/u.test(d)) {
    issues.push("cutoff-tail");
  }
  if (/ほしく$/u.test(r) || /(?:とこい|はいし|をちがう)$/u.test(r)) issues.push("cutoff-tail");
  if (/^ための/u.test(r) || /にも(?:きみ|ぼく|わたし)$/u.test(r)) issues.push("cutoff-tail");
  if (/^いつのまにか./u.test(r)) issues.push("stray-tail");
  if (
    /(?:をあい|がどこ|がおそ|にいら|もあつ|がわたし|のたび|があか|がゆうかん|のささい|にけっして)$/u.test(
      r,
    )
  ) {
    issues.push("cutoff-tail");
  }
  return issues;
}

/** @param {string} reading */
export function isPredicateReading(reading) {
  const r = String(reading);
  if (OPEN_PREDICATE_TAIL.test(r)) return false;
  if (/(?:のした|ちたい|けいたい|じったい|ぐんたい|ぎょたい|あした)$/u.test(r)) return false;
  return PREDICATE_END.test(r);
}

/**
 * 形態素ロールが述部で、かつ言い切っている終句か。
 * @param {string} reading
 * @param {Record<string, string[]>} [roles]
 */
export function canCloseTanka(reading, roles = {}) {
  const list = roles[reading] ?? [];
  if (!list.includes("pred")) return false;
  return isPredicateReading(reading);
}

/**
 * 0–100。生成はこれを最大化する。
 * @param {{ text: string, reading: string }[]} lines
 */
export function scoreTanka(lines) {
  /** @type {string[]} */
  const issues = [];
  if (!lines || lines.length !== 5) return { score: 0, issues: ["length"] };
  if (!hasCorrectTankaMora(lines)) return { score: 0, issues: ["mora"] };

  let score = 100;
  const seen = new Set();
  for (const line of lines) {
    if (seen.has(line.reading)) {
      score -= 45;
      issues.push("dup-line");
    }
    seen.add(line.reading);
    const defects = lineDefects(line.text, line.reading);
    if (defects.length) {
      score -= 28 * defects.length;
      issues.push(...defects);
    }
    if (startsAsFragment(line.reading) || hasBrokenChunkJoin(line.reading)) {
      score -= 40;
      issues.push("broken");
    }
    if (/[0-9]/.test(line.text)) {
      score -= 10;
    }
  }

  if (!isPredicateReading(lines[4].reading)) {
    score -= 36;
    issues.push("weak-end");
  }

  const grammatical = lines.filter(
    (l) => /[がはをにで]/.test(l.reading) || isPredicateReading(l.reading),
  ).length;
  if (grammatical < 2) {
    score -= 24;
    issues.push("word-list");
  } else if (grammatical >= 4) {
    score += 6;
  }

  const full = lines.map((l) => l.reading).join("");
  const grams = new Set();
  let repeatHits = 0;
  for (let i = 0; i + 4 <= full.length; i++) {
    const g = full.slice(i, i + 4);
    if (grams.has(g)) continue;
    grams.add(g);
    let n = 0;
    let pos = 0;
    while ((pos = full.indexOf(g, pos)) !== -1) {
      n += 1;
      pos += 4;
    }
    if (n >= 2) repeatHits += 1;
  }
  if (repeatHits) {
    score -= Math.min(32, repeatHits * 8);
    issues.push("repeat");
  }
  if (hasKanjiNounGlue(lines)) {
    score -= 40;
    issues.push("kanji-glue");
  }
  if (hasNoisyWordRepeat(lines)) {
    score -= 20;
    issues.push("noisy");
  }
  if (hasRepeatedNoNaka(lines)) {
    score -= 16;
    issues.push("no-naka");
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

/** @param {{ text: string, reading: string }[]} lines */
export function hasCorrectTankaMora(lines) {
  if (lines.length !== TANKA_MORA_PATTERN.length) return false;
  return lines.every((line, i) => countMora(line.reading) === TANKA_MORA_PATTERN[i]);
}

/**
 * 連結前の2語句が許容できるか。
 * @param {string} prevReading
 * @param {string} nextReading
 */
export function isSegmentJoinOk(prevReading, nextReading) {
  if (!prevReading || !nextReading) return true;
  return !hasBrokenChunkJoin(prevReading + nextReading);
}

/** 目的語なしの「探す」単独（行末） */
function hasBareSagasuLine(reading) {
  const r = String(reading);
  if (!/さがす/u.test(r)) return false;
  if (/^(?:を|が).*さがす/u.test(r) || /(?:を|ため|ほう|もの).{0,12}さがす$/u.test(r)) {
    return false;
  }
  if (/さがすなら|さがすために|それでもさがす/u.test(r)) return false;
  return /さがす$/u.test(r);
}

/**
 * 一行表示で、前の句末の漢字と次の句頭の漢字二字以上がひとつの熟語に見える。
 * 例: 寡黙な隣 + 論理から → 隣論理
 * 述語で始まる句（見失ってね）や、漢字一字＋送り仮名（美しい）は対象にしない。
 * @param {{ text: string, reading: string }[]} lines
 */
function hasKanjiNounGlue(lines) {
  for (let i = 0; i < lines.length - 1; i++) {
    const prev = lines[i].text;
    const next = lines[i + 1];
    const end = [...prev].at(-1) ?? "";
    if (!/[\u4e00-\u9fff]/u.test(end)) continue;
    if (!/^[\u4e00-\u9fff]{2}/u.test(next.text)) continue;
    if (isPredicateReading(next.reading)) continue;
    return true;
  }
  return false;
}

/** 全文で「の中」が2回以上（比喩の重ねすぎ） */
function hasRepeatedNoNaka(lines) {
  const full = lines.map((l) => l.reading).join("");
  let count = 0;
  let pos = 0;
  while ((pos = full.indexOf("のなか", pos)) !== -1) {
    count += 1;
    pos += 4;
  }
  return count >= 2;
}

/** @param {string} display @param {string} reading */
function hasMissingTeForm(reading, display) {
  const r = String(reading);
  const d = display.trim();
  if (r === "かいあって" || d === "書いあって") return true;
  return /^[かきぎしちにひびみり]いあっ/.test(r);
}

/** 促音止まりの未完了（例: ちぢみきっ） */
function endsWithTruncatedGeminate(reading) {
  const r = String(reading);
  if (!/っ$/u.test(r)) return false;
  if (r === "よっぱらっ") return false;
  return true;
}

/** @param {string} display */
export function hasBalancedCornerQuotes(display) {
  const count = (s, ch) => [...s].filter((c) => c === ch).length;
  return (
    count(display, "「") === count(display, "」") &&
    count(display, "｢") === count(display, "｣")
  );
}

/** @param {string} display @param {string} reading */
export function isClauseFragment(display, reading) {
  return /^たこと/u.test(display) || /^たこと/u.test(reading);
}

/**
 * プールに載せてよい語句か。
 * @param {string} display
 * @param {string} reading
 */
export function isNaturalPhrase(display, reading) {
  const d = display.trim();
  const r = String(reading);
  if (!d || !r) return false;
  if (/^@[\w]+$/u.test(r) || /^@[\w]+$/u.test(d)) return false;
  if (/^[、。，．！？\s]/.test(d)) return false;
  if (!hasBalancedCornerQuotes(d)) return false;
  if (isClauseFragment(d, r)) return false;
  if (BAD_DISPLAY.test(d)) return false;
  if (isNiParticleLead(d, r)) return false;
  if (hasMissingTeForm(r, d)) return false;
  if (endsWithTruncatedGeminate(r)) return false;
  if (startsAsFragment(r) || startsAsFragment(d)) return false;
  if (endsIncomplete(r)) return false;
  if (hasBrokenChunkJoin(r) || hasBrokenDisplayJoin(d)) return false;
  return true;
}

/** 一方の読みがもう一方にほぼ含まれる（包まれた／さに包まれた など） */
function hasRedundantOverlap(lines) {
  const readings = lines.map((l) => l.reading);
  for (let i = 0; i < readings.length; i++) {
    for (let j = i + 1; j < readings.length; j++) {
      const [a, b] = [readings[i], readings[j]];
      const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
      if (shorter.length >= 4 && longer.includes(shorter) && shorter !== longer) {
        return true;
      }
    }
  }
  return false;
}

/** どれか二行以上で読みが3文字以上重なる（連想の最低限） */
function hasLexicalEcho(lines) {
  const readings = lines.map((l) => l.reading);
  for (let i = 0; i < readings.length; i++) {
    for (let j = i + 1; j < readings.length; j++) {
      const a = readings[i];
      const b = readings[j];
      for (let len = 3; len <= 5; len++) {
        for (let k = 0; k + len <= a.length; k++) {
          const sub = a.slice(k, k + len);
          if (b.includes(sub)) return true;
        }
      }
    }
  }
  return false;
}

/**
 * @param {{ text: string, reading: string }[]} lines
 * @param {{ requireEcho?: boolean }} [options]
 */
export function isNaturalTanka(lines, options = {}) {
  const requireEcho = options.requireEcho === true;
  if (lines.length !== 5) return false;
  if (!hasCorrectTankaMora(lines)) return false;
  for (const { reading, text } of lines) {
    if (!isNaturalPhrase(text, reading)) return false;
    if (hasBrokenDisplayJoin(text)) return false;
  }
  const first = lines[0].reading;
  if (startsAsFragment(first)) return false;
  const last = lines[lines.length - 1];
  if (endsIncomplete(last.reading)) return false;
  if (!endsClosed(last.reading) && !/[よねかなわ]$/.test(last.reading)) return false;
  const fragmentish = lines.filter(({ reading }) => FRAGMENT_NOMINAL.test(reading)).length;
  if (fragmentish > 0) return false;
  const midOpen = lines
    .slice(0, 4)
    .filter(({ reading }) => CONNECTIVE_END.test(reading) || endsIncomplete(reading)).length;
  if (midOpen > 0) return false;
  if (hasRedundantOverlap(lines)) return false;
  if (requireEcho && !hasLexicalEcho(lines)) return false;
  for (const { reading } of lines) {
    if (hasBrokenChunkJoin(reading)) return false;
    if (hasBareSagasuLine(reading)) return false;
  }
  if (hasRepeatedNoNaka(lines)) return false;
  if (hasNoisyWordRepeat(lines)) return false;
  if (lines.some((l) => lineDefects(l.text, l.reading).length > 0)) return false;
  if (!isPredicateReading(lines[lines.length - 1].reading)) return false;
  return scoreTanka(lines).score >= 70;
}

/**
 * @param {string[]} readings5
 * @param {string[]} readings7
 * @param {Record<string, string>} kanji
 */
export function filterNaturalPool(readings5, readings7, kanji) {
  const keep5 = readings5.filter((r) => isNaturalPhrase(kanji[r] ?? r, r));
  const keep7 = readings7.filter((r) => isNaturalPhrase(kanji[r] ?? r, r));
  return { readings5: keep5, readings7: keep7 };
}