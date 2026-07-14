import type { Round, Segment } from "./types/match";

export const ROUND_LABELS: Record<Round, string> = {
  ROUND_16: "دور الـ16",
  ROUND_8: "دور الـ8",
  QUARTER_FINAL: "ربع النهائي",
  SEMI_FINAL: "نصف النهائي",
  FINAL: "النهائي",
};

export const SEGMENT_LABELS: Record<Segment, string> = {
  WHAT_DO_YOU_KNOW: "ماذا تعرف",
  AUCTION: "المزاد",
  PLAYER_STORY: "قصة لاعب",
  BUZZER: "الجرس",
  IMPOSSIBLE: "المستحيل",
  COMPENSATION: "التعويض",
};

export const SEGMENT_DISPLAY_TITLES: Record<Segment, string> = {
  WHAT_DO_YOU_KNOW: "ماذا تعرف..؟",
  AUCTION: "المزاد",
  PLAYER_STORY: "قصة لاعب",
  BUZZER: "الجرس",
  IMPOSSIBLE: "المستحيل",
  COMPENSATION: "التعويض",
};

export const ROUND_DISPLAY_LABELS: Record<Round, string> = {
  ROUND_16: "دور الـ 16",
  ROUND_8: "دور الـ 8",
  QUARTER_FINAL: "ربع النهائي",
  SEMI_FINAL: "نصف النهائي",
  FINAL: "النهائي",
};

export const SEGMENT_ORDER: Segment[] = [
  "WHAT_DO_YOU_KNOW",
  "AUCTION",
  "PLAYER_STORY",
  "BUZZER",
  "IMPOSSIBLE",
  "COMPENSATION",
];
