const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Configuration, OpenAIApi } = require("openai");
const cors = require("cors");
const { GPTTokens } = require("gpt-tokens");
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
const path = require("path");
const helmet = require("helmet");

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          "'unsafe-eval'",
          "https://cdnjs.cloudflare.com",
        ],
      },
    },
  })
);
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

const checkAuth = (req, res, next) => {
  const user = firebase.auth().currentUser;
  if (user) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", checkAuth, async (req, res) => {
  const chatDoc = await db.collection("chats").doc("chat").get();
  if (chatDoc.exists) {
    messages = chatDoc.data().messages;
  } else {
    messages = [];
  }
  res.render("index", { messages });
});

app.get("/login", (req, res) => {
  res.render("auth/user");
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/send", checkAuth, async (req, res) => {
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
app.post("/clear", checkAuth, async (req, res) => {
  messages = [];
  // Save chat history to Firestore
  await db.collection("chats").doc("chat").set({ messages });
  res.send(""); // send an empty string as response
});

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    await firebase.auth().createUserWithEmailAndPassword(email, password);
    res.status(200).send(); // Send a 200 status code for success
  } catch (error) {
    res.status(400).send(error.message); // Send the error message for the client to handle
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    res.status(200).send(); // Send a 200 status code for success
  } catch (error) {
    res.status(400).send(error.message); // Send the error message for the client to handle
  }
});

app.post("/logout", checkAuth, async (req, res) => {
  try {
    await firebase.auth().signOut();
    res.redirect("/login"); // Redirect to the login page
  } catch (error) {
    res.status(400).send(error.message); // Send the error message for the client to handle
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
