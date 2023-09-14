"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebase = exports.auth = exports.firestore = void 0;
const app_1 = require("@firebase/app");
const lite_1 = require("firebase/firestore/lite");
const auth_1 = require("@firebase/auth");
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
const app = (0, app_1.initializeApp)(firebaseConfig);
exports.firebase = app;
const firestore = (0, lite_1.getFirestore)(app);
exports.firestore = firestore;
const auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
