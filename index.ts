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
import { firestore } from "./firebaseConfig"; // Import firestore from firebaseConfig.js
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const standaloneLogger = pino({ level: "warn" });
const httpLogger = logger({ autoLogging: false });

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(httpLogger);
app.use(
  session({
    store: new FirestoreStore({
      dataset: firestore, // Use the firestore instance from firebaseConfig.js
      kind: "express-sessions",
    }),
    secret: "test123",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if your using https
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

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(3000, () => {
  console.log("Server is now running at port 3000!");
});