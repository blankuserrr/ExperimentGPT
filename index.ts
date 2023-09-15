import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import { Store, SessionData } from 'express-session';
import session from "express-session";
import routes from "./routes.ts";
import { CustomSession } from './routes.ts';
import { firestore } from "./firebaseConfig.ts";
import http from "http";
import { Server } from "socket.io";
import compression from "compression";
import { BadRequestError, errorHandler } from "./error.ts";
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore/lite';


declare module 'express-serve-static-core' {
  interface Request {
    io: typeof io;
  }
}

class FirestoreStore extends Store {
  constructor() {
    super();
  }

  async get(sid: string, callback: (err: any, session?: SessionData | null) => void) {
    try {
      const docRef = doc(collection(firestore, 'sessions'), sid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        callback(null, docSnap.data() as SessionData);
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, session: SessionData, callback?: (err?: any) => void) {
  try {
    const userId = (session as CustomSession).userId;
    let sessionData: Partial<SessionData & {userId?: string, expiresString?: string}> = {
  cookie: {
    originalMaxAge: session.cookie.originalMaxAge,
    path: session.cookie.path,
    httpOnly: session.cookie.httpOnly,
    secure: session.cookie.secure,
    expires: session.cookie.expires,
  },
};
if (session.cookie.expires) {
  sessionData = {...sessionData, expiresString: session.cookie.expires.toISOString()};
}
if (userId) {
  sessionData = {...sessionData, userId: userId};
}
    const docRef = doc(collection(firestore, 'sessions'), sid);
    await setDoc(docRef, sessionData);
    if (callback) callback(null);
  } catch (err) {
    console.error('Error setting session:', err);
    if (callback) callback(err);
  }
}

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const docRef = doc(collection(firestore, 'sessions'), sid);
      await deleteDoc(docRef);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
}

  dotenv.config();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error('SESSION_SECRET is not set');
}

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());
  app.use(compression());
  app.use(
  session({
    store: new FirestoreStore(),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

  app.use((req: Request, res: Response, next: NextFunction) => {
    req.io = io;
    next();
  });

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "public"));

  app.use(express.static(path.join(__dirname, "public")));
  app.use("/chats", express.static(path.join(__dirname, "public/chats")));

  app.use("/", routes);

  app.use(errorHandler);

  server.listen(3000, () => {
    console.log("ExperimentGPT is now running at port 3000!");
  });
