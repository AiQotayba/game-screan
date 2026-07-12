"use client";

import { useFormContext } from "react-hook-form";
import type { CreateMatchInput } from "@game-screan/shared";
import { cn } from "@/lib/cn";

export function StepPlayers({ className }: { className?: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateMatchInput>();

  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)} dir="rtl">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm text-white/60">لاعب A</p>
        <input
          className="mb-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-emerald-400/60"
          placeholder="الاسم"
          {...register("playerA.name")}
        />
        {errors.playerA?.name && (
          <p className="text-xs text-rose-400">{errors.playerA.name.message}</p>
        )}
        <input
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-emerald-400/60"
          placeholder="رابط الصورة"
          {...register("playerA.image")}
        />
        {errors.playerA?.image && (
          <p className="text-xs text-rose-400">{errors.playerA.image.message}</p>
        )}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-3 text-sm text-white/60">لاعب B</p>
        <input
          className="mb-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-emerald-400/60"
          placeholder="الاسم"
          {...register("playerB.name")}
        />
        {errors.playerB?.name && (
          <p className="text-xs text-rose-400">{errors.playerB.name.message}</p>
        )}
        <input
          className="mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-white outline-none focus:border-emerald-400/60"
          placeholder="رابط الصورة"
          {...register("playerB.image")}
        />
        {errors.playerB?.image && (
          <p className="text-xs text-rose-400">{errors.playerB.image.message}</p>
        )}
      </div>
    </div>
  );
}
