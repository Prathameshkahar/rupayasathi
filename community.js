import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    updateDoc,
    increment,
    serverTimestamp,
    query,
    orderBy,
    onSnapshot,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// Replace with your Firebase project configuration.
const firebaseConfig = {
    apiKey: "REPLACE_WITH_API_KEY",
    authDomain: "REPLACE_WITH_AUTH_DOMAIN",
    projectId: "REPLACE_WITH_PROJECT_ID",
    storageBucket: "REPLACE_WITH_STORAGE_BUCKET",
    messagingSenderId: "REPLACE_WITH_SENDER_ID",
    appId: "REPLACE_WITH_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const prefixes = ["Paisa", "Rupai", "Lakshmi", "Desi", "Naya", "Smart", "Budget", "Saving"];
const suffixes = ["Investor", "Trader", "Guru", "Yodha", "Planner", "Seeker", "Ninja", "Builder"];

const usernameChip = document.getElementById("usernameChip");
const questionCounter = document.getElementById("questionCounter");
const questionForm = document.getElementById("questionForm");
const questionFeedback = document.getElementById("questionFeedback");
const questionsList = document.getElementById("questionsList");
const trendingList = document.getElementById("trendingList");
const liveTickerTrack = document.getElementById("liveTickerTrack");
const heroQuestionInput = document.getElementById("heroQuestionInput");
const titleInput = document.getElementById("questionTitle");


const answersCache = new Map();
let currentUsername = localStorage.getItem("username");

if (!currentUsername) {
    const randomName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    localStorage.setItem("username", randomName);
    currentUsername = randomName;
}

usernameChip.textContent = `Posting as ${currentUsername}`;

const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");


const formatTime = (timestamp) => {
    if (!timestamp?.toDate) {
        return "just now";
    }
    return timestamp.toDate().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
    });
};


const focusAskInput = () => {
    if (!titleInput) {
        return;
    }
    titleInput.focus();
    titleInput.scrollIntoView({ behavior: "smooth", block: "center" });
};

if (heroQuestionInput) {
    heroQuestionInput.addEventListener("focus", focusAskInput);
    heroQuestionInput.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
            return;
        }
        event.preventDefault();
        const value = heroQuestionInput.value.trim();
        if (value && !titleInput.value.trim()) {
            titleInput.value = value;
        }
        focusAskInput();
    });
}

const params = new URLSearchParams(window.location.search);
if (params.get("focus") === "ask") {
    const quickQuestion = params.get("q");
    if (quickQuestion && titleInput && !titleInput.value.trim()) {
        titleInput.value = quickQuestion.slice(0, 120);
    }
    requestAnimationFrame(focusAskInput);
}

const selectedTags = () => Array.from(document.querySelectorAll("#questionTags input:checked")).map((item) => item.value);

const trendingHtml = (questions) => {
    if (!questions.length) {
        trendingList.innerHTML = "<p>No questions yet. Be the first to ask!</p>";
        return;
    }

    const ranked = [...questions].sort((a, b) => {
        const scoreA = (a.upvotes || 0) + (answersCache.get(a.id)?.length || 0);
        const scoreB = (b.upvotes || 0) + (answersCache.get(b.id)?.length || 0);
        return scoreB - scoreA;
    }).slice(0, 5);

    trendingList.innerHTML = ranked.map((question) => `
        <div class="trending-item">
            <strong>${escapeHtml(question.title)}</strong>
            <span>${question.upvotes || 0} upvotes • ${(answersCache.get(question.id) || []).length} answers</span>
        </div>
    `).join("");
};

const answerMarkup = (answer) => `
    <article class="answer-item">
        <p>${escapeHtml(answer.text)}</p>
        <div class="answer-meta">By ${escapeHtml(answer.username)} • ${formatTime(answer.timestamp)}</div>
        <div class="answer-actions">
            <button type="button" class="btn-mini btn-upvote" data-type="answer" data-id="${answer.id}">▲ Upvote (${answer.upvotes || 0})</button>
        </div>
    </article>
`;

const createQuestionMarkup = (question) => {
    const answers = answersCache.get(question.id) || [];

    return `
        <article class="question-card" data-question-id="${question.id}">
            <div class="question-title-row">
                <h3>${escapeHtml(question.title)}</h3>
                <button type="button" class="btn-mini btn-upvote" data-type="question" data-id="${question.id}">▲ Upvote (${question.upvotes || 0})</button>
            </div>
            <p>${escapeHtml(question.description)}</p>
            <p class="question-meta">Asked by: ${escapeHtml(question.username)} • ${formatTime(question.timestamp)}</p>
            ${question.tags?.length ? `<div class="question-tags">${question.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            <div class="question-actions">
                <button type="button" class="btn-mini" data-action="toggle-answers">View Answers (${answers.length})</button>
                <button type="button" class="btn-mini" data-action="toggle-answer-form">Answer</button>
            </div>

            <section class="answer-panel" data-role="answer-panel" hidden>
                <form class="answer-form" data-question-id="${question.id}">
                    <label>Write your answer</label>
                    <textarea rows="3" maxlength="400" required></textarea>
                    <button type="submit" class="btn btn-primary">Submit answer</button>
                </form>
                <div class="answers-container">
                    ${answers.map(answerMarkup).join("") || "<p>No answers yet.</p>"}
                </div>
            </section>
        </article>
    `;
};

const attachAnswerListener = (questionId) => {
    const answerQuery = query(collection(db, "answers"), where("questionId", "==", questionId), orderBy("timestamp", "desc"));
    onSnapshot(answerQuery, (snapshot) => {
        const answers = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        answersCache.set(questionId, answers);

        const answersContainer = document.querySelector(`[data-question-id="${questionId}"] .answers-container`);
        const answerToggle = document.querySelector(`[data-question-id="${questionId}"] [data-action="toggle-answers"]`);

        if (answerToggle) {
            answerToggle.textContent = `View Answers (${answers.length})`;
        }

        if (answersContainer) {
            answersContainer.innerHTML = answers.length ? answers.map(answerMarkup).join("") : "<p>No answers yet.</p>";
        }
    });
};


const updateLiveTicker = (questions) => {
    if (!liveTickerTrack) {
        return;
    }

    if (!questions.length) {
        liveTickerTrack.innerHTML = "<span>Be the first to ask your money question in the live bar.</span>";
        return;
    }

    const latest = questions.slice(0, 10).map((item) => `<span>${escapeHtml(item.title)}</span>`);
    liveTickerTrack.innerHTML = [...latest, ...latest].join("");
};

const questionsQuery = query(collection(db, "questions"), orderBy("timestamp", "desc"));
onSnapshot(questionsQuery, (snapshot) => {
    const questions = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

    questionCounter.textContent = `${questions.length} live questions`;
    questionsList.innerHTML = questions.length ? questions.map(createQuestionMarkup).join("") : "<p>No questions posted yet.</p>";

    questions.forEach((question) => {
        if (!answersCache.has(question.id)) {
            attachAnswerListener(question.id);
        }
    });

    trendingHtml(questions);
    updateLiveTicker(questions);
});

questionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("questionTitle").value.trim();
    const description = document.getElementById("questionDescription").value.trim();
    const tags = selectedTags();

    if (!title || !description) {
        questionFeedback.textContent = "Please enter both title and description.";
        return;
    }

    try {
        await addDoc(collection(db, "questions"), {
            title,
            description,
            tags,
            username: currentUsername,
            timestamp: serverTimestamp(),
            upvotes: 0
        });
        questionForm.reset();
        questionFeedback.textContent = "Question posted successfully.";
    } catch (error) {
        questionFeedback.textContent = "Unable to post question. Please configure Firebase and try again.";
        console.error(error);
    }
});

questionsList.addEventListener("click", async (event) => {
    const upvoteButton = event.target.closest(".btn-upvote");
    if (upvoteButton) {
        const id = upvoteButton.dataset.id;
        const type = upvoteButton.dataset.type;
        const collectionName = type === "question" ? "questions" : "answers";

        upvoteButton.classList.add("is-pulsing");
        setTimeout(() => upvoteButton.classList.remove("is-pulsing"), 320);
        try {
            await updateDoc(doc(db, collectionName, id), { upvotes: increment(1) });
        } catch (error) {
            console.error(error);
        }
        return;
    }

    const questionCard = event.target.closest(".question-card");
    if (!questionCard) {
        return;
    }

    const panel = questionCard.querySelector('[data-role="answer-panel"]');

    if (event.target.matches('[data-action="toggle-answers"], [data-action="toggle-answer-form"]')) {
        panel.hidden = !panel.hidden;
    }
});

questionsList.addEventListener("submit", async (event) => {
    const form = event.target.closest(".answer-form");
    if (!form) {
        return;
    }

    event.preventDefault();

    const textarea = form.querySelector("textarea");
    const text = textarea.value.trim();
    if (!text) {
        return;
    }

    try {
        await addDoc(collection(db, "answers"), {
            questionId: form.dataset.questionId,
            text,
            username: currentUsername,
            timestamp: serverTimestamp(),
            upvotes: 0
        });
        form.reset();
    } catch (error) {
        console.error(error);
    }
});
