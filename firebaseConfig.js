const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const { Firestore } = require("@google-cloud/firestore");
const dotenv = require("dotenv");

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const firestore = new Firestore({
  projectId: process.env.FIREBASE_PROJECT_ID,
  keyFilename:
    "secrets/experimentgpt-b7411-firebase-adminsdk-k8f78-d5b8e11e63.json",
});

module.exports = { firestore, auth };
