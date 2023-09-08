import express, { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { RequestHandler } from "express";
import OpenAI from "openai";
import { GPTTokens } from "gpt-tokens";
import { firestore, firebase } from "./firebaseConfig";
import { FieldValue } from "@google-cloud/firestore";
import session from 'express-session';
import { Server as SocketIoServer } from "socket.io";
import { BadRequestError, UnauthorizedError, InternalServerError } from './error';

interface CustomSession extends session.Session {
  userId?: string; // Add your custom property here
}

interface RequestWithCustomSession extends Request {
  session: CustomSession;
  uid?: string; // Add uid property here
}

interface RequestWithIo extends Request {
  io: SocketIoServer;
}

type RequestHandlerWithIo = RequestHandler & ((req: RequestWithIo, res: Response, next: NextFunction) => any);

const systemPrompt = "You are a helpful assistant.";

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const sessionReq = req as RequestWithCustomSession;
  if (sessionReq.session.userId) {
    sessionReq.uid = sessionReq.session.userId;
    next();
  } else {
    res.redirect("/login");
  }
};

router.get("/", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
  const userRef = firestore.doc(`users/${req.uid}`);
  const userDoc = await userRef.get();
  const chatIds = userDoc.exists ? userDoc.data()?.chats : [];
  const chats = await Promise.all(
  chatIds.map(async (chatId: string) => {
    const chatRef = firestore.collection("chats").doc(chatId);
    const chatDoc = await chatRef.get();
      if (chatDoc.exists) {
        return { id: chatId, name: chatDoc.data()?.name };
      } else {
        // If the chat document does not exist, return null
        return null;
      }
    })
  );
  // Filter out null values
  const existingChats = chats.filter((chat) => chat !== null);
  res.render("chats/chats", { chats: existingChats });
});

router.get("/chat/:chatId", checkAuth, async (req: Request, res: Response) => {
  const chatRef = firestore.doc(`chats/${req.params.chatId}`);
  const chatDoc = await chatRef.get();
  const messages = chatDoc.exists ? chatDoc.data()?.messages : [];
  res.render("index", {
    messages: messages,
    chatId: req.params.chatId,
    systemPrompt: systemPrompt,
  });
});

router.get("/login", (req: Request, res: Response) => {
  res.render("auth/user");
});

router.post("/sendMessage/:chatId", checkAuth, async (req: Request, res: Response) => {
  const userMessage = req.body.userMessage;
  const chatRef = firestore.collection("chats").doc(req.params.chatId);
  const chatDoc = await chatRef.get();
  let messages = chatDoc.exists ? chatDoc.data()?.messages : [];

  if (!chatDoc.exists) {
    throw new BadRequestError('Chat does not exist');
  }

  messages.push(
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage }
  );

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
  await chatRef.update({ messages });

  // Calculate tokens used
  const usageInfo = new GPTTokens({
    model: "gpt-3.5-turbo-0613",
    messages: messages,
  });

  console.table({
    "Tokens prompt": usageInfo.promptUsedTokens,
    "Tokens total": usageInfo.usedTokens,
  });

  res.status(200).send();
});

router.post("/register", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const userCredential = await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password);
    const uid = userCredential.user?.uid;
    const userRef = firestore.doc(`users/${uid}`);
    await userRef.set({ chats: [] });
    res.status(200).send();
  } catch (error) {
    throw new InternalServerError('Error registering user');
  }
});

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const userCredential = await firebase
      .auth()
      .signInWithEmailAndPassword(email, password);
    
    req.session.regenerate((err) => {
      if (err) {
        throw new InternalServerError('Error regenerating session');
      }
      // Save user ID in new session
      (req.session as CustomSession).userId = userCredential.user?.uid;
      res.status(200).send();
    });
  } catch (error) {
    throw new UnauthorizedError('Error logging in');
  }
});


router.post("/logout", checkAuth, async (req: Request, res: Response) => {
  try {
    await firebase.auth().signOut();
    req.session.destroy((err) => {
  if(err) {
    console.log(err);
  }
});
    res.redirect("/login");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging out");
  }
});

router.post("/createChat", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
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
    if (!userRef) {
      throw new BadRequestError('User does not exist');
    }
    await userRef.update({
      chats: FieldValue.arrayUnion(chatRef.id), 
    });
    res.redirect(`/chat/${chatRef.id}`);
  } catch (error) {
    console.error(error);
    throw new InternalServerError('Error creating chat');
  }
});

router.get("/getChats", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
  try {
    const userRef = firestore.doc(`users/${req.uid}`);
    const userDoc = await userRef.get();
    const chats = userDoc.exists ? userDoc.data()?.chats : [];
    res.status(200).send(chats);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting chats");
  }
});

router.post("/clearChat/:chatId", checkAuth, async (req: Request, res: Response) => {
  const chatRef = firestore.doc(`chats/${req.params.chatId}`);
  const chatDoc = await chatRef.get();
  const chatName = chatDoc.exists ? chatDoc.data()?.name : "";
  if (!chatDoc.exists) {
    throw new BadRequestError('Chat does not exist');
  }
  // Set the messages of the chat to an empty array and preserve the name
  await chatRef.set({ messages: [], name: chatName });
  res.status(200).send();
});


router.post("/deleteChat", checkAuth, async (req: RequestWithCustomSession, res: Response) => {
  const chatId = req.body.chatId;
  if (!chatId) {
    throw new BadRequestError('Chat ID is required');
  }
  try {
    await firestore.collection("chats").doc(chatId).delete();
    const userRef = firestore.doc(`users/${req.uid}`);
    if (!userRef) {
      throw new BadRequestError('User does not exist');
    }
    await userRef.update({
      chats: FieldValue.arrayRemove(chatId), 
    });
    res.status(200).send(''); 
  } catch (error) {
    console.error(error);
    throw new InternalServerError('Error deleting chat');
  }
});

export default router;