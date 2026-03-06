import {
    addDoc,
    collection,
    doc,
    getDoc,
    increment,
    limit,
    onSnapshot,
    orderBy,
    query,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const usersRef = collection(db, "users");
const postsRef = collection(db, "posts");
const commentsRef = collection(db, "comments");
const aiAnswersRef = collection(db, "aiAnswers");

const getOpenAiKey = () => localStorage.getItem("openaiApiKey") || window.OPENAI_API_KEY || "";

const requestAiAnswer = async (questionText) => {
    const apiKey = getOpenAiKey();
    if (!apiKey) {
        return "AI response is unavailable right now because OpenAI API key is not configured.";
    }

    const prompt = `You are a helpful financial assistant for Indian users. Answer this question clearly and concisely: ${questionText}`;

    const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            input: prompt,
            max_output_tokens: 220
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const outputText = payload.output_text
        || payload.output?.flatMap((item) => item.content || []).find((entry) => entry.type === "output_text")?.text;

    return outputText || "AI could not generate an answer at this time.";
};

export const upsertUserProfile = async ({ uid, userId, username, avatar, joinDate }) => {
    const resolvedUserId = uid || userId;
    const userRef = doc(db, "users", resolvedUserId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            userId: resolvedUserId,
            username,
            avatar,
            joinDate,
            postsCount: 0,
            answersCount: 0,
            upvotesReceived: 0
        });
        return;
    }

    await setDoc(userRef, { userId: resolvedUserId, username, avatar }, { merge: true });
};

export const createPost = async ({ userId, username, avatar, title, content }) => {
    const post = await addDoc(postsRef, {
        postId: "",
        userId,
        username,
        avatar,
        title,
        content,
        upvotes: 0,
        commentsCount: 0,
        timestamp: serverTimestamp()
    });

    await updateDoc(post, { postId: post.id });
    await updateDoc(doc(db, "users", userId), { postsCount: increment(1) });
    return post;
};

export const createComment = async ({ postId, userId, username, avatar, text, parentCommentId = null }) => {
    const comment = await addDoc(commentsRef, {
        commentId: "",
        postId,
        userId,
        username,
        avatar,
        text,
        upvotes: 0,
        parentCommentId,
        timestamp: serverTimestamp()
    });

    await updateDoc(comment, { commentId: comment.id });
    await updateDoc(doc(db, "users", userId), { answersCount: increment(1) });
    if (!parentCommentId) {
        await updateDoc(doc(db, "posts", postId), { commentsCount: increment(1) });
    }
    return comment;
};

export const generateAndStoreAiAnswer = async ({ postId, questionTitle, questionContent }) => {
    const answerText = await requestAiAnswer(`${questionTitle}. ${questionContent}`);

    const answerDoc = await addDoc(aiAnswersRef, {
        postId,
        answerText,
        timestamp: serverTimestamp()
    });

    await updateDoc(answerDoc, { answerId: answerDoc.id });
    return answerDoc;
};

export const watchPosts = (callback, onError) => {
    const q = query(postsRef, orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
};

export const watchCommentsByPost = (postId, callback, onError) => {
    const q = query(commentsRef, where("postId", "==", postId), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))), onError);
};

export const watchAiAnswerByPost = (postId, callback, onError) => {
    const q = query(aiAnswersRef, where("postId", "==", postId), orderBy("timestamp", "desc"), limit(1));
    return onSnapshot(q, (snapshot) => {
        const answer = snapshot.docs[0] ? { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } : null;
        callback(answer);
    }, onError);
};

export const upvotePost = async ({ postId, ownerId }) => {
    await runTransaction(db, async (tx) => {
        tx.update(doc(db, "posts", postId), { upvotes: increment(1) });
        if (ownerId) tx.update(doc(db, "users", ownerId), { upvotesReceived: increment(1) });
    });
};

export const upvoteComment = async ({ commentId, ownerId }) => {
    await runTransaction(db, async (tx) => {
        tx.update(doc(db, "comments", commentId), { upvotes: increment(1) });
        if (ownerId) tx.update(doc(db, "users", ownerId), { upvotesReceived: increment(1) });
    });
};

export const watchUserProfile = (uid, callback, onError) => onSnapshot(doc(db, "users", uid), (snap) => {
    callback(snap.exists() ? snap.data() : null);
}, onError);

export const getUserProfile = async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
};

export const watchUserPosts = (uid, callback, onError) => {
    const q = query(postsRef, where("userId", "==", uid), orderBy("timestamp", "desc"), limit(5));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
};

export const watchUserAnswers = (uid, callback, onError) => {
    const q = query(commentsRef, where("userId", "==", uid), orderBy("timestamp", "desc"), limit(5));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
};
