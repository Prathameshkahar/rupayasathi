import {
    collection,
    addDoc,
    doc,
    updateDoc,
    increment,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase-config.js";

const postsRef = collection(db, "posts");
const commentsRef = collection(db, "comments");

export const createPost = ({ username, avatar, title, content }) => addDoc(postsRef, {
    username,
    avatar,
    title,
    content,
    upvotes: 0,
    timestamp: serverTimestamp()
});

export const createComment = ({ postId, username, avatar, text }) => addDoc(commentsRef, {
    postId,
    username,
    avatar,
    text,
    upvotes: 0,
    timestamp: serverTimestamp()
});

export const watchPosts = (callback, onError) => {
    const q = query(postsRef, orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
};

export const watchCommentsByPost = (postId, callback, onError) => {
    const q = query(commentsRef, where("postId", "==", postId), orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, onError);
};

export const upvotePost = (id) => updateDoc(doc(db, "posts", id), { upvotes: increment(1) });
export const upvoteComment = (id) => updateDoc(doc(db, "comments", id), { upvotes: increment(1) });
