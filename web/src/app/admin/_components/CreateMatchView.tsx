"use client";

import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  createMatchSchema,
  ROUND_VALUES,
  ROUND_LABELS,
  type CreateMatchInput,
  type Match,
  toMatchState,
} from "@game-screan/shared";
import { getSocketBase } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { PlayerPhotoField } from "@/components/admin/PlayerPhotoField";
import { useMatchStore } from "@/store/matchStore";

const DEFAULT_AVATAR = "#";

const ROUND_IMAGES: Partial<Record<(typeof ROUND_VALUES)[number], string>> = {
  ROUND_16: "/images/16.png",
  ROUND_8: "/images/8.png",
  QUARTER_FINAL: "/images/4.png",
  SEMI_FINAL: "/images/2.png",
  FINAL: "/images/final.png",
};

const ROUNDS_UI = ROUND_VALUES.map((id) => ({
  id,
  label: ROUND_LABELS[id],
}));

type SetupStep = "players" | "platform";

interface CreateMatchViewProps {
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
  showToast: (msg: string) => void;
}

export function CreateMatchView({ busy, setBusy, setError, showToast }: CreateMatchViewProps) {
  const setMatchState = useMatchStore((s) => s.setMatchState);

  // You can use sessionStorage or simply lift state if persistence during navigation is highly required,
  // but typically useForm defaults to initialValues on unmount. We'll use localStorage to preserve inputs if needed.
  const form = useForm<CreateMatchInput>({
    resolver: zodResolver(createMatchSchema),
    defaultValues: {
      playerA: { name: "", image: DEFAULT_AVATAR, rank: 0 },
      playerB: { name: "", image: DEFAULT_AVATAR, rank: 0 },
      round: "ROUND_16",
      segment: "WHAT_DO_YOU_KNOW",
      isFinal: false,
    },
  });

  const { register, handleSubmit, setValue, control } = form;
  const round = useWatch({ control, name: "round" });
  const nameA = useWatch({ control, name: "playerA.name" }) ?? "";
  const nameB = useWatch({ control, name: "playerB.name" }) ?? "";
  const [setupStep, setSetupStep] = useState<SetupStep>("players");

  const onCreate = handleSubmit(async (values) => {
    setError(null);
    setBusy(true);
    try {
      const body = {
        ...values,
        isFinal: values.round === "FINAL",
        playerA: {
          ...values.playerA,
          image: values.playerA.image?.trim() || DEFAULT_AVATAR,
          misses: 0,
          passActive: false,
        },
        playerB: {
          ...values.playerB,
          image: values.playerB.image?.trim() || DEFAULT_AVATAR,
          misses: 0,
          passActive: false,
        },
      };
      const res = await fetch(`${getSocketBase()}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "تعذر إنشاء المباراة");
      }
      setMatchState(toMatchState(json as Match));
      showToast("بدء المباراة");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  });

  const namesReady = nameA.trim().length > 0 && nameB.trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-3xl space-y-8"
    >
      <FormProvider {...form}>
        <form
          onSubmit={onCreate}
          className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
        >
          <input type="hidden" {...register("playerA.rank", { valueAsNumber: true })} />
          <input type="hidden" {...register("playerB.rank", { valueAsNumber: true })} />
          <input type="hidden" {...register("segment")} />

          <div className="mb-8 flex items-center justify-center gap-6">
            {(
              [
                { id: "players" as const, label: "اللاعبون", n: 1 },
                { id: "platform" as const, label: "المنصة", n: 2 },
              ] as const
            ).map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full text-sm font-bold",
                    setupStep === s.id
                      ? "bg-purple-600 text-white"
                      : setupStep === "platform" && s.id === "players"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-400",
                  )}
                >
                  {setupStep === "platform" && s.id === "players" ? (
                    <Check size={16} aria-hidden />
                  ) : (
                    s.n
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-bold",
                    setupStep === s.id ? "text-purple-700" : "text-gray-400",
                  )}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {setupStep === "players" ? (
              <motion.div
                key="setup-players"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">
                  بيانات اللاعبين
                </h2>
                <p className="mb-8 text-center text-sm text-gray-500">
                  أدخل الاسم وارفع صورة كل لاعب
                </p>

                <div className="mb-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-6">
                    <PlayerPhotoField field="playerA" side="A" name={nameA} />
                  </div>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-6">
                    <PlayerPhotoField field="playerB" side="B" name={nameB} />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!namesReady}
                  onClick={() => setSetupStep("platform")}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 text-xl font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  التالي
                  <ChevronLeft size={24} aria-hidden />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="setup-platform"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="mb-2 text-center text-2xl font-bold text-gray-800">المنصة</h2>
                <p className="mb-8 text-center text-sm text-gray-500">
                  اختر دور البطولة (دور الـ16، دور الـ8، ربع النهائي، نصف النهائي، النهائي)
                </p>

                <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {ROUNDS_UI.map((r) => {
                    const img = ROUND_IMAGES[r.id];
                    const selected = round === r.id;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setValue("round", r.id, { shouldValidate: true });
                          setValue("isFinal", r.id === "FINAL", { shouldValidate: true });
                        }}
                        className={cn(
                          "flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
                          selected
                            ? "border-purple-600 bg-purple-50 shadow-md shadow-purple-100"
                            : "border-gray-100 bg-gray-50 hover:border-purple-200 hover:bg-white",
                        )}
                      >
                        {img ? (
                          <Image
                            src={img}
                            alt={r.label}
                            width={80}
                            height={80}
                            className="h-14 w-auto object-contain sm:h-16"
                          />
                        ) : (
                          <span className="text-2xl font-black text-purple-600">
                            {r.label}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-center text-xs font-bold sm:text-sm",
                            selected ? "text-purple-700" : "text-gray-500",
                          )}
                        >
                          {r.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-600">
                  <span className="font-bold text-gray-800">{nameA.trim()}</span>
                  <span className="mx-2 text-purple-600">ضد</span>
                  <span className="font-bold text-gray-800">{nameB.trim()}</span>
                  <span className="mx-2 text-gray-300">·</span>
                  <span className="font-bold text-purple-600">{ROUND_LABELS[round]}</span>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSetupStep("players")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-4 text-lg font-bold text-gray-600 transition hover:bg-gray-50"
                  >
                    <ChevronRight size={22} aria-hidden />
                    السابق
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 text-xl font-bold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    بدء المباراة
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </FormProvider>
    </motion.div>
  );
}
