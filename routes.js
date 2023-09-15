"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const openai_1 = __importDefault(require("openai"));
const gpt_tokens_1 = require("gpt-tokens");
const firebaseConfig_1 = require("./firebaseConfig");
const error_1 = require("./error");
const lite_1 = require("firebase/firestore/lite");
const auth_1 = require("@firebase/auth");
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
  } else {
    console.log("User is not authenticated, redirecting to login");
    res.redirect("/login");
  }
};
router.get("/", checkAuth, async (req, res) => {
  const userRef = (0, lite_1.doc)(
    firebaseConfig_1.firestore,
    `users/${req.uid}`
  );
  const userDoc = await (0, lite_1.getDoc)(userRef);
  const chatIds = userDoc.exists() ? userDoc.data()?.chats : [];
  const chats = await Promise.all(
    chatIds.map(async (chatId) => {
      const chatRef = (0, lite_1.doc)(
        firebaseConfig_1.firestore,
        "chats",
        chatId
      );
      const chatDoc = await (0, lite_1.getDoc)(chatRef);
      if (chatDoc.exists()) {
        return { id: chatId, name: chatDoc.data()?.name };
      } else {
        // If the chat document does not exist, return null
        return null;
      }
    })
  );
  // Filter out null values
  const existingChats = chats.filter((chat) => chat !== null);
  res.render("chats/chats", { chats: existingChats });
});
router.get("/chat/:chatId", checkAuth, async (req, res) => {
  const chatRef = (0, lite_1.doc)(
    firebaseConfig_1.firestore,
    "chats",
    req.params.chatId
  );
  const chatDoc = await (0, lite_1.getDoc)(chatRef);
  const messages = chatDoc.exists() ? chatDoc.data()?.messages : [];
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
  const chatRef = (0, lite_1.doc)(
    firebaseConfig_1.firestore,
    "chats",
    req.params.chatId
  );
  const chatDoc = await (0, lite_1.getDoc)(chatRef);
  let messages = chatDoc.exists() ? chatDoc.data()?.messages : [];
  if (!chatDoc.exists()) {
    throw new error_1.BadRequestError("Chat does not exist");
  }
  messages.push(
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  );
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
  await (0, lite_1.updateDoc)(chatRef, { messages });
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
    const userCredential = await (0, auth_1.createUserWithEmailAndPassword)(
      firebaseConfig_1.auth,
      email,
      password
    );
    const uid = userCredential.user?.uid;
    const userRef = (0, lite_1.doc)(firebaseConfig_1.firestore, `users/${uid}`);
    await (0, lite_1.setDoc)(userRef, { chats: [] });
    res.status(200).send();
  } catch (error) {
    throw new error_1.InternalServerError("Error registering user");
  }
});
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await (0, auth_1.signInWithEmailAndPassword)(
      firebaseConfig_1.auth,
      email,
      password
    );
    if (userCredential.user && userCredential.user.uid) {
      req.session.regenerate((err) => {
        if (err) {
          console.error("Error regenerating session:", err);
          throw new error_1.InternalServerError("Error regenerating session");
        }
        req.session.userId = userCredential.user.uid;
        res.status(200).send();
      });
    } else {
      console.error("User or user ID is undefined");
      throw new error_1.UnauthorizedError("User or user ID is undefined");
    }
  } catch (error) {
    console.error("Error logging in:", error);
    throw new error_1.UnauthorizedError("Error logging in");
  }
});
router.post("/logout", checkAuth, async (req, res) => {
  try {
    await (0, auth_1.signOut)(firebaseConfig_1.auth);
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error logging out");
      } else {
        res.redirect("/login");
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging out");
  }
});
router.post("/createChat", checkAuth, async (req, res) => {
  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour12: true });
    const is12HourFormat =
      timeString.includes("AM") || timeString.includes("PM");
    const formattedTime = is12HourFormat
      ? timeString
      : now.toLocaleTimeString([], { hour12: false });
    const chatName = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}: ${formattedTime}`;
    // Create a new chat document with a random ID
    const chatRef = (0, lite_1.doc)(
      (0, lite_1.collection)(firebaseConfig_1.firestore, "chats")
    );
    // Set the chat document data
    await (0, lite_1.setDoc)(chatRef, { messages: [], name: chatName });
    if (!req.uid) {
      throw new error_1.BadRequestError("User ID is required");
    }
    const userRef = (0, lite_1.doc)(
      firebaseConfig_1.firestore,
      "users",
      req.uid
    );
    const userDoc = await (0, lite_1.getDoc)(userRef);
    if (!userDoc.exists()) {
      throw new error_1.BadRequestError("User does not exist");
    }
    // Update the user document with the new chat ID
    await (0, lite_1.updateDoc)(userRef, {
      chats: (0, lite_1.arrayUnion)(chatRef.id),
    });
    res.redirect(`/chat/${chatRef.id}`);
  } catch (error) {
    console.error(error);
    throw new error_1.InternalServerError("Error creating chat");
  }
});
router.get("/getChats", checkAuth, async (req, res) => {
  try {
    const userRef = (0, lite_1.doc)(
      firebaseConfig_1.firestore,
      `users/${req.uid}`
    );
    const userDoc = await (0, lite_1.getDoc)(userRef);
    const chats = userDoc.exists() ? userDoc.data()?.chats : [];
    res.status(200).send(chats);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting chats");
  }
});
router.post("/clearChat/:chatId", checkAuth, async (req, res) => {
  const chatRef = (0, lite_1.doc)(
    firebaseConfig_1.firestore,
    `chats/${req.params.chatId}`
  );
  const chatDoc = await (0, lite_1.getDoc)(chatRef);
  const chatName = chatDoc.exists() ? chatDoc.data()?.name : "";
  if (!chatDoc.exists()) {
    throw new error_1.BadRequestError("Chat does not exist");
  }
  // Set the messages of the chat to an empty array and preserve the name
  await (0, lite_1.setDoc)(chatRef, { messages: [], name: chatName });
  res.status(200).send();
});
router.post("/deleteChat", checkAuth, async (req, res) => {
  const chatId = req.body.chatId;
  if (!chatId) {
    throw new error_1.BadRequestError("Chat ID is required");
  }
  try {
    await (0, lite_1.deleteDoc)(
      (0, lite_1.doc)(firebaseConfig_1.firestore, `chats/${chatId}`)
    );
    const userRef = (0, lite_1.doc)(
      firebaseConfig_1.firestore,
      `users/${req.uid}`
    );
    const userDoc = await (0, lite_1.getDoc)(userRef);
    if (!userDoc.exists()) {
      throw new error_1.BadRequestError("User does not exist");
    }
    await (0, lite_1.updateDoc)(userRef, {
      chats: (0, lite_1.arrayRemove)(chatId),
    });
    res.status(200).send("");
  } catch (error) {
    console.error(error);
    throw new error_1.InternalServerError("Error deleting chat");
  }
});
exports.default = router;
