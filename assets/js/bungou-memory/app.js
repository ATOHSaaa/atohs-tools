import { AUTHORS, DIFFICULTIES } from "./data.js";

const SESSION_KEY = "atohs-bungo-memory-session";
const SESSION_VERSION = 2;
const FLIP_BACK_MS = 780;
const PLAYER_COUNTS = [1, 2, 3, 4];

const $root = document.getElementById("bungo-app");
const $main = document.getElementById("main");

/** @type {"intro"|"play"} */
let phase = "intro";
let difficulty = "normal";
/** @type {ReturnType<typeof buildDeck>} */
let cards = [];
/** @type {string[]} */
let openIds = [];
let locked = false;
let moves = 0;
let matchedCount = 0;
let startedAt = 0;
let elapsedMs = 0;
let timerId = 0;
let saveSessionTimer = 0;
let playerCount = 1;
let currentPlayer = 0;
/** @type {number[]} */
let scores = [0];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function shuffle(list) {
  const next = [...list];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pairsFor(diffId) {
  return DIFFICULTIES.find((item) => item.id === diffId)?.pairs ?? 8;
}

function selectedAuthors(diffId) {
  return AUTHORS.slice(0, pairsFor(diffId));
}

function buildDeck(diffId) {
  return shuffle(
    selectedAuthors(diffId).flatMap((author) => [
      {
        uid: `${author.id}-person`,
        pairId: author.id,
        kind: "person",
        name: author.name,
        work: author.work,
        image: author.image,
        objectPosition: author.objectPosition ?? "50% 15%",
        flipped: false,
        matched: false,
      },
      {
        uid: `${author.id}-work`,
        pairId: author.id,
        kind: "work",
        name: author.name,
        work: author.work,
        image: author.image,
        objectPosition: author.objectPosition ?? "50% 15%",
        flipped: false,
        matched: false,
      },
    ])
  );
}

function preload(authors) {
  for (const author of authors) {
    const img = new Image();
    img.decoding = "async";
    img.src = author.image;
  }
}

function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function authorForCardUid(uid) {
  return AUTHORS.find((author) => uid === `${author.id}-person` || uid === `${author.id}-work`);
}

function cardFromSnapshot(entry) {
  const author = authorForCardUid(entry.uid);
  if (!author) return null;
  const kind = entry.uid.endsWith("-person") ? "person" : "work";
  return {
    uid: entry.uid,
    pairId: author.id,
    kind,
    name: author.name,
    work: author.work,
    image: author.image,
    objectPosition: author.objectPosition ?? "50% 15%",
    flipped: Boolean(entry.flipped),
    matched: Boolean(entry.matched),
  };
}

function scheduleSaveSession() {
  clearTimeout(saveSessionTimer);
  saveSessionTimer = window.setTimeout(saveSession, 100);
}

function clearStoredSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
}

function isPlayComplete() {
  return phase === "play" && matchedCount >= pairTotal();
}

function saveSession() {
  if (isPlayComplete()) {
    clearStoredSession();
    return;
  }
  try {
    const payload = {
      v: SESSION_VERSION,
      phase,
      difficulty,
      moves,
      matchedCount,
      elapsedMs: phase === "play" ? currentElapsed() : 0,
      cards:
        phase === "play"
          ? cards.map((card) => ({
              uid: card.uid,
              flipped: card.flipped,
              matched: card.matched,
            }))
          : [],
      openIds: locked ? [] : openIds.filter((uid) => {
        const card = cardByUid(uid);
        return card && card.flipped && !card.matched;
      }),
      playerCount,
      currentPlayer,
      scores: scores.slice(0, playerCount),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data?.v !== SESSION_VERSION && data?.v !== 1) return false;

    const nextDifficulty = DIFFICULTIES.some((item) => item.id === data.difficulty)
      ? data.difficulty
      : "normal";
    difficulty = nextDifficulty;

    const nextPlayerCount = PLAYER_COUNTS.includes(data.playerCount) ? data.playerCount : 1;
    playerCount = nextPlayerCount;

    if (data.phase !== "play") {
      phase = "intro";
      cards = [];
      openIds = [];
      locked = false;
      moves = 0;
      matchedCount = 0;
      startedAt = 0;
      elapsedMs = 0;
      resetScores();
      return true;
    }

    const pairGoal = pairsFor(nextDifficulty);
    if (data.completed || (Number.isFinite(data.matchedCount) && data.matchedCount >= pairGoal)) {
      clearStoredSession();
      phase = "intro";
      cards = [];
      openIds = [];
      locked = false;
      moves = 0;
      matchedCount = 0;
      startedAt = 0;
      elapsedMs = 0;
      resetScores();
      return true;
    }

    const expected = pairsFor(difficulty) * 2;
    if (!Array.isArray(data.cards) || data.cards.length !== expected) return false;

    const restored = data.cards.map(cardFromSnapshot).filter(Boolean);
    if (restored.length !== expected) return false;

    phase = "play";
    cards = restored;
    moves = Number.isFinite(data.moves) ? data.moves : 0;
    matchedCount = Number.isFinite(data.matchedCount) ? data.matchedCount : 0;
    elapsedMs = Number.isFinite(data.elapsedMs) ? data.elapsedMs : 0;
    openIds = (data.openIds ?? []).filter((uid) => {
      const card = restored.find((item) => item.uid === uid);
      return card && card.flipped && !card.matched;
    });
    locked = false;
    startedAt = 0;
    if (data.v >= 2 && Array.isArray(data.scores)) {
      scores = data.scores
        .slice(0, playerCount)
        .map((value) => (Number.isFinite(value) ? value : 0));
      while (scores.length < playerCount) scores.push(0);
      currentPlayer =
        Number.isFinite(data.currentPlayer) && data.currentPlayer >= 0
          ? data.currentPlayer % playerCount
          : 0;
    } else {
      currentPlayer = 0;
      scores = Array.from({ length: playerCount }, () => 0);
    }
    return true;
  } catch {
    return false;
  }
}

function resumePlayTimer() {
  if (phase !== "play" || matchedCount >= pairTotal() || elapsedMs <= 0) return;
  startedAt = Date.now() - elapsedMs;
  stopTimer();
  timerId = setInterval(() => {
    elapsedMs = Date.now() - startedAt;
    updateStats();
  }, 250);
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = 0;
  }
}

function startTimer() {
  if (timerId || startedAt) return;
  startedAt = Date.now();
  timerId = setInterval(() => {
    elapsedMs = Date.now() - startedAt;
    updateStats();
  }, 250);
}

function finishTimer() {
  if (startedAt) elapsedMs = Date.now() - startedAt;
  stopTimer();
}

function cardByUid(uid) {
  return cards.find((card) => card.uid === uid);
}

function pairTotal() {
  return pairsFor(difficulty);
}

function resetScores() {
  scores = Array.from({ length: playerCount }, () => 0);
  currentPlayer = 0;
}

function playerChipHtml(index) {
  const active = index === currentPlayer;
  return `
    <span
      class="bungo-player${active ? " is-active" : ""}"
      data-player="${index}"
      ${active ? 'aria-current="step"' : ""}
    >
      <span class="bungo-player__name">
        P${index + 1}
        <span class="bungo-player__turn">の番</span>
      </span>
      <span class="bungo-player__score">${scores[index] ?? 0}</span>
    </span>
  `;
}

function playersBarHtml() {
  if (playerCount <= 1) return "";
  return `
    <div class="bungo-players" data-bungo-players role="status" aria-live="polite">
      ${Array.from({ length: playerCount }, (_, index) => playerChipHtml(index)).join("")}
    </div>
  `;
}

function updatePlayersUI() {
  const strip = $root.querySelector("[data-bungo-players]");
  if (!strip) return;
  strip.setAttribute("aria-label", `P${currentPlayer + 1}の番`);
  strip.querySelectorAll("[data-player]").forEach((el) => {
    const index = Number(el.dataset.player);
    if (!Number.isFinite(index)) return;
    const active = index === currentPlayer;
    el.classList.toggle("is-active", active);
    if (active) el.setAttribute("aria-current", "step");
    else el.removeAttribute("aria-current");
    const scoreEl = el.querySelector(".bungo-player__score");
    if (scoreEl) scoreEl.textContent = String(scores[index] ?? 0);
  });
}

function playerCountLabel(count) {
  return `${count}人`;
}

function playerCountPickerHtml() {
  const options = PLAYER_COUNTS.map((count) => {
    const selected = count === playerCount;
    return `
      <button
        type="button"
        class="bungo-picker__option${selected ? " is-selected" : ""}"
        role="option"
        aria-selected="${selected ? "true" : "false"}"
        data-value="${count}"
      >
        <span class="bungo-picker__mark" aria-hidden="true">
          <svg class="bungo-picker__check" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path
              d="M2.75 7.5 6 10.75 12.25 4.25"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="bungo-picker__option-label">${playerCountLabel(count)}</span>
      </button>
    `;
  }).join("");

  return `
    <div class="bungo-picker" data-bungo-picker="players">
      <div class="bungo-picker__control">
        <button
          type="button"
          id="bungo-player-count"
          class="bungo-picker__trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-controls="bungo-player-count-list"
          aria-labelledby="bungo-player-count-label bungo-player-count-value"
        >
          <span id="bungo-player-count-value" class="bungo-picker__value" data-bungo-player-count-value>${escapeHtml(
            playerCountLabel(playerCount)
          )}</span>
          <span class="bungo-picker__chevron" aria-hidden="true"></span>
        </button>
        <div
          id="bungo-player-count-list"
          class="bungo-picker__popover"
          role="listbox"
          aria-labelledby="bungo-player-count-label"
          hidden
        >
          ${options}
        </div>
      </div>
    </div>
  `;
}

function closeBungoPicker(picker) {
  if (!picker) return;
  const trigger = picker.querySelector(".bungo-picker__trigger");
  const popover = picker.querySelector(".bungo-picker__popover");
  picker.classList.remove("is-open");
  trigger?.setAttribute("aria-expanded", "false");
  if (popover) popover.hidden = true;
}

function openBungoPicker(picker) {
  if (!picker) return;
  $root?.querySelectorAll(".bungo-picker.is-open").forEach((openPicker) => {
    if (openPicker !== picker) closeBungoPicker(openPicker);
  });
  const trigger = picker.querySelector(".bungo-picker__trigger");
  const popover = picker.querySelector(".bungo-picker__popover");
  picker.classList.add("is-open");
  trigger?.setAttribute("aria-expanded", "true");
  if (popover) popover.hidden = false;
}

function syncPlayerCountPicker(picker) {
  if (!picker) return;
  const valueEl = picker.querySelector("[data-bungo-player-count-value]");
  if (valueEl) valueEl.textContent = playerCountLabel(playerCount);
  picker.querySelectorAll(".bungo-picker__option").forEach((option) => {
    const count = Number(option.dataset.value);
    const selected = count === playerCount;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function bindPlayerCountPicker() {
  const picker = $root.querySelector('[data-bungo-picker="players"]');
  if (!picker) return;
  const trigger = picker.querySelector(".bungo-picker__trigger");

  trigger?.addEventListener("click", () => {
    if (picker.classList.contains("is-open")) closeBungoPicker(picker);
    else openBungoPicker(picker);
  });

  trigger?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBungoPicker(picker);
      picker.querySelector(".bungo-picker__option.is-selected")?.focus();
    }
  });

  picker.querySelectorAll(".bungo-picker__option").forEach((option) => {
    option.addEventListener("click", () => {
      const next = Number(option.dataset.value);
      if (!PLAYER_COUNTS.includes(next)) return;
      playerCount = next;
      syncPlayerCountPicker(picker);
      closeBungoPicker(picker);
      trigger?.focus();
      scheduleSaveSession();
    });

    option.addEventListener("keydown", (event) => {
      const items = [...picker.querySelectorAll(".bungo-picker__option")];
      const index = items.indexOf(option);
      if (event.key === "Escape") {
        event.preventDefault();
        closeBungoPicker(picker);
        trigger?.focus();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[Math.min(index + 1, items.length - 1)]?.focus();
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        items[Math.max(index - 1, 0)]?.focus();
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        option.click();
      }
    });
  });
}

function ensureBungoPickerDismiss() {
  if (window.__bungoPickerDismiss) return;
  window.__bungoPickerDismiss = true;
  document.addEventListener("pointerdown", (event) => {
    $root?.querySelectorAll(".bungo-picker.is-open").forEach((picker) => {
      if (!picker.contains(event.target)) closeBungoPicker(picker);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    $root?.querySelectorAll(".bungo-picker.is-open").forEach(closeBungoPicker);
  });
}

function introHtml() {
  const radios = DIFFICULTIES.map((item) => {
    return `
      <label class="bungo-diff__option">
        <input type="radio" name="bungo-diff" value="${item.id}" ${
          item.id === difficulty ? "checked" : ""
        } />
        <span class="bungo-diff__card">
          <span class="bungo-diff__label">${escapeHtml(item.label)}</span>
          <span class="bungo-diff__hint">${escapeHtml(item.hint)}</span>
        </span>
      </label>
    `;
  }).join("");

  return `
    <div class="bungo-intro">
      <p class="bungo-intro__field">
        <span class="bungo-intro__label" id="bungo-player-count-label">人数</span>
        ${playerCountPickerHtml()}
      </p>
      <fieldset class="bungo-diff">
        <legend class="bungo-fieldset-legend">難易度</legend>
        ${radios}
      </fieldset>
      <p class="bungo-intro__actions">
        <button type="button" class="button" data-bungo-start>はじめる</button>
      </p>
    </div>
  `;
}

function playShellHtml() {
  return `
    <div class="bungo-play">
      <div class="bungo-toolbar">
        <p class="bungo-stats" aria-live="polite">
          <span data-bungo-stat="moves"></span>
          <span class="bungo-stats__sep" aria-hidden="true">/</span>
          <span data-bungo-stat="time"></span>
          <span class="bungo-stats__sep" aria-hidden="true">/</span>
          <span data-bungo-stat="pairs"></span>
        </p>
        <div class="bungo-toolbar__actions">
          <button type="button" class="button button--ghost bungo-toolbar__btn" data-bungo-quit>やめる</button>
          <button type="button" class="button button--ghost bungo-toolbar__btn" data-bungo-restart>やり直す</button>
        </div>
      </div>
      ${playersBarHtml()}
      <div class="bungo-board" data-pairs="${pairTotal()}" role="group" aria-label="カード"></div>
    </div>
    <dialog class="bungo-win bungo-win--result" data-bungo-dialog="win" aria-labelledby="bungo-win-title">
      <div class="bungo-win__inner"></div>
    </dialog>
    <dialog class="bungo-win bungo-win--confirm" data-bungo-dialog="restart" aria-labelledby="bungo-restart-title">
      <h2 id="bungo-restart-title" class="bungo-win__title">やり直しますか？</h2>
      <p class="bungo-dialog__lead">進行中の手数と時間はリセットされます。</p>
      <p class="bungo-win__actions">
        <button type="button" class="button" data-bungo-restart-confirm>やり直す</button>
        <button type="button" class="button button--secondary" data-bungo-restart-cancel>続ける</button>
      </p>
    </dialog>
    <dialog class="bungo-win bungo-win--confirm" data-bungo-dialog="quit" aria-labelledby="bungo-quit-title">
      <h2 id="bungo-quit-title" class="bungo-win__title">やめますか？</h2>
      <p class="bungo-dialog__lead">
        難易度の画面に戻ります。<br />
        進行中のプレイは中断されます。
      </p>
      <p class="bungo-win__actions">
        <button type="button" class="button" data-bungo-quit-confirm>やめる</button>
        <button type="button" class="button button--secondary" data-bungo-quit-cancel>続ける</button>
      </p>
    </dialog>
  `;
}

function cardFaceHtml(card) {
  if (card.kind === "person") {
    return `
      <span class="bungo-card__person">
        <img
          class="bungo-card__photo"
          src="${escapeHtml(card.image)}"
          alt=""
          width="360"
          height="480"
          decoding="async"
          style="object-position: ${escapeHtml(card.objectPosition)}"
        />
        <span class="bungo-card__person-name">${escapeHtml(card.name)}</span>
      </span>
    `;
  }
  return `
    <span class="bungo-card__work">
      <span class="bungo-card__work-title">${escapeHtml(card.work)}</span>
    </span>
  `;
}

function cardLabel(card) {
  if (!card.flipped && !card.matched) return "伏せられたカード";
  if (card.kind === "person") return card.name;
  return card.work;
}

function cardHtml(card) {
  const shown = card.flipped || card.matched;
  const classes = ["bungo-card"];
  if (shown) classes.push("is-flipped");
  if (card.matched) classes.push("is-matched");
  return `
    <button
      type="button"
      class="${classes.join(" ")}"
      data-uid="${escapeHtml(card.uid)}"
      aria-label="${escapeHtml(cardLabel(card))}"
      aria-pressed="${shown ? "true" : "false"}"
    >
      <span class="bungo-card__inner">
        <span class="bungo-card__face bungo-card__face--back" aria-hidden="true"></span>
        <span class="bungo-card__face bungo-card__face--front">
          ${cardFaceHtml(card)}
        </span>
      </span>
    </button>
  `;
}

function winHtml() {
  const recap = selectedAuthors(difficulty)
    .map((author) => {
      return `
        <li>
          <img src="${escapeHtml(author.image)}" alt="" width="48" height="48" />
          <p>
            <strong>${escapeHtml(author.name)}</strong>
            <span>${escapeHtml(author.work)}</span>
          </p>
        </li>
      `;
    })
    .join("");
  const diffLabel = DIFFICULTIES.find((item) => item.id === difficulty)?.label ?? "";

  if (playerCount > 1) {
    const ranked = scores
      .map((score, index) => ({ index, score }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const top = ranked[0]?.score ?? 0;
    const winners = ranked.filter((item) => item.score === top);
    const title =
      winners.length > 1
        ? "引き分け"
        : `プレイヤー${winners[0].index + 1}の勝ち`;
    const standings = ranked
      .map((item) => {
        const crown = item.score === top ? " ★" : "";
        return `<li><strong>P${item.index + 1}</strong><span>${item.score}点${crown}</span></li>`;
      })
      .join("");

    return `
      <h2 id="bungo-win-title" class="bungo-win__title">${escapeHtml(title)}</h2>
      <p class="bungo-win__score">
        ${escapeHtml(diffLabel)} · ${moves}手 · ${formatTime(elapsedMs)}
      </p>
      <ol class="bungo-standings">${standings}</ol>
      <ul class="bungo-recap">${recap}</ul>
      <p class="bungo-win__actions">
        <button type="button" class="button" data-bungo-again>もう一度</button>
        <button type="button" class="button button--secondary" data-bungo-home>人数・難易度を変える</button>
      </p>
    `;
  }

  return `
    <h2 id="bungo-win-title" class="bungo-win__title">揃いました</h2>
    <p class="bungo-win__score">
      ${escapeHtml(diffLabel)} · ${moves}手 · ${formatTime(elapsedMs)}
    </p>
    <ul class="bungo-recap">${recap}</ul>
    <p class="bungo-win__actions">
      <button type="button" class="button" data-bungo-again>もう一度</button>
      <button type="button" class="button button--secondary" data-bungo-home>難易度を変える</button>
    </p>
  `;
}

function currentElapsed() {
  if (timerId && startedAt) return Date.now() - startedAt;
  return elapsedMs;
}

function updateStats() {
  const movesEl = $root.querySelector('[data-bungo-stat="moves"]');
  const timeEl = $root.querySelector('[data-bungo-stat="time"]');
  const pairsEl = $root.querySelector('[data-bungo-stat="pairs"]');
  if (!movesEl || !timeEl || !pairsEl) return;
  movesEl.textContent = `${moves}手`;
  timeEl.textContent = formatTime(currentElapsed());
  pairsEl.textContent = `${matchedCount}/${pairTotal()}組`;
  updatePlayersUI();
}

function syncCardButton(card) {
  const button = $root.querySelector(`[data-uid="${card.uid}"]`);
  if (!button) return;
  const shown = card.flipped || card.matched;
  button.classList.toggle("is-flipped", shown);
  button.classList.toggle("is-matched", card.matched);
  button.setAttribute("aria-pressed", shown ? "true" : "false");
  button.setAttribute("aria-label", cardLabel(card));
}

function celebrateMatch(...matched) {
  for (const card of matched) {
    const button = $root.querySelector(`[data-uid="${card.uid}"]`);
    if (!button) continue;
    button.classList.remove("is-pair-hit");
    void button.offsetWidth;
    button.classList.add("is-pair-hit");
  }
  window.setTimeout(() => {
    for (const card of matched) {
      $root.querySelector(`[data-uid="${card.uid}"]`)?.classList.remove("is-pair-hit");
    }
  }, 1620);
}

function boardColumns() {
  if (pairTotal() === 12 && window.matchMedia("(width >= 900px)").matches) return 6;
  return 4;
}

function setPlayChrome(active) {
  $main?.classList.toggle("is-bungo-playing", active);
}

function layoutBungoBoard() {
  if (phase !== "play") return;
  const board = $root.querySelector(".bungo-board");
  if (!board) return;

  const cols = boardColumns();
  const rows = Math.ceil(cards.length / cols);
  const gap = parseFloat(getComputedStyle(board).gap) || 8;
  const viewportH = window.visualViewport?.height ?? window.innerHeight;
  const top = board.getBoundingClientRect().top;
  const buffer = 12;
  const available = Math.max(0, viewportH - top - buffer);
  const rowGaps = Math.max(0, rows - 1) * gap;
  const colGaps = Math.max(0, cols - 1) * gap;
  const boardWidth = board.clientWidth;
  const heightPerWidth = 4 / 3;

  let cardWidth = (boardWidth - colGaps) / cols;
  let cardHeight = cardWidth * heightPerWidth;

  if (rows * cardHeight + rowGaps > available) {
    cardHeight = Math.max(0, available - rowGaps) / rows;
    cardWidth = cardHeight / heightPerWidth;
  }

  if (cols * cardWidth + colGaps > boardWidth) {
    cardWidth = (boardWidth - colGaps) / cols;
    cardHeight = cardWidth * heightPerWidth;
    if (rows * cardHeight + rowGaps > available) {
      cardHeight = Math.max(0, available - rowGaps) / rows;
      cardWidth = cardHeight / heightPerWidth;
    }
  }

  cardWidth = Math.max(40, Math.floor(cardWidth));
  cardHeight = Math.max(54, Math.floor(cardHeight));

  board.classList.add("bungo-board--fit");
  board.style.setProperty("--bungo-rows", String(rows));
  board.style.setProperty("--bungo-cols", String(cols));
  board.style.setProperty("--bungo-card-width", `${cardWidth}px`);
  board.style.setProperty("--bungo-card-height", `${cardHeight}px`);

  const win = $root.querySelector('[data-bungo-dialog="win"]');
  const restart = $root.querySelector('[data-bungo-dialog="restart"]');
  const quit = $root.querySelector('[data-bungo-dialog="quit"]');
  if (win?.open) alignBungoDialog(win);
  if (restart?.open) alignBungoDialog(restart);
  if (quit?.open) alignBungoDialog(quit);
}

function scheduleBoardLayout() {
  if (phase !== "play") return;
  requestAnimationFrame(() => {
    requestAnimationFrame(layoutBungoBoard);
  });
}

function alignBungoDialog(dialog) {
  const board = $root.querySelector(".bungo-board");
  if (!dialog || !board) return;
  const rect = board.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const isConfirm = dialog.classList.contains("bungo-win--confirm");
  if (isConfirm) {
    const top = Math.max(12, rect.top);
    dialog.style.setProperty("--bungo-dialog-top", `${top}px`);
    dialog.style.setProperty("--bungo-dialog-left", `${centerX}px`);
    dialog.style.removeProperty("--bungo-dialog-width");
    return;
  }
  const top = Math.max(12, rect.top);
  dialog.style.setProperty("--bungo-dialog-top", `${top}px`);
  dialog.style.setProperty("--bungo-dialog-left", `${centerX}px`);
  dialog.style.setProperty("--bungo-dialog-width", `${rect.width}px`);
}

function openWin() {
  const dialog = $root.querySelector('[data-bungo-dialog="win"]');
  const inner = $root.querySelector(".bungo-win__inner");
  if (!dialog || !inner) return;
  inner.innerHTML = winHtml();
  if (typeof dialog.showModal === "function" && !dialog.open) {
    dialog.showModal();
    alignBungoDialog(dialog);
  }
}

function closeWin() {
  const dialog = $root.querySelector('[data-bungo-dialog="win"]');
  if (dialog?.open) dialog.close();
}

function openRestartConfirm() {
  closeQuitConfirm();
  const dialog = $root.querySelector('[data-bungo-dialog="restart"]');
  if (!dialog?.showModal || dialog.open) return;
  dialog.showModal();
  alignBungoDialog(dialog);
}

function closeRestartConfirm() {
  const dialog = $root.querySelector('[data-bungo-dialog="restart"]');
  if (dialog?.open) dialog.close();
}

function openQuitConfirm() {
  closeRestartConfirm();
  const dialog = $root.querySelector('[data-bungo-dialog="quit"]');
  if (!dialog?.showModal || dialog.open) return;
  dialog.showModal();
  alignBungoDialog(dialog);
}

function closeQuitConfirm() {
  const dialog = $root.querySelector('[data-bungo-dialog="quit"]');
  if (dialog?.open) dialog.close();
}

function startGame() {
  stopTimer();
  closeWin();
  closeRestartConfirm();
  closeQuitConfirm();
  phase = "play";
  cards = buildDeck(difficulty);
  openIds = [];
  locked = false;
  moves = 0;
  matchedCount = 0;
  startedAt = 0;
  elapsedMs = 0;
  resetScores();
  preload(selectedAuthors(difficulty));
  render();
  scheduleSaveSession();
}

function goIntro() {
  stopTimer();
  closeWin();
  closeRestartConfirm();
  closeQuitConfirm();
  phase = "intro";
  cards = [];
  openIds = [];
  locked = false;
  moves = 0;
  matchedCount = 0;
  startedAt = 0;
  elapsedMs = 0;
  resetScores();
  render();
  scheduleSaveSession();
}

function advanceTurn() {
  if (playerCount <= 1) return;
  currentPlayer = (currentPlayer + 1) % playerCount;
  updatePlayersUI();
  scheduleSaveSession();
}

function onCardClick(uid) {
  if (locked) return;
  const card = cardByUid(uid);
  if (!card || card.flipped || card.matched) return;
  if (openIds.includes(uid)) return;

  startTimer();
  card.flipped = true;
  openIds.push(uid);
  syncCardButton(card);
  scheduleSaveSession();

  if (openIds.length < 2) return;

  moves += 1;
  updateStats();
  const [firstId, secondId] = openIds;
  const first = cardByUid(firstId);
  const second = cardByUid(secondId);
  if (!first || !second) return;

  if (first.pairId === second.pairId) {
    first.matched = true;
    second.matched = true;
    first.flipped = true;
    second.flipped = true;
    openIds = [];
    matchedCount += 1;
    if (playerCount > 1) {
      scores[currentPlayer] += 1;
    }
    syncCardButton(first);
    syncCardButton(second);
    celebrateMatch(first, second);
    updateStats();
    if (matchedCount >= pairTotal()) {
      finishTimer();
      openWin();
      scheduleSaveSession();
    } else {
      scheduleSaveSession();
    }
    return;
  }

  locked = true;
  scheduleSaveSession();
  window.setTimeout(() => {
    first.flipped = false;
    second.flipped = false;
    openIds = [];
    locked = false;
    syncCardButton(first);
    syncCardButton(second);
  advanceTurn();
    scheduleSaveSession();
  }, FLIP_BACK_MS);
}

function bindIntro() {
  bindPlayerCountPicker();
  $root.querySelectorAll('input[name="bungo-diff"]').forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        difficulty = input.value;
        scheduleSaveSession();
      }
    });
  });
  $root.querySelector("[data-bungo-start]")?.addEventListener("click", startGame);
}

function bindPlay() {
  $root.querySelector(".bungo-board")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-uid]");
    if (!button) return;
    onCardClick(button.dataset.uid);
  });
  $root.querySelector("[data-bungo-quit]")?.addEventListener("click", openQuitConfirm);
  $root.querySelector("[data-bungo-quit-confirm]")?.addEventListener("click", goIntro);
  $root.querySelector("[data-bungo-quit-cancel]")?.addEventListener("click", closeQuitConfirm);
  $root.querySelector("[data-bungo-restart]")?.addEventListener("click", openRestartConfirm);
  $root.querySelector("[data-bungo-restart-confirm]")?.addEventListener("click", startGame);
  $root.querySelector("[data-bungo-restart-cancel]")?.addEventListener("click", closeRestartConfirm);
  $root.querySelectorAll("[data-bungo-home]").forEach((button) => {
    button.addEventListener("click", goIntro);
  });
  $root.querySelector('[data-bungo-dialog="win"]')?.addEventListener("click", (event) => {
    if (event.target.closest("[data-bungo-again]")) startGame();
    if (event.target.closest("[data-bungo-home]")) goIntro();
  });
}

function render() {
  if (!$root) return;
  if (phase === "intro") {
    setPlayChrome(false);
    $root.innerHTML = introHtml();
    bindIntro();
    return;
  }

  setPlayChrome(true);
  $root.innerHTML = playShellHtml();
  const board = $root.querySelector(".bungo-board");
  if (board) board.innerHTML = cards.map(cardHtml).join("");
  updateStats();
  bindPlay();
  scheduleBoardLayout();
  scheduleSaveSession();
}

if ($root) {
  ensureBungoPickerDismiss();
  const restored = loadSession();
  if (restored && phase === "play") {
    preload(selectedAuthors(difficulty));
  }
  render();
  if (restored && phase === "play" && matchedCount < pairTotal()) {
    resumePlayTimer();
  }
  if (!window.__bungoLayoutListener) {
    window.__bungoLayoutListener = true;
    const onResize = () => scheduleBoardLayout();
    window.addEventListener("resize", onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("pagehide", saveSession);
  }
}
