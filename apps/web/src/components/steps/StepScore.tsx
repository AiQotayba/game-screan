"use client";

import { cn } from "@/lib/cn";

type Side = "A" | "B";

type Props = {
  rankA: number;
  rankB: number;
  onDelta: (side: Side, delta: number) => void;
  onSetRank: (side: Side, value: number) => void;
  className?: string;
};

function SideCard({
  label,
  rank,
  side,
  onDelta,
  onSetRank,
}: {
  label: string;
  rank: number;
  side: Side;
  onDelta: (side: Side, delta: number) => void;
  onSetRank: (side: Side, value: number) => void;
}) {
  const deltas = [1, 2, 3, 4, 5];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4" dir="rtl">
      <p className="mb-3 text-center text-sm text-white/60">{label}</p>
      <p className="mb-4 text-center text-4xl font-black tabular-nums text-white">{rank}</p>
      <div className="mb-2 grid grid-cols-5 gap-2">
        {deltas.map((d) => (
          <button
            key={`p-${d}`}
            type="button"
            className="rounded-lg bg-emerald-500/20 py-2 text-xs text-emerald-100 hover:bg-emerald-500/30 sm:text-sm"
            onClick={() => onDelta(side, d)}
          >
            +{d}
          </button>
        ))}
      </div>
      <div className="mb-3 grid grid-cols-5 gap-2">
        {deltas.map((d) => (
          <button
            key={`m-${d}`}
            type="button"
            className="rounded-lg bg-rose-500/20 py-2 text-xs text-rose-100 hover:bg-rose-500/30 sm:text-sm"
            onClick={() => onDelta(side, -d)}
          >
            −{d}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1 text-xs text-white/50">
        قيمة مباشرة
        <input
          type="number"
          className="w-full rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white outline-none"
          value={Number.isFinite(rank) ? rank : 0}
          onChange={(e) => onSetRank(side, Number.parseInt(e.target.value || "0", 10))}
        />
      </label>
    </div>
  );
}

export function StepScore({ rankA, rankB, onDelta, onSetRank, className }: Props) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2", className)} dir="ltr">
      <SideCard label="A" side="A" rank={rankA} onDelta={onDelta} onSetRank={onSetRank} />
      <SideCard label="B" side="B" rank={rankB} onDelta={onDelta} onSetRank={onSetRank} />
    </div>
  );
}
