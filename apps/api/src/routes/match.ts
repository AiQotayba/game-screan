import { Router } from "express";
import {
  createMatchSchema,
  patchMatchBodySchema,
} from "@game-screan/shared";
import {
  createMatch,
  getActiveMatchState,
  getDisplaySnapshot,
  getLatestFinishedMatchState,
  getMatchById,
  getWaitingPreview,
  listMatches,
  updateMatch,
} from "../lib/db.js";
import { emitMatchState } from "../lib/emit-state.js";

export const matchRouter = Router();

matchRouter.get("/", async (req, res) => {
  const id = req.query.id as string | undefined;
  const active = req.query.active;

  if (active === "1" || active === "true") {
    const state = await getActiveMatchState();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(state);
  }

  const display = req.query.display;
  if (display === "1" || display === "true") {
    const snapshot = await getDisplaySnapshot();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(snapshot);
  }

  const preview = req.query.preview;
  if (preview === "1" || preview === "true") {
    const data = await getWaitingPreview();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(data);
  }

  const finished = req.query.finished;
  if (finished === "1" || finished === "true") {
    const data = await getLatestFinishedMatchState();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(data);
  }

  const history = req.query.history;
  if (history === "1" || history === "true") {
    const data = await listMatches();
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    return res.json(data);
  }

  if (!id) {
    return res.status(400).json({ error: "id مطلوب" });
  }

  const match = await getMatchById(id);
  if (!match) {
    return res.status(404).json({ error: "غير موجود" });
  }

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  return res.json(match);
});

matchRouter.post("/", async (req, res) => {
  const parsed = createMatchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: "تحقق فشل",
      issues: parsed.error.flatten(),
    });
  }

  try {
    const match = await createMatch(parsed.data);
    emitMatchState(match);
    return res.status(201).json(match);
  } catch (e) {
    if (e instanceof Error && e.message === "ACTIVE_MATCH_EXISTS") {
      return res.status(409).json({
        error: "توجد مباراة نشطة. أنهِها قبل بدء أخرى.",
      });
    }
    throw e;
  }
});

matchRouter.patch("/", async (req, res) => {
  const parsed = patchMatchBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      error: "تحقق فشل",
      issues: parsed.error.flatten(),
    });
  }

  const updated = await updateMatch(parsed.data);
  if (!updated) {
    return res.status(404).json({ error: "غير موجود" });
  }

  emitMatchState(updated);
  return res.json(updated);
});
