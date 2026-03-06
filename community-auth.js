import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const prefixes = ["Paisa", "Lakshmi", "Desi", "Budget", "Saving", "Smart"];
const suffixes = ["Investor", "Trader", "Guru", "Planner", "Ninja", "Builder"];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const generateUsername = () => `${randomFrom(prefixes)}${randomFrom(suffixes)}`;

const generateAvatar = (username) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&radius=50&backgroundType=gradientLinear`;

const ensureLocalIdentity = () => {
    const storedLegacyProfile = JSON.parse(localStorage.getItem("communityUserProfile") || "null");
    const storedLegacyUsername = localStorage.getItem("communityUsername");
    const storedIdentity = JSON.parse(localStorage.getItem("communityUser") || "null");

    const username = storedIdentity?.username || storedLegacyUsername || storedLegacyProfile?.username || generateUsername();
    const userId = storedIdentity?.userId || `local-${username.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;
    const identity = {
        userId,
        username,
        avatar: storedIdentity?.avatar || storedLegacyProfile?.avatar || generateAvatar(username),
        joinDate: storedIdentity?.joinDate || storedLegacyProfile?.joinDate || new Date().toISOString()
    };

    localStorage.setItem("communityUser", JSON.stringify(identity));
    localStorage.setItem("communityUsername", identity.username);
    localStorage.setItem("communityUserProfile", JSON.stringify({
        username: identity.username,
        avatar: identity.avatar,
        joinDate: identity.joinDate
    }));

    return identity;
};

export const getCommunityIdentity = async () => {
    const stored = ensureLocalIdentity();

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.warn("Anonymous auth unavailable. Running local mode.", error);
    }

    return new Promise((resolve) => {
        const stop = onAuthStateChanged(auth, (user) => {
            stop();
            resolve({
                uid: user?.uid || stored.userId,
                userId: user?.uid || stored.userId,
                username: stored.username,
                avatar: stored.avatar,
                joinDate: stored.joinDate
            });
        }, () => {
            resolve({
                uid: stored.userId,
                userId: stored.userId,
                username: stored.username,
                avatar: stored.avatar,
                joinDate: stored.joinDate
            });
        });
    });
};
