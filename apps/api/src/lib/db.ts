import { randomUUID } from "node:crypto";
import {
  toMatchState,
  type CreateMatchInput,
  type DisplayPhase,
  type Match,
  type MatchState,
  type PatchMatchInput,
} from "@game-screan/shared";
import { readAppState, withAppState, type AppStateFile } from "./file-store.js";

function mergePlayer(
  base: Match["playerA"],
  patch: NonNullable<PatchMatchInput["data"]["playerA"]> | undefined,
) {
  if (!patch) return base;
  const nextMisses = patch.misses ?? base.misses ?? 0;
  const nextPassActive = patch.passActive ?? base.passActive ?? false;
  return {
    ...base,
    ...patch,
    misses: Math.max(0, Math.min(3, nextMisses)),
    passActive: nextPassActive,
  };
}

function applyPatch(match: Match, data: PatchMatchInput["data"]): Match {
  const next: Match = {
    ...match,
    playerA: mergePlayer(match.playerA, data.playerA),
    playerB: mergePlayer(match.playerB, data.playerB),
    updatedAt: new Date().toISOString(),
  };

  if (data.round !== undefined) next.round = data.round;
  if (data.segment !== undefined) {
    next.segment = data.segment;
    if (data.segment !== "AUCTION") {
      next.timer = null;
    }
  }
  if (data.timer !== undefined) next.timer = data.timer;
  if (data.isFinal !== undefined) next.isFinal = data.isFinal;
  if (data.status !== undefined) next.status = data.status;
  if (data.question !== undefined) next.question = data.question;

  if (data.segment === "AUCTION" && next.timer == null) {
    next.timer = 30;
  }

  return next;
}

export async function getMatchById(id: string): Promise<Match | null> {
  const state = await readAppState();
  return state.matches.find((m) => m.id === id) ?? null;
}

export async function getActiveMatchState(): Promise<MatchState | null> {
  const state = await readAppState();
  if (!state.activeMatchId) return null;
  const match = state.matches.find((m) => m.id === state.activeMatchId);
  if (!match || match.status !== "SETUP") return null;
  return toMatchState(match);
}

export type MatchPreview = {
  playerA: Match["playerA"];
  playerB: Match["playerB"];
};

export async function getLatestFinishedMatchState(): Promise<MatchState | null> {
  const state = await readAppState();
  const finished = state.matches
    .filter((m) => m.status === "FINISHED")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const latest = finished[0];
  return latest ? toMatchState(latest) : null;
}

/** معاينة «المتسابقين التاليين» من آخر مباراة منتهية فقط. */
export async function getWaitingPreview(): Promise<MatchPreview | null> {
  const state = await readAppState();
  const finished = state.matches
    .filter((m) => m.status === "FINISHED")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  const latest = finished[0];
  if (!latest) return null;
  return {
    playerA: latest.playerA,
    playerB: latest.playerB,
  };
}

export type DisplaySnapshot = {
  phase: DisplayPhase;
  state: MatchState | null;
  preview: MatchPreview | null;
};

export async function getDisplaySnapshot(): Promise<DisplaySnapshot> {
  const active = await getActiveMatchState();
  if (active) {
    return { phase: "ACTIVE", state: active, preview: null };
  }

  const finished = await getLatestFinishedMatchState();
  if (finished) {
    return { phase: "WINNER", state: finished, preview: null };
  }

  const preview = await getWaitingPreview();
  return { phase: "WAITING", state: null, preview };
}

export async function listMatches(): Promise<Match[]> {
  const state = await readAppState();
  return [...state.matches].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function createMatch(input: CreateMatchInput): Promise<Match> {
  return withAppState(async (state) => {
    if (state.activeMatchId) {
      const current = state.matches.find((m) => m.id === state.activeMatchId);
      if (current?.status === "SETUP") {
        throw new Error("ACTIVE_MATCH_EXISTS");
      }
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const timer = input.segment === "AUCTION" ? (input.timer ?? 30) : null;

    const match: Match = {
      id,
      playerA: {
        ...input.playerA,
        misses: input.playerA.misses ?? 0,
        passActive: input.playerA.passActive ?? false,
      },
      playerB: {
        ...input.playerB,
        misses: input.playerB.misses ?? 0,
        passActive: input.playerB.passActive ?? false,
      },
      round: input.round,
      segment: input.segment,
      timer,
      isFinal: input.isFinal,
      status: "SETUP",
      question: input.question ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const next: AppStateFile = {
      matches: [...state.matches, match],
      activeMatchId: id,
    };

    return { next, result: match };
  });
}

export async function updateMatch(body: PatchMatchInput): Promise<Match | null> {
  return withAppState(async (state) => {
    const idx = state.matches.findIndex((m) => m.id === body.id);
    if (idx === -1) return { next: state, result: null };

    const updated = applyPatch(state.matches[idx], body.data);
    const matches = [...state.matches];
    matches[idx] = updated;

    let activeMatchId = state.activeMatchId;
    if (updated.status === "FINISHED" && activeMatchId === updated.id) {
      activeMatchId = null;
    }

    return {
      next: { matches, activeMatchId },
      result: updated,
    };
  });
}

export async function deleteMatch(id: string): Promise<boolean> {
  return withAppState(async (state) => {
    const idx = state.matches.findIndex((m) => m.id === id);
    if (idx === -1) return { next: state, result: false };

    const matches = [...state.matches];
    matches.splice(idx, 1);

    let activeMatchId = state.activeMatchId;
    if (activeMatchId === id) {
      activeMatchId = null;
    }

    return {
      next: { matches, activeMatchId },
      result: true,
    };
  });
}

export async function clearAllMatches(): Promise<void> {
  return withAppState(async () => {
    return {
      next: { matches: [], activeMatchId: null },
      result: undefined,
    };
  });
}
