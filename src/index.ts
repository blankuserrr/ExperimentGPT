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
import { firestore } from "./firebaseConfig"; 
import http from "http";
import { Server } from "socket.io";
import compression from "compression";
import { BadRequestError, errorHandler } from "./error";
import cluster from "cluster";
import os from "os";

 declare module 'express-serve-static-core' {
    interface Request {
      io: typeof io;
    }
  }

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;

  console.log(`Primary ${process.pid} is running with ${numCPUs} workers!`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  dotenv.config();

  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(cors());
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

  server.listen(3000);
}