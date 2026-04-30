document.addEventListener("DOMContentLoaded", () => {
    const ratesGrid = document.getElementById("ratesGrid");
    const currencyInfoGrid = document.getElementById("currencyInfoGrid");

    const currencyMeta = [
        { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", description: "Global reserve currency used in world trade and commodities." },
        { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", description: "Shared currency used across many EU nations." },
        { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", description: "One of the oldest actively traded global currencies." },
        { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", description: "A highly liquid safe-haven currency in Asia." },
        { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳", description: "A key trade currency with rising global influence." },
        { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", description: "Widely used Gulf currency for energy-linked trade." }
    ];

    const chartConfig = {
        USD: { canvasId: "usdChart", title: "USD/INR" },
        EUR: { canvasId: "eurChart", title: "EUR/INR" },
        GBP: { canvasId: "gbpChart", title: "GBP/INR" }
    };

    const charts = {};
    const timeframeDays = { "1D": 1, "1W": 7, "1M": 30, "1Y": 365 };
    const chartState = { USD: "1D", EUR: "1D", GBP: "1D" };

    const showRateSkeletons = () => {
        ratesGrid.innerHTML = Array.from({ length: 6 }).map(() => '<article class="skeleton"></article>').join("");
    };

    const renderTopCurrencies = () => {
        currencyInfoGrid.innerHTML = currencyMeta.map(({ code, name, flag, description }) => `
            <article class="currency-card">
                <h3>${flag} ${code} - ${name}</h3>
                <p>${description}</p>
            </article>
        `).join("");
    };

    const renderRates = (rates, previousRates = {}) => {
        ratesGrid.innerHTML = currencyMeta.map(({ code, symbol, name, flag }) => {
            const rate = rates[code];
            const prev = previousRates[code] || rate;
            const change = prev ? ((rate - prev) / prev) * 100 : 0;
            const trendClass = change >= 0 ? "trend-up" : "trend-down";
            const trendArrow = change >= 0 ? "▲" : "▼";
            return `
            <article class="market-card">
                <div class="rate-header"><h3>${code}</h3><span>${flag}</span></div>
                <p class="rate-value">₹1 = ${symbol}${rate ? rate.toFixed(4) : "N/A"}</p>
                <p class="rate-meta">${name}</p>
                <p class="${trendClass}">${trendArrow} ${Math.abs(change).toFixed(2)}%</p>
            </article>`;
        }).join("");
    };

    const createGradient = (ctx) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, "rgba(13,110,253,0.35)");
        gradient.addColorStop(1, "rgba(13,110,253,0.02)");
        return gradient;
    };

    const buildChart = (pairCode, labels, values) => {
        const canvas = document.getElementById(chartConfig[pairCode].canvasId);
        const ctx = canvas.getContext("2d");
        if (charts[pairCode]) charts[pairCode].destroy();

        charts[pairCode] = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: chartConfig[pairCode].title,
                    data: values,
                    borderColor: "#0d6efd",
                    backgroundColor: createGradient(ctx),
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#6c757d" } },
                    y: { ticks: { color: getComputedStyle(document.documentElement).getPropertyValue("--muted") || "#6c757d" } }
                }
            }
        });
    };

    const fetchHistorical = async (code, timeframe) => {
        const days = timeframeDays[timeframe];
        const end = new Date();
        const start = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
        const formatDate = (d) => d.toISOString().split("T")[0];

        const url = `https://api.exchangerate.host/timeframe?start_date=${formatDate(start)}&end_date=${formatDate(end)}&base=INR&symbols=${code}`;
        const response = await fetch(url);
        const data = await response.json();
        const entries = Object.entries(data.rates || {});
        const labels = entries.map(([date]) => date.slice(5));
        const values = entries.map(([, row]) => row[code]);
        buildChart(code, labels, values);
    };

    const fetchData = async () => {
        try {
            showRateSkeletons();
            const previousRates = JSON.parse(localStorage.getItem("inr_rates_previous") || "{}");
            const response = await fetch("https://api.exchangerate.host/latest?base=INR");
            const data = await response.json();
            renderRates(data.rates, previousRates);
            localStorage.setItem("inr_rates_previous", JSON.stringify(data.rates));

            await Promise.all(Object.keys(chartConfig).map((code) => fetchHistorical(code, chartState[code])));
        } catch (error) {
            ratesGrid.innerHTML = '<article class="market-card"><p>Unable to load market data right now.</p></article>';
        }
    };

    document.querySelectorAll(".timeframe-selector").forEach((selector) => {
        selector.addEventListener("click", async (event) => {
            const btn = event.target.closest(".time-btn");
            if (!btn) return;

            selector.querySelectorAll(".time-btn").forEach((node) => node.classList.remove("is-active"));
            btn.classList.add("is-active");

            const pair = selector.dataset.pair;
            const timeframe = btn.dataset.timeframe;
            chartState[pair] = timeframe;
            await fetchHistorical(pair, timeframe);
        });
    });

    renderTopCurrencies();
    fetchData();
    window.setInterval(fetchData, 60000);
});
