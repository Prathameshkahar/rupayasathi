import { getCommunityIdentity } from "./community-auth.js";
import { getUserProfile, upsertUserProfile, watchUserAnswers, watchUserPosts } from "./community-db.js";

const profileNavAvatar = document.getElementById("profileNavAvatar");
const profileAvatar = document.getElementById("profileAvatar");
const profileUsername = document.getElementById("profileUsername");
const profileJoinDate = document.getElementById("profileJoinDate");
const profileCardUsername = document.getElementById("profileCardUsername");
const profileCardJoinDate = document.getElementById("profileCardJoinDate");
const activityHeading = document.getElementById("activityHeading");
const postsCount = document.getElementById("postsCount");
const answersCount = document.getElementById("answersCount");
const upvotesCount = document.getElementById("upvotesCount");
const activityList = document.getElementById("activityList");

let viewer = null;
let posts = [];
let answers = [];
let profile = null;

const formatDate = (iso) => {
    if (!iso) return "Recently joined";
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? "Recently joined"
        : `Joined ${date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
};

const formatTimestamp = (ts) => {
    if (!ts?.toDate) return "just now";
    return ts.toDate().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const getFallbackProfile = () => {
    const storedProfile = JSON.parse(localStorage.getItem("communityUserProfile") || "null");
    const storedUsername = localStorage.getItem("communityUsername");
    return {
        userId: viewer?.uid || "local-user",
        username: storedUsername || storedProfile?.username || viewer?.username || "CommunityMember",
        avatar: storedProfile?.avatar || viewer?.avatar || "https://api.dicebear.com/9.x/initials/svg?seed=CommunityMember&radius=50&backgroundType=gradientLinear",
        joinDate: storedProfile?.joinDate || viewer?.joinDate || new Date().toISOString(),
        postsCount: 0,
        answersCount: 0,
        upvotesReceived: 0
    };
};

const renderProfile = () => {
    if (!profile) return;

    profileAvatar.src = profile.avatar;
    profileNavAvatar.src = profile.avatar;
    profileUsername.textContent = profile.username;
    profileJoinDate.textContent = formatDate(profile.joinDate);
    profileCardUsername.textContent = profile.username;
    profileCardJoinDate.textContent = formatDate(profile.joinDate).replace("Joined ", "");
    activityHeading.textContent = `${profile.username}'s Recent Activity`;
    postsCount.textContent = profile.postsCount || 0;
    answersCount.textContent = profile.answersCount || 0;
    upvotesCount.textContent = profile.upvotesReceived || 0;
};

const renderActivity = () => {
    const items = [
        ...posts.map((post) => ({
            type: "question",
            title: `Asked: ${post.title}`,
            time: post.timestamp
        })),
        ...answers.map((answer) => ({
            type: "answer",
            title: `Answered: ${answer.text}`,
            time: answer.timestamp
        }))
    ]
        .sort((a, b) => (b.time?.seconds || 0) - (a.time?.seconds || 0))
        .slice(0, 6);

    if (profile?.upvotesReceived) {
        items.unshift({
            type: "upvote",
            title: `Received ${profile.upvotesReceived} total upvotes from the community`,
            time: null
        });
    }

    activityList.innerHTML = items.length
        ? items.map((item) => `<li><strong>${item.type.toUpperCase()}</strong> · ${item.title}<br><small>${formatTimestamp(item.time)}</small></li>`).join("")
        : `<li>${profile?.username || "User"} has no activity yet.</li>`;
};

const init = async () => {
    viewer = await getCommunityIdentity();

    try {
        await upsertUserProfile(viewer);
        profile = await getUserProfile(viewer.uid);
    } catch {
        profile = null;
    }

    profile = {
        ...getFallbackProfile(),
        ...profile,
        username: localStorage.getItem("communityUsername") || profile?.username || viewer.username
    };

    renderProfile();
    renderActivity();

    watchUserPosts(viewer.uid, (data) => {
        posts = data;
        renderActivity();
    }, () => {
        posts = [];
        renderActivity();
    });

    watchUserAnswers(viewer.uid, (data) => {
        answers = data;
        renderActivity();
    }, () => {
        answers = [];
        renderActivity();
    });
};

init();
