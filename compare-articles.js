(function () {
    const optionA = document.getElementById("optionA");
    const optionB = document.getElementById("optionB");
    const button = document.getElementById("generateComparison");
    const article = document.getElementById("generatedArticle");
    const options = ["SIP", "FD", "PPF", "RD", "NPS", "Mutual Funds"];

    const getOpenAiKey = () => localStorage.getItem("openaiApiKey") || window.OPENAI_API_KEY || "";

    const toHtml = (text) => text
        .split("\n")
        .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
            if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
            if (trimmed.startsWith("- ")) return `<li>${trimmed.slice(2)}</li>`;
            return `<p>${trimmed}</p>`;
        })
        .join("")
        .replace(/(<li>.*?<\/li>)(?!\s*<li>)/gms, "<ul>$1</ul>");

    const generateArticle = async (a, b) => {
        const apiKey = getOpenAiKey();
        if (!apiKey) {
            return `# ${a} vs ${b} – Which is Better?\n\n## What is ${a}\nOpenAI API key is missing. Configure localStorage.openaiApiKey to generate AI content.`;
        }

        const prompt = `Write a clear financial comparison for Indian investors between ${a} and ${b}. Include sections:\n\n1. What is ${a}\n2. What is ${b}\n3. Key Differences\n4. Risk Level\n5. Returns Comparison\n6. Liquidity\n7. Tax Treatment\n8. Which is better for long-term investing\n9. Conclusion\n\nReturn clean markdown using one H1 title and H2 section headings.`;
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ model: "gpt-4o-mini", input: prompt, max_output_tokens: 900 })
        });
        if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}`);
        const payload = await response.json();
        return payload.output_text
            || payload.output?.flatMap((item) => item.content || []).find((entry) => entry.type === "output_text")?.text
            || "# Unable to generate content";
    };

    const fillOptions = () => {
        const opts = options.map((item) => `<option value="${item}">${item}</option>`).join("");
        optionA.innerHTML = opts;
        optionB.innerHTML = opts;
        optionA.value = "SIP";
        optionB.value = "FD";
    };

    button.addEventListener("click", async () => {
        if (optionA.value === optionB.value) {
            article.innerHTML = "<p>Please select two different options.</p>";
            return;
        }

        article.innerHTML = '<p class="loading-state">Generating comparison article...</p>';
        button.disabled = true;
        try {
            const content = await generateArticle(optionA.value, optionB.value);
            article.innerHTML = toHtml(content);
        } catch (error) {
            article.innerHTML = `<p>Could not generate article: ${error.message}</p>`;
        } finally {
            button.disabled = false;
        }
    });

    fillOptions();
})();
