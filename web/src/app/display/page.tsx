"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SEGMENT_DISPLAY_TITLES,
  resolveDisplayPhase,
  type DisplayPhase,
  type MatchState,
} from "@game-screan/shared";
import { apiFetch } from "@/lib/api-client";
import { getSocket } from "@/lib/socket-client";
import "./display-screen.css";
import NavLayout from "@/components/nav";
import { Player } from "./player";
import { DisplayWaiting } from "./DisplayWaiting";
import { DisplayWinner } from "./DisplayWinner";
import { fontTjwal } from "@/lib/font-tjwal";

type WaitingPreview = {
  nameA?: string;
  nameB?: string;
  imageA?: string;
  imageB?: string;
};

type DisplaySnapshotResponse = {
  phase: DisplayPhase;
  state: MatchState | null;
  preview: {
    playerA: { name: string; image: string };
    playerB: { name: string; image: string };
  } | null;
};

const AUCTION_TIMER_MAX = 30;
const RING_SIZE = 220;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function DisplayAuctionTimer({ timer }: { timer: number }) {
  const progress = Math.min(1, Math.max(0, timer / AUCTION_TIMER_MAX));
  const strokeOffset = RING_CIRCUMFERENCE * (1 - progress);

  return (
    <div className={`${fontTjwal.className} display-timer mx-auto w-full max-w-2xl`}>
      <div className="display-timer__ring-wrap" aria-hidden>
        <svg
          className="display-timer__ring-svg"
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          role="presentation"
        >
          <circle
            className="display-timer__ring-bg"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
          />
          <motion.circle
            className="display-timer__ring-progress"
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            animate={{ strokeDashoffset: strokeOffset }}
            transition={{ duration: 0.5, ease: "linear" }}
            transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
          />
        </svg>

        <div className="display-timer__value">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={timer}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="font-tjwal display-title-shadow tabular-nums text-[clamp(2.5rem,7vw,5rem)] font-bold text-[#f4d03f]"
            >
              {timer}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
 
    </div>
  );
}

function previewFromSnapshot(
  preview: DisplaySnapshotResponse["preview"],
): WaitingPreview | null {
  if (!preview?.playerA || !preview?.playerB) return null;
  return {
    nameA: preview.playerA.name,
    nameB: preview.playerB.name,
    imageA: preview.playerA.image,
    imageB: preview.playerB.image,
  };
}

function DisplayLayout({
  state,
  waitingPreview,
}: {
  state: MatchState | null;
  waitingPreview: WaitingPreview | null;
}) {
  const phase = resolveDisplayPhase(state);
  const waitingPlayers =
    phase === "WAITING"
      ? {
        nameA: waitingPreview?.nameA,
        nameB: waitingPreview?.nameB,
        imageA: waitingPreview?.imageA,
        imageB: waitingPreview?.imageB,
      }
      : null;
  const segmentTitle = state ? SEGMENT_DISPLAY_TITLES[state.segment] : "";
  const showTimer =
    phase === "ACTIVE" &&
    state?.segment === "AUCTION" &&
    state.timer != null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="display-screen relative pt-42 *:flex min-h-screen max-w-[1800px] flex-col overflow-hidden p-8 text-white"
      dir="rtl"
    >
      <NavLayout state={state} />

      {phase === "ACTIVE" && (
        <motion.div layout className="relative z-10 px-4 pt-2 text-center flex flex-col items-center justify-center">
          {showTimer ? (
            <DisplayAuctionTimer
              timer={state!.timer!}
            />
          ) : (
            <AnimatePresence mode="wait">
              <motion.h1
                key={segmentTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="font-azkadina display-title-shadow mx-auto mt-32 text-[clamp(2.25rem,6vw,4.5rem)] text-[#f4d03f]"
              >
                {segmentTitle}
              </motion.h1>
            </AnimatePresence>
          )}
        </motion.div>
      )}

      <div className="relative z-10 flex flex-1 flex-col justify-center px-[clamp(0.5rem,2vw,2rem)] pb-[clamp(1.5rem,4vw,3rem)]">
        <AnimatePresence mode="wait">
          {phase === "WINNER" && state ? (
            <DisplayWinner key={`winner-${state.id}`} state={state} />
          ) : phase === "WAITING" ? (
            <DisplayWaiting
              key="waiting"
              nameA={waitingPlayers?.nameA}
              nameB={waitingPlayers?.nameB}
              imageA={waitingPlayers?.imageA}
              imageB={waitingPlayers?.imageB}
            />
          ) : state ? (
            <motion.div layout className="display-players -mt-22" dir="ltr">
              <Player
                name={state.playerA.name}
                image={state.playerA.image}
                score={state.playerA.rank}
                misses={state.playerA.misses ?? 0}
                passActive={state.playerA.passActive ?? false}
                showMisses={state.segment === "WHAT_DO_YOU_KNOW"}
                side="A"
              />
              <Player
                name={state.playerB.name}
                image={state.playerB.image}
                score={state.playerB.rank}
                misses={state.playerB.misses ?? 0}
                passActive={state.playerB.passActive ?? false}
                showMisses={state.segment === "WHAT_DO_YOU_KNOW"}
                side="B"
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {phase === "ACTIVE" && state?.question && (
          <motion.p
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-auto mt-8 max-w-4xl text-center text-xl font-bold text-white/90 md:text-2xl"
            dir="rtl"
          >
            {state.question}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}

export default function DisplayPage() {
  const [state, setState] = useState<MatchState | null>(null);
  const [waitingPreview, setWaitingPreview] = useState<WaitingPreview | null>(
    null,
  );

  const applySnapshot = useCallback((snap: DisplaySnapshotResponse) => {
    setState(snap.state);
    if (snap.phase === "WAITING") {
      setWaitingPreview(previewFromSnapshot(snap.preview));
    } else {
      setWaitingPreview(null);
    }
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onUpdate = (payload: unknown) => {
      const next = payload as MatchState;
      setState(next);
      if (resolveDisplayPhase(next) !== "WAITING") {
        setWaitingPreview(null);
      }
    };

    const syncDisplayState = async () => {
      try {
        const res = await apiFetch("/api/match?display=1");
        if (!res.ok) return;
        const snap = (await res.json()) as DisplaySnapshotResponse;
        applySnapshot(snap);
      } catch {
        /* ignore */
      }
    };

    const onConnect = () => {
      void syncDisplayState();
    };

    socket.on("STATE_UPDATE", onUpdate);
    socket.on("connect", onConnect);
    void syncDisplayState();

    return () => {
      socket.off("STATE_UPDATE", onUpdate);
      socket.off("connect", onConnect);
    };
  }, [applySnapshot]);

  const displayState = useMemo(() => state, [state]);
  const layoutKey =
    displayState?.id ??
    (waitingPreview ? "waiting" : resolveDisplayPhase(displayState));

  return (
    <AnimatePresence mode="wait">
      <DisplayLayout
        key={layoutKey}
        state={displayState}
        waitingPreview={waitingPreview}
      />
    </AnimatePresence>
  );
}
