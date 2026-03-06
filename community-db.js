import {
    collection,
    addDoc,
    doc,
    setDoc,
    updateDoc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where,
    getDoc,
    runTransaction,
    limit
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const postsRef = collection(db, "posts");
const commentsRef = collection(db, "comments");

export const upsertUserProfile = async ({ uid, username, avatar, joinDate }) => {
    const userRef = doc(db, "users", uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
        await setDoc(userRef, {
            userId: uid,
            username,
            avatar,
            joinDate,
            postsCount: 0,
            answersCount: 0,
            upvotesReceived: 0
        });
        return;
    }

    await setDoc(userRef, { username, avatar }, { merge: true });
};

export const createPost = async ({ userId, username, avatar, title, content }) => {
    const post = await addDoc(postsRef, {
        userId,
        username,
        avatar,
        title,
        content,
        upvotes: 0,
        commentsCount: 0,
        timestamp: serverTimestamp()
    });
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
