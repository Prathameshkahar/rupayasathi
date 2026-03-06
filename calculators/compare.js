(function () {
    const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
    const percent = (n) => `${n.toFixed(2)}%`;

    const calculatorConfigs = {
        sip: {
            name: "SIP Calculator",
            fields: [
                { key: "monthly", label: "Monthly Investment (₹)", min: 500, step: 100, value: 5000 },
                { key: "rate", label: "Annual Return (%)", min: 0, step: 0.1, value: 12 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 10 }
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
                { key: "principal", label: "Deposit Amount (₹)", min: 1000, step: 500, value: 200000 },
                { key: "rate", label: "Annual Interest (%)", min: 0, step: 0.1, value: 7 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 5 }
            ],
            calculate: ({ principal, rate, years }) => {
                const finalValue = principal * Math.pow(1 + rate / 100, years);
                return { investment: principal, interest: finalValue - principal, finalValue, details: `Compounded yearly at ${percent(rate)}` };
            }
        },
        rd: {
            name: "RD Calculator",
            fields: [
                { key: "monthly", label: "Monthly Deposit (₹)", min: 500, step: 100, value: 3000 },
                { key: "rate", label: "Annual Interest (%)", min: 0, step: 0.1, value: 7 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 5 }
            ],
            calculate: ({ monthly, rate, years }) => {
                const months = years * 12;
                const qRate = rate / 400;
                const finalValue = monthly * months + monthly * months * (months + 1) / 2 * (qRate / 3);
                const investment = monthly * months;
                return { investment, interest: finalValue - investment, finalValue, details: `Approximation at ${percent(rate)}` };
            }
        },
        emi: {
            name: "EMI Calculator",
            fields: [
                { key: "loan", label: "Loan Amount (₹)", min: 10000, step: 1000, value: 500000 },
                { key: "rate", label: "Annual Interest (%)", min: 0, step: 0.1, value: 10 },
                { key: "years", label: "Tenure (Years)", min: 1, step: 1, value: 5 }
            ],
            calculate: ({ loan, rate, years }) => {
                const n = years * 12;
                const r = rate / 1200;
                const emi = r ? loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : loan / n;
                const finalValue = emi * n;
                return { investment: loan, interest: finalValue - loan, finalValue, details: `EMI: ${inr.format(emi)} per month` };
            }
        },
        "mutual-returns": {
            name: "Mutual Fund Returns Calculator",
            fields: [
                { key: "invested", label: "Total Invested (₹)", min: 1000, step: 500, value: 150000 },
                { key: "current", label: "Current Value (₹)", min: 1000, step: 500, value: 220000 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 7 }
            ],
            calculate: ({ invested, current, years }) => {
                const cagr = (Math.pow(current / invested, 1 / years) - 1) * 100;
                return { investment: invested, interest: current - invested, finalValue: current, details: `CAGR: ${percent(cagr)}` };
            }
        },
        ppf: {
            name: "PPF Calculator",
            fields: [
                { key: "annual", label: "Annual Contribution (₹)", min: 500, step: 500, value: 50000 },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 7.1 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 15 }
            ],
            calculate: ({ annual, rate, years }) => {
                let finalValue = 0;
                for (let year = 1; year <= years; year += 1) finalValue = (finalValue + annual) * (1 + rate / 100);
                return { investment: annual * years, interest: finalValue - annual * years, finalValue, details: `Annual contribution model` };
            }
        },
        epf: {
            name: "EPF Calculator",
            fields: [
                { key: "salary", label: "Monthly Salary (₹)", min: 5000, step: 500, value: 50000 },
                { key: "contribution", label: "Total Contribution (%)", min: 1, step: 0.1, value: 15.67 },
                { key: "rate", label: "Interest Rate (%)", min: 0, step: 0.1, value: 8.15 },
                { key: "years", label: "Duration (Years)", min: 1, step: 1, value: 10 }
            ],
            calculate: ({ salary, contribution, rate, years }) => {
                const monthly = salary * (contribution / 100);
                const months = years * 12;
                const mRate = rate / 1200;
                const finalValue = mRate ? monthly * ((Math.pow(1 + mRate, months) - 1) / mRate) * (1 + mRate) : monthly * months;
                const investment = monthly * months;
                return { investment, interest: finalValue - investment, finalValue, details: `Monthly contribution: ${inr.format(monthly)}` };
            }
        },
        "income-tax": {
            name: "Income Tax Calculator",
            fields: [
                { key: "income", label: "Annual Taxable Income (₹)", min: 0, step: 1000, value: 1200000 }
            ],
            calculate: ({ income }) => {
                const slabs = [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]];
                let previous = 0;
                let tax = 0;
                slabs.forEach(([limit, slabRate]) => {
                    if (income > previous) {
                        const taxable = Math.min(income, limit) - previous;
                        tax += taxable * slabRate;
                        previous = limit;
                    }
                });
                if (income <= 1200000) tax = 0;
                const cess = tax * 0.04;
                const finalValue = tax + cess;
                return { investment: income, interest: finalValue, finalValue, details: "Tax + cess estimate" };
            }
        },
        gst: {
            name: "GST Calculator",
            fields: [
                { key: "amount", label: "Base Amount (₹)", min: 1, step: 100, value: 50000 },
                { key: "rate", label: "GST Rate (%)", min: 0, step: 0.1, value: 18 }
            ],
            calculate: ({ amount, rate }) => {
                const gstValue = amount * rate / 100;
                return { investment: amount, interest: gstValue, finalValue: amount + gstValue, details: `GST amount at ${percent(rate)}` };
            }
        }
    };

    const supportedOrder = ["sip", "fd", "rd", "emi", "mutual-returns", "ppf", "epf", "income-tax", "gst"];
    const calculatorASelect = document.getElementById("calculatorASelect");
    const calculatorBSelect = document.getElementById("calculatorBSelect");
    const panelA = document.getElementById("panelA");
    const panelB = document.getElementById("panelB");
    const comparisonResults = document.getElementById("comparisonResults");
    const chartCanvas = document.getElementById("comparisonChart");
    let chart;

    function toInput(field, value, side) {
        return `<label>${field.label}<input type="number" min="${field.min}" step="${field.step}" value="${value}" data-side="${side}" data-key="${field.key}"></label>`;
    }

    function populateSelect(select, defaultValue) {
        select.innerHTML = `<option value="">Choose a calculator</option>${supportedOrder.map((slug) => `<option value="${slug}">${calculatorConfigs[slug].name}</option>`).join("")}`;
        select.value = defaultValue;
    }

    function readInputs(panel, config) {
        return config.fields.reduce((acc, field) => {
            const input = panel.querySelector(`[data-key='${field.key}']`);
            acc[field.key] = Number(input?.value || field.value || 0);
            return acc;
        }, {});
    }

    function renderPanel(side, selectValue, panel) {
        const config = calculatorConfigs[selectValue];
        if (!config) {
            panel.innerHTML = "";
            return null;
        }

        panel.innerHTML = `
            <div class="compare-panel-grid">
                <h2>${config.name}</h2>
                ${config.fields.map((field) => toInput(field, field.value, side)).join("")}
                <ul class="compare-metrics" data-metrics="${side}"></ul>
            </div>
        `;

        const result = config.calculate(readInputs(panel, config));
        const metrics = panel.querySelector(".compare-metrics");
        metrics.innerHTML = `
            <li><strong>Inputs used:</strong> ${config.fields.map((field) => `${field.label.split("(")[0].trim()}: ${readInputs(panel, config)[field.key]}`).join(" | ")}</li>
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

    function refresh() {
        const selectedA = calculatorASelect.value;
        const selectedB = calculatorBSelect.value;
        if (!selectedA || !selectedB) {
            comparisonResults.hidden = true;
            return;
        }

        comparisonResults.hidden = false;
        const resultA = renderPanel("a", selectedA, panelA);
        const resultB = renderPanel("b", selectedB, panelB);
        renderChart(resultA, resultB);

    }

    comparisonResults.addEventListener("input", (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        const updatedA = renderPanel("a", calculatorASelect.value, panelA);
        const updatedB = renderPanel("b", calculatorBSelect.value, panelB);
        renderChart(updatedA, updatedB);
    });

    populateSelect(calculatorASelect, "sip");
    populateSelect(calculatorBSelect, "fd");

    calculatorASelect.addEventListener("change", refresh);
    calculatorBSelect.addEventListener("change", refresh);

    refresh();
})();
