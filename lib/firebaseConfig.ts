import { initializeApp } from "@firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getAuth } from "@firebase/auth";

const firebaseConfig = {
	apiKey: Bun.env.FIREBASE_API_KEY,
	authDomain: Bun.env.FIREBASE_AUTH_DOMAIN,
	projectId: Bun.env.FIREBASE_PROJECT_ID,
	storageBucket: Bun.env.FIREBASE_STORAGE_BUCKET,
	messagingSenderId: Bun.env.FIREBASE_MESSAGING_SENDER_ID,
	appId: Bun.env.FIREBASE_APP_ID,
	measurementId: Bun.env.FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const auth = getAuth(app);

export { firestore, auth, app as firebase };
