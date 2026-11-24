const STORAGE_KEY = "atohs-bmi";

/** @typedef {{ max: number, bmiText: string, label: string, range: string }} JassoRow */

/** @type {JassoRow[]} */
const JASSO_CRITERIA = [
  { max: 18.5, bmiText: "18.5未満", label: "低体重(やせ型)", range: "18.5未満" },
  { max: 25, bmiText: "18.5～25未満", label: "普通体重", range: "18.5～25未満" },
  { max: 30, bmiText: "25～30未満", label: "肥満(1度)", range: "25～30未満" },
  { max: 35, bmiText: "30～35未満", label: "肥満(2度)", range: "30～35未満" },
  { max: 40, bmiText: "35～40未満", label: "肥満(3度)", range: "35～40未満" },
  { max: Infinity, bmiText: "40以上", label: "肥満(4度)", range: "40以上" },
];

/** @type {{ bmiText: string, label: string, match: (v: number) => boolean }[]} */
const WHO_CRITERIA = [
  { bmiText: "16未満", label: "やせすぎ", match: (v) => v < 16 },
  { bmiText: "16.00～16.99以下", label: "やせ", match: (v) => v >= 16 && v < 17 },
  { bmiText: "17.00～18.49以下", label: "やせぎみ", match: (v) => v >= 17 && v < 18.5 },
  { bmiText: "18.50～24.99以下", label: "普通体重", match: (v) => v >= 18.5 && v < 25 },
  { bmiText: "25.00～29.99以下", label: "前肥満", match: (v) => v >= 25 && v < 30 },
  { bmiText: "30.00～34.99以下", label: "肥満(1度)", match: (v) => v >= 30 && v < 35 },
  { bmiText: "35.00～39.99以下", label: "肥満(2度)", match: (v) => v >= 35 && v < 40 },
  { bmiText: "40.00以上", label: "肥満(3度)", match: (v) => v >= 40 },
];

/** @param {number} bmi */
function categoryFor(bmi) {
  for (const item of JASSO_CRITERIA) {
    if (bmi < item.max) return item;
  }
  return JASSO_CRITERIA[JASSO_CRITERIA.length - 1];
}

/** @param {number | null} bmi */
function jassoActiveIndex(bmi) {
  if (bmi == null) return -1;
  return JASSO_CRITERIA.findIndex((row) => bmi < row.max);
}

/** @param {number | null} bmi */
function whoActiveIndex(bmi) {
  if (bmi == null) return -1;
  return WHO_CRITERIA.findIndex((row) => row.match(bmi));
}

/**
 * @param {{ bmiText: string, label: string }[]} rows
 * @param {number} activeIndex
 */
function tableBodyHtml(rows, activeIndex) {
  return rows
    .map(
      (row, i) => `
        <tr class="bmi-table__row${i === activeIndex ? " bmi-table__row--active" : ""}">
          <th scope="row">${row.bmiText}</th>
          <td>${row.label}</td>
        </tr>
      `
    )
    .join("");
}

/**
 * @param {number} heightCm
 * @param {number} weightKg
 */
function calcBmi(heightCm, weightKg) {
  if (!(heightCm > 0 && weightKg > 0)) return null;
  const h = heightCm / 100;
  return weightKg / (h * h);
}

/**
 * @param {number} heightCm
 */
function healthyWeightRange(heightCm) {
  if (!(heightCm > 0)) return null;
  const h = heightCm / 100;
  return { low: 18.5 * h * h, high: 24.9 * h * h };
}

function formatNum(n, digits = 1) {
  return n.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { height: "", weight: "" };
    const data = JSON.parse(raw);
    return {
      height: typeof data.height === "number" ? String(data.height) : "",
      weight: typeof data.weight === "number" ? String(data.weight) : "",
    };
  } catch {
    return { height: "", weight: "" };
  }
}

function saveState(height, weight) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ height, weight }));
  } catch {
    /* private mode */
  }
}

function parsePositive(raw) {
  const n = Number.parseFloat(String(raw).trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function meterPercent(bmi) {
  const min = 16;
  const max = 40;
  const clamped = Math.min(max, Math.max(min, bmi));
  return ((clamped - min) / (max - min)) * 100;
}

const $root = document.getElementById("bmi-app");
if (!$root) throw new Error("bmi-app not found");

const initial = loadState();

$root.innerHTML = `
  <div class="bmi-panel diag-panel">
    <form class="bmi-form" id="bmi-form">
      <div class="bmi-field">
        <label class="bmi-label" for="bmi-height">身長</label>
        <div class="bmi-input-row">
          <input
            class="bmi-input"
            id="bmi-height"
            name="height"
            type="number"
            inputmode="decimal"
            min="1"
            max="250"
            step="0.1"
            placeholder="170"
            autocomplete="off"
          />
          <span class="bmi-unit">cm</span>
        </div>
      </div>
      <div class="bmi-field">
        <label class="bmi-label" for="bmi-weight">体重</label>
        <div class="bmi-input-row">
          <input
            class="bmi-input"
            id="bmi-weight"
            name="weight"
            type="number"
            inputmode="decimal"
            min="1"
            max="300"
            step="0.1"
            placeholder="65"
            autocomplete="off"
          />
          <span class="bmi-unit">kg</span>
        </div>
      </div>
    </form>
    <div id="bmi-result" class="bmi-result-wrap" aria-live="polite"></div>
    <p class="bmi-note diag-note">
      BMI ＝ 体重（kg）÷ 身長（m）²。日本肥満学会の区分を表示しています。医療上の診断・治療の代替にはなりません。
    </p>
  </div>
  <section class="bmi-ref" aria-label="BMI判定基準">
    <div class="bmi-ref__grid">
      <div class="bmi-ref__block">
        <h3 class="bmi-ref__title">日本肥満学会の判定基準</h3>
        <div class="bmi-table-wrap">
          <table class="bmi-table">
            <thead>
              <tr>
                <th scope="col">BMI値</th>
                <th scope="col">判定</th>
              </tr>
            </thead>
            <tbody id="bmi-table-jasso"></tbody>
          </table>
        </div>
      </div>
      <div class="bmi-ref__block">
        <h3 class="bmi-ref__title">世界保健機関（WHO）の判定基準</h3>
        <div class="bmi-table-wrap">
          <table class="bmi-table">
            <thead>
              <tr>
                <th scope="col">BMI値</th>
                <th scope="col">判定</th>
              </tr>
            </thead>
            <tbody id="bmi-table-who"></tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
`;

const heightEl = document.getElementById("bmi-height");
const weightEl = document.getElementById("bmi-weight");
const resultEl = document.getElementById("bmi-result");
const formEl = document.getElementById("bmi-form");
const jassoTableBody = document.getElementById("bmi-table-jasso");
const whoTableBody = document.getElementById("bmi-table-who");

if (!heightEl || !weightEl || !resultEl || !formEl || !jassoTableBody || !whoTableBody) {
  throw new Error("bmi markup incomplete");
}

heightEl.value = initial.height;
weightEl.value = initial.weight;

function updateTables(bmi) {
  jassoTableBody.innerHTML = tableBodyHtml(JASSO_CRITERIA, jassoActiveIndex(bmi));
  whoTableBody.innerHTML = tableBodyHtml(WHO_CRITERIA, whoActiveIndex(bmi));
}

function updateResult() {
  const height = parsePositive(heightEl.value);
  const weight = parsePositive(weightEl.value);

  if (height != null && weight != null) {
    saveState(height, weight);
  }

  const bmi = height != null && weight != null ? calcBmi(height, weight) : null;

  updateTables(bmi);

  if (bmi == null) {
    resultEl.innerHTML = `<p class="bmi-placeholder">身長と体重を入力すると BMI を表示します。</p>`;
    return;
  }

  const cat = categoryFor(bmi);
  const range = height != null ? healthyWeightRange(height) : null;

  resultEl.innerHTML = `
    <div class="bmi-result">
      <p class="bmi-result__label">あなたの BMI</p>
      <p class="bmi-result__value">${formatNum(bmi)}</p>
      <p class="bmi-result__category">${cat.label}</p>
      <p class="bmi-result__range-hint">${cat.range}</p>
      <div class="bmi-meter" aria-hidden="true">
        <div class="bmi-meter__track">
          <span class="bmi-meter__marker" style="left: ${meterPercent(bmi)}%"></span>
        </div>
        <div class="bmi-meter__labels">
          <span>16</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
      </div>
      ${
        range
          ? `<p class="bmi-range">この身長の普通体重の目安（BMI 18.5〜24.9）: <strong>${formatNum(range.low)}</strong>〜<strong>${formatNum(range.high)}</strong> kg</p>`
          : ""
      }
    </div>
  `;
}

formEl.addEventListener("input", () => {
  updateResult();
});

updateTables(null);
updateResult();