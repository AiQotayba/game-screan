"use client";

import { ROUND_LABELS, type Round } from "@game-screan/shared";
import { cn } from "@/lib/cn";

export function StepRound({ round, className }: { round: Round; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90",
        className,
      )}
      dir="rtl"
    >
      <span className="text-white/50">الجولة</span>
      <span className="font-medium">{ROUND_LABELS[round]}</span>
    </div>
  );
}
