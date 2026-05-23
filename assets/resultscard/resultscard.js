function safeText(value = "") {
    return String(value ?? "").trim();
  }
  
  function buildTitle(context = {}) {
    const ingredient = safeText(context.ingredient);
    const quantity = safeText(context.quantity);
    const unit = safeText(context.unit);
  
    const value = unit ? `${quantity} ${unit}` : quantity;
  
    if (!ingredient || !quantity) {
      return "Ingredienti proporzionati";
    }
  
    return `Ingredienti proporzionati in base a ${ingredient} ${value}`;
  }
  
  export function createResultsCard(results = [], context = {}) {
    const card = document.createElement("section");
    card.className = "ingredients-card rcard";
  
    card.innerHTML = `
      <div class="rcard-head">
        <div class="rcard-title-wrap">
          <h2 class="rcard-title"></h2>
        </div>
      </div>
  
      <div class="rcard-body">
        <div class="rcard-list"></div>
      </div>
    `;
  
    card.updateResults = (newResults = [], newContext = {}) => {
      renderResults(card, newResults, newContext);
    };
  
    renderResults(card, results, context);
  
    return card;
  }
  
  export function renderResults(card, results = [], context = {}) {
    const title = card.querySelector(".rcard-title");
    const list = card.querySelector(".rcard-list");
  
    if (!title || !list) return;
  
    title.textContent = buildTitle(context);
  
    list.innerHTML = "";
  
    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "rcard-empty";
      empty.textContent = "Nessun risultato da mostrare.";
      list.appendChild(empty);
      return;
    }
  
    results.forEach((item) => {
      const row = document.createElement("div");
      row.className = "rcard-row";
  
      const name = document.createElement("span");
      name.className = "rcard-name";
      name.textContent = safeText(item.name);
  
      const value = document.createElement("span");
      value.className = "rcard-value";
  
      const quantity = safeText(item.quantity);
      const unit = safeText(item.unit);
  
      value.textContent = unit ? `${quantity} ${unit}` : quantity;
  
      row.appendChild(name);
      row.appendChild(value);
  
      list.appendChild(row);
    });
  }