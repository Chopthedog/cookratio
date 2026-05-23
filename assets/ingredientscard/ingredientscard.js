import { createIngredientsRow } from "./ingredientsrow/ingredientsrow.js";

export function createIngredientsCard() {
  const MIN_ROWS = 2;
  const MAX_ROWS = 30;

  const card = document.createElement("section");
  card.className = "ingredients-card";

  const head = document.createElement("div");
  head.className = "ingredients-head";

  const titleWrap = document.createElement("div");
  titleWrap.className = "ingredients-title-wrap";

  const title = document.createElement("h2");
  title.className = "ingredients-title";
  title.textContent = "Ingredienti";

  const subtitle = document.createElement("p");
  subtitle.className = "ingredients-subtitle";
  subtitle.textContent = "Inserisci gli ingredienti della ricetta.";

  titleWrap.appendChild(title);
  titleWrap.appendChild(subtitle);

  const count = document.createElement("div");
  count.className = "ingredients-count";
  count.textContent = "0";

  head.appendChild(titleWrap);
  head.appendChild(count);

  const gridHead = document.createElement("div");
  gridHead.className = "ingredients-grid-head";

  const nameHead = document.createElement("p");
  nameHead.className = "ingredients-grid-label";
  nameHead.textContent = "Ingrediente";

  const quantityHead = document.createElement("p");
  quantityHead.className = "ingredients-grid-label";
  quantityHead.textContent = "Quantità";

  const unitHead = document.createElement("p");
  unitHead.className = "ingredients-grid-label";
  unitHead.textContent = "Unità";

  gridHead.appendChild(nameHead);
  gridHead.appendChild(quantityHead);
  gridHead.appendChild(unitHead);

  const body = document.createElement("div");
  body.className = "ingredients-body";

  const actions = document.createElement("div");
  actions.className = "ingredients-actions";

  const addButton = document.createElement("button");
  addButton.className = "ingredients-add";
  addButton.type = "button";
  addButton.setAttribute("aria-label", "Aggiungi ingrediente");

  const addIcon = document.createElement("span");
  addIcon.className = "ingredients-add-icon";
  addIcon.textContent = "+";

  const addText = document.createElement("span");
  addText.textContent = "Aggiungi ingrediente";

  addButton.appendChild(addIcon);
  addButton.appendChild(addText);
  actions.appendChild(addButton);

  card.appendChild(head);
  card.appendChild(gridHead);
  card.appendChild(body);
  card.appendChild(actions);

  function getRows() {
    return Array.from(body.querySelectorAll(".ir-row"));
  }

  function updateCount() {
    const totalRows = getRows().length;
    const reachedMax = totalRows >= MAX_ROWS;

    count.textContent = String(totalRows);

    actions.classList.toggle("hidden", reachedMax);
    addButton.disabled = reachedMax;

    card.dataset.rowsCount = String(totalRows);
    card.dataset.maxRowsReached = reachedMax ? "true" : "false";
  }

  function ensureMinimumRows() {
    while (getRows().length < MIN_ROWS) {
      const row = createIngredientsRow();
      body.appendChild(row);
    }

    updateCount();
  }

  function addRow(prefill = {}, focusName = false) {
    if (getRows().length >= MAX_ROWS) {
      updateCount();
      return null;
    }

    const row = createIngredientsRow(prefill);
    body.appendChild(row);
    updateCount();

    if (focusName) {
      const firstInput = row.querySelector('[data-field="name"]');
      if (firstInput) firstInput.focus();
    }

    return row;
  }

  function getUnitValue(unitInput) {
    if (!unitInput) return "";

    const datasetValue =
      unitInput.dataset.value ||
      unitInput.dataset.unit ||
      "";

    if (datasetValue.trim()) {
      return datasetValue.trim();
    }

    const text =
      unitInput.querySelector?.(".ir-unit-text")?.textContent ||
      unitInput.textContent ||
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

  addButton.addEventListener("click", () => {
    addRow({}, true);
  });

  const observer = new MutationObserver(() => {
    ensureMinimumRows();
    updateCount();
  });

  observer.observe(body, {
    childList: true
  });

  ensureMinimumRows();

  card.addIngredientRow = (prefill = {}) => addRow(prefill);

  card.getIngredientRows = () => getRows();

  card.getIngredientsData = () => {
    return getRows().map((row) => {
      const nameInput = row.querySelector('[data-field="name"]');
      const quantityInput = row.querySelector('[data-field="quantity"]');
      const unitInput = row.querySelector('[data-field="unit"]');

      return {
        name: nameInput ? nameInput.value.trim() : "",
        quantity: quantityInput ? quantityInput.value.trim() : "",
        unit: getUnitValue(unitInput)
      };
    });
  };

  card.getCompletedRowsCount = () => {
    return card.getIngredientsData().filter((item) => {
      return item.name !== "" && item.quantity !== "" && item.unit !== "";
    }).length;
  };

  card.hasEnoughCompletedRows = () => {
    return card.getCompletedRowsCount() >= MIN_ROWS;
  };

  card.getMaxRows = () => MAX_ROWS;

  card.hasReachedMaxRows = () => getRows().length >= MAX_ROWS;

  return card;
}