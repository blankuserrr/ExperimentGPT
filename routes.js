"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const gpt_tokens_1 = require("gpt-tokens");
const firebaseConfig_1 = require("./firebaseConfig");
const firestore_1 = require("@google-cloud/firestore");
const error_1 = require("./error");
const systemPrompt = "You are a helpful assistant.";
const router = (0, express_1.Router)();
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const checkAuth = (req, res, next) => {
    const sessionReq = req;
    if (sessionReq.session.userId) {
        sessionReq.uid = sessionReq.session.userId;
        next();
    }
    else {
        res.redirect("/login");
    }
};
router.get("/", checkAuth, async (req, res) => {
    const userRef = firebaseConfig_1.firestore.doc(`users/${req.uid}`);
    const userDoc = await userRef.get();
    const chatIds = userDoc.exists ? userDoc.data()?.chats : [];
    const chats = await Promise.all(chatIds.map(async (chatId) => {
        const chatRef = firebaseConfig_1.firestore.collection("chats").doc(chatId);
        const chatDoc = await chatRef.get();
        if (chatDoc.exists) {
            return { id: chatId, name: chatDoc.data()?.name };
        }
        else {
            // If the chat document does not exist, return null
            return null;
        }
    }));
    // Filter out null values
    const existingChats = chats.filter((chat) => chat !== null);
    res.render("chats/chats", { chats: existingChats });
});
router.get("/chat/:chatId", checkAuth, async (req, res) => {
    const chatRef = firebaseConfig_1.firestore.doc(`chats/${req.params.chatId}`);
    const chatDoc = await chatRef.get();
    const messages = chatDoc.exists ? chatDoc.data()?.messages : [];
    res.render("index", {
        messages: messages,
        chatId: req.params.chatId,
        systemPrompt: systemPrompt,
    });
});
router.get("/login", (req, res) => {
    res.render("auth/user");
});
router.post("/sendMessage/:chatId", checkAuth, async (req, res) => {
    const userMessage = req.body.userMessage;
    const chatRef = firebaseConfig_1.firestore.collection("chats").doc(req.params.chatId);
    const chatDoc = await chatRef.get();
    let messages = chatDoc.exists ? chatDoc.data()?.messages : [];
    if (!chatDoc.exists) {
        throw new error_1.BadRequestError('Chat does not exist');
    }
    messages.push({ role: "system", content: systemPrompt }, { role: "user", content: userMessage });
    const stream = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: userMessage }],
        stream: true,
    });
    let responseContent = "";
    for await (const part of stream) {
        const newPart = part.choices[0]?.delta?.content || "";
        responseContent += newPart;
        req.io.emit("new message", newPart);
    }
    messages.push({ role: "system", content: responseContent });
    req.io.emit("message finished");
    // Save chat history to Firestore
    await chatRef.update({ messages });
    // Calculate tokens used
    const usageInfo = new gpt_tokens_1.GPTTokens({
        model: "gpt-3.5-turbo-0613",
        messages: messages,
    });
    console.table({
        "Tokens prompt": usageInfo.promptUsedTokens,
        "Tokens total": usageInfo.usedTokens,
    });
    res.status(200).send();
});
router.post("/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await firebaseConfig_1.firebase
            .auth()
            .createUserWithEmailAndPassword(email, password);
        const uid = userCredential.user?.uid;
        const userRef = firebaseConfig_1.firestore.doc(`users/${uid}`);
        await userRef.set({ chats: [] });
        res.status(200).send();
    }
    catch (error) {
        throw new error_1.InternalServerError('Error registering user');
    }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const userCredential = await firebaseConfig_1.firebase
            .auth()
            .signInWithEmailAndPassword(email, password);
        req.session.regenerate((err) => {
            if (err) {
                throw new error_1.InternalServerError('Error regenerating session');
            }
            // Save user ID in new session
            req.session.userId = userCredential.user?.uid;
            res.status(200).send();
        });
    }
    catch (error) {
        throw new error_1.UnauthorizedError('Error logging in');
    }
});
router.post("/logout", checkAuth, async (req, res) => {
    try {
        await firebaseConfig_1.firebase.auth().signOut();
        req.session.destroy((err) => {
            if (err) {
                console.log(err);
            }
        });
        res.redirect("/login");
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error logging out");
    }
});
router.post("/createChat", checkAuth, async (req, res) => {
    try {
        // Get the current date and time
        const now = new Date();
        // Format the date and time as d-m-y:time
        const chatName = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}:${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        // Create a unique ID for the chat
        const chatId = firebaseConfig_1.firestore.collection("chats").doc().id;
        const chatRef = firebaseConfig_1.firestore.doc(`chats/${chatId}`);
        await chatRef.set({ messages: [], name: chatName });
        const userRef = firebaseConfig_1.firestore.doc(`users/${req.uid}`);
        if (!userRef) {
            throw new error_1.BadRequestError('User does not exist');
        }
        await userRef.update({
            chats: firestore_1.FieldValue.arrayUnion(chatRef.id),
        });
        res.redirect(`/chat/${chatRef.id}`);
    }
    catch (error) {
        console.error(error);
        throw new error_1.InternalServerError('Error creating chat');
    }
});
router.get("/getChats", checkAuth, async (req, res) => {
    try {
        const userRef = firebaseConfig_1.firestore.doc(`users/${req.uid}`);
        const userDoc = await userRef.get();
        const chats = userDoc.exists ? userDoc.data()?.chats : [];
        res.status(200).send(chats);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error getting chats");
    }
});
router.post("/clearChat/:chatId", checkAuth, async (req, res) => {
    const chatRef = firebaseConfig_1.firestore.doc(`chats/${req.params.chatId}`);
    const chatDoc = await chatRef.get();
    const chatName = chatDoc.exists ? chatDoc.data()?.name : "";
    if (!chatDoc.exists) {
        throw new error_1.BadRequestError('Chat does not exist');
    }
    // Set the messages of the chat to an empty array and preserve the name
    await chatRef.set({ messages: [], name: chatName });
    res.status(200).send();
});
router.post("/deleteChat", checkAuth, async (req, res) => {
    const chatId = req.body.chatId;
    if (!chatId) {
        throw new error_1.BadRequestError('Chat ID is required');
    }
    try {
        await firebaseConfig_1.firestore.collection("chats").doc(chatId).delete();
        const userRef = firebaseConfig_1.firestore.doc(`users/${req.uid}`);
        if (!userRef) {
            throw new error_1.BadRequestError('User does not exist');
        }
        await userRef.update({
            chats: firestore_1.FieldValue.arrayRemove(chatId),
        });
        res.status(200).send('');
    }
    catch (error) {
        console.error(error);
        throw new error_1.InternalServerError('Error deleting chat');
    }
});
exports.default = router;
