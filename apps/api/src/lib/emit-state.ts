import { toMatchState, type Match } from "@game-screan/shared";
import { getSocketIO } from "./socket-registry.js";

export function emitMatchState(match: Match | null) {
  const io = getSocketIO();
  if (!io) return;
  io.emit("STATE_UPDATE", match ? toMatchState(match) : null);
}
