import type { MatchState } from "./state-engine";

/** حالة شاشة العرض (لا تُخزَّن في قاعدة البيانات). */
export type DisplayPhase = "WAITING" | "ACTIVE" | "WINNER";

export const DISPLAY_PHASE_LABELS: Record<DisplayPhase, string> = {
  WAITING: "بانتظار مباراة",
  ACTIVE: "مباراة مفعلة",
  WINNER: "الفائز",
};

export function resolveDisplayPhase(state: MatchState | null): DisplayPhase {
  if (!state) return "WAITING";
  if (state.status === "SETUP") return "ACTIVE";
  if (state.status === "FINISHED") return "WINNER";
  return "WAITING";
}
