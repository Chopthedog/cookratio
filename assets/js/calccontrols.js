document.addEventListener("DOMContentLoaded", () => {
    const btnFine = document.getElementById("calcMain");
    const actions = document.getElementById("calcActions");
    const actionButtons = document.querySelectorAll(".calc-action");
    const ingredientsMount = document.getElementById("ingredientsCardMount");
  
    const proportionIngredientWrap = document.getElementById("proportionIngredientCardWrap");
    const proportionPortionWrap = document.getElementById("proportionPortionCardWrap");
  
    if (!btnFine || !actions || !ingredientsMount) return;
  
    let finished = false;
    let currentMode = "ingredient";
  
    function getIngredientsCard() {
      const card = ingredientsMount.querySelector(".ingredients-card");
  
      if (card && typeof card.getCompletedRowsCount === "function") {
        return card;
      }
  
      return null;
    }
  
    function getCompletedRowsCount() {
      const ingredientsCard = getIngredientsCard();
  
      if (!ingredientsCard) return 0;
  
      return ingredientsCard.getCompletedRowsCount();
    }
  
    function hasEnoughCompletedRows() {
      return getCompletedRowsCount() >= 2;
    }
  
    function showCompileWarning() {
      alert("Compila almeno 2 ingredienti completi prima di continuare.");
    }
  
    function updateFineButtonState() {
      /*
        Il bottone resta cliccabile anche quando non ci sono abbastanza righe.
        In questo modo, se l'utente preme FINE, possiamo mostrare l'avviso.
      */
  
      btnFine.disabled = false;
  
      if (finished) {
        btnFine.classList.remove("is-disabled");
        btnFine.setAttribute("aria-disabled", "false");
        return;
      }
  
      const canFinish = hasEnoughCompletedRows();
  
      btnFine.classList.toggle("is-disabled", !canFinish);
      btnFine.setAttribute("aria-disabled", canFinish ? "false" : "true");
    }
  
    function getProportionIngredientCard() {
      return window.proportionIngredientCard || null;
    }
  
    function getProportionPortionCard() {
      return window.proportionPortionCard || null;
    }
  
    function updateSecondaryCards() {
      const proportionIngredientCard = getProportionIngredientCard();
      const proportionPortionCard = getProportionPortionCard();
  
      const showIngredientCard =
        finished &&
        currentMode === "ingredient";
  
      const showPortionCard =
        finished &&
        currentMode === "portion";
  
      if (proportionIngredientWrap) {
        proportionIngredientWrap.classList.toggle("hidden", !showIngredientCard);
      }
  
      if (proportionPortionWrap) {
        proportionPortionWrap.classList.toggle("hidden", !showPortionCard);
      }
  
      if (showIngredientCard && proportionIngredientCard?.refresh) {
        proportionIngredientCard.refresh();
      }
  
      if (showPortionCard && proportionPortionCard?.refresh) {
        proportionPortionCard.refresh();
      }
    }
  
    function setIngredientsFrozen(isFrozen) {
      const textInputs = ingredientsMount.querySelectorAll('input[type="text"]');
      const numberInputs = ingredientsMount.querySelectorAll('input[type="number"]');
      const unitButtons = ingredientsMount.querySelectorAll('[data-field="unit"]');
      const addButtons = ingredientsMount.querySelectorAll(".ingredients-add");
  
      textInputs.forEach((input) => {
        input.readOnly = isFrozen;
        input.tabIndex = isFrozen ? -1 : 0;
      });
  
      numberInputs.forEach((input) => {
        input.readOnly = isFrozen;
        input.tabIndex = isFrozen ? -1 : 0;
      });
  
      unitButtons.forEach((button) => {
        button.disabled = isFrozen;
        button.tabIndex = isFrozen ? -1 : 0;
      });
  
      addButtons.forEach((button) => {
        button.disabled = isFrozen;
        button.tabIndex = isFrozen ? -1 : 0;
      });
  
      const rows = ingredientsMount.querySelectorAll(".ir-row");
  
      rows.forEach((row) => {
        row.dataset.locked = isFrozen ? "true" : "false";
      });
  
      ingredientsMount.classList.toggle("is-frozen", isFrozen);
      document.body.dataset.ingredientsFrozen = isFrozen ? "true" : "false";
    }
  
    function setFinishedState(isFinished) {
      if (isFinished && !hasEnoughCompletedRows()) {
        showCompileWarning();
        updateFineButtonState();
        return;
      }
  
      finished = isFinished;
  
      if (finished) {
        actions.classList.remove("hidden");
        btnFine.textContent = "MODIFICA";
        setIngredientsFrozen(true);
      } else {
        actions.classList.add("hidden");
        btnFine.textContent = "FINE";
        setIngredientsFrozen(false);
      }
  
      updateSecondaryCards();
      updateFineButtonState();
    }
  
    btnFine.addEventListener("click", () => {
      setFinishedState(!finished);
    });
  
    actionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        actionButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
  
        const mode = btn.dataset.mode;
  
        if (!mode) return;
  
        currentMode = mode;
        document.body.dataset.proportionMode = mode;
  
        updateSecondaryCards();
      });
    });
  
    ingredientsMount.addEventListener("input", () => {
      updateFineButtonState();
    });
  
    ingredientsMount.addEventListener("change", () => {
      updateFineButtonState();
    });
  
    const observer = new MutationObserver(() => {
      updateFineButtonState();
    });
  
    observer.observe(ingredientsMount, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-value", "data-unit"]
    });
  
    document.body.dataset.proportionMode = currentMode;
  
    setFinishedState(false);
    updateFineButtonState();
  });