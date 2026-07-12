"use client";

import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  className?: string;
};

export function StepQuestion({ value, onChange, onSubmit, className }: Props) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/5 p-4", className)} dir="rtl">
      <p className="mb-2 text-sm text-white/60">نص السؤال (للشاشة)</p>
      <textarea
        className="mb-3 min-h-[88px] w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اختياري"
      />
      <button
        type="button"
        className="w-full rounded-xl border border-white/15 bg-white/10 py-2 text-sm text-white hover:bg-white/15"
        onClick={onSubmit}
      >
        تحديث السؤال
      </button>
    </div>
  );
}
