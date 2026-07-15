"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { MatchState } from "@game-screan/shared";
import { resolvePlayerImageSrc } from "@/lib/player-image";
import { cn } from "@/lib/cn";

function WinnerPhoto({
  name,
  image,
  highlight,
}: {
  name: string;
  image: string;
  highlight: boolean;
}) {
  const src = resolvePlayerImageSrc(image);
  const initial = name.trim().charAt(0) || "?";

  return (
    <motion.div
      className={cn(
        "display-winner__photo-wrap",
        highlight && "display-winner__photo-wrap--winner",
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, type: "spring", stiffness: 200 }}
    >
      <div className="display-winner__photo">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="size-full object-cover" />
        ) : (
          <span className="display-winner__initial">{initial}</span>
        )}
      </div>
      {highlight && (
        <Trophy
          className="display-winner__trophy"
          size={40}
          aria-hidden
        />
      )}
    </motion.div>
  );
}

export function DisplayWinner({ state }: { state: MatchState }) {
  const { playerA, playerB } = state;
  const scoreA = playerA.rank;
  const scoreB = playerB.rank;
  const tie = scoreA === scoreB;
  const winnerSide =
    scoreA > scoreB ? "A" : scoreB > scoreA ? "B" : null;

  const winner = winnerSide === "A" ? playerA : winnerSide === "B" ? playerB : null;

  return (
    <motion.section
      className="display-winner"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      aria-live="polite"
    >
      <p className="font-azkadina display-winner__heading pt-24 display-title-shadow">
        {tie ? "تعادل" : "الفائز"}
      </p>

      {tie ? (
        <div className="display-winner__tie-row" dir="ltr">
          <div className="display-winner__tie-slot">
            <WinnerPhoto name={playerA.name} image={playerA.image} highlight />
            <p className="display-winner__name">{playerA.name}</p>
            <p className="display-winner__score">{scoreA}</p>
          </div>
          <span className="font-sans font-black display-winner__vs" aria-hidden>
            VS
          </span>
          <div className="display-winner__tie-slot">
            <WinnerPhoto name={playerB.name} image={playerB.image} highlight />
            <p className="display-winner__name">{playerB.name}</p>
            <p className="display-winner__score">{scoreB}</p>
          </div>
        </div>
      ) : winner ? (
        <div className="display-winner__hero">
          <WinnerPhoto
            name={winner.name}
            image={winner.image}
            highlight
          />
          <p className="font-azkadina display-winner__winner-name">{winner.name}</p>
          <p className="display-winner__winner-score tabular-nums">{winner.rank}</p>
          <p className="display-winner__sub">
            {winnerSide === "A" ? playerB.name : playerA.name}
            <span className="mx-2 text-white/40">·</span>
            <span className="tabular-nums">
              {winnerSide === "A" ? scoreB : scoreA}
            </span>
          </p>
        </div>
      ) : null}
    </motion.section>
  );
}
