/// <reference types="bun-types" />b

import { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { RequestHandler } from "express";
import OpenAI from "openai";
import { GPTTokens } from "gpt-tokens"
import session from "express-session";
import { Server as SocketIoServer } from "socket.io";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove, collection } from "firebase/firestore/lite";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "@firebase/auth";
import { firestore, auth } from "./firebaseConfig";
import { BadRequestError, UnauthorizedError, InternalServerError } from "./error";

export interface CustomSession extends session.Session {
	userId?: string;
}

interface RequestWithCustomSession extends Request {
	session: CustomSession;
	uid?: string;
}

interface RequestWithIo extends Request {
	io: SocketIoServer;
}

type RequestHandlerWithIo = RequestHandler & ((req: RequestWithIo, res: Response, next: NextFunction) => any);

const systemPrompt = "You are a helpful assistant.";

const router = Router();
const openai = new OpenAI({
	apiKey: Bun.env.OPENAI_API_KEY,
});

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
	const sessionReq = req as RequestWithCustomSession;
	if (sessionReq.session.userId) {
		sessionReq.uid = sessionReq.session.userId;
		next();
	} else {
		console.log("User is not authenticated, redirecting to login");
		res.redirect("/login");
	}
};

router.get("/", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	const userRef = doc(firestore, `users/${req.uid}`);
	const userDoc = await getDoc(userRef);
	const chatIds = userDoc.exists() ? userDoc.data()?.chats : [];
	const chats = await Promise.all(
		chatIds.map(async (chatId: string) => {
			const chatRef = doc(firestore, "chats", chatId);
			const chatDoc = await getDoc(chatRef);
			if (chatDoc.exists()) {
				return { id: chatId, name: chatDoc.data()?.name };
			} else {
				return null;
			}
		})
	);
	// Filter out null values
	const existingChats = chats.filter((chat) => chat !== null);
	res.render("chats/chats", { chats: existingChats });
});

router.get("/chat/:chatId", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	const chatRef = doc(firestore, "chats", req.params.chatId);
	const chatDoc = await getDoc(chatRef);
	const messages = chatDoc.exists() ? chatDoc.data()?.messages : [];
	res.render("index", {
		messages: messages,
		chatId: req.params.chatId,
		systemPrompt: systemPrompt,
	});
});

router.get("/login", (req: Request, res: Response) => {
	res.render("auth/user");
});

router.post("/sendMessage/:chatId", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	const userMessage = req.body.userMessage;
	const chatRef = doc(firestore, "chats", req.params.chatId);
	const chatDoc = await getDoc(chatRef);
	let messages = chatDoc.exists() ? chatDoc.data()?.messages : [];

	if (!chatDoc.exists()) {
		throw new BadRequestError("Chat does not exist");
	}

	messages.push({ role: "system", content: systemPrompt }, { role: "user", content: userMessage });

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
	await updateDoc(chatRef, { messages });

	// Calculate tokens used
	const usageInfo = new GPTTokens({
		model: "gpt-3.5-turbo-0613",
		messages: messages,
	});

	console.table({
		"Prompt price": "$"+usageInfo.usedUSD
	});

	res.status(200).send();
});

router.post("/register", async (req: Request, res: Response) => {
	const { email, password } = req.body;
	try {
		const userCredential = await createUserWithEmailAndPassword(auth, email, password);
		const uid = userCredential.user?.uid;
		const userRef = doc(firestore, `users/${uid}`);
		await setDoc(userRef, { chats: [] });
		res.status(200).send();
	} catch (error) {
		throw new InternalServerError("Error registering user");
	}
});

router.post("/login", async (req: Request, res: Response) => {
	const { email, password } = req.body;
	try {
		const userCredential = await signInWithEmailAndPassword(auth, email, password);
		if (userCredential.user && userCredential.user.uid) {
			req.session.regenerate((err) => {
				if (err) {
					console.error("Error regenerating session:", err);
					throw new InternalServerError("Error regenerating session");
				}
				(req.session as CustomSession).userId = userCredential.user.uid;
				res.status(200).send();
			});
		} else {
			console.error("User or user ID is undefined");
			throw new UnauthorizedError("User or user ID is undefined");
		}
	} catch (error) {
		console.error("Error logging in:", error);
		throw new UnauthorizedError("Error logging in");
	}
});

router.post("/logout", checkAuth, async (req: Request, res: Response) => {
	try {
		await signOut(auth);
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

router.post("/createChat", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	try {
		const now = new Date();
		const timeString = now.toLocaleTimeString([], { hour12: true });
		const is12HourFormat = timeString.includes("AM") || timeString.includes("PM");
		const formattedTime = is12HourFormat ? timeString : now.toLocaleTimeString([], { hour12: false });
		const chatName = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}: ${formattedTime}`;

		// Create a new chat document with a random ID
		const chatRef = doc(collection(firestore, "chats"));
		// Set the chat document data
		await setDoc(chatRef, { messages: [], name: chatName });

		if (!req.uid) {
			throw new BadRequestError("User ID is required");
		}

		const userRef = doc(firestore, "users", req.uid);
		const userDoc = await getDoc(userRef);
		if (!userDoc.exists()) {
			throw new BadRequestError("User does not exist");
		}
		// Update the user document with the new chat ID
		await updateDoc(userRef, {
			chats: arrayUnion(chatRef.id),
		});
		res.redirect(`/chat/${chatRef.id}`);
	} catch (error) {
		console.error(error);
		throw new InternalServerError("Error creating chat");
	}
});

router.get("/getChats", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	try {
		const userRef = doc(firestore, `users/${req.uid}`);
		const userDoc = await getDoc(userRef);
		const chats = userDoc.exists() ? userDoc.data()?.chats : [];
		res.status(200).send(chats);
	} catch (error) {
		console.error(error);
		res.status(500).send("Error getting chats");
	}
});

router.post("/clearChat/:chatId", checkAuth, async (req: Request, res: Response) => {
	const chatRef = doc(firestore, `chats/${req.params.chatId}`);
	const chatDoc = await getDoc(chatRef);
	const chatName = chatDoc.exists() ? chatDoc.data()?.name : "";
	if (!chatDoc.exists()) {
		throw new BadRequestError("Chat does not exist");
	}
	// Set the messages of the chat to an empty array and preserve the name
	await setDoc(chatRef, { messages: [], name: chatName });
	res.status(200).send();
});

router.post("/deleteChat", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
	const chatId = req.body.chatId;
	if (!chatId) {
		throw new BadRequestError("Chat ID is required");
	}
	try {
		await deleteDoc(doc(firestore, `chats/${chatId}`));
		const userRef = doc(firestore, `users/${req.uid}`);
		const userDoc = await getDoc(userRef);
		if (!userDoc.exists()) {
			throw new BadRequestError("User does not exist");
		}
		await updateDoc(userRef, {
			chats: arrayRemove(chatId),
		});
		res.status(200).send("");
	} catch (error) {
		console.error(error);
		throw new InternalServerError("Error deleting chat");
	}
});

export default router;
