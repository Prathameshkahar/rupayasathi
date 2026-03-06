(function () {
  const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
  const fixedRateBySlug = { ppf: 7.1, ssy: 8.2, epf: 8.15 };
  const sliderSlugs = new Set(["sip", "emi", "fd", "rd", "mutual-returns", "home-loan-emi", "car-loan-emi", "personal-emi"]);

  function findCalculator(slug) {
    return window.CALCULATORS.find((item) => item.slug === slug);
  }

  function getCalculatorConfig(slug) {
    const base = findCalculator(slug);
    if (!base) return null;

    if (slug === "mutual-returns") {
      return {
        ...base,
        description: "Estimate maturity value and wealth gain using expected annual return assumptions.",
        fields: [
          { key: "invested", label: "Investment Amount (₹)", type: "number", min: 1, step: "100", value: 100000 },
          { key: "rate", label: "Expected Annual Return (%)", type: "number", min: 0, max: 30, step: "0.1", value: 12 },
          { key: "years", label: "Investment Duration (Years)", type: "number", min: 1, max: 40, step: "1", value: 10 }
        ],
        calculate: ({ invested, rate, years }) => {
          const current = invested * Math.pow(1 + rate / 100, years);
          return [["Estimated Value", current, "currency"], ["Total Invested", invested, "currency"], ["Estimated Wealth Gain", current - invested, "currency"], ["CAGR", rate, "percent"]];
        }
      };
    }

    return base;
  }

  function formatValue(value, type) {
    if (type === "currency") return inr.format(value);
    if (type === "percent") return `${value.toFixed(2)}%`;
    return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  }

  function parseNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
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

  function summarizeResults(rows) {
    const currencyRows = rows.filter((row) => row[2] === "currency");
    let invested = 0;
    let interest = 0;
    let finalValue = currencyRows.length ? currencyRows[0][1] : 0;

    currencyRows.forEach(([label, value]) => {
      const key = label.toLowerCase();
      if (/invest|deposit|contribution|principal|loan amount/.test(key)) invested = value;
      if (/interest|gain|profit|wealth/.test(key)) interest = value;
      if (/maturity|final|future|amount|corpus|value|liability/.test(key)) finalValue = Math.max(finalValue, value);
    });

    if (!interest && currencyRows.length > 1) {
      interest = Math.max(finalValue - invested, 0);
    }
    if (!invested && currencyRows.length > 1) {
      invested = Math.max(finalValue - interest, 0);
    }

    return {
      invested: Math.max(invested, 0),
      interest: Math.max(interest, 0),
      finalValue: Math.max(finalValue, 0)
    };
  }

  function buildYearlySeries(values, summary) {
    const years = Math.max(1, Math.round(values.years || values.tenure || values.duration || 10));
    const labels = [];
    const points = [];
    const growth = summary.invested > 0 ? Math.pow(summary.finalValue / Math.max(summary.invested, 1), 1 / years) - 1 : 0;
    for (let year = 1; year <= years; year += 1) {
      labels.push(`Year ${year}`);
      if (values.monthly) {
        const investedSoFar = values.monthly * 12 * year;
        points.push(investedSoFar * Math.pow(1 + growth, Math.max(0, years - year)));
      } else {
        points.push(summary.invested * Math.pow(1 + growth, year));
      }
    }
    return { labels, points };
  }

  function animateNumber(el, target, type) {
    const duration = 700;
    const startTime = performance.now();
    const start = Number(el.dataset.value || 0);

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const value = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      el.textContent = formatValue(value, type);
      if (progress < 1) requestAnimationFrame(tick);
      else el.dataset.value = String(target);
    }

    requestAnimationFrame(tick);
  }

  function loadChartJs() {
    if (window.Chart) return Promise.resolve(window.Chart);
    if (window.__chartLoadingPromise) return window.__chartLoadingPromise;

    window.__chartLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js";
      script.onload = () => resolve(window.Chart);
      script.onerror = () => reject(new Error("Chart.js failed to load"));
      document.head.appendChild(script);
    });

    return window.__chartLoadingPromise;
  }

  function renderCalculatorPage() {
    const container = document.getElementById("calculatorApp");
    const infoContainer = document.getElementById("calculatorInfoSection");
    if (!container) return;

    const slug = container.dataset.calculator;
    const calculator = getCalculatorConfig(slug);

    if (!calculator) {
      container.innerHTML = '<p class="error-state result-card">Calculator configuration not found.</p>';
      return;
    }

    const usesSlider = sliderSlugs.has(slug);
    container.classList.add("calculator-shell");

    container.innerHTML = `
      <h1>${calculator.name}</h1>
      <p class="section-intro">${calculator.description}</p>
      <section class="calculator-layout">
        <form id="dynamicCalculatorForm" class="inputs-card">
          <h2>Enter Inputs</h2>
          ${calculator.fields.map((field) => {
            const isRateFixed = fixedRateBySlug[slug] && field.key === "rate";
            const initialValue = isRateFixed ? fixedRateBySlug[slug] : (field.value ?? field.min ?? "");
            const showSlider = usesSlider && field.type !== "text" && field.type !== "select";
            const min = field.min ?? 0;
            const max = field.max ?? (field.key.toLowerCase().includes("rate") ? 30 : (field.key.toLowerCase().includes("year") ? 40 : 1000000));
            const step = field.step ?? "1";
            return `
              <div class="field-group">
                <label for="${field.key}">${field.label}</label>
                <div class="field-inline">
                  <input id="${field.key}" data-key="${field.key}" type="${field.type || "number"}" min="${field.min ?? ""}" max="${field.max ?? ""}" step="${field.step ?? "any"}" value="${initialValue}" ${isRateFixed ? "readonly" : ""} required>
                  ${showSlider ? `<input class="range-control" data-sync="${field.key}" type="range" min="${min}" max="${max}" step="${step}" value="${initialValue}" ${isRateFixed ? "disabled" : ""}>` : ""}
                </div>
                <small class="field-help">${isRateFixed ? `Current Government Rate: ${fixedRateBySlug[slug]}% (may change periodically)` : "Adjust values to compare scenarios in real time."}</small>
              </div>
            `;
          }).join("")}
        </form>

        <section class="result-panel card" aria-live="polite">
          <h2>Estimated Results</h2>
          <div class="result-metrics">
            <article><span>Total Investment</span><strong id="metricInvested">${inr.format(0)}</strong></article>
            <article><span>Total Interest Earned</span><strong id="metricInterest">${inr.format(0)}</strong></article>
            <article><span>Final Value</span><strong id="metricFinal">${inr.format(0)}</strong></article>
          </div>
          <div class="chart-grid">
            <div class="chart-card"><canvas id="splitChart" aria-label="Investment split chart"></canvas></div>
            <div class="chart-card"><canvas id="growthChart" aria-label="Yearly growth chart"></canvas></div>
          </div>
          <div class="breakdown-table" id="breakdownTable"></div>
        </section>
      </section>
      <a class="btn btn-outline full-width" href="../calculators.html">← Back to Calculators Hub</a>
    `;

    if (infoContainer) {
      infoContainer.innerHTML = buildInfoContent(calculator);
    }

    const form = document.getElementById("dynamicCalculatorForm");
    const breakdownTable = document.getElementById("breakdownTable");
    const investedEl = document.getElementById("metricInvested");
    const interestEl = document.getElementById("metricInterest");
    const finalEl = document.getElementById("metricFinal");
    let splitChart;
    let growthChart;

    function collectValues() {
      const values = {};
      let valid = true;
      calculator.fields.forEach((field) => {
        const value = parseNumber(document.getElementById(field.key).value);
        if (!Number.isFinite(value)) valid = false;
        values[field.key] = value;
      });
      return { values, valid };
    }

    function renderCharts(summary, values) {
      loadChartJs().then((Chart) => {
        const splitCtx = document.getElementById("splitChart");
        const growthCtx = document.getElementById("growthChart");
        if (!splitCtx || !growthCtx) return;

        if (splitChart) splitChart.destroy();
        if (growthChart) growthChart.destroy();

        splitChart = new Chart(splitCtx, {
          type: "doughnut",
          data: {
            labels: ["Principal / Investment", "Interest / Returns"],
            datasets: [{ data: [summary.invested, summary.interest], backgroundColor: ["#1f6feb", "#1fa971"], borderWidth: 0 }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom" }, tooltip: { enabled: true } },
            animation: { duration: 700 }
          }
        });

        const series = buildYearlySeries(values, summary);
        growthChart = new Chart(growthCtx, {
          type: "bar",
          data: {
            labels: series.labels,
            datasets: [{ label: "Portfolio Value", data: series.points, borderRadius: 6, backgroundColor: "rgba(31,169,113,0.7)" }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { tooltip: { enabled: true } },
            scales: { y: { ticks: { callback: (value) => inr.format(value) } } },
            animation: { duration: 750 }
          }
        });
      }).catch(() => {
        breakdownTable.insertAdjacentHTML("beforeend", '<p class="field-help">Charts are unavailable right now, but results are accurate.</p>');
      });
    }

    function updateResults() {
      const { values, valid } = collectValues();
      if (!valid) return;

      const rows = calculator.calculate(values);
      const summary = summarizeResults(rows);
      animateNumber(investedEl, summary.invested, "currency");
      animateNumber(interestEl, summary.interest, "currency");
      animateNumber(finalEl, summary.finalValue, "currency");

      breakdownTable.innerHTML = `
        <table>
          <tr><th>Total Investment</th><td>${inr.format(summary.invested)}</td></tr>
          <tr><th>Interest Earned</th><td>${inr.format(summary.interest)}</td></tr>
          <tr><th>Final Value</th><td>${inr.format(summary.finalValue)}</td></tr>
          ${rows.map(([label, value, type]) => `<tr><th>${label}</th><td>${formatValue(value, type)}</td></tr>`).join("")}
        </table>
      `;

      renderCharts(summary, values);
    }

    form.addEventListener("input", (event) => {
      const target = event.target;
      if (target.classList.contains("range-control")) {
        const input = form.querySelector(`#${target.dataset.sync}`);
        if (input) input.value = target.value;
      } else if (target.matches("input[type='number']")) {
        const slider = form.querySelector(`.range-control[data-sync='${target.id}']`);
        if (slider) slider.value = target.value;
      }
      updateResults();
    });

    updateResults();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHub();
    renderCalculatorPage();
  });
})();
