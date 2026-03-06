(function () {
    const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
    const percent = (n) => `${Number(n || 0).toFixed(2)}%`;

    const calculatorConfigs = {
        sip: {
            name: "SIP Calculator",
            fields: [
                { key: "monthly", label: "Investment Amount", min: 500, step: 100, value: 5000, placeholder: "Enter amount" },
                { key: "years", label: "Tenure (Years)", min: 1, step: 1, value: 10, placeholder: "Enter years" },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 12, placeholder: "Enter rate" }
            ],
            calculate: ({ monthly, rate, years }) => {
                const mRate = rate / 1200;
                const months = years * 12;
                const finalValue = mRate ? monthly * ((Math.pow(1 + mRate, months) - 1) / mRate) * (1 + mRate) : monthly * months;
                const investment = monthly * months;
                return { investment, interest: finalValue - investment, finalValue, details: `Rate: ${percent(rate)}, Duration: ${years} years` };
            }
        },
        fd: {
            name: "FD Calculator",
            fields: [
                { key: "principal", label: "Investment Amount", min: 1000, step: 500, value: 200000, placeholder: "Enter amount" },
                { key: "years", label: "Tenure (Years)", min: 1, step: 1, value: 5, placeholder: "Enter years" },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 7, placeholder: "Enter rate" }
            ],
            calculate: ({ principal, rate, years }) => {
                const finalValue = principal * Math.pow(1 + rate / 100, years);
                return { investment: principal, interest: finalValue - principal, finalValue, details: `Compounded yearly at ${percent(rate)}` };
            }
        },
        ppf: {
            name: "PPF Calculator",
            fields: [
                { key: "annual", label: "Investment Amount", min: 500, step: 500, value: 50000, placeholder: "Enter amount" },
                { key: "years", label: "Tenure (Years)", min: 1, step: 1, value: 15, placeholder: "Enter years" },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 7.1, placeholder: "Enter rate" }
            ],
            calculate: ({ annual, rate, years }) => {
                let finalValue = 0;
                for (let year = 1; year <= years; year += 1) finalValue = (finalValue + annual) * (1 + rate / 100);
                return { investment: annual * years, interest: finalValue - annual * years, finalValue, details: "Annual contribution model" };
            }
        },
        rd: {
            name: "RD Calculator",
            fields: [
                { key: "monthly", label: "Investment Amount", min: 500, step: 100, value: 3000, placeholder: "Enter amount" },
                { key: "years", label: "Tenure (Years)", min: 1, step: 1, value: 5, placeholder: "Enter years" },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 7, placeholder: "Enter rate" }
            ],
            calculate: ({ monthly, rate, years }) => {
                const months = years * 12;
                const qRate = rate / 400;
                const finalValue = monthly * months + monthly * months * (months + 1) / 2 * (qRate / 3);
                const investment = monthly * months;
                return { investment, interest: finalValue - investment, finalValue, details: `Approximation at ${percent(rate)}` };
            }
        }
    };

    const supportedOrder = ["sip", "fd", "ppf", "rd"];
    const calculatorASelect = document.getElementById("calculatorASelect");
    const calculatorBSelect = document.getElementById("calculatorBSelect");
    const panelA = document.getElementById("panelA");
    const panelB = document.getElementById("panelB");
    const comparisonResults = document.getElementById("comparisonResults");
    const chartCanvas = document.getElementById("comparisonChart");
    let chart;

    const state = { a: {}, b: {} };

    function populateSelect(select, defaultValue) {
        select.innerHTML = `<option value="">Choose a calculator</option>${supportedOrder.map((slug) => `<option value="${slug}">${calculatorConfigs[slug].name}</option>`).join("")}`;
        select.value = defaultValue;
    }

    function renderPanel(side, slug, panel) {
        const config = calculatorConfigs[slug];
        if (!config) {
            panel.innerHTML = "";
            return;
        }

        state[side] = state[side][slug] || Object.fromEntries(config.fields.map((field) => [field.key, field.value]));

        panel.innerHTML = `
            <div class="compare-panel-grid">
                <h2>${config.name}</h2>
                ${config.fields.map((field) => `
                    <label>${field.label}
                        <input type="number" min="${field.min}" step="${field.step}" value="${state[side][slug][field.key]}" placeholder="${field.placeholder}" data-side="${side}" data-slug="${slug}" data-key="${field.key}">
                    </label>`).join("")}
                <ul class="compare-metrics" data-metrics="${side}"></ul>
            </div>
        `;
    }

    function calculatePanel(side, slug, panel) {
        const config = calculatorConfigs[slug];
        if (!config) return null;

        const values = {};
        config.fields.forEach((field) => {
            const input = panel.querySelector(`[data-key='${field.key}']`);
            values[field.key] = Number(input?.value || 0);
        });

        const result = config.calculate(values);
        const metrics = panel.querySelector(".compare-metrics");
        metrics.innerHTML = `
            <li><strong>Inputs used:</strong> ${config.fields.map((field) => `${field.label}: ${values[field.key]}`).join(" | ")}</li>
            <li><strong>Estimated returns:</strong> ${inr.format(result.interest)}</li>
            <li><strong>Interest gained:</strong> ${inr.format(result.interest)}</li>
            <li><strong>Final maturity value:</strong> ${inr.format(result.finalValue)}</li>
            <li><strong>Summary:</strong> ${result.details}</li>
        `;

        return { label: config.name, ...result };
    }

    function renderChart(resultA, resultB) {
        if (!resultA || !resultB) return;
        const textColor = getComputedStyle(document.body).getPropertyValue("--text").trim() || "#15314b";
        const gridColor = getComputedStyle(document.body).getPropertyValue("--border").trim() || "#d8e6f4";

        const data = {
            labels: ["Total investment", "Total interest", "Final value"],
            datasets: [
                { label: resultA.label, data: [resultA.investment, resultA.interest, resultA.finalValue], backgroundColor: "rgba(13, 110, 253, 0.7)" },
                { label: resultB.label, data: [resultB.investment, resultB.interest, resultB.finalValue], backgroundColor: "rgba(31, 169, 113, 0.7)" }
            ]
        };

        if (chart) chart.destroy();
        chart = new Chart(chartCanvas, {
            type: "bar",
            data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { ticks: { color: textColor }, grid: { color: gridColor } },
                    x: { ticks: { color: textColor }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${inr.format(ctx.parsed.y)}` } }
                }
            }
        });
    }

    function calculateResults() {
        const slugA = calculatorASelect.value;
        const slugB = calculatorBSelect.value;
        if (!slugA || !slugB) {
            comparisonResults.hidden = true;
            return;
        }

        comparisonResults.hidden = false;
        const resultA = calculatePanel("a", slugA, panelA);
        const resultB = calculatePanel("b", slugB, panelB);
        renderChart(resultA, resultB);
    }

    function refreshSelectors() {
        const slugA = calculatorASelect.value;
        const slugB = calculatorBSelect.value;
        if (!slugA || !slugB) {
            comparisonResults.hidden = true;
            return;
        }

        renderPanel("a", slugA, panelA);
        renderPanel("b", slugB, panelB);
        calculateResults();
    }

    comparisonResults.addEventListener("input", (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        const { side, slug, key } = event.target.dataset;
        if (!side || !slug || !key) return;
        state[side][slug][key] = Number(event.target.value || 0);
        calculateResults();
    });

    populateSelect(calculatorASelect, "sip");
    populateSelect(calculatorBSelect, "fd");

    calculatorASelect.addEventListener("change", refreshSelectors);
    calculatorBSelect.addEventListener("change", refreshSelectors);

    refreshSelectors();
})();
