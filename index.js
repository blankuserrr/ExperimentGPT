const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const { GPTTokens } = require("gpt-tokens");
const firebase = require("firebase");
const path = require("path");
const helmet = require("helmet");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
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

  // Return the HTML for the new system message
   res.send(
     `<div class="system"><strong>SYSTEM:</strong> ${responseContent}</div>`
   );
});

// Clear conversation endpoint
app.post("/clear", async (req, res) => {
  messages = [];
  // Save chat history to Firestore
  await db.collection("chats").doc("chat").set({ messages });
  res.send(""); // send an empty string as response
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
