const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
const { GPTTokens } = require("gpt-tokens");

const { firestore, auth } = require("./firebaseConfig");
const { FieldValue } = require("@google-cloud/firestore");

const systemPrompt = "You are a helpful assistant.";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // This is also the default, can be omitted
});

const checkAuth = (req, res, next) => {
  if (req.session.userId) {
    req.uid = req.session.userId;
    next();
  } else {
    res.redirect("/login");
  }
};

// Define your routes here
router.get("/", checkAuth, async (req, res) => {
  const userRef = firestore.doc(`users/${req.uid}`);
  const userDoc = await userRef.get();
  const chatIds = userDoc.exists ? userDoc.data().chats : [];
  const chats = await Promise.all(
    chatIds.map(async (chatId) => {
      const chatRef = firestore.collection("chats").doc(chatId);
      const chatDoc = await chatRef.get();
      if (chatDoc.exists) {
        return { id: chatId, name: chatDoc.data().name };
      } else {
        return null;
      }
    })
  );
  const existingChats = chats.filter((chat) => chat !== null);
  res.render("chats/chats", { chats: existingChats });
});

router.get("/chat/:chatId", checkAuth, async (req, res) => {
  const chatRef = firestore.doc(`chats/${req.params.chatId}`);
  const chatDoc = await chatRef.get();
  const messages = chatDoc.exists ? chatDoc.data().messages : [];
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
  const chatRef = firestore.collection("chats").doc(req.params.chatId);
  const chatDoc = await chatRef.get();
  let messages = chatDoc.exists ? chatDoc.data().messages : [];

  messages.push(
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  );

  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: userMessage }],
  });

  const responseContent = chatCompletion.choices[0].message.content;
  messages.push({ role: "system", content: responseContent });
  await chatRef.update({ messages }); // Use update instead of set

  const usageInfo = new GPTTokens({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  console.table({
    "Tokens prompt": usageInfo.promptUsedTokens,
    "Tokens total": usageInfo.usedTokens,
  });

  res.send(
    `<div class="system"><strong>SYSTEM:</strong> ${responseContent}</div>`
  );
});

router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user.uid;
    const userRef = firestore.doc(`users/${uid}`);
    await userRef.set({ chats: [] });
    res.status(200).send();
  } catch (error) {
    req.log.error(error);
    res.status(500).send("Error registering user");
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    req.session.userId = userCredential.user.uid; // Save user ID in session
    res.status(200).send();
  } catch (error) {
    req.log.error(error);
    res.status(500).send("Error logging out");
  }
});
router.post("/logout", checkAuth, async (req, res) => {
  try {
    await auth.signOut();
    req.session.destroy(); // Clear session
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging out");
  }
});

router.post("/createChat", checkAuth, async (req, res) => {
  try {
    // Get the current date and time
    const now = new Date();
    // Format the date and time as d-m-y:time
    const chatName = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}:${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // Create a unique ID for the chat
    const chatId = firestore.collection("chats").doc().id;

    const chatRef = firestore.doc(`chats/${chatId}`);
    await chatRef.set({ messages: [], name: chatName });
    const userRef = firestore.doc(`users/${req.uid}`);
    await userRef.update({
      chats: FieldValue.arrayUnion(chatRef.id), // Use FieldValue
    });
    res.redirect(`/chat/${chatRef.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating chat");
  }
});

router.post("/deleteChat", checkAuth, async (req, res) => {
  const chatId = req.body.chatId;
  try {
    await firestore.collection("chats").doc(chatId).delete();
    const userRef = firestore.doc(`users/${req.uid}`);
    await userRef.update({
      chats: FieldValue.arrayRemove(chatId), // Use FieldValue
    });
    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting chat");
  }
});

router.get("/getChats", checkAuth, async (req, res) => {
  try {
    const userRef = firestore.doc(`users/${req.uid}`);
    const userDoc = await userRef.get();
    const chats = userDoc.exists ? userDoc.data().chats : [];
    res.status(200).send(chats);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting chats");
  }
});

router.post("/clearChat/:chatId", checkAuth, async (req, res) => {
  const chatRef = firestore.doc(`chats/${req.params.chatId}`);
  const chatDoc = await chatRef.get();
  if (!chatDoc.exists || !chatDoc.data().name) {
    console.error("Chat document does not exist or chatName is undefined");
    res.status(500).send("Error clearing chat");
    return;
  }
  const chatName = chatDoc.data().name;
  await chatRef.set({ messages: [], name: chatName });
  res.status(200).send();
});

router.post("/deleteChat", checkAuth, async (req, res) => {
  const chatId = req.body.chatId;
  try {
    await firestore.collection("chats").doc(chatId).delete();
    const userRef = firestore.doc(`users/${req.uid}`);
    await userRef.update({
      chats: FieldValue.arrayRemove(chatId), // Use FieldValue
    });
    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting chat");
  }
});
module.exports = router;
