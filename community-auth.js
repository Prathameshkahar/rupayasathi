import { signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { auth } from "./firebase-config.js";

const prefixes = ["Paisa", "Lakshmi", "Desi", "Smart", "Budget", "Saving"];
const suffixes = ["Investor", "Trader", "Guru", "Yodha", "Planner", "Ninja"];

const randomFrom = (list) => list[Math.floor(Math.random() * list.length)];

const initials = (name) => (name || "RU").slice(0, 2).toUpperCase();

const randomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue} 70% 45%)`;
};

const generateIdentity = () => {
    const username = `${randomFrom(prefixes)}${randomFrom(suffixes)}`;
    const bg = randomColor();
    return {
        username,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=${encodeURIComponent(bg.replace('#', ''))}`,
        initials: initials(username),
        color: bg
    };
};

export const getCommunityIdentity = async () => {
    let storedUser = localStorage.getItem("communityUser");
    let storedAvatar = localStorage.getItem("communityAvatar");

    if (!storedUser || !storedAvatar) {
        const identity = generateIdentity();
        storedUser = identity.username;
        storedAvatar = identity.avatar;
        localStorage.setItem("communityUser", storedUser);
        localStorage.setItem("communityAvatar", storedAvatar);
    }

    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.warn("Anonymous auth failed", error);
    }

    return new Promise((resolve) => {
        const stop = onAuthStateChanged(auth, (user) => {
            stop();
            resolve({
                uid: user?.uid || null,
                username: storedUser,
                avatar: storedAvatar
            });
        });
    });
};
