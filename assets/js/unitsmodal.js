let unitsModalInitialized = false;
let activeUnitInput = null;
let activeSystem = "metric";
let modalResolver = null;
let modalOptions = getDefaultModalOptions();

const UNIT_SYSTEMS = {
  metric: {
    label: "Metric",
    mass: ["mg", "g", "kg"],
    liquid: ["ml", "cl", "dl", "l"]
  },
  imperial: {
    label: "Imperial",
    mass: ["oz", "lb"],
    liquid: ["fl oz", "pt", "qt", "gal"]
  }
};

const COMMON_COOKING_UNITS = [
  "egg",
  "eggs",
  "egg white",
  "egg whites",
  "egg yolk",
  "egg yolks",
  "pinch",
  "teaspoon",
  "tablespoon",
  "cup",
  "glass",
  "clove",
  "bunch",
  "sprig",
  "leaf",
  "packet",
  "jar",
  "can",
  "piece",
  "pcs",
  "to taste"
];

const VALUE_UNITS = [
  "mg", "g", "kg",
  "ml", "cl", "dl", "l",
  "oz", "lb",
  "fl oz", "pt", "qt", "gal",
  "teaspoon", "tablespoon", "cup", "glass"
];

const GENERIC_UNITS = [
  "egg",
  "eggs",
  "egg white",
  "egg whites",
  "egg yolk",
  "egg yolks",
  "pinch",
  "clove",
  "bunch",
  "sprig",
  "leaf",
  "packet",
  "jar",
  "can",
  "piece",
  "pcs",
  "to taste"
];

function normalizeUnit(unit = "") {
  return String(unit).trim().toLowerCase();
}

function isValueUnit(unit = "") {
  return VALUE_UNITS.includes(normalizeUnit(unit));
}

function getDefaultModalOptions() {
  return {
    value: "",
    allowedUnits: null,
    excludeGeneric: false,
    onlyValueUnits: false
  };
}

export function initUnitsModal() {
  if (unitsModalInitialized) return;
  unitsModalInitialized = true;

  injectUnitsModalStyles();
  createUnitsModalDOM();
  bindUnitsModalEvents();
}

function injectUnitsModalStyles() {
  if (document.getElementById("unitsModalStyles")) return;

  const style = document.createElement("style");
  style.id = "unitsModalStyles";
  style.textContent = `
    .um-hidden{
      display: none !important;
    }

    .um-overlay{
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 18px;
      background: rgba(15, 18, 28, 0.34);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }

    .um-modal{
      width: min(100%, 560px);
      max-height: min(82vh, 760px);
      overflow: auto;
      border-radius: 30px;
      padding: 18px;
      background: rgba(232, 238, 248, 0.82);
      border: 1px solid rgba(255,255,255,0.45);
      box-shadow:
        0 30px 80px rgba(0,0,0,0.18),
        inset 0 1px 0 rgba(255,255,255,0.45);
      backdrop-filter: blur(22px) saturate(140%);
      -webkit-backdrop-filter: blur(22px) saturate(140%);
      color: rgb(var(--ink));
      transform: translateY(10px);
      animation: um-slide-up .18s ease forwards;
    }

    @keyframes um-slide-up{
      from{
        opacity: 0;
        transform: translateY(18px) scale(.985);
      }
      to{
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .um-topbar{
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 16px;
    }

    .um-title-wrap{
      min-width: 0;
    }

    .um-title{
      margin: 0;
      font-size: 22px;
      line-height: 1.05;
      font-weight: 800;
      letter-spacing: -0.03em;
    }

    .um-subtitle{
      margin: 6px 0 0;
      font-size: 13px;
      line-height: 1.35;
      color: rgba(18,18,22,0.58);
    }

    .um-close{
      width: 42px;
      height: 42px;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      flex-shrink: 0;
      font: inherit;
      font-size: 20px;
      font-weight: 800;
      color: rgb(var(--ink));
      background: rgba(255,255,255,0.72);
      border: 1px solid rgba(255,255,255,0.38);
      box-shadow:
        0 8px 18px rgba(0,0,0,0.08),
        inset 0 1px 0 rgba(255,255,255,0.42);
      transition: transform .16s ease, background .16s ease;
    }

    .um-close:hover{
      transform: scale(1.03);
      background: rgba(255,255,255,0.92);
    }

    .um-system-switch{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      padding: 6px;
      margin-bottom: 18px;
      border-radius: 22px;
      background: rgba(255,255,255,0.48);
      border: 1px solid rgba(255,255,255,0.34);
      box-shadow:
        inset 0 1px 0 rgba(255,255,255,0.42),
        0 8px 22px rgba(0,0,0,0.06);
    }

    .um-system-btn{
      border: none;
      min-height: 44px;
      border-radius: 16px;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 800;
      color: rgb(var(--ink));
      background: transparent;
      transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
    }

    .um-system-btn.active{
      background: rgba(255,255,255,0.92);
      box-shadow:
        0 6px 16px rgba(0,0,0,0.08),
        inset 0 1px 0 rgba(255,255,255,0.46);
    }

    .um-sections{
      display: grid;
      gap: 16px;
    }

    .um-section{
      display: grid;
      gap: 10px;
    }

    .um-section-title{
      margin: 0;
      padding-left: 4px;
      font-size: 12px;
      line-height: 1;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(18,18,22,0.52);
    }

    .um-grid{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .um-chip{
      min-height: 48px;
      padding: 12px 10px;
      border: none;
      border-radius: 18px;
      cursor: pointer;
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      color: rgb(var(--ink));
      background: rgba(255,255,255,0.76);
      border: 1px solid rgba(255,255,255,0.42);
      box-shadow:
        0 8px 18px rgba(0,0,0,0.05),
        inset 0 1px 0 rgba(255,255,255,0.42);
      transition: transform .16s ease, background .16s ease, box-shadow .16s ease, color .16s ease;
    }

    .um-chip:hover{
      transform: translateY(-1px);
      background: rgba(255,255,255,0.94);
      box-shadow:
        0 12px 24px rgba(0,0,0,0.08),
        inset 0 1px 0 rgba(255,255,255,0.42);
    }

    .um-chip:active{
      transform: scale(.985);
    }

    .um-chip.selected{
      background: #000;
      color: #fff;
      border-color: #000;
      box-shadow:
        0 8px 18px rgba(0,0,0,0.18),
        inset 0 1px 0 rgba(255,255,255,0.15);
    }

    .um-common-divider{
      height: 1px;
      margin: 4px 0 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(18,18,22,0.12),
        transparent
      );
    }

    .um-empty{
      padding: 14px 12px;
      border-radius: 16px;
      font-size: 13px;
      line-height: 1.4;
      color: rgba(18,18,22,0.58);
      background: rgba(255,255,255,0.5);
      border: 1px dashed rgba(18,18,22,0.12);
    }

    @media (max-width: 560px){
      .um-overlay{
        padding: 12px;
      }

      .um-modal{
        width: 100%;
        border-radius: 26px;
        padding: 16px;
      }

      .um-title{
        font-size: 20px;
      }

      .um-grid{
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .um-chip{
        min-height: 46px;
        font-size: 13px;
        padding: 10px 8px;
        border-radius: 16px;
      }
    }

    @media (max-width: 380px){
      .um-grid{
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;
  document.head.appendChild(style);
}

function createUnitsModalDOM() {
  if (document.getElementById("unitsModalOverlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "unitsModalOverlay";
  overlay.className = "um-overlay um-hidden";

  const modal = document.createElement("div");
  modal.className = "um-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "unitsModalTitle");

  modal.innerHTML = `
    <div class="um-topbar">
      <div class="um-title-wrap">
        <h3 class="um-title" id="unitsModalTitle">Choose unit</h3>
        <p class="um-subtitle">Select a unit to apply to the active field.</p>
      </div>

      <button class="um-close" type="button" aria-label="Close modal">×</button>
    </div>

    <div class="um-system-switch" id="unitsSystemSwitch">
      <button class="um-system-btn active" type="button" data-system="metric">Metric</button>
      <button class="um-system-btn" type="button" data-system="imperial">Imperial</button>
    </div>

    <div class="um-sections">
      <section class="um-section">
        <h4 class="um-section-title">Mass</h4>
        <div class="um-grid" id="unitsMassGrid"></div>
      </section>

      <section class="um-section">
        <h4 class="um-section-title">Liquids</h4>
        <div class="um-grid" id="unitsLiquidGrid"></div>
      </section>

      <div class="um-common-divider" id="unitsCommonDivider" aria-hidden="true"></div>

      <section class="um-section" id="unitsCommonSection">
        <h4 class="um-section-title">Cooking</h4>
        <div class="um-grid" id="unitsCommonGrid"></div>
      </section>

      <div class="um-empty um-hidden" id="unitsModalEmpty">
        No units available for this selection.
      </div>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  renderUnitsModalContent();
}

function bindUnitsModalEvents() {
  const overlay = document.getElementById("unitsModalOverlay");
  const modal = overlay.querySelector(".um-modal");
  const closeBtn = overlay.querySelector(".um-close");
  const systemSwitch = overlay.querySelector("#unitsSystemSwitch");

  document.addEventListener("click", (event) => {
    const unitInput = event.target.closest('[data-field="unit"]');
    if (!unitInput) return;

    event.preventDefault();

    activeUnitInput = unitInput;
    modalOptions = getDefaultModalOptions();

    const currentValue =
      activeUnitInput?.dataset?.value ||
      activeUnitInput?.value ||
      "";

    modalOptions.value = currentValue;

    renderUnitsModalContent();
    showUnitsModal();
  });

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeUnitsModal(null);
    }
  });

  closeBtn.addEventListener("click", () => {
    closeUnitsModal(null);
  });

  systemSwitch.addEventListener("click", (event) => {
    const btn = event.target.closest(".um-system-btn");
    if (!btn) return;

    const nextSystem = btn.dataset.system;
    if (!nextSystem || nextSystem === activeSystem) return;

    activeSystem = nextSystem;
    updateSystemButtons();
    renderUnitsModalContent();
  });

  modal.addEventListener("click", (event) => {
    const chip = event.target.closest(".um-chip");
    if (!chip) return;

    const value = chip.dataset.value ?? "";

    if (activeUnitInput) {
      applyUnitToInput(activeUnitInput, value);
    }

    closeUnitsModal(value);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeUnitsModal(null);
    }
  });
}

function applyUnitToInput(input, value) {
  if (!input) return;

  if ("dataset" in input) {
    input.dataset.value = value;
  }

  if ("value" in input && "tagName" in input) {
    const tag = input.tagName.toLowerCase();

    if (tag === "input" || tag === "textarea" || tag === "select") {
      input.value = value;
    }
  }

  if (input.dataset) {
    input.dataset.unit = value;
  }

  const unitText = input.querySelector?.(".ir-unit-text");

  if (unitText) {
    unitText.textContent = value || "Unit";
  } else if ("textContent" in input && input.matches?.("button")) {
    input.textContent = value || "Select unit";
  }

  input.classList?.toggle("is-placeholder", !value);

  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function getFilteredUnitsForSystem(systemKey) {
  const system = UNIT_SYSTEMS[systemKey];

  let mass = [...system.mass];
  let liquid = [...system.liquid];
  let common = [...COMMON_COOKING_UNITS];

  if (modalOptions.onlyValueUnits) {
    common = common.filter((unit) => isValueUnit(unit));
  }

  if (modalOptions.excludeGeneric) {
    const genericSet = new Set(GENERIC_UNITS.map(normalizeUnit));
    common = common.filter((unit) => !genericSet.has(normalizeUnit(unit)));
  }

  if (Array.isArray(modalOptions.allowedUnits) && modalOptions.allowedUnits.length > 0) {
    const allowedSet = new Set(modalOptions.allowedUnits.map(normalizeUnit));

    mass = mass.filter((unit) => allowedSet.has(normalizeUnit(unit)));
    liquid = liquid.filter((unit) => allowedSet.has(normalizeUnit(unit)));
    common = common.filter((unit) => allowedSet.has(normalizeUnit(unit)));
  }

  return { mass, liquid, common };
}

function renderUnitsModalContent() {
  const massGrid = document.getElementById("unitsMassGrid");
  const liquidGrid = document.getElementById("unitsLiquidGrid");
  const commonGrid = document.getElementById("unitsCommonGrid");
  const commonSection = document.getElementById("unitsCommonSection");
  const commonDivider = document.getElementById("unitsCommonDivider");
  const emptyState = document.getElementById("unitsModalEmpty");

  if (!massGrid || !liquidGrid || !commonGrid || !commonSection || !commonDivider || !emptyState) {
    return;
  }

  const filtered = getFilteredUnitsForSystem(activeSystem);
  const currentValue = modalOptions.value || "";

  massGrid.innerHTML = "";
  liquidGrid.innerHTML = "";
  commonGrid.innerHTML = "";

  filtered.mass.forEach((unit) => {
    massGrid.appendChild(createUnitChip(unit, currentValue));
  });

  filtered.liquid.forEach((unit) => {
    liquidGrid.appendChild(createUnitChip(unit, currentValue));
  });

  filtered.common.forEach((unit) => {
    commonGrid.appendChild(createUnitChip(unit, currentValue));
  });

  const hasCommon = filtered.common.length > 0;
  const hasAny =
    filtered.mass.length > 0 ||
    filtered.liquid.length > 0 ||
    filtered.common.length > 0;

  commonSection.classList.toggle("um-hidden", !hasCommon);
  commonDivider.classList.toggle("um-hidden", !hasCommon);
  emptyState.classList.toggle("um-hidden", hasAny);
}

function createUnitChip(label, currentValue = "") {
  const btn = document.createElement("button");
  btn.className = "um-chip";
  btn.type = "button";
  btn.dataset.value = label;
  btn.textContent = label;

  if (normalizeUnit(currentValue) === normalizeUnit(label)) {
    btn.classList.add("selected");
  }

  return btn;
}

function updateSystemButtons() {
  const buttons = document.querySelectorAll(".um-system-btn");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.system === activeSystem);
  });
}

function showUnitsModal() {
  const overlay = document.getElementById("unitsModalOverlay");
  if (!overlay) return;

  overlay.classList.remove("um-hidden");
  document.body.style.overflow = "hidden";
}

function resetModalState() {
  activeUnitInput = null;
  modalOptions = getDefaultModalOptions();
}

function closeUnitsModal(result = null) {
  const overlay = document.getElementById("unitsModalOverlay");
  if (!overlay) return;

  overlay.classList.add("um-hidden");
  document.body.style.overflow = "";

  if (modalResolver) {
    const resolve = modalResolver;
    modalResolver = null;
    resolve(result);
  }

  resetModalState();
}

export function openUnitsModal(options = {}) {
  initUnitsModal();

  modalOptions = {
    ...getDefaultModalOptions(),
    ...options
  };

  modalOptions.value = modalOptions.value || "";

  const normalizedValue = normalizeUnit(modalOptions.value);

  if (UNIT_SYSTEMS.imperial.mass.includes(normalizedValue) || UNIT_SYSTEMS.imperial.liquid.includes(normalizedValue)) {
    activeSystem = "imperial";
  } else {
    activeSystem = "metric";
  }

  updateSystemButtons();
  renderUnitsModalContent();
  showUnitsModal();

  return new Promise((resolve) => {
    modalResolver = resolve;
  });
}

initUnitsModal();