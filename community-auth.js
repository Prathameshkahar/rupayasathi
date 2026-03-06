import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const prefixes = ["Paisa", "Lakshmi", "Desi", "Smart", "Budget", "Saving"];
const suffixes = ["Investor", "Trader", "Guru", "Planner", "Ninja", "Builder"];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const generateUsername = () => `${randomFrom(prefixes)}${randomFrom(suffixes)}`;

const generateAvatar = (username) => `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&radius=50&backgroundType=gradientLinear`;

const ensureLocalIdentity = () => {
    const storedProfile = JSON.parse(localStorage.getItem("communityUserProfile") || "null");
    const storedUsername = localStorage.getItem("communityUsername");
    const username = storedUsername || storedProfile?.username || generateUsername();

    if (!storedUsername) {
        localStorage.setItem("communityUsername", username);
    }

    const normalizedProfile = {
        username,
        avatar: storedProfile?.avatar || generateAvatar(username),
        joinDate: storedProfile?.joinDate || new Date().toISOString()
    };

    localStorage.setItem("communityUserProfile", JSON.stringify(normalizedProfile));
    return normalizedProfile;
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
            resolve({ uid: user?.uid || `local-${stored.username}`, ...stored });
        }, () => {
            resolve({ uid: `local-${stored.username}`, ...stored });
        });
    });
};
