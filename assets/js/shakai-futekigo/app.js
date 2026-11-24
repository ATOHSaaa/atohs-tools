import { TYPES, QUESTIONS, QUIZ_META } from "./data.js";

const STORAGE_KEY = "atohs-shakai-futekigo-last";

/** @type {"intro"|"quiz"|"result"} */
let phase = "intro";
/** @type {number} */
let index = 0;
/** @type {Record<string, number>} */
let scores = Object.fromEntries(TYPES.map((t) => [t.id, 0]));

const $root = document.getElementById("quiz-app");

function emptyScores() {
  return Object.fromEntries(TYPES.map((t) => [t.id, 0]));
}

function typeById(id) {
  return TYPES.find((t) => t.id === id);
}

function rankedTypes() {
  return [...TYPES]
    .map((t) => ({ type: t, score: scores[t.id] ?? 0 }))
    .sort((a, b) => b.score - a.score);
}

function pickResult() {
  const ranked = rankedTypes();
  const top = ranked[0];
  const runner = ranked[1];
  const close =
    runner && top.score > 0 && runner.score >= top.score - 2 && runner.score !== top.score
      ? runner.type
      : null;
  return { primary: top.type, secondary: close, ranked };
}

function setPhase(next) {
  phase = next;
  render();
}

function saveResult(primaryId) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: primaryId, at: new Date().toISOString() })
    );
  } catch {
    /* private mode */
  }
}

function resetQuiz() {
  scores = emptyScores();
  index = 0;
  setPhase("intro");
}

function startQuiz() {
  sharedLinkView = false;
  scores = emptyScores();
  index = 0;
  setPhase("quiz");
}

function answer(choice) {
  for (const [typeId, weight] of Object.entries(choice.scores)) {
    scores[typeId] = (scores[typeId] ?? 0) + weight;
  }
  if (index < QUESTIONS.length - 1) {
    index += 1;
    render();
    return;
  }
  const { primary } = pickResult();
  saveResult(primary.id);
  setPhase("result");
  if (location.hash !== `#${primary.id}`) {
    history.replaceState(null, "", `#${primary.id}`);
  }
}

function shareText(primary, secondary) {
  const lines = [
    `【${QUIZ_META.title}】`,
    `結果: ${primary.name} — ${primary.tagline}`,
    secondary ? `サブ傾向: ${secondary.name}` : null,
    `${QUIZ_META.shareBaseUrl}#${primary.id}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function copyShare(primary, secondary) {
  const text = shareText(primary, secondary);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function renderIntro() {
  return `
    <div class="diag-panel">
      <h1 class="diag-title">${QUIZ_META.title}</h1>
      <p class="diag-lead">
        ${QUESTIONS.length}問・所要 ${Math.ceil(QUESTIONS.length * 0.4)}〜${Math.ceil(QUESTIONS.length * 0.6)} 分。
        答えは端末内だけで集計し、サーバーには送りません。
      </p>
      <p class="diag-note">${QUIZ_META.disclaimer}</p>
      <button type="button" class="button diag-primary" data-action="start">診断をはじめる</button>
    </div>
  `;
}

function renderQuiz() {
  const q = QUESTIONS[index];
  const progress = ((index + 1) / QUESTIONS.length) * 100;
  return `
    <div class="diag-panel">
      <div class="diag-progress" aria-hidden="true">
        <p class="diag-progress__label">質問 ${index + 1} / ${QUESTIONS.length}</p>
        <div class="diag-progress__track">
          <div class="diag-progress__bar" style="width:${progress.toFixed(1)}%"></div>
        </div>
      </div>
      <fieldset class="diag-question">
        <legend class="diag-question__text">${q.text}</legend>
        <ul class="diag-choices">
          ${q.choices
            .map(
              (c) => `
            <li>
              <button type="button" class="diag-choice" data-choice="${c.id}">
                <span class="diag-choice__label">${c.label}</span>
              </button>
            </li>`
            )
            .join("")}
        </ul>
      </fieldset>
      <button type="button" class="diag-text-btn" data-action="abort">トップに戻る（途中結果は破棄）</button>
    </div>
  `;
}

function renderResult() {
  const { primary, secondary, ranked } = pickResult();
  const sub = secondary;
  const bars = ranked
    .slice(0, 4)
    .map(({ type, score }) => {
      const max = ranked[0].score || 1;
      const pct = Math.round((score / max) * 100);
      return `
        <li class="diag-meter">
          <span class="diag-meter__name">${type.name}</span>
          <span class="diag-meter__track" aria-hidden="true"><span style="width:${pct}%"></span></span>
          <span class="diag-meter__score">${score}</span>
        </li>`;
    })
    .join("");

  return `
    <div class="diag-result">
      <h1 class="diag-result__name">${primary.name}</h1>
      <p class="diag-result__tagline">${primary.tagline}</p>
      ${sub ? `<p class="diag-result__sub">サブ傾向: <strong>${sub.name}</strong></p>` : ""}
      ${
        sharedLinkView
          ? `<p class="diag-note">共有リンクのタイプです。自分で診断するには「もう一度」を押してください。</p>`
          : ""
      }
      <p class="diag-result__summary">${primary.summary}</p>
      <p class="diag-result__detail">${primary.detail}</p>
      <section class="diag-block" aria-labelledby="traits-h">
        <h2 id="traits-h">よくある特徴</h2>
        <ul>${primary.traits.map((t) => `<li>${t}</li>`).join("")}</ul>
      </section>
      <section class="diag-block" aria-labelledby="tips-h">
        <h2 id="tips-h">生きやすくするヒント</h2>
        <ul>${primary.tips.map((t) => `<li>${t}</li>`).join("")}</ul>
      </section>
      ${
        sharedLinkView
          ? ""
          : `<section class="diag-block" aria-labelledby="meter-h">
        <h2 id="meter-h">スコア内訳（上位）</h2>
        <ul class="diag-meters">${bars}</ul>
      </section>`
      }
      <div class="diag-actions">
        <button type="button" class="button" data-action="copy">結果をコピー</button>
        <button type="button" class="button button--secondary" data-action="retry">もう一度</button>
        <a class="button button--ghost" href="/">ツール一覧へ</a>
      </div>
      <p class="diag-copy-status" id="copy-status" role="status" aria-live="polite"></p>
    </div>
  `;
}

function render() {
  if (!$root) return;
  let html = "";
  if (phase === "intro") html = renderIntro();
  else if (phase === "quiz") html = renderQuiz();
  else html = renderResult();
  $root.innerHTML = html;
  bindEvents();
}

function bindEvents() {
  const start = $root.querySelector('[data-action="start"]');
  start?.addEventListener("click", startQuiz);

  $root.querySelector('[data-action="abort"]')?.addEventListener("click", () => {
    location.href = "/";
  });

  $root.querySelector('[data-action="retry"]')?.addEventListener("click", () => {
    sharedLinkView = false;
    history.replaceState(null, "", location.pathname);
    startQuiz();
  });

  const copyBtn = $root.querySelector('[data-action="copy"]');
  copyBtn?.addEventListener("click", async () => {
    const { primary, secondary } = pickResult();
    const ok = await copyShare(primary, secondary);
    const status = document.getElementById("copy-status");
    if (status) {
      status.textContent = ok ? "コピーしました。" : "コピーに失敗しました。手動で選択してください。";
    }
  });

  for (const btn of $root.querySelectorAll("[data-choice]")) {
    btn.addEventListener("click", () => {
      const q = QUESTIONS[index];
      const id = /** @type {HTMLButtonElement} */ (btn).dataset.choice;
      const choice = q.choices.find((c) => c.id === id);
      if (choice) answer(choice);
    });
  }
}

/** @type {boolean} */
let sharedLinkView = false;

function tryHashBootstrap() {
  const hash = location.hash.replace(/^#/, "");
  if (!hash) return;
  const type = typeById(hash);
  if (!type) return;
  sharedLinkView = true;
  scores = emptyScores();
  scores[hash] = 1;
  phase = "result";
}

tryHashBootstrap();
render();