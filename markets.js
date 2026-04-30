
document.addEventListener("DOMContentLoaded", () => {
    const ratesGrid = document.getElementById("ratesGrid");
    const chartsGrid = document.getElementById("chartsGrid");
    const currencyInfoGrid = document.getElementById("currencyInfoGrid");

    const targetCurrencies = [
        { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
        { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
        { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
        { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪" },
        { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
        { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳" }
    ];

    const topCurrencies = [
        ["USD", "$", "US Dollar", "Global reserve currency used in trade and commodities pricing."],
        ["EUR", "€", "Euro", "Major shared currency used by many European Union nations."],
        ["GBP", "£", "British Pound", "One of the oldest actively traded currencies worldwide."],
        ["JPY", "¥", "Japanese Yen", "Key Asian currency known for liquidity and safe-haven demand."],
        ["CNY", "¥", "Chinese Yuan", "China's currency with growing importance in global trade."],
        ["CHF", "CHF", "Swiss Franc", "Traditionally viewed as stable during market uncertainty."],
        ["AUD", "A$", "Australian Dollar", "Commodity-linked currency influenced by metals and energy cycles."],
        ["CAD", "C$", "Canadian Dollar", "Often tracks crude oil trends and North American growth."],
        ["SGD", "S$", "Singapore Dollar", "Regional financial hub currency with strong monetary management."],
        ["AED", "د.إ", "UAE Dirham", "Important Gulf currency commonly pegged to the US Dollar."]
    ];

    const chartWidgets = [
        { title: "USD/INR", symbol: "FX_IDC:USDINR" },
        { title: "EUR/INR", symbol: "FX_IDC:EURINR" },
        { title: "GBP/INR", symbol: "FX_IDC:GBPINR" },
        { title: "Gold (XAU/USD)", symbol: "OANDA:XAUUSD" },
        { title: "Crude Oil", symbol: "TVC:USOIL" }
    ];

    const cacheKey = "inr_rates_cache_v1";
    const cacheTtl = 60000;

    const renderTopCurrencies = () => {
        currencyInfoGrid.innerHTML = topCurrencies.map(([code, symbol, name, description]) => `
            <article class="currency-card">
                <h3>${code} - ${name}</h3>
                <p><strong>Symbol:</strong> ${symbol}</p>
                <p>${description}</p>
            </article>
        `).join("");
    };

    const renderRates = (rates) => {
        ratesGrid.innerHTML = targetCurrencies.map(({ code, symbol, name, flag }) => {
            const value = rates[code] ? rates[code].toFixed(4) : "N/A";
            return `<article class="market-card"><p class="rate-value">₹1 = ${symbol}${value}</p><p class="rate-meta">${flag} ${code} (${name})</p></article>`;
        }).join("");
    };

    const getCachedRates = () => {
        const cache = localStorage.getItem(cacheKey);
        if (!cache) return null;
        const parsed = JSON.parse(cache);
        if (Date.now() - parsed.timestamp > cacheTtl) return null;
        return parsed.rates;
    };

    const fetchRates = async () => {
        const cached = getCachedRates();
        if (cached) {
            renderRates(cached);
            return;
        }
        try {
            const response = await fetch("https://api.exchangerate-api.com/v4/latest/INR");
            const data = await response.json();
            localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), rates: data.rates }));
            renderRates(data.rates);
        } catch (error) {
            ratesGrid.innerHTML = '<article class="market-card"><p>Unable to load exchange rates right now.</p></article>';
        }
    };

    const initCharts = () => {
        chartsGrid.innerHTML = chartWidgets.map(({ title, symbol }) => `
            <article class="chart-card">
                <h3>${title}</h3>
                <div class="chart-shell" data-symbol="${symbol}"></div>
            </article>
        `).join("");

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const shell = entry.target;
                const symbol = shell.dataset.symbol;
                const iframe = document.createElement("iframe");
                iframe.className = "chart-frame";
                iframe.loading = "lazy";
                iframe.title = `${symbol} chart`;
                iframe.src = `https://s.tradingview.com/widgetembed/?frameElementId=tv-${symbol}&symbol=${encodeURIComponent(symbol)}&interval=60&hidesidetoolbar=1&symboledit=1&saveimage=0&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=Etc%2FUTC&withdateranges=1&hidevolume=1&allow_symbol_change=1`;
                shell.appendChild(iframe);
                obs.unobserve(shell);
            });
        }, { rootMargin: "150px 0px" });

        document.querySelectorAll(".chart-shell").forEach((shell) => observer.observe(shell));
    };

    renderTopCurrencies();
    initCharts();
    fetchRates();
    window.setInterval(fetchRates, 60000);
});
