import { Server as SocketIoServer } from "socket.io";

declare namespace Express {
  export interface Request {
    io: SocketIoServer;
  }
}

declare global {
  interface Window {
    jQuery: any;
  }
}

declare global {
  const htmx: any;
}