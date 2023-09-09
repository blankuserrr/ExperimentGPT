"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const express_session_1 = __importDefault(require("express-session"));
const connect_firestore_1 = require("@google-cloud/connect-firestore");
const routes_1 = __importDefault(require("./routes"));
const firebaseConfig_1 = require("./firebaseConfig");
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const compression_1 = __importDefault(require("compression"));
const error_1 = require("./error");
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
if (cluster_1.default.isMaster) {
    const numCPUs = os_1.default.cpus().length;
    console.log(`Primary ${process.pid} is running with ${numCPUs} workers!`);
    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
    });
}
else {
    dotenv_1.default.config();
    const app = (0, express_1.default)();
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server);
    app.use(body_parser_1.default.json());
    app.use(body_parser_1.default.urlencoded({ extended: true }));
    app.use((0, cors_1.default)());
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
    app.use((req, res, next) => {
        req.io = io;
        next();
    });
    app.set("view engine", "ejs");
    app.set("views", path_1.default.join(__dirname, "public"));
    app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
    app.use("/chats", express_1.default.static(path_1.default.join(__dirname, "public/chats")));
    app.use("/", routes_1.default);
    // Use the error handler middleware
    app.use(error_1.errorHandler);
    server.listen(3000);
}
