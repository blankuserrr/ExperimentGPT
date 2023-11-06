import { Server as SocketIoServer } from "socket.io";
import { CustomSession } from '../lib/routes';

declare module "express-serve-static-core" {
	interface Request {
		io: SocketIoServer;
		session: CustomSession;
		uid?: string;
	}
}
