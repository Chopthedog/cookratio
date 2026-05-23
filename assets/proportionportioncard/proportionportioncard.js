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
  
  function toNumber(value) {
    const number = Number(String(value).replace(",", "."));
    return Number.isFinite(number) ? number : 0;
  }
  
  function formatQuantity(value) {
    if (!Number.isFinite(value)) return "";
  
    const rounded = Math.round(value * 100) / 100;
    return String(rounded).replace(".", ",");
  }
  
  function escapeHtml(value = "") {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
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
  
  export function createProportionPortionCard() {
    const card = document.createElement("section");
    card.className = "ingredients-card ppcard";
  
    card.innerHTML = `
      <div class="ppcard-head">
        <div class="ppcard-title-wrap">
          <h2 class="ppcard-title">Proporziona per porzioni</h2>
          <p class="ppcard-subtitle">
            Indica per quante porzioni è la ricetta e per quante vuoi adattarla.
          </p>
        </div>
      </div>
  
      <div class="ppcard-body">
        <div class="ppcard-row">
          <p class="ppcard-label">Ricetta attuale</p>
  
          <input
            class="ppcard-input"
            id="currentPortionsInput"
            type="number"
            inputmode="decimal"
            step="any"
            min="0"
            placeholder="Porzioni attuali"
          />
        </div>
  
        <div class="ppcard-row">
          <p class="ppcard-label">Nuova ricetta</p>
  
          <input
            class="ppcard-input"
            id="desiredPortionsInput"
            type="number"
            inputmode="decimal"
            step="any"
            min="0"
            placeholder="Porzioni desiderate"
          />
        </div>
  
        <button class="ppcard-calc-btn" id="calculatePortionsButton" type="button">
          Calcola
        </button>
  
        <div class="ppcard-empty hidden" id="portionEmptyState">
          Inserisci almeno un ingrediente valido nella card principale.
        </div>
  
        <div class="ppcard-error hidden" id="portionErrorState">
          Inserisci un numero valido di porzioni attuali e desiderate.
        </div>
      </div>
    `;
  
    const currentPortionsInput = card.querySelector("#currentPortionsInput");
    const desiredPortionsInput = card.querySelector("#desiredPortionsInput");
    const calculateButton = card.querySelector("#calculatePortionsButton");
    const emptyState = card.querySelector("#portionEmptyState");
    const errorState = card.querySelector("#portionErrorState");
  
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
  
    function getOrCreateResultsCard() {
      let wrap = document.getElementById("resultsCardWrap");
  
      if (!wrap) {
        wrap = document.createElement("article");
        wrap.className = "card bio-card";
        wrap.id = "resultsCardWrap";
  
        const mount = document.createElement("div");
        mount.id = "resultsCardMount";
  
        wrap.appendChild(mount);
  
        const portionWrap = document.getElementById("proportionPortionCardWrap");
  
        if (portionWrap) {
          portionWrap.insertAdjacentElement("afterend", wrap);
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
  
    function showError(show) {
      errorState.classList.toggle("hidden", !show);
    }
  
    function calculateByPortions() {
      const ingredients = getIngredientsData();
  
      const currentPortions = toNumber(currentPortionsInput.value);
      const desiredPortions = toNumber(desiredPortionsInput.value);
  
      if (!ingredients.length) {
        showError(false);
        emptyState.classList.remove("hidden");
        return;
      }
  
      if (currentPortions <= 0 || desiredPortions <= 0) {
        showError(true);
        return;
      }
  
      showError(false);
  
      const factor = desiredPortions / currentPortions;
  
      const results = ingredients.map((item) => {
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
      const ingredients = getIngredientsData();
      const hasIngredients = ingredients.length > 0;
  
      currentPortionsInput.disabled = !hasIngredients;
      desiredPortionsInput.disabled = !hasIngredients;
      calculateButton.disabled = !hasIngredients;
  
      emptyState.classList.toggle("hidden", hasIngredients);
  
      if (!hasIngredients) {
        showError(false);
      }
    }
  
    calculateButton.addEventListener("click", calculateByPortions);
  
    currentPortionsInput.addEventListener("input", () => {
      showError(false);
    });
  
    desiredPortionsInput.addEventListener("input", () => {
      showError(false);
    });
  
    card.refresh = refresh;
  
    card.getData = () => ({
      currentPortions: currentPortionsInput.value.trim(),
      desiredPortions: desiredPortionsInput.value.trim()
    });
  
    refresh();
  
    return card;
  }