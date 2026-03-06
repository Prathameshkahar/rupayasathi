import {
    createPost,
    createComment,
    watchPosts,
    watchCommentsByPost,
    upvotePost,
    upvoteComment
} from "./community-db.js";
import { getCommunityIdentity } from "./community-auth.js";

const identityChip = document.getElementById("identityChip");
const postForm = document.getElementById("postForm");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
const postMessage = document.getElementById("postMessage");
const postsFeed = document.getElementById("postsFeed");
const trendingQuestions = document.getElementById("trendingQuestions");
const askQuestionBtn = document.getElementById("askQuestionBtn");
const threadView = document.getElementById("threadView");
const myActivityText = document.getElementById("myActivityText");

let viewer = { uid: null, username: "Guest", avatar: "" };
let postsCache = [];
let activeCommentUnsub = null;

const votedPostKey = "communityVotedPosts";
const votedCommentKey = "communityVotedComments";

const getVoted = (key) => new Set(JSON.parse(localStorage.getItem(key) || "[]"));
const saveVoted = (key, values) => localStorage.setItem(key, JSON.stringify([...values]));

const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatTime = (ts) => ts?.toDate ? ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "just now";

const avatarMarkup = (avatar, username) => `<img class="avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(username)} avatar" loading="lazy" referrerpolicy="no-referrer" onerror="this.outerHTML='<span class=&quot;avatar avatar-fallback&quot; style=&quot;background:#5f7aa6;&quot;>${escapeHtml((username || 'U').slice(0,2).toUpperCase())}</span>'">`;

const postCardMarkup = (post) => `
<article class="post-card card" data-post-id="${post.id}">
    <div class="vote-col">
        <button class="vote-btn" data-action="upvote-post" data-id="${post.id}" aria-label="Upvote post">▲</button>
        <strong>${post.upvotes || 0}</strong>
    </div>
    <div>
        <div class="post-head">
            ${avatarMarkup(post.avatar, post.username)}
            <div>
                <div class="username">${escapeHtml(post.username)}</div>
                <div class="timestamp">${formatTime(post.timestamp)}</div>
            </div>
        </div>
        <h3 class="post-title">${escapeHtml(post.title)}</h3>
        <p class="post-text">${escapeHtml(post.content)}</p>
        <div class="post-actions">
            <button type="button" data-action="open-thread" data-id="${post.id}">Comment</button>
            <button type="button">Share</button>
            <button type="button" data-action="upvote-post" data-id="${post.id}">Upvote</button>
        </div>
    </div>
</article>`;

const renderTrending = () => {
    const ranked = [...postsCache].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 5);
    trendingQuestions.innerHTML = ranked.length
        ? ranked.map((post) => `<button class="shortcut-item" data-action="open-thread" data-id="${post.id}">${escapeHtml(post.title)}</button>`).join("")
        : "<p>No trending questions yet.</p>";
};

const setActivity = () => {
    const myPosts = postsCache.filter((post) => post.username === viewer.username).length;
    myActivityText.textContent = myPosts ? `You have posted ${myPosts} question${myPosts > 1 ? "s" : ""}.` : "No activity yet.";
};

const openThread = (postId) => {
    const post = postsCache.find((item) => item.id === postId);
    if (!post) {
        return;
    }

    if (activeCommentUnsub) activeCommentUnsub();

    const url = new URL(window.location.href);
    url.searchParams.set("post", postId);
    window.history.replaceState({}, "", url);

    threadView.hidden = false;
    threadView.innerHTML = `<h2>Discussion Thread</h2>${postCardMarkup(post)}<div id="commentList" class="comment-list"><p>Loading answers...</p></div>
    <form id="commentForm" class="comment-form">
        <input id="commentText" type="text" maxlength="400" placeholder="Write your answer" required>
        <button class="btn btn-primary" type="submit">Add Answer</button>
    </form>`;

    const commentList = document.getElementById("commentList");
    const commentForm = document.getElementById("commentForm");
    const commentText = document.getElementById("commentText");

    activeCommentUnsub = watchCommentsByPost(postId, (comments) => {
        commentList.innerHTML = comments.length ? comments.map((comment) => `
            <article class="comment-item" data-comment-id="${comment.id}">
                <div class="post-head">${avatarMarkup(comment.avatar, comment.username)}<div><div class="username">${escapeHtml(comment.username)}</div><div class="timestamp">${formatTime(comment.timestamp)}</div></div></div>
                <p>${escapeHtml(comment.text)}</p>
                <button class="vote-btn" data-action="upvote-comment" data-id="${comment.id}">▲ ${comment.upvotes || 0}</button>
            </article>
        `).join("") : "<p>No answers yet.</p>";
    }, () => {
        commentList.innerHTML = "<p>Unable to load answers. Configure Firebase credentials.</p>";
    });

    commentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = commentText.value.trim();
        if (!text) return;

        await createComment({ postId, username: viewer.username, avatar: viewer.avatar, text });
        commentText.value = "";
    });

    threadView.scrollIntoView({ behavior: "smooth", block: "start" });
};

postForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = postTitle.value.trim();
    const content = postContent.value.trim();

    if (!title || !content) {
        postMessage.textContent = "Please add title and description.";
        return;
    }

    try {
        await createPost({ username: viewer.username, avatar: viewer.avatar, title, content });
        postTitle.value = "";
        postContent.value = "";
        postMessage.textContent = "Posted successfully.";
    } catch (error) {
        postMessage.textContent = "Unable to post. Add valid Firebase config and auth rules.";
    }
});

postsFeed.addEventListener("click", async (event) => {
    const target = event.target.closest("button, .post-card");
    if (!target) return;

    const action = target.dataset.action;
    const id = target.dataset.id || target.closest(".post-card")?.dataset.postId;

    if (action === "open-thread" || target.classList.contains("post-card")) {
        openThread(id);
        return;
    }

    if (action === "upvote-post") {
        const voted = getVoted(votedPostKey);
        if (voted.has(id)) return;
        voted.add(id);
        saveVoted(votedPostKey, voted);
        await upvotePost(id);
    }
});

threadView.addEventListener("click", async (event) => {
    const target = event.target.closest("[data-action='upvote-comment']");
    if (!target) return;
    const id = target.dataset.id;
    const voted = getVoted(votedCommentKey);
    if (voted.has(id)) return;
    voted.add(id);
    saveVoted(votedCommentKey, voted);
    await upvoteComment(id);
});

askQuestionBtn.addEventListener("click", () => {
    document.getElementById("ask-box").scrollIntoView({ behavior: "smooth" });
    postTitle.focus();
});

const init = async () => {
    viewer = await getCommunityIdentity();
    identityChip.textContent = `Signed in anonymously as ${viewer.username}`;

    watchPosts((posts) => {
        postsCache = posts;
        postsFeed.innerHTML = posts.length ? posts.map(postCardMarkup).join("") : "<article class='card'>No questions yet. Ask the first question.</article>";
        renderTrending();
        setActivity();

        const selected = new URLSearchParams(window.location.search).get("post");
        if (selected && posts.some((item) => item.id === selected)) {
            openThread(selected);
        }
    }, () => {
        postsFeed.innerHTML = "<article class='card'>Unable to load real-time feed. Update firebase-config.js and Firestore rules.</article>";
    });
};

init();
