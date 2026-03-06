(function () {
    const form = document.getElementById("assistantForm");
    const input = document.getElementById("assistantQuestion");
    const chatMessages = document.getElementById("chatMessages");

    const getOpenAiKey = () => localStorage.getItem("openaiApiKey") || window.OPENAI_API_KEY || "";

    const addBubble = (text, type, extraClass = "") => {
        const bubble = document.createElement("article");
        bubble.className = `chat-bubble ${type} ${extraClass}`.trim();
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    };

    const askAssistant = async (question) => {
        const apiKey = getOpenAiKey();
        if (!apiKey) {
            return "OpenAI API key is missing. Set localStorage.openaiApiKey to enable AI responses.";
        }

        const prompt = `You are a helpful financial assistant for Indian users. Explain clearly and simply: ${question}`;
        const response = await fetch("https://api.openai.com/v1/responses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({ model: "gpt-4o-mini", input: prompt, max_output_tokens: 350 })
        });

        if (!response.ok) throw new Error(`OpenAI request failed with status ${response.status}`);

        const payload = await response.json();
        return payload.output_text
            || payload.output?.flatMap((item) => item.content || []).find((entry) => entry.type === "output_text")?.text
            || "AI could not generate an answer right now.";
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) return;

        addBubble(question, "chat-user");
        input.value = "";
        const loadingBubble = addBubble("Thinking", "chat-ai", "loading-dots");

        try {
            const answer = await askAssistant(question);
            loadingBubble.classList.remove("loading-dots");
            loadingBubble.textContent = answer;
        } catch (error) {
            loadingBubble.classList.remove("loading-dots");
            loadingBubble.textContent = `Sorry, something went wrong: ${error.message}`;
        }
    });
})();
