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



  function prettifyLabel(label) {
    return label.replace(/\(.*?\)/g, "").trim();
  }

  function buildInfoContent(calculator) {
    const terms = calculator.fields.slice(0, 5).map((field) => ({
      term: prettifyLabel(field.label),
      meaning: `${prettifyLabel(field.label)} is an input used to estimate your ${calculator.name.toLowerCase().replace(" calculator", "")} outcome.`
    }));

    const concept = calculator.fields.map((field) => prettifyLabel(field.label).toLowerCase()).join(", ");

    return `
      <div class="info-divider" role="presentation"></div>
      <h2>What Does This Calculator Do?</h2>
      <p>The ${calculator.name} helps you convert key financial inputs into clear, actionable numbers in seconds. Instead of calculating manually, you can enter your values and instantly see estimates that are useful for everyday money decisions.</p>
      <p>Conceptually, this tool processes factors like ${concept} and applies a standard financial formula in the background. This gives you a practical projection so you can compare options and understand how changing one input can affect your result.</p>
      <p>This calculator is useful for salaried professionals, self-employed users, students, families, and investors who want better visibility before they commit to a plan. It is especially helpful when you need fast estimates during budgeting, investing, borrowing, or tax planning.</p>

      <h2>Why Is This Important?</h2>
      <ul>
        <li>Supports informed financial decisions with quick and structured projections.</li>
        <li>Helps you test real-life what-if scenarios before you commit money.</li>
        <li>Improves planning by showing how small changes can influence long-term outcomes.</li>
        <li>Reduces calculation errors and saves time compared to manual methods.</li>
      </ul>

      <h2>Key Terms Explained</h2>
      <div class="key-terms-grid">
        ${terms.map((item) => `<article><h3>${item.term}</h3><p>${item.meaning}</p></article>`).join("")}
      </div>

      <h2>Frequently Asked Questions</h2>
      <article class="faq-item">
        <h3>How accurate is this calculator?</h3>
        <p>It uses standard formulas for planning estimates. Actual values can vary based on policy changes, charges, taxes, and provider-specific rules.</p>
      </article>
      <article class="faq-item">
        <h3>Who should use this calculator?</h3>
        <p>Anyone who wants faster clarity while planning investments, loans, taxes, or cash flows can use it before taking financial decisions.</p>
      </article>
      <article class="faq-item">
        <h3>How can I use the result effectively?</h3>
        <p>Run multiple scenarios with different inputs, compare outcomes, and choose a plan that best fits your risk profile, monthly budget, and long-term goals.</p>
      </article>
    `;
  }

  function renderCalculatorPage() {
    const container = document.getElementById("calculatorApp");
    const infoContainer = document.getElementById("calculatorInfoSection");
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

    if (infoContainer) {
      infoContainer.innerHTML = buildInfoContent(calculator);
    }

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
