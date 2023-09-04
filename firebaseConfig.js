"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebase = exports.firestore = void 0;
const app_1 = __importDefault(require("firebase/app"));
exports.firebase = app_1.default;
require("firebase/auth");
const firestore_1 = require("@google-cloud/firestore");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};
app_1.default.initializeApp(firebaseConfig);
const firestore = new firestore_1.Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID,
    keyFilename: "secrets/experimentgpt-b7411-firebase-adminsdk-k8f78-d5b8e11e63.json",
});
exports.firestore = firestore;
