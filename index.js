"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadRequestError = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const connect_firestore_1 = require("@google-cloud/connect-firestore");
const routes_1 = __importDefault(require("./routes"));
const pino_http_1 = __importDefault(require("pino-http"));
const firebaseConfig_1 = require("./firebaseConfig");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
dotenv_1.default.config();
const httpLogger = (0, pino_http_1.default)({ autoLogging: false });
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// Custom error classes
class BadRequestError extends Error {
    constructor(message = 'Bad Request') {
        super(message);
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use(httpLogger);
app.use((0, compression_1.default)());
app.use((0, express_session_1.default)({
    store: new connect_firestore_1.FirestoreStore({
        dataset: firebaseConfig_1.firestore,
        kind: "express-sessions",
    }),
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
app.use((err, req, res, next) => {
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
app.use((req, res, next) => {
    req.io = io;
    next();
});
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "public"));
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
app.use("/chats", express_1.default.static(path_1.default.join(__dirname, "public/chats")));
app.use("/", routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    req.log.error(err.stack);
    res.status(500).send("Something broke!");
});
server.listen(3000, () => {
    console.log("Server is now running at port 3000!");
});
