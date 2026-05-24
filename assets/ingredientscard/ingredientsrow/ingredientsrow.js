export function createIngredientsRow(prefill = {}) {
    const MAX_NAME_CHARS = 20;
  
    const row = document.createElement("div");
    row.className = "ir-row";
  
    const nameInput = document.createElement("input");
    nameInput.className = "ir-field";
    nameInput.type = "text";
    nameInput.placeholder = "Ingrediente";
    nameInput.autocomplete = "off";
    nameInput.maxLength = MAX_NAME_CHARS;
    nameInput.setAttribute("data-field", "name");
    nameInput.value = String(prefill.name ?? "").slice(0, MAX_NAME_CHARS);
  
    const quantityInput = document.createElement("input");
    quantityInput.className = "ir-field ir-field-qty";
    quantityInput.type = "number";
    quantityInput.placeholder = "0";
    quantityInput.inputMode = "decimal";
    quantityInput.step = "any";
    quantityInput.min = "0";
    quantityInput.setAttribute("data-field", "quantity");
    quantityInput.value = prefill.quantity ?? "";
  
    const unitButton = document.createElement("button");
    unitButton.className = "ir-field ir-unit-trigger";
    unitButton.type = "button";
    unitButton.setAttribute("data-field", "unit");
    unitButton.setAttribute("aria-label", "Seleziona unità");
    unitButton.dataset.value = prefill.unit ?? "";
  
    const unitText = document.createElement("span");
    unitText.className = "ir-unit-text";
    unitText.textContent = prefill.unit || "Unità";
  
    const unitChevron = document.createElement("span");
    unitChevron.className = "ir-unit-chevron";
    unitChevron.setAttribute("aria-hidden", "true");
    unitChevron.textContent = "⌄";
  
    unitButton.appendChild(unitText);
    unitButton.appendChild(unitChevron);
  
    const overlay = document.createElement("div");
    overlay.className = "ir-delete-overlay";
    overlay.textContent = "ELIMINA";
  
    row.appendChild(nameInput);
    row.appendChild(quantityInput);
    row.appendChild(unitButton);
    row.appendChild(overlay);
  
    let pressTimer = null;
    let deleteMode = false;
    let suppressNextClick = false;
    let startX = 0;
    let startY = 0;
    let unitWasAutoSetFromIngredientName = false;
  
    const HOLD_MS = 600;
    const MOVE_TOLERANCE = 10;
  
    const AUTO_UNIT_GROUPS = [
      { singular: "uovo", plural: "uova" },
      { singular: "albume", plural: "albumi" },
      { singular: "tuorlo", plural: "tuorli" }
    ];
  
    const AUTO_UNITS = new Set(
      AUTO_UNIT_GROUPS.flatMap((group) => [group.singular, group.plural])
    );
  
    function normalizeUnit(value = "") {
      return String(value).trim().toLowerCase();
    }
  
    function isQbUnit(unit = "") {
      const clean = normalizeUnit(unit)
        .replaceAll(".", "")
        .replaceAll(" ", "");
  
      return clean === "qb" || clean === "quantobasta";
    }
  
    function syncQuantityAvailability() {
      const currentUnit = unitButton.dataset.value ?? "";
  
      if (isQbUnit(currentUnit)) {
        quantityInput.value = "";
        quantityInput.disabled = true;
        quantityInput.placeholder = "";
        quantityInput.classList.add("is-disabled");
        row.dataset.quantityDisabledByUnit = "true";
        return;
      }
  
      quantityInput.disabled = false;
      quantityInput.placeholder = "0";
      quantityInput.classList.remove("is-disabled");
      row.dataset.quantityDisabledByUnit = "false";
    }
  
    function activateDeleteMode() {
      deleteMode = true;
      suppressNextClick = true;
      row.classList.add("delete-mode");
    }
  
    function cancelDeleteMode() {
      deleteMode = false;
      row.classList.remove("delete-mode");
    }
  
    function clearPressTimer() {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
  
    function syncUnitUI() {
      const value = unitButton.dataset.value ?? "";
      unitText.textContent = value || "Unità";
      unitButton.classList.toggle("is-placeholder", !value);
      syncQuantityAvailability();
    }
  
    function getNormalizedIngredientName() {
      return (nameInput.value ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
    }
  
    function getQuantityNumber() {
      const raw = (quantityInput.value ?? "").trim().replace(",", ".");
      if (!raw) return null;
  
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
  
    function getUnitGroupFromName() {
      const normalized = getNormalizedIngredientName();
      if (!normalized) return null;
  
      for (const group of AUTO_UNIT_GROUPS) {
        if (normalized === group.singular || normalized === group.plural) {
          return group;
        }
  
        if (
          normalized.startsWith(`${group.singular} `) ||
          normalized.startsWith(`${group.plural} `)
        ) {
          return group;
        }
      }
  
      return null;
    }
  
    function getAutoUnitFromNameAndQuantity() {
      const group = getUnitGroupFromName();
      if (!group) return "";
  
      const quantity = getQuantityNumber();
  
      if (quantity === 1) {
        return group.singular;
      }
  
      if (quantity !== null) {
        return group.plural;
      }
  
      const normalized = getNormalizedIngredientName();
  
      if (
        normalized === group.singular ||
        normalized.startsWith(`${group.singular} `)
      ) {
        return group.singular;
      }
  
      return group.plural;
    }
  
    function setUnitValue(value, { auto = false } = {}) {
      const cleanValue = value ?? "";
  
      unitButton.dataset.value = cleanValue;
      syncUnitUI();
  
      unitWasAutoSetFromIngredientName =
        auto && AUTO_UNITS.has(cleanValue.trim().toLowerCase());
    }
  
    function syncAutoUnitFromInputs() {
      const autoUnit = getAutoUnitFromNameAndQuantity();
      const currentUnit = (unitButton.dataset.value ?? "").trim().toLowerCase();
  
      if (autoUnit) {
        const canAutoReplace =
          currentUnit === "" ||
          AUTO_UNITS.has(currentUnit) ||
          unitWasAutoSetFromIngredientName;
  
        if (canAutoReplace) {
          setUnitValue(autoUnit, { auto: true });
        }
  
        return;
      }
  
      if (unitWasAutoSetFromIngredientName && AUTO_UNITS.has(currentUnit)) {
        setUnitValue("", { auto: false });
      }
    }
  
    row.addEventListener("pointerdown", (event) => {
      startX = event.clientX;
      startY = event.clientY;
  
      if (deleteMode) {
        row.remove();
        return;
      }
  
      clearPressTimer();
  
      pressTimer = setTimeout(() => {
        activateDeleteMode();
      }, HOLD_MS);
    });
  
    row.addEventListener("pointermove", (event) => {
      if (!pressTimer) return;
  
      const deltaX = Math.abs(event.clientX - startX);
      const deltaY = Math.abs(event.clientY - startY);
  
      if (deltaX > MOVE_TOLERANCE || deltaY > MOVE_TOLERANCE) {
        clearPressTimer();
      }
    });
  
    row.addEventListener("pointerup", () => {
      clearPressTimer();
    });
  
    row.addEventListener("pointerleave", () => {
      clearPressTimer();
    });
  
    row.addEventListener("pointercancel", () => {
      clearPressTimer();
    });
  
    row.addEventListener(
      "click",
      (event) => {
        if (suppressNextClick) {
          event.preventDefault();
          event.stopPropagation();
          suppressNextClick = false;
          return;
        }
  
        if (deleteMode) {
          event.preventDefault();
          event.stopPropagation();
          row.remove();
        }
      },
      true
    );
  
    document.addEventListener("click", (event) => {
      if (deleteMode && !row.contains(event.target)) {
        cancelDeleteMode();
      }
    });
  
    unitButton.addEventListener("click", (event) => {
      if (deleteMode || suppressNextClick) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
    });
  
    nameInput.addEventListener("input", () => {
      if (nameInput.value.length > MAX_NAME_CHARS) {
        nameInput.value = nameInput.value.slice(0, MAX_NAME_CHARS);
      }
  
      syncAutoUnitFromInputs();
    });
  
    quantityInput.addEventListener("input", () => {
      if (quantityInput.disabled) return;
      syncAutoUnitFromInputs();
    });
  
    unitButton.addEventListener("input", () => {
      const nextValue = unitButton.value ?? unitButton.dataset.value ?? "";
      setUnitValue(nextValue, { auto: false });
    });
  
    unitButton.addEventListener("change", () => {
      const nextValue = unitButton.value ?? unitButton.dataset.value ?? "";
      setUnitValue(nextValue, { auto: false });
    });
  
    row.getRowData = () => ({
      name: nameInput.value.trim(),
      quantity: quantityInput.disabled ? "" : quantityInput.value.trim(),
      unit: (unitButton.dataset.value ?? "").trim()
    });
  
    row.setRowData = (data = {}) => {
      nameInput.value = String(data.name ?? "").slice(0, MAX_NAME_CHARS);
      quantityInput.value = data.quantity ?? "";
      setUnitValue(data.unit ?? "", { auto: false });
      syncAutoUnitFromInputs();
      syncQuantityAvailability();
    };
  
    row.getFields = () => ({
      nameInput,
      quantityInput,
      unitButton
    });
  
    syncUnitUI();
    syncAutoUnitFromInputs();
    syncQuantityAvailability();
  
    return row;
  }