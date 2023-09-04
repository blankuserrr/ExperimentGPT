import { Server as SocketIoServer } from "socket.io";

declare global {
  interface Window {
    jQuery: any;
  }
}

declare global {
  const htmx: any;
}
