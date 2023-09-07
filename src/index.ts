import express, { Request, Response, NextFunction } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import helmet from "helmet";
import session from "express-session";
import { Firestore } from "@google-cloud/firestore";
import { FirestoreStore } from "@google-cloud/connect-firestore";
import routes from "./routes";
import pino from "pino";
import logger from "pino-http";
import { firestore } from "./firebaseConfig"; 
import http from "http";
import { Server } from "socket.io";
import compression from "compression";

dotenv.config();

const httpLogger = logger({ autoLogging: false });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Custom error classes
export class BadRequestError extends Error {
  constructor(message = 'Bad Request') {
    super(message);
    this.name = 'BadRequestError';
  }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(httpLogger);
app.use(compression());
app.use(
  session({
    store: new FirestoreStore({
      dataset: firestore, 
      kind: "express-sessions",
    }),
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error(err.stack);
  switch (err.name) {
    case 'BadRequestError':
      res.status(400).send(err.message);
      break;
    case 'UnauthorizedError':
      res.status(401).send(err.message);
      break;
    case 'NotFoundError':
      res.status(404).send(err.message);
      break;
    default:
      res.status(500).send('Something broke!');
  }
});

declare module 'express-serve-static-core' {
  interface Request {
    io: typeof io;
  }
}

app.use((req: Request, res: Response, next: NextFunction) => {
  req.io = io;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/chats", express.static(path.join(__dirname, "public/chats")));

app.use("/", routes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error(err.stack);
  res.status(500).send("Something broke!");
});


server.listen(3000, () => {
  console.log("Server is now running at port 3000!");
});