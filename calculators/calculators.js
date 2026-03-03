(function () {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

  function findCalculator(slug) {
    return window.CALCULATORS.find((item) => item.slug === slug);
  }

  function formatValue(value, type) {
    if (type === "currency") return inr.format(value);
    if (type === "percent") return `${value.toFixed(2)}%`;
    return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }

  function renderHub() {
    const holder = document.getElementById("calculatorCards");
    if (!holder) return;
    holder.innerHTML = window.CALCULATORS.map((item) => `
      <article class="card calc-card">
        <div class="calc-icon">${item.icon}</div>
        <p class="calc-category">${item.category}</p>
        <h2>${item.name}</h2>
        <p>${item.description}</p>
        <a class="btn btn-primary" href="calculators/${item.slug}.html">Open Calculator</a>
      </article>
    `).join("");
  }

  function renderCalculatorPage() {
    const container = document.getElementById("calculatorApp");
    if (!container) return;

    const slug = container.dataset.calculator;
    const calculator = findCalculator(slug);
    if (!calculator) {
      container.innerHTML = '<p class="error-state result-card">Calculator configuration not found.</p>';
      return;
    }

    container.innerHTML = `
      <h1>${calculator.name}</h1>
      <p class="section-intro">${calculator.description}</p>
      <form id="dynamicCalculatorForm">
        ${calculator.fields.map((field) => `
          <div class="field-group">
            <label for="${field.key}">${field.label}</label>
            <input id="${field.key}" type="${field.type || "number"}" min="${field.min ?? ""}" max="${field.max ?? ""}" step="${field.step ?? "any"}" value="${field.value ?? ""}" required>
          </div>
        `).join("")}
        <button type="submit" class="btn btn-primary full-width">Calculate</button>
      </form>
      <div class="result-card" id="resultBox" aria-live="polite">Enter values and click calculate.</div>
      <a class="btn btn-outline full-width" href="../calculators.html">← Back to Calculators Hub</a>
    `;

    const form = document.getElementById("dynamicCalculatorForm");
    const resultBox = document.getElementById("resultBox");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = {};
      let valid = true;
      calculator.fields.forEach((field) => {
        const value = Number(document.getElementById(field.key).value);
        if (Number.isNaN(value)) valid = false;
        values[field.key] = value;
      });

      if (!valid) {
        resultBox.className = "result-card error-state";
        resultBox.textContent = "Please enter valid values in all fields.";
        return;
      }

      const rows = calculator.calculate(values);
      resultBox.className = "result-card";
      resultBox.innerHTML = rows.map(([label, value, type]) => `<strong>${label}:</strong> ${formatValue(value, type)}`).join("<br>");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHub();
    renderCalculatorPage();
  });
})();
