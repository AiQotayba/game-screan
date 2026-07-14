import { createServer } from "node:http";
import path from "node:path";
import cors from "cors";
import express from "express";
import { Server as IOServer } from "socket.io";
import { getActiveMatchState } from "./lib/db.js";
import { setSocketIO } from "./lib/socket-registry.js";
import { matchRouter } from "./routes/match.js";
import { uploadRouter } from "./routes/upload.js";

const uploadDir =
  process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const corsOrigin = process.env.CORS_ORIGIN ?? "https://ga.sy-calculator.com";

const app = express();
app.use(
  cors({
    origin: corsOrigin.split(",").map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/match", matchRouter);
app.use("/api/upload", uploadRouter);
app.use("/uploads", express.static(uploadDir));

const httpServer = createServer(app);

const allowedOrigins = corsOrigin.split(",").map((o) => o.trim());

const io = new IOServer(httpServer, {
  path: "/socket.io",
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setSocketIO(io);

io.on("connection", (socket) => {
  void (async () => {
    const state = await getActiveMatchState();
    if (state) socket.emit("STATE_UPDATE", state);
  })();
});

httpServer.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.warn(
      `Port ${port} already in use — API may already be running at http://localhost:${port}`,
    );
    process.exit(0);
  }
  throw err;
});

httpServer.listen(port, () => {
  console.log(`API http://localhost:${port} (CORS ${corsOrigin})`);
});
