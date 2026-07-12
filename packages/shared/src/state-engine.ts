import type { Match, PlayerCard, Round, Segment } from "./types/match";

export type MatchState = {
  id: string;
  playerA: PlayerCard;
  playerB: PlayerCard;
  round: Round;
  segment: Segment;
  question: string | null;
  timer: number | null;
  status: Match["status"];
  isFinal: boolean;
};

export function toMatchState(match: Match): MatchState {
  const isAuction = match.segment === "AUCTION";
  return {
    id: match.id,
    playerA: {
      ...match.playerA,
      misses: match.playerA.misses ?? 0,
      passActive: match.playerA.passActive ?? false,
    },
    playerB: {
      ...match.playerB,
      misses: match.playerB.misses ?? 0,
      passActive: match.playerB.passActive ?? false,
    },
    round: match.round,
    segment: match.segment,
    question: match.question ?? null,
    timer: isAuction ? match.timer : null,
    status: match.status,
    isFinal: match.isFinal,
  };
}
