import { getCommunityIdentity } from "./community-auth.js";
import { upsertUserProfile, watchUserProfile, watchPosts } from "./community-db.js";

const avatar = document.getElementById("profileAvatar");
const username = document.getElementById("profileUsername");
const joinDate = document.getElementById("profileJoinDate");
const postsCount = document.getElementById("postsCount");
const answersCount = document.getElementById("answersCount");
const upvotesCount = document.getElementById("upvotesCount");
const myPostsList = document.getElementById("myPostsList");

const formatDate = (value) => new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const formatTime = (ts) => ts?.toDate ? ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "just now";

const init = async () => {
    const viewer = await getCommunityIdentity();

    avatar.src = viewer.avatar;
    username.textContent = viewer.username;
    joinDate.textContent = `Joined ${formatDate(viewer.joinDate)}`;

    try {
        await upsertUserProfile(viewer);
    } catch (error) {
        console.warn("Could not sync profile", error);
    }

    watchUserProfile(viewer.uid, (profile) => {
        const data = profile || {};
        postsCount.textContent = data.postsCount || 0;
        answersCount.textContent = data.answersCount || 0;
        upvotesCount.textContent = data.upvotesReceived || 0;
    }, () => {
        postsCount.textContent = "0";
        answersCount.textContent = "0";
        upvotesCount.textContent = "0";
    });

    watchPosts((posts) => {
        const mine = posts.filter((post) => post.userId === viewer.uid).slice(0, 8);
        myPostsList.innerHTML = mine.length
            ? mine.map((post) => `<article class="my-post-item"><h3>${post.title}</h3><p>${post.content}</p><small class="timestamp">${formatTime(post.timestamp)}</small></article>`).join("")
            : "<p>No posts yet.</p>";
    }, () => {
        myPostsList.innerHTML = "<p>Unable to load posts right now.</p>";
    });
};

init();
