const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const session = require("express-session");
const { Firestore } = require("@google-cloud/firestore");
const { FirestoreStore } = require("@google-cloud/connect-firestore");
const routes = require("./routes");
const pino = require("pino");
const logger = require("pino-http");
const { firestore } = require("./firebaseConfig"); // Import firestore from firebaseConfig.js
const http = require("http");
const { Server } = require("socket.io");

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
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

app.use(express.static(path.join(__dirname, "public")));
app.use("/chats", express.static(path.join(__dirname, "public/chats")));

app.use("/", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  req.log.error(err.stack);
  res.status(500).send("Something broke!");
});

server.listen(3000, () => {
  console.log("Server is now running at port 3000!");
});
