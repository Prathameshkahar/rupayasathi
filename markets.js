document.addEventListener("DOMContentLoaded", () => {
    const primaryApi = "https://open.er-api.com/v6/latest/INR";
    const fallbackApi = "https://api.exchangerate.host/latest?base=INR";
    const trackedCurrencies = ["USD", "EUR", "GBP", "AED", "JPY"];
    const fallbackRates = {
        USD: 0.0120,
        EUR: 0.0111,
        GBP: 0.0095,
        AED: 0.0440,
        JPY: 1.8800
    };

    const symbols = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        AED: "د.إ",
        JPY: "¥"
    };

    const statusEl = document.getElementById("marketStatus");
    const cardsEl = document.getElementById("currency-cards");
    const usdCtx = document.getElementById("usdChart");
    let usdChart = null;

    function getSavedRates() {
        const saved = localStorage.getItem("markets_cached_rates");
        if (!saved) return fallbackRates;
        try {
            return { ...fallbackRates, ...JSON.parse(saved) };
        } catch {
            return fallbackRates;
        }
    }

    async function fetchRates() {
        try {
            const res = await fetch(primaryApi, { cache: "no-store" });
            if (!res.ok) throw new Error("Primary API HTTP error");
            const data = await res.json();
            if (!data.rates) throw new Error("Primary API malformed");
            return { rates: data.rates, source: "primary", warning: false };
        } catch {
            try {
                const res = await fetch(fallbackApi, { cache: "no-store" });
                if (!res.ok) throw new Error("Fallback API HTTP error");
                const data = await res.json();
                if (!data.rates) throw new Error("Fallback API malformed");
                return { rates: data.rates, source: "fallback", warning: true };
            } catch {
                return { rates: getSavedRates(), source: "cache", warning: true };
            }
        }
    }

    function generateData(baseRate) {
        const data = [];
        for (let i = 0; i < 30; i += 1) {
            data.push(baseRate + (Math.random() - 0.5) * 0.002);
        }
        return data;
    }

    function renderCards(rates) {
        cardsEl.innerHTML = trackedCurrencies.map((code) => {
            const rate = Number(rates[code] ?? fallbackRates[code]);
            const symbol = symbols[code] || "";
            return `
                <article class="currency-card">
                    <h3>${code}</h3>
                    <p>₹1 = ${symbol}${rate.toFixed(4)}</p>
                </article>
            `;
        }).join("");
    }

    function renderChart(rate) {
        const ctx = usdCtx.getContext("2d");
        const labels = [...Array(30).keys()].map((d) => `Day ${d + 1}`);

        if (usdChart) usdChart.destroy();

        usdChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "USD/INR (Sample Trend)",
                    data: generateData(rate),
                    borderColor: "#4CAF50",
                    backgroundColor: "rgba(76, 175, 80, 0.15)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue("--text") || "#111"
                        }
                    }
                },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#666" } },
                    y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#666" } }
                }
            }
        });
    }

    async function loadMarketData() {
        statusEl.textContent = "Loading market data...";
        const { rates, source, warning } = await fetchRates();

        renderCards(rates);

        const usdRate = Number(rates.USD ?? fallbackRates.USD);
        renderChart(usdRate);

        localStorage.setItem("markets_cached_rates", JSON.stringify(rates));

        if (warning) {
            statusEl.textContent = "Live data unavailable. Showing last updated values.";
            statusEl.classList.add("status-warning");
        } else {
            statusEl.textContent = `Live rates loaded successfully (${source} API).`;
            statusEl.classList.remove("status-warning");
        }
    }

    loadMarketData();
    setInterval(loadMarketData, 60000);
});
