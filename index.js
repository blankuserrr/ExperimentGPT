const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const session = require("express-session");
const routes = require("./routes");
const pino = require("pino");
const logger = require("pino-http");

dotenv.config();

const standaloneLogger = pino({ level: "warn" });
const httpLogger = logger({ autoLogging: false });

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(httpLogger);
app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if your using https
  })
);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://unpkg.com",
          "'unsafe-eval'",
          "https://cdnjs.cloudflare.com",
        ],
      },
    },
  })
);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

const db = require("./firebaseConfig");

app.use(express.static(path.join(__dirname, "public")));
app.use("/chats", express.static(path.join(__dirname, "public/chats")));

app.use("/", routes); // Use the routes

// Error handling middleware
app.use((err, req, res, next) => {
  req.log.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(3000, () => {
  console.log("Server is now running at port 3000!");
});
 