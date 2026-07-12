import type { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function setSocketIO(server: IOServer) {
  io = server;
}

export function getSocketIO(): IOServer | null {
  return io;
}
