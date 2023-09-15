"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const express_session_1 = require("express-session");
const express_session_2 = __importDefault(require("express-session"));
const routes_1 = __importDefault(require("./routes"));
const firebaseConfig_1 = require("./firebaseConfig");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const error_1 = require("./error");
const lite_1 = require("firebase/firestore/lite");
class FirestoreStore extends express_session_1.Store {
  constructor() {
    super();
  }
  async get(sid, callback) {
    try {
      const docRef = (0, lite_1.doc)(
        (0, lite_1.collection)(firebaseConfig_1.firestore, "sessions"),
        sid
      );
      const docSnap = await (0, lite_1.getDoc)(docRef);
      if (docSnap.exists()) {
        callback(null, docSnap.data());
      } else {
        callback(null, null);
      }
    } catch (err) {
      callback(err);
    }
  }
  async set(sid, session, callback) {
    try {
      const userId = session.userId;
      let sessionData = {
        cookie: {
          originalMaxAge: session.cookie.originalMaxAge,
          path: session.cookie.path,
          httpOnly: session.cookie.httpOnly,
          secure: session.cookie.secure,
          expires: session.cookie.expires,
        },
      };
      if (session.cookie.expires) {
        sessionData = {
          ...sessionData,
          expiresString: session.cookie.expires.toISOString(),
        };
      }
      if (userId) {
        sessionData = { ...sessionData, userId: userId };
      }
      const docRef = (0, lite_1.doc)(
        (0, lite_1.collection)(firebaseConfig_1.firestore, "sessions"),
        sid
      );
      await (0, lite_1.setDoc)(docRef, sessionData);
      if (callback) callback(null);
    } catch (err) {
      console.error("Error setting session:", err);
      if (callback) callback(err);
    }
  }
  async destroy(sid, callback) {
    try {
      const docRef = (0, lite_1.doc)(
        (0, lite_1.collection)(firebaseConfig_1.firestore, "sessions"),
        sid
      );
      await (0, lite_1.deleteDoc)(docRef);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
}
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET is not set");
}
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(
  (0, express_session_2.default)({
    store: new FirestoreStore(),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "public"));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use(
  "/chats",
  express_1.default.static(path_1.default.join(__dirname, "public/chats"))
);
app.use("/", routes_1.default);
app.use(error_1.errorHandler);
server.listen(3000, () => {
  console.log("ExperimentGPT is now running at port 3000!");
});
