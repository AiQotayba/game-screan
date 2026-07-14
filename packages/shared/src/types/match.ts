export const ROUND_VALUES = [
  "ROUND_16",
  "ROUND_8",
  "QUARTER_FINAL",
  "SEMI_FINAL",
  "FINAL",
] as const;

export const SEGMENT_VALUES = [
  "WHAT_DO_YOU_KNOW",
  "AUCTION",
  "PLAYER_STORY",
  "BUZZER",
  "IMPOSSIBLE",
  "COMPENSATION",
] as const;

export type Round = (typeof ROUND_VALUES)[number];
export type Segment = (typeof SEGMENT_VALUES)[number];

export type PlayerCard = {
  name: string;
  image: string;
  rank: number;
  misses: number;
  passActive: boolean;
};

export type Match = {
  id: string;
  playerA: PlayerCard;
  playerB: PlayerCard;
  round: Round;
  segment: Segment;
  timer: number | null;
  isFinal: boolean;
  status: "SETUP" | "FINISHED";
  question?: string | null;
  createdAt: string;
  updatedAt: string;
};
