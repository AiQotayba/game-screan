"use client";

import { SEGMENT_LABELS, SEGMENT_ORDER, type Segment } from "@game-screan/shared";
import { cn } from "@/lib/cn";

type Props = {
  segment: Segment;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export function StepSegment({ segment, onPrev, onNext, className }: Props) {
  const idx = SEGMENT_ORDER.indexOf(segment);

  return (
    <div className={cn("flex flex-col gap-3", className)} dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-white/60">الفقرة</p>
        <p className="text-lg font-semibold text-white">{SEGMENT_LABELS[segment]}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90 transition hover:bg-white/10 disabled:opacity-40"
          onClick={onPrev}
          disabled={idx <= 0}
        >
          رجوع
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-500/25 disabled:opacity-40"
          onClick={onNext}
          disabled={idx >= SEGMENT_ORDER.length - 1}
        >
          تقدّم
        </button>
      </div>
    </div>
  );
}
