import {
  GLOBAL_KEYWORDS,
  PLAYGROUNDS,
  defaultPlayState,
  isKeywordPick,
  needsParentRow,
  parentCss,
  displaySpecified,
  specifiedCss,
  strokeColorCss,
} from "./playgrounds.js";

/** @type {() => string} */
let getPreviewText = () => "";

export function setPreviewTextGetter(fn) {
  getPreviewText = fn;
}

export function createDefaultGenericState() {
  /** @type {Record<string, import("./playgrounds.js").PlaygroundState>} */
  const generic = {};
  for (const [id, def] of Object.entries(PLAYGROUNDS)) {
    generic[id] = defaultPlayState(def);
  }
  return generic;
}

export function genericControlsHtml(propId, state, helpers) {
  const def = PLAYGROUNDS[propId];
  const st = state.generic[propId];
  if (!def || !st) return "";

  const escapeHtml = helpers.escapeHtml;
  const rangeRow = helpers.rangeRow;
  const specified = specifiedCss(propId, st);
  const isKeyword = isKeywordPick(st.pick);
  const showNumeric = def.numeric && st.pick === "num";
  const showValue = !isKeyword && showNumeric;
  const showColor = def.colorOptions && !isKeyword && st.pick === "num";

  const optionLabel = (o) => (o.label ? o.label : o.id === "num" && def.numeric ? "数値" : o.id);

  return `
    <div class="text-css__controls font-sim__controls">
      <div class="font-sim__field">
        <span class="font-sim__label" id="text-css-opt-label">候補</span>
        <div class="font-sim__seg text-css__unit-seg" role="group" aria-labelledby="text-css-opt-label">
          ${def.options
            .filter((o) => o.id !== "num" || def.numeric)
            .map(
              (o) => `
            <button type="button" class="font-sim__seg-btn${st.pick === o.id ? " is-active" : ""}" data-gen-pick="${propId}:${o.id}">${escapeHtml(optionLabel(o))}</button>`
            )
            .join("")}
        </div>
      </div>

      <div class="font-sim__field text-css__value-field">
        <div class="font-sim__seg text-css__keyword-seg" role="group" aria-label="${escapeHtml(propId)} のキーワード値">
          ${GLOBAL_KEYWORDS.map(
            (k) => `
            <button type="button" class="font-sim__seg-btn${st.pick === k ? " is-active" : ""}" data-gen-pick="${propId}:${k}">${k}</button>`
          ).join("")}
        </div>
        ${
          needsParentRow(propId, st.pick) && def.parentStyle
            ? `
        <div class="text-css__parent-field">
          <span class="font-sim__label">親の ${escapeHtml(propId)}</span>
          <div class="font-sim__seg" role="group">
            ${def.parentStyle.presets
              .map(
                (p) => `
            <button type="button" class="font-sim__seg-btn${st.parentPick === p.id ? " is-active" : ""}" data-gen-parent="${propId}:${p.id}">${escapeHtml(p.label ?? p.id)}</button>`
              )
              .join("")}
          </div>
        </div>`
            : ""
        }
        ${
          showColor
            ? `
        <div class="text-css__parent-field">
          <span class="font-sim__label">色</span>
          <div class="font-sim__seg" role="group">
            ${def.colorOptions
              .map(
                (c) => `
            <button type="button" class="font-sim__seg-btn${st.colorPick === c.id ? " is-active" : ""}" data-gen-color="${propId}:${c.id}">${escapeHtml(c.label ?? c.id)}</button>`
              )
              .join("")}
          </div>
        </div>`
            : ""
        }
        ${
          showValue
            ? `<div class="text-css__value-input">${
                showNumeric && def.numeric
                  ? rangeRow(
                      `text-css-gen-${propId}-val`,
                      "値",
                      st.value ?? def.numeric.default,
                      def.numeric.min,
                      def.numeric.max,
                      def.numeric.step,
                      () => specifiedCss(propId, st)
                    )
                  : `
        <div class="font-sim__field-head">
          <span class="font-sim__label">値</span>
          <output class="font-sim__value"><code>${escapeHtml(specified)}</code></output>
        </div>`
              }</div>`
            : ""
        }
        <p class="text-css__ref-note" id="text-css-ref-note" hidden></p>
      </div>
    </div>`;
}

export function applyGenericPreview(propId, state) {
  const def = PLAYGROUNDS[propId];
  const st = state.generic[propId];
  const shell = document.getElementById("text-css-preview-shell");
  const sample = document.getElementById("text-css-preview");
  const stage = document.querySelector(".text-css__stage");
  if (!def || !st || !shell || !sample) return;

  shell.style.cssText = "";
  sample.style.cssText = "";
  sample.textContent = getPreviewText();
  sample.style.fontSize = "18px";
  sample.style.fontFamily = '"Noto Sans JP", sans-serif';
  sample.style.width = "100%";
  sample.style.maxWidth = "none";

  def.previewSetup?.(sample, getPreviewText());

  const parentVal = parentCss(propId, st);
  if (parentVal != null && def.parentStyle) {
    shell.style[def.parentStyle.prop] = parentVal;
  }

  const value = specifiedCss(propId, st);
  if (def.customApply) {
    def.customApply(sample, value, st, def);
  } else if (def.styleProp) {
    sample.style[def.styleProp] = value;
  }
  if (
    def.colorOptions &&
    def.styleProp === "webkitTextStrokeWidth" &&
    !isKeywordPick(st.pick) &&
    st.pick !== "none"
  ) {
    sample.style.webkitTextStrokeColor = strokeColorCss(st, def);
  }
  if (propId === "text-decoration" && value !== "none") {
    sample.style.textDecorationThickness = "2px";
  }

  if (def.styleProp === "writingMode" && value.startsWith("vertical")) {
    sample.style.textOrientation = "mixed";
  }

  if (stage && def.previewShellClass) {
    const cls = def.previewShellClass(st.pick);
    stage.classList.remove("text-css__stage--vertical");
    if (cls) stage.classList.add(cls);
  } else if (stage) {
    stage.classList.remove("text-css__stage--vertical");
  }

  const out = document.getElementById(`text-css-gen-${propId}-val-out`);
  if (out) out.textContent = specifiedCss(propId, st);

  const refNote = document.getElementById("text-css-ref-note");
  if (refNote && def.refNote) {
    const computedProp = def.computedStyleProp ?? def.styleProp ?? "";
    const parentProp = def.parentStyle?.prop ?? computedProp;
    const parentComputed = parentProp ? getComputedStyle(shell)[parentProp] : "";
    const computed = computedProp ? getComputedStyle(sample)[computedProp] : "";
    const html = def.refNote({
      propId,
      pick: st.pick,
      specified: displaySpecified(propId, st),
      parentComputed: String(parentComputed),
      computed: String(computed),
    });
    refNote.innerHTML = html;
    refNote.hidden = !html;
  }
}

export function bindGenericHandlers(propId, state, root, { saveState, render, bindRange, applyPreview }) {
  root.querySelectorAll(`[data-gen-pick^="${propId}:"]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-gen-pick");
      const pick = raw?.split(":")[1];
      if (!pick) return;
      state.generic[propId].pick = pick;
      saveState();
      render();
    });
  });

  root.querySelectorAll(`[data-gen-color^="${propId}:"]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-gen-color");
      const id = raw?.split(":")[1];
      if (!id) return;
      state.generic[propId].colorPick = id;
      saveState();
      render();
    });
  });

  root.querySelectorAll(`[data-gen-parent^="${propId}:"]`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-gen-parent");
      const id = raw?.split(":")[1];
      if (!id) return;
      state.generic[propId].parentPick = id;
      saveState();
      render();
    });
  });

  const def = PLAYGROUNDS[propId];
  if (def?.numeric) {
    bindRange(`text-css-gen-${propId}-val`, "value", Number, "generic", propId);
  }
}