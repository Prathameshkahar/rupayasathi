import {
    createPost,
    createComment,
    watchPosts,
    watchCommentsByPost,
    upvotePost,
    upvoteComment,
    upsertUserProfile,
    watchUserProfile
} from "./community-db.js";
import { getCommunityIdentity } from "./community-auth.js";
import { initProfilePanel } from "./profile-panel.js";

const identityChip = document.getElementById("identityChip");
const postForm = document.getElementById("postForm");
const postTitle = document.getElementById("postTitle");
const postContent = document.getElementById("postContent");
const postMessage = document.getElementById("postMessage");
const postsFeed = document.getElementById("postsFeed");
const trendingQuestions = document.getElementById("trendingQuestions");
const askQuestionBtn = document.getElementById("askQuestionBtn");
const heroAskBtn = document.getElementById("heroAskBtn");
const threadView = document.getElementById("threadView");
const myActivityText = document.getElementById("myActivityText");

let viewer = null;
let viewerProfile = null;
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

const avatarMarkup = (avatar, username) => `<img class="avatar" src="${escapeHtml(avatar)}" alt="${escapeHtml(username)} avatar" loading="lazy" referrerpolicy="no-referrer">`;

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
            <button type="button" class="action-btn" data-action="open-thread" data-id="${post.id}">Comment (${post.commentsCount || 0})</button>
            <button type="button" class="action-btn" data-action="share-post" data-id="${post.id}">Share</button>
            <button type="button" class="action-btn" data-action="upvote-post" data-id="${post.id}">Upvote</button>
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
    const myPosts = postsCache.filter((post) => post.userId === viewer.uid).length;
    myActivityText.textContent = myPosts ? `You have posted ${myPosts} question${myPosts > 1 ? "s" : ""}.` : "No activity yet.";
};

const openThread = (postId) => {
    const post = postsCache.find((item) => item.id === postId);
    if (!post) return;
    if (activeCommentUnsub) activeCommentUnsub();

    const url = new URL(window.location.href);
    url.searchParams.set("post", postId);
    window.history.replaceState({}, "", url);

    threadView.hidden = false;
    threadView.innerHTML = `
        <div class="post-actions"><button class="action-btn" data-action="close-thread">← Back to feed</button></div>
        <h2>Discussion Thread</h2>
        ${postCardMarkup(post)}
        <div id="commentList" class="comment-list"><p>Loading answers...</p></div>
        <form id="commentForm" class="comment-form">
            <input id="commentText" type="text" maxlength="400" placeholder="Write your answer" required>
            <button class="btn btn-primary animated-btn" type="submit">Add Answer</button>
        </form>`;

    const commentList = document.getElementById("commentList");
    const commentForm = document.getElementById("commentForm");
    const commentText = document.getElementById("commentText");

    activeCommentUnsub = watchCommentsByPost(postId, (comments) => {
        const roots = comments.filter((item) => !item.parentCommentId);
        const repliesMap = comments.filter((item) => item.parentCommentId).reduce((acc, item) => {
            acc[item.parentCommentId] = [...(acc[item.parentCommentId] || []), item];
            return acc;
        }, {});

        commentList.innerHTML = roots.length ? roots.map((comment) => `
            <article class="comment-item" data-comment-id="${comment.id}">
                <div class="post-head">${avatarMarkup(comment.avatar, comment.username)}<div><div class="username">${escapeHtml(comment.username)}</div><div class="timestamp">${formatTime(comment.timestamp)}</div></div></div>
                <p>${escapeHtml(comment.text)}</p>
                <div class="post-actions">
                    <button class="vote-btn" data-action="upvote-comment" data-id="${comment.id}" data-owner="${comment.userId || ""}">▲ ${comment.upvotes || 0}</button>
                    <button class="action-btn" data-action="toggle-reply" data-id="${comment.id}">Reply</button>
                </div>
                <form class="reply-form" data-reply-form="${comment.id}" hidden>
                    <input type="text" maxlength="300" placeholder="Write a reply" required>
                    <button class="btn btn-primary" type="submit">Post Reply</button>
                </form>
                <div class="reply-list">
                    ${(repliesMap[comment.id] || []).map((reply) => `<div class="reply-item"><strong>${escapeHtml(reply.username)}</strong>: ${escapeHtml(reply.text)}</div>`).join("")}
                </div>
            </article>`).join("") : "<p>No answers yet.</p>";
    }, () => {
        commentList.innerHTML = "<p>Unable to load answers. Configure Firebase credentials.</p>";
    });

    commentForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const text = commentText.value.trim();
        if (!text) return;
        await createComment({ postId, userId: viewer.uid, username: viewer.username, avatar: viewer.avatar, text });
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
        await createPost({ userId: viewer.uid, username: viewer.username, avatar: viewer.avatar, title, content });
        postTitle.value = "";
        postContent.value = "";
        postMessage.textContent = "Posted successfully ✓";
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

    if (action === "share-post") {
        navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?post=${id}`);
        return;
    }

    if (action === "upvote-post") {
        const voted = getVoted(votedPostKey);
        if (voted.has(id)) return;
        voted.add(id);
        saveVoted(votedPostKey, voted);
        const post = postsCache.find((item) => item.id === id);
        await upvotePost({ postId: id, ownerId: post?.userId });
    }
});

trendingQuestions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='open-thread']");
    if (!button) return;
    openThread(button.dataset.id);
});

threadView.addEventListener("click", async (event) => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.dataset.action === "close-thread") {
        threadView.hidden = true;
        const url = new URL(window.location.href);
        url.searchParams.delete("post");
        window.history.replaceState({}, "", url);
        return;
    }

    if (target.dataset.action === "toggle-reply") {
        const form = threadView.querySelector(`[data-reply-form='${target.dataset.id}']`);
        if (form) form.hidden = !form.hidden;
        return;
    }

    if (target.dataset.action === "upvote-comment") {
        const id = target.dataset.id;
        const voted = getVoted(votedCommentKey);
        if (voted.has(id)) return;
        voted.add(id);
        saveVoted(votedCommentKey, voted);
        await upvoteComment({ commentId: id, ownerId: target.dataset.owner || null });
    }
});

threadView.addEventListener("submit", async (event) => {
    const form = event.target.closest(".reply-form");
    if (!form) return;
    event.preventDefault();

    const input = form.querySelector("input");
    const text = input.value.trim();
    if (!text) return;

    const postId = new URLSearchParams(window.location.search).get("post");
    const parentCommentId = form.dataset.replyForm;
    await createComment({ postId, userId: viewer.uid, username: viewer.username, avatar: viewer.avatar, text, parentCommentId });
    input.value = "";
    form.hidden = true;
});

const scrollToAsk = () => {
    document.getElementById("ask-box").scrollIntoView({ behavior: "smooth" });
    postTitle.focus();
};

askQuestionBtn.addEventListener("click", scrollToAsk);
heroAskBtn.addEventListener("click", scrollToAsk);

const init = async () => {
    viewer = await getCommunityIdentity();
    identityChip.textContent = `Signed in anonymously as ${viewer.username}`;

    try {
        await upsertUserProfile(viewer);
    } catch (error) {
        console.warn("User sync unavailable.", error);
        viewerProfile = { ...viewer, postsCount: 0, answersCount: 0, upvotesReceived: 0 };
    }

    const profilePanel = initProfilePanel({
        openButton: document.getElementById("profileIconBtn"),
        profileImage: document.getElementById("profileIconImage"),
        panel: document.getElementById("profilePanel"),
        panelBody: document.getElementById("profilePanelBody"),
        closeButton: document.getElementById("profilePanelClose"),
        getProfile: () => viewerProfile || { ...viewer, postsCount: 0, answersCount: 0, upvotesReceived: 0 }
    });

    watchUserProfile(viewer.uid, (profile) => {
        viewerProfile = profile || { ...viewer, postsCount: 0, answersCount: 0, upvotesReceived: 0 };
        profilePanel.renderPanel();
    }, () => {
        viewerProfile = { ...viewer, postsCount: 0, answersCount: 0, upvotesReceived: 0 };
        profilePanel.renderPanel();
    });

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
