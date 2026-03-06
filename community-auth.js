import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const prefixes = ["Paisa", "Lakshmi", "Desi", "Budget", "Saving", "Smart"];
const suffixes = ["Investor", "Trader", "Guru", "Planner", "Ninja", "Builder"];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const generateIdentity = () => {
    const username = `${randomFrom(prefixes)}${randomFrom(suffixes)}`;
    return {
        username,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&radius=50&backgroundType=gradientLinear`
    };
};

export const getCommunityIdentity = async () => {
    let stored = JSON.parse(localStorage.getItem("communityUserProfile") || "null");
    if (!stored?.username || !stored?.avatar || !stored?.joinDate) {
        const identity = generateIdentity();
        stored = {
            ...identity,
            joinDate: new Date().toISOString()
        };
        localStorage.setItem("communityUserProfile", JSON.stringify(stored));
    }

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.warn("Anonymous auth unavailable. Running local mode.", error);
    }

    return new Promise((resolve) => {
        const stop = onAuthStateChanged(auth, (user) => {
            stop();
            resolve({ uid: user?.uid || `local-${stored.username}`, ...stored });
        }, () => {
            resolve({ uid: `local-${stored.username}`, ...stored });
        });
    });
};
