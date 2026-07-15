import { create } from "zustand";
import type { MatchState } from "@game-screan/shared";

type MatchStore = {
  matchState: MatchState | null;
  setMatchState: (state: MatchState | null) => void;
};

export const useMatchStore = create<MatchStore>((set) => ({
  matchState: null,
  setMatchState: (matchState) => set({ matchState }),
}));
