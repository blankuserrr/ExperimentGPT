const express = require("express");
const router = express.Router();
const { Configuration, OpenAIApi } = require("openai");
const { GPTTokens } = require("gpt-tokens");

const { db, firebase } = require("./firebaseConfig");

const systemPrompt = "You are a helpful assistant.";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
  const userRef = db.collection("users").doc(req.uid);
  const userDoc = await userRef.get();
  const chats = userDoc.exists ? userDoc.data().chats : [];
  res.render("chats/chats", { chats });
});

router.get("/chat/:chatId", checkAuth, async (req, res) => {
  const chatRef = db.collection("chats").doc(req.params.chatId);
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
  const chatRef = db.collection("chats").doc(req.params.chatId);
  const chatDoc = await chatRef.get();
  let messages = chatDoc.exists ? chatDoc.data().messages : [];

  messages.push(
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  );

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  const responseContent = chatCompletion.data.choices[0].message.content;
  messages.push({ role: "system", content: responseContent });

  // Save chat history to Firestore
  await chatRef.set({ messages });

  // Calculate tokens used
  const usageInfo = new GPTTokens({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  console.table({
    "Tokens prompt": usageInfo.promptUsedTokens,
    "Tokens total": usageInfo.usedTokens,
  });

  // Return the HTML for the new system message
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
    const userRef = db.collection("users").doc(uid);
    await userRef.set({ chats: [] });
    res.status(200).send();
  } catch (error) {
    console.error(error);
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
    console.error(error);
    res.status(500).send("Error logging in");
  }
});

router.post("/logout", checkAuth, async (req, res) => {
  try {
    await firebase.auth().signOut();
    req.session.destroy(); // Clear session
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging out");
  }
});

router.post("/createChat", checkAuth, async (req, res) => {
  try {
    // Create a new chat with a randomly generated ID
    const chatRef = db.collection("chats").doc();

    // Get the current date and time
    const now = new Date();
    // Format the date and time as d-m-y:time
    const chatName = `${now.getDate()}-${
      now.getMonth() + 1
    }-${now.getFullYear()}:${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    await chatRef.set({ messages: [], name: chatName });
    const userRef = db.collection("users").doc(req.uid);
    await userRef.update({
      chats: firebase.firestore.FieldValue.arrayUnion(chatRef.id),
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
    await db.collection("chats").doc(chatId).delete();
    const userRef = db.collection("users").doc(req.uid);
    await userRef.update({
      chats: firebase.firestore.FieldValue.arrayRemove(chatId),
    });
    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting chat");
  }
});

router.get("/getChats", checkAuth, async (req, res) => {
  try {
    const userRef = db.collection("users").doc(req.uid);
    const userDoc = await userRef.get();
    const chats = userDoc.exists ? userDoc.data().chats : [];
    res.status(200).send(chats);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting chats");
  }
});

router.post("/clearChat/:chatId", checkAuth, async (req, res) => {
  const chatRef = db.collection("chats").doc(req.params.chatId);
  // Set the messages of the chat to an empty array
  await chatRef.set({ messages: [] });
  res.status(200).send();
});

module.exports = router;
