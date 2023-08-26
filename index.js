const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const { GPTTokens } = require("gpt-tokens");
const Ai = require("ai");
const firebase = require("firebase");
const path = require("path");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

const firebaseConfig = {
  apiKey: "AIzaSyCCwswtxlhhz38QPGZh8232WWhpMC9o-0E",
  authDomain: "experimentgpt-b7411.firebaseapp.com",
  projectId: "experimentgpt-b7411",
  storageBucket: "experimentgpt-b7411.appspot.com",
  messagingSenderId: "575444930797",
  appId: "1:575444930797:web:08f7e8485b1f9dab3ffce4",
  measurementId: "G-ZVH7JCEMC3",
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

let messages = [];

app.get("/", async (req, res) => {
  const chatDoc = await db.collection("chats").doc("chat").get();
  if (chatDoc.exists) {
    messages = chatDoc.data().messages;
  } else {
    messages = [];
  }
  res.render("index", { messages });
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/send", async (req, res) => {
  const userMessage = req.body.userMessage;
  messages.push(
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: userMessage }
  );

  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  const responseContent = chatCompletion.data.choices[0].message.content;
  messages.push({ role: "system", content: responseContent });

  // Save chat history to Firestore
  await db.collection("chats").doc("chat").set({ messages });

  // Calculate tokens used
  const usageInfo = new GPTTokens({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  console.table({
    "Tokens prompt": usageInfo.promptUsedTokens,
    "Tokens total": usageInfo.usedTokens,
  });

  res.json({ messages });
});

// Clear conversation endpoint
app.post("/clear", async (req, res) => {
  messages = [];

  // Clear the chat in Firestore
  await db.collection("chats").doc("chat").set({ messages: [] });

  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
