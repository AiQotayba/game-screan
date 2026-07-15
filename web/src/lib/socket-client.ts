"use client";

import { io, type Socket } from "socket.io-client";
import { getSocketBase } from "./api-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (typeof window === "undefined") {
    throw new Error("Socket متاح في المتصفح فقط");
  }
  if (!socket) {
    // Socket.io يجب أن يتصل مباشرة بالـ API (ليس عبر Next.js)
    const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    const url = configured ?? `${window.location.protocol}//${window.location.hostname}:4000`;
    socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
    });

    if (process.env.NODE_ENV === "development") {
      socket.on("connect", () => {
        console.info("[socket] connected", url, socket?.id);
      });
      socket.on("disconnect", (reason) => {
        console.warn("[socket] disconnected", reason);
      });
      socket.on("connect_error", (err) => {
        console.error("[socket] connect_error", err.message, "→", url);
      });
    }
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
