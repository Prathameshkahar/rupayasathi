(function () {
    const AI_PROVIDER = window.AI_PROVIDER || "openai"; // "openai" or "gemini"

    const OPENAI_API_URL = "https://api.openai.com/v1/responses";
    const GEMINI_MODEL = "gemini-1.5-flash";

    const form = document.getElementById("assistantForm");
    const input = document.getElementById("assistantQuestion");
    const chatMessages = document.getElementById("chatMessages");
    const askButton = document.getElementById("askButton");

    if (!form || !input || !chatMessages || !askButton) {
        return;
    }

    const timestamp = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const scrollToBottom = () => {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: "smooth" });
    };

    const addMessage = (text, role, options = {}) => {
        const bubble = document.createElement("article");
        bubble.className = `chat-bubble ${role} ${options.extraClass || ""}`.trim();

        const textNode = document.createElement("p");
        textNode.textContent = text;
        bubble.appendChild(textNode);

        const timeNode = document.createElement("span");
        timeNode.className = "message-time";
        timeNode.textContent = timestamp();
        bubble.appendChild(timeNode);

        if (role === "chat-ai" && !options.isLoading) {
            const disclaimer = document.createElement("p");
            disclaimer.className = "assistant-disclaimer";
            disclaimer.textContent = "This AI-generated response is for informational purposes only and should not replace professional financial advice.";
            bubble.appendChild(disclaimer);
        }

        chatMessages.appendChild(bubble);
        scrollToBottom();
        return { bubble, textNode, timeNode };
    };

    const getOpenAiKey = () => localStorage.getItem("openaiApiKey") || window.OPENAI_API_KEY || "";
    const getGeminiKey = () => localStorage.getItem("geminiApiKey") || window.GEMINI_API_KEY || "";

    const getPrompt = (question) => `You are a financial assistant for Indian users. Answer clearly and concisely: ${question}`;

    const askOpenAi = async (question) => {
        const apiKey = getOpenAiKey();
        if (!apiKey) {
            throw new Error("OpenAI API key missing. Set localStorage.openaiApiKey or window.OPENAI_API_KEY.");
        }

        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                input: getPrompt(question),
                max_output_tokens: 350
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI request failed (${response.status}).`);
        }

        const payload = await response.json();
        return payload.output_text
            || payload.output?.flatMap((item) => item.content || []).find((entry) => entry.type === "output_text")?.text
            || "I could not generate a response right now.";
    };

    const askGemini = async (question) => {
        const apiKey = getGeminiKey();
        if (!apiKey) {
            throw new Error("Gemini API key missing. Set localStorage.geminiApiKey or window.GEMINI_API_KEY.");
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [{ text: getPrompt(question) }]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini request failed (${response.status}).`);
        }

        const payload = await response.json();
        return payload.candidates?.[0]?.content?.parts?.[0]?.text || "I could not generate a response right now.";
    };

    const askAssistant = (question) => {
        if (AI_PROVIDER === "gemini") {
            return askGemini(question);
        }

        return askOpenAi(question);
    };

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const question = input.value.trim();
        if (!question) {
            return;
        }

        addMessage(question, "chat-user");
        input.value = "";
        askButton.disabled = true;

        const loading = addMessage("Thinking", "chat-ai", { isLoading: true, extraClass: "loading-dots" });

        try {
            const answer = await askAssistant(question);
            loading.bubble.classList.remove("loading-dots");
            loading.textNode.textContent = answer;
            loading.timeNode.textContent = timestamp();

            const disclaimer = document.createElement("p");
            disclaimer.className = "assistant-disclaimer";
            disclaimer.textContent = "This AI-generated response is for informational purposes only and should not replace professional financial advice.";
            loading.bubble.appendChild(disclaimer);
        } catch (error) {
            loading.bubble.classList.remove("loading-dots");
            loading.textNode.textContent = `Sorry, something went wrong: ${error.message}`;
            loading.timeNode.textContent = timestamp();

            const disclaimer = document.createElement("p");
            disclaimer.className = "assistant-disclaimer";
            disclaimer.textContent = "This AI-generated response is for informational purposes only and should not replace professional financial advice.";
            loading.bubble.appendChild(disclaimer);
        } finally {
            askButton.disabled = false;
            input.focus();
            scrollToBottom();
        }
    });
})();
