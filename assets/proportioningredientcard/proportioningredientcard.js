import { openUnitsModal } from "../js/unitsmodal.js";

const VALUE_UNITS = [
  "g", "kg",
  "mg", "hg",
  "ml", "cl", "dl", "l",
  "oz", "lb",
  "tsp", "tbsp",
  "cucchiaino", "cucchiaio", "tazza", "bicchiere"
];

function normalizeUnit(value = "") {
  return String(value).trim().toLowerCase();
}

function isQbUnit(unit = "") {
  const clean = normalizeUnit(unit)
    .replaceAll(".", "")
    .replaceAll(" ", "");

  return clean === "qb" || clean === "quantobasta";
}

function isValueUnit(unit = "") {
  return VALUE_UNITS.includes(normalizeUnit(unit));
}

function getAllowedUnitsFromIngredients(ingredients = []) {
  const set = new Set();

  ingredients.forEach((item) => {
    const unit = normalizeUnit(item.unit);
    if (isValueUnit(unit)) set.add(unit);
  });

  VALUE_UNITS.forEach((unit) => set.add(unit));

  return Array.from(set);
}

function toNumber(value) {
  const number = Number(String(value).replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function formatQuantity(value) {
  if (!Number.isFinite(value)) return "";

  const rounded = Math.round(value * 100) / 100;
  return String(rounded).replace(".", ",");
}

function smartUnit(quantity, unit = "") {
  const cleanUnit = normalizeUnit(unit);

  if (!Number.isFinite(quantity)) {
    return {
      quantity: "",
      unit: unit || ""
    };
  }

  if (["mg", "g", "hg", "kg"].includes(cleanUnit)) {
    return smartMassUnit(quantity, cleanUnit);
  }

  if (["ml", "cl", "dl", "l"].includes(cleanUnit)) {
    return smartLiquidUnit(quantity, cleanUnit);
  }

  if (["oz", "lb"].includes(cleanUnit)) {
    return smartImperialMassUnit(quantity, cleanUnit);
  }

  return {
    quantity: formatQuantity(quantity),
    unit: unit || ""
  };
}

function smartMassUnit(quantity, unit) {
  let grams = quantity;

  if (unit === "mg") grams = quantity / 1000;
  if (unit === "hg") grams = quantity * 100;
  if (unit === "kg") grams = quantity * 1000;

  const absGrams = Math.abs(grams);

  if (absGrams >= 1000) {
    return {
      quantity: formatQuantity(grams / 1000),
      unit: "kg"
    };
  }

  if (absGrams > 0 && absGrams < 1) {
    return {
      quantity: formatQuantity(grams * 1000),
      unit: "mg"
    };
  }

  return {
    quantity: formatQuantity(grams),
    unit: "g"
  };
}

function smartLiquidUnit(quantity, unit) {
  let ml = quantity;

  if (unit === "cl") ml = quantity * 10;
  if (unit === "dl") ml = quantity * 100;
  if (unit === "l") ml = quantity * 1000;

  const absMl = Math.abs(ml);

  if (absMl >= 1000) {
    return {
      quantity: formatQuantity(ml / 1000),
      unit: "l"
    };
  }

  if (absMl > 0 && absMl < 1) {
    return {
      quantity: formatQuantity(ml * 1000),
      unit: "µl"
    };
  }

  return {
    quantity: formatQuantity(ml),
    unit: "ml"
  };
}

function smartImperialMassUnit(quantity, unit) {
  let oz = quantity;

  if (unit === "lb") oz = quantity * 16;

  const absOz = Math.abs(oz);

  if (absOz >= 16) {
    return {
      quantity: formatQuantity(oz / 16),
      unit: "lb"
    };
  }

  return {
    quantity: formatQuantity(oz),
    unit: "oz"
  };
}

function escapeHtml(value = "") {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createProportionIngredientCard() {
  const card = document.createElement("section");
  card.className = "ingredients-card picard";

  card.innerHTML = `
    <div class="picard-head">
      <div class="picard-title-wrap">
        <h2 class="picard-title">Proporziona per ingrediente</h2>
        <p class="picard-subtitle">
          Scegli un ingrediente e imposta la nuova quantità desiderata.
        </p>
      </div>
    </div>

    <div class="picard-body">
      <div class="picard-row">
        <p class="picard-label">Ingrediente da proporzionare</p>

        <button
          type="button"
          class="picard-select picard-picker-trigger"
          id="ingredientTrigger"
        >
          Seleziona un ingrediente
        </button>
      </div>

      <div class="picard-row">
        <p class="picard-label">Nuovo valore</p>

        <div class="picard-grid-2">
          <input
            class="picard-input"
            id="quantityInput"
            type="number"
            inputmode="decimal"
            step="any"
            min="0"
            placeholder="Nuova quantità"
          />

          <button
            type="button"
            class="picard-unit"
            id="unitButton"
          >
            Seleziona unità
          </button>
        </div>
      </div>

      <button class="picard-calc-btn" id="calculateButton" type="button">
        Calcola
      </button>

      <div class="picard-empty hidden" id="emptyState">
        Inserisci almeno un ingrediente valido nella card principale.
      </div>
    </div>
  `;

  const trigger = card.querySelector("#ingredientTrigger");
  const quantityInput = card.querySelector("#quantityInput");
  const unitButton = card.querySelector("#unitButton");
  const calculateButton = card.querySelector("#calculateButton");
  const emptyState = card.querySelector("#emptyState");

  let selectedIngredient = "";

  const modal = createIngredientModal();
  const overlay = modal.overlay;
  const closeButton = modal.closeButton;
  const menu = modal.menu;

  function createIngredientModal() {
    const existingOverlay = document.getElementById("ingredientModalOverlay");

    if (existingOverlay) {
      return {
        overlay: existingOverlay,
        closeButton: existingOverlay.querySelector("#ingredientModalClose"),
        menu: existingOverlay.querySelector("#ingredientMenu")
      };
    }

    const overlay = document.createElement("div");
    overlay.className = "picard-modal-overlay hidden";
    overlay.id = "ingredientModalOverlay";

    overlay.innerHTML = `
      <div
        class="picard-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredientModalTitle"
      >
        <div class="picard-modal-topbar">
          <div class="picard-modal-title-wrap">
            <h3 class="picard-modal-title" id="ingredientModalTitle">
              Scegli ingrediente
            </h3>
            <p class="picard-modal-subtitle">
              Seleziona l’ingrediente da usare come riferimento.
            </p>
          </div>

          <button
            class="picard-modal-close"
            type="button"
            id="ingredientModalClose"
            aria-label="Chiudi modale"
          >
            ×
          </button>
        </div>

        <div class="picard-picker-list" id="ingredientMenu"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    return {
      overlay,
      closeButton: overlay.querySelector("#ingredientModalClose"),
      menu: overlay.querySelector("#ingredientMenu")
    };
  }

  function getMainIngredientsCard() {
    return document.querySelector("#ingredientsCardMount .ingredients-card");
  }

  function getCleanUnitFromButton(button) {
    if (!button) return "";

    const datasetValue =
      button.dataset.value ||
      button.dataset.unit ||
      "";

    if (datasetValue.trim()) {
      return datasetValue.trim();
    }

    const text =
      button.querySelector?.(".ir-unit-text")?.textContent ||
      button.textContent ||
      "";

    const clean = text.trim();

    if (
      !clean ||
      clean.toLowerCase() === "unità" ||
      clean.toLowerCase() === "seleziona unità"
    ) {
      return "";
    }

    return clean;
  }

  function getIngredientsDataFromDOM() {
    const mainCard = getMainIngredientsCard();
    if (!mainCard) return [];

    const rows = Array.from(mainCard.querySelectorAll(".ir-row"));

    return rows
      .map((row) => {
        const nameInput = row.querySelector('[data-field="name"]');
        const quantityInput = row.querySelector('[data-field="quantity"]');
        const unitButton = row.querySelector('[data-field="unit"]');

        return {
          name: (nameInput?.value ?? "").trim(),
          quantity: (quantityInput?.value ?? "").trim(),
          unit: getCleanUnitFromButton(unitButton)
        };
      })
      .filter((item) => item.name !== "");
  }

  function getIngredientsData() {
    const domData = getIngredientsDataFromDOM();

    if (domData.length > 0) {
      return domData;
    }

    const mainCard = getMainIngredientsCard();

    if (!mainCard || typeof mainCard.getIngredientsData !== "function") {
      return [];
    }

    return mainCard
      .getIngredientsData()
      .map((item) => ({
        name: (item.name ?? "").trim(),
        quantity: (item.quantity ?? "").trim(),
        unit: (item.unit ?? item.unita ?? item.unità ?? "").trim()
      }))
      .filter((item) => item.name !== "");
  }

  function getSelectableIngredientsData() {
    return getIngredientsData().filter(
      (ingredient) => !isQbUnit(ingredient.unit)
    );
  }

  function setUnitValue(unit = "") {
    const clean = String(unit ?? "").trim();

    if (clean) {
      unitButton.dataset.unit = clean;
      unitButton.textContent = clean;
    } else {
      unitButton.dataset.unit = "";
      unitButton.textContent = "Seleziona unità";
    }
  }

  function openIngredientModal() {
    if (trigger.disabled) return;

    renderMenu();
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeIngredientModal() {
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function setSelectedIngredient(name = "") {
    const ingredients = getSelectableIngredientsData();
    const found = ingredients.find((item) => item.name === name);

    if (!found) {
      selectedIngredient = "";
      trigger.textContent = "Seleziona un ingrediente";
      quantityInput.value = "";
      setUnitValue("");
      renderMenu();
      return;
    }

    selectedIngredient = found.name;

    trigger.textContent = found.unit
      ? `${found.name} (${found.quantity || "0"} ${found.unit})`
      : found.name;

    quantityInput.value = "";
    setUnitValue(found.unit);

    renderMenu();
  }

  function renderMenu() {
    const ingredients = getSelectableIngredientsData();

    menu.innerHTML = "";

    if (!ingredients.length) {
      menu.innerHTML = `
        <div class="picard-picker-empty">
          Nessun ingrediente proporzionabile disponibile
        </div>
      `;
      return;
    }

    ingredients.forEach((ingredient) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "picard-picker-option";

      if (ingredient.name === selectedIngredient) {
        btn.classList.add("is-selected");
      }

      btn.innerHTML = `
        <span class="picard-picker-option-name">${escapeHtml(ingredient.name)}</span>
        <span class="picard-picker-option-meta">
          ${escapeHtml(ingredient.quantity || "")} ${escapeHtml(ingredient.unit || "")}
        </span>
      `;

      btn.addEventListener("click", () => {
        setSelectedIngredient(ingredient.name);
        closeIngredientModal();
      });

      menu.appendChild(btn);
    });
  }

  async function openUnitSelector() {
    if (unitButton.disabled) return;

    const ingredients = getIngredientsData();
    const allowedUnits = getAllowedUnitsFromIngredients(ingredients);

    try {
      const selected = await openUnitsModal({
        value: unitButton.dataset.unit || "",
        allowedUnits,
        excludeGeneric: true,
        onlyValueUnits: true
      });

      if (selected) {
        setUnitValue(selected);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function getOrCreateResultsCard() {
    let wrap = document.getElementById("resultsCardWrap");

    if (!wrap) {
      wrap = document.createElement("article");
      wrap.className = "card bio-card";
      wrap.id = "resultsCardWrap";

      const mount = document.createElement("div");
      mount.id = "resultsCardMount";

      wrap.appendChild(mount);

      const proportionWrap = document.getElementById("proportionIngredientCardWrap");

      if (proportionWrap) {
        proportionWrap.insertAdjacentElement("afterend", wrap);
      }
    }

    wrap.classList.remove("hidden");
    return wrap;
  }

  function renderResults(results = []) {
    const wrap = getOrCreateResultsCard();
    const mount = wrap.querySelector("#resultsCardMount");

    if (!mount) return;

    const title = "Nuove quantità";

    mount.innerHTML = `
      <section class="ingredients-card rcard">
        <div class="rcard-head">
          <div class="rcard-title-wrap">
            <h2 class="rcard-title">${escapeHtml(title)}</h2>
          </div>
        </div>

        <div class="rcard-body">
          <div class="rcard-list">
            ${results.map((item) => {
              const quantity = item.quantity || "";
              const unit = item.unit || "";
              const value = unit ? `${quantity} ${unit}` : quantity;

              return `
                <div class="rcard-row">
                  <span class="rcard-name">${escapeHtml(item.name)}</span>
                  <span class="rcard-value">${escapeHtml(value)}</span>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function calculateProportion() {
    const ingredients = getIngredientsData();

    const selected = ingredients.find(
      (item) => item.name === selectedIngredient
    );

    if (!selected || isQbUnit(selected.unit)) return;

    const oldQuantity = toNumber(selected.quantity);
    const newQuantity = toNumber(quantityInput.value);

    if (oldQuantity <= 0 || newQuantity <= 0) return;

    const factor = newQuantity / oldQuantity;

    const results = ingredients.map((item) => {
      if (isQbUnit(item.unit)) {
        return {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit
        };
      }

      const originalQuantity = toNumber(item.quantity);
      const calculatedQuantity = originalQuantity * factor;
      const smartResult = smartUnit(calculatedQuantity, item.unit);

      return {
        name: item.name,
        quantity: smartResult.quantity,
        unit: smartResult.unit
      };
    });

    renderResults(results);
  }

  function refresh() {
    const ingredients = getSelectableIngredientsData();
    const hasIngredients = ingredients.length > 0;

    trigger.disabled = !hasIngredients;
    quantityInput.disabled = !hasIngredients;
    unitButton.disabled = !hasIngredients;
    calculateButton.disabled = !hasIngredients;

    emptyState.classList.toggle("hidden", hasIngredients);

    if (!hasIngredients) {
      selectedIngredient = "";
      trigger.textContent = "Nessun ingrediente proporzionabile disponibile";
      quantityInput.value = "";
      setUnitValue("");
      renderMenu();
      return;
    }

    const stillExists = ingredients.some(
      (item) => item.name === selectedIngredient
    );

    if (stillExists) {
      const currentSelected = selectedIngredient;
      selectedIngredient = "";

      const found = ingredients.find((item) => item.name === currentSelected);

      if (!found) return;

      selectedIngredient = found.name;

      trigger.textContent = found.unit
        ? `${found.name} (${found.quantity || "0"} ${found.unit})`
        : found.name;

      setUnitValue(found.unit);
      renderMenu();
    } else {
      selectedIngredient = "";
      trigger.textContent = "Seleziona un ingrediente";
      quantityInput.value = "";
      setUnitValue("");
      renderMenu();
    }
  }

  trigger.addEventListener("click", openIngredientModal);
  unitButton.addEventListener("click", openUnitSelector);
  calculateButton.addEventListener("click", calculateProportion);

  closeButton.addEventListener("click", closeIngredientModal);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeIngredientModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeIngredientModal();
    }
  });

  card.refresh = refresh;

  card.getData = () => ({
    ingredient: selectedIngredient,
    quantity: quantityInput.value.trim(),
    unit: unitButton.dataset.unit || ""
  });

  refresh();

  return card;
}