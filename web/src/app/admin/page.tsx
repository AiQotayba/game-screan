"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Trophy,
} from "lucide-react";
import {
  createMatchSchema,
  ROUND_VALUES,
  ROUND_LABELS,
  SEGMENT_LABELS,
  SEGMENT_ORDER,
  toMatchState,
  type CreateMatchInput,
  type Match,
} from "@game-screan/shared";
import { useMatchStore } from "@/store/matchStore";
import { apiFetch } from "@/lib/api-client";
import { getSocket } from "@/lib/socket-client";
import { cn } from "@/lib/cn";
import Link from "next/link";
import Image from "next/image";
import { PlayerPhotoField } from "@/components/admin/PlayerPhotoField";

const DEFAULT_AVATAR = "#";

const ROUND_IMAGES: Partial<Record<(typeof ROUND_VALUES)[number], string>> = {
  ROUND_16: "/images/16.png",
  ROUND_8: "/images/8.png",
  QUARTER_FINAL: "/images/4.png",
  SEMI_FINAL: "/images/2.png",
  FINAL: "/images/final.png",
};

type SetupStep = "players" | "platform";

const ROUNDS_UI = ROUND_VALUES.map((id) => ({
  id,
  label: ROUND_LABELS[id],
}));

async function patchMatch(id: string, data: Record<string, unknown>) {
  const res = await apiFetch("/api/match", {
    method: "PATCH",
    body: JSON.stringify({ id, data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "فشل التحديث");
  }
  return res.json() as Promise<Match>;
}

function useToast() {
  const [message, setMessage] = useState("");
  const show = useCallback((text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2200);
  }, []);
  return { message, show };
}

export default function AdminPage() {
  const matchState = useMatchStore((s) => s.matchState);
  const setMatchState = useMatchStore((s) => s.setMatchState);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOffline, setApiOffline] = useState(false);
  const [pendingA, setPendingA] = useState(0);
  const [pendingB, setPendingB] = useState(0);
  const [auctionRunning, setAuctionRunning] = useState(false);
  const { message: toast, show: showToast } = useToast();
  const auctionTickRef = useRef(matchState?.timer ?? 30);

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

  const { register, handleSubmit, setValue, control, reset } = form;
  const round = useWatch({ control, name: "round" });
  const nameA = useWatch({ control, name: "playerA.name" }) ?? "";
  const nameB = useWatch({ control, name: "playerB.name" }) ?? "";
  const [setupStep, setSetupStep] = useState<SetupStep>("players");
  const [stapValue, setStapValue] = useState(SEGMENT_LABELS[SEGMENT_ORDER[0]]);

  const applyRemoteState = useCallback(
    (payload: ReturnType<typeof toMatchState> | null) => {
      setMatchState(payload);
    },
    [setMatchState],
  );

  const patchAndSync = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      const match = await patchMatch(id, data);
      applyRemoteState(toMatchState(match));
      return match;
    },
    [applyRemoteState],
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await apiFetch("/health");
        const json = await res.json();
        setApiOffline(!json.ok);
      } catch {
        setApiOffline(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (apiOffline) return;

    const socket = getSocket();
    const onUpdate = (payload: unknown) => {
      applyRemoteState(payload as ReturnType<typeof toMatchState>);
    };

    const syncActive = () => {
      void (async () => {
        try {
          const res = await apiFetch("/api/match?active=true");
          if (!res.ok) return;
          const json = await res.json();
          if (json?.id) applyRemoteState(json as ReturnType<typeof toMatchState>);
        } catch {
          /* ignore */
        }
      })();
    };

    socket.on("STATE_UPDATE", onUpdate);
    socket.on("connect", syncActive);
    if (socket.connected) syncActive();

    return () => {
      socket.off("STATE_UPDATE", onUpdate);
      socket.off("connect", syncActive);
    };
  }, [applyRemoteState, apiOffline]);

  const activeId = matchState?.status === "SETUP" ? matchState.id : null;

  useEffect(() => {
    auctionTickRef.current = matchState?.timer ?? 30;
  }, [matchState?.timer]);

  useEffect(() => {
    if (!auctionRunning || !activeId || matchState?.segment !== "AUCTION") {
      return;
    }
    const iv = window.setInterval(() => {
      const cur = auctionTickRef.current ?? 30;
      const next = Math.max(0, cur - 1);
      auctionTickRef.current = next;
      void patchAndSync(activeId, { timer: next > 0 ? next : null }).catch(() => {
        setAuctionRunning(false);
      });
      if (next <= 0) setAuctionRunning(false);
    }, 1000);
    return () => window.clearInterval(iv);
  }, [auctionRunning, activeId, matchState?.segment, patchAndSync]);

  const segmentIndex = useMemo(() => {
    if (!matchState) return 0;
    return Math.max(0, SEGMENT_ORDER.indexOf(matchState.segment));
  }, [matchState]);
  const currentSegmentId = matchState?.segment ?? "WHAT_DO_YOU_KNOW";
  const currentSegmentLabel = SEGMENT_LABELS[currentSegmentId];
  const isFirstSegment = segmentIndex === 0;
  const isLastSegment = segmentIndex === SEGMENT_ORDER.length - 1;

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
      const res = await apiFetch("/api/match", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error ?? "تعذر إنشاء المباراة");
      }
      applyRemoteState(toMatchState(json as Match));
      showToast("بدء المباراة");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  });

  const togglePending = (side: "A" | "B", value: number) => {
    if (side === "A") {
      setPendingA((p) => (p === value ? 0 : value));
    } else {
      setPendingB((p) => (p === value ? 0 : value));
    }
  };

  const confirmScore = async (side: "A" | "B") => {
    if (!activeId || !matchState) return;
    const amount = side === "A" ? pendingA : pendingB;
    if (amount === 0) return;
    setBusy(true);
    setError(null);
    try {
      const nextA =
        side === "A" ? matchState.playerA.rank + amount : matchState.playerA.rank;
      const nextB =
        side === "B" ? matchState.playerB.rank + amount : matchState.playerB.rank;
      await patchAndSync(activeId, {
        playerA: { rank: nextA },
        playerB: { rank: nextB },
      });
      if (side === "A") setPendingA(0);
      else setPendingB(0);
      showToast(`تحديث نقاط ${side === "A" ? matchState.playerA.name : matchState.playerB.name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const updateMisses = async (side: "A" | "B", nextMisses: number) => {
    if (!activeId || !matchState) return;
    const clampedMisses = Math.max(0, Math.min(3, nextMisses));
    setBusy(true);
    setError(null);
    try {
      await patchAndSync(activeId, {
        playerA: side === "A" ? { misses: clampedMisses } : undefined,
        playerB: side === "B" ? { misses: clampedMisses } : undefined,
      });
      showToast(
        `تحديث X لـ ${side === "A" ? matchState.playerA.name : matchState.playerB.name}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const resetAllMisses = async () => {
    if (!activeId || !matchState) return;
    setBusy(true);
    setError(null);
    try {
      await patchAndSync(activeId, {
        playerA: { misses: 0, passActive: false },
        playerB: { misses: 0, passActive: false },
      });
      showToast("تم تصفير X و PASS لجميع اللاعبين");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const setPassActive = async (side: "A" | "B", active: boolean) => {
    if (!activeId || !matchState) return;
    setBusy(true);
    setError(null);
    try {
      await patchAndSync(activeId, {
        playerA: side === "A" ? { passActive: active } : undefined,
        playerB: side === "B" ? { passActive: active } : undefined,
      });
      showToast(
        `${active ? "تفعيل" : "إلغاء"} PASS لـ ${side === "A" ? matchState.playerA.name : matchState.playerB.name}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const shiftSegment = async (dir: -1 | 1) => {
    if (!activeId || !matchState) return;
    const nextIdx = segmentIndex + dir;
    if (nextIdx < 0 || nextIdx >= SEGMENT_ORDER.length) return;
    setBusy(true);
    setError(null);
    try {
      await patchAndSync(activeId, { segment: SEGMENT_ORDER[nextIdx] });
      setAuctionRunning(false);
      showToast(`الفقرة: ${SEGMENT_LABELS[SEGMENT_ORDER[nextIdx]]}`);
      setStapValue(SEGMENT_LABELS[SEGMENT_ORDER[nextIdx]]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleEndMatch = async () => {
    if (!activeId || !matchState) return;
    setBusy(true);
    setError(null);
    try {
      await patchAndSync(activeId, { status: "FINISHED" });
      setAuctionRunning(false);
      reset({
        playerA: { name: "", image: DEFAULT_AVATAR, rank: 0 },
        playerB: { name: "", image: DEFAULT_AVATAR, rank: 0 },
        round: "ROUND_16",
        segment: "WHAT_DO_YOU_KNOW",
        isFinal: false,
      });
      setSetupStep("players");
      showToast("تم إنهاء المباراة وعرض النتائج");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleNextSegment = async () => {
    if (!activeId || !matchState) return;
    if (!isLastSegment) {
      await shiftSegment(1);
    } else {
      await handleEndMatch();
    }
  };

  const handlePrevSegment = async () => {
    if (isFirstSegment || !activeId) return;
    await shiftSegment(-1);
  };

  const startAuctionTimer = () => {
    if (!activeId || matchState?.segment !== "AUCTION") return;
    const start = matchState.timer ?? 30;
    auctionTickRef.current = start;
    void patchAndSync(activeId, { timer: start }).then(() => {
      setAuctionRunning(true);
      showToast("بدء العداد");
    });
  };

  const pauseAuctionTimer = () => {
    setAuctionRunning(false);
    showToast("إيقاف العداد");
  };

  const resetAuctionTimer = () => {
    if (!activeId || matchState?.segment !== "AUCTION") return;
    setAuctionRunning(false);
    auctionTickRef.current = 30;
    void patchAndSync(activeId, { timer: 30 })
      .then(() => {
        showToast("تصفير المزاد");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "خطأ");
      });
  };

  const namesReady = nameA.trim().length > 0 && nameB.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900" dir="rtl">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-6 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gray-900 px-6 py-3 font-bold text-white shadow-xl"
          >
            <Check size={18} className="text-purple-400" aria-hidden />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-5xl pt-2">
        {apiOffline && (
          <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            الخادم (API) غير متصل على المنفذ 4000. من مجلد المشروع شغّل{" "}
            <code className="rounded bg-amber-100 px-1 font-mono">npm run dev</code>{" "}
            لتشغيل الواجهة والـ API معاً، ثم أعد تحميل الصفحة.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!activeId ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600">
                {ROUND_LABELS[matchState!.round]}
              </span>
              <span className="text-2xl font-black text-purple-600">{currentSegmentLabel}</span>

              <div className="flex shrink-0 flex-col gap-1 border-t border-gray-100 pt-3 sm:border-t-0 sm:border-r sm:pr-6 sm:pt-0">
                <p className="text-xs font-semibold text-gray-500">الفقرة الحالية</p>
                <p className="text-lg font-black leading-tight text-purple-700 sm:text-xl">
                  {stapValue}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 sm:justify-end">

                <Link
                  className="rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-100"
                  href="/display"
                  target="_blank"
                  rel="noreferrer"
                >
                  فتح شاشة العرض
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {(["A", "B"] as const).map((side) => {
                const isA = side === "A";
                const name = isA ? matchState!.playerA.name : matchState!.playerB.name;
                const score = isA ? matchState!.playerA.rank : matchState!.playerB.rank;
                const misses = isA
                  ? (matchState!.playerA.misses ?? 0)
                  : (matchState!.playerB.misses ?? 0);
                const passActive = isA
                  ? (matchState!.playerA.passActive ?? false)
                  : (matchState!.playerB.passActive ?? false);
                const pending = isA ? pendingA : pendingB;
                const positives = [1, 2, 3, 4, 5];
                const negatives = [-1, -2, -3, -4, -5];

                return (
                  <div
                    key={side}
                    className="flex flex-col items-center rounded-3xl border border-gray-100 bg-white p-8 shadow-sm"
                    dir="rtl"
                  >
                    <h2 className="mb-2 text-2xl font-bold text-gray-800">{name}</h2>
                    <div className="mb-8 text-7xl font-black text-purple-600 sm:text-8xl">{score}</div>

                    <div className="mb-2 grid w-full grid-cols-5 gap-2">
                      {positives.map((num) => (
                        <button
                          key={`add-${side}-${num}`}
                          type="button"
                          disabled={busy}
                          onClick={() => togglePending(side, num)}
                          className={cn(
                            "rounded-xl py-3 text-lg font-bold transition-all",
                            pending === num
                              ? "bg-purple-600 text-white shadow-md"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          +{num}
                        </button>
                      ))}
                    </div>
                    <div className="mb-6 grid w-full grid-cols-5 gap-2">
                      {negatives.map((num) => (
                        <button
                          key={`sub-${side}-${num}`}
                          type="button"
                          disabled={busy}
                          onClick={() => togglePending(side, num)}
                          className={cn(
                            "rounded-xl py-3 text-lg font-bold transition-all",
                            pending === num
                              ? "bg-gray-800 text-white shadow-md"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100",
                          )}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={pending === 0 || busy}
                      onClick={() => void confirmScore(side)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 text-xl font-bold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:opacity-40"
                    >
                      <Check size={24} aria-hidden />
                      تأكيد النقاط
                    </button>

                    <div className="mt-4 w-full rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <p className="mb-2 text-center text-sm font-bold text-gray-700">
                        X: {misses} / 3 {passActive ? "• PASS مفعل" : ""}
                      </p>
                      <div className="grid w-full grid-cols-3 gap-2">
                        <button
                          type="button"
                          disabled={busy || misses >= 3}
                          onClick={() => void updateMisses(side, misses + 1)}
                          className="rounded-xl bg-red-500 py-2 text-sm font-bold text-white transition hover:bg-red-600 disabled:opacity-40"
                        >
                          +X
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void setPassActive(side, !passActive)}
                          className="rounded-xl bg-amber-500 py-2 text-sm font-bold text-white transition hover:bg-amber-600 disabled:opacity-40"
                        >
                          {passActive ? "إلغاء PASS" : "تفعيل PASS"}
                        </button>
                        <button
                          type="button"
                          disabled={busy || misses === 0}
                          onClick={() => void updateMisses(side, 0)}
                          className="rounded-xl bg-gray-700 py-2 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-40"
                        >
                          تصفير X
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                disabled={busy}
                onClick={() => void resetAllMisses()}
                className="rounded-xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-40"
              >
                تصفير X للجميع (سؤال جديد)
              </button>
            </div>

            {matchState?.segment === "AUCTION" && (
              <motion.div
                layout
                className="flex flex-col items-stretch justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center"
              >
                <span className="text-xl font-bold text-gray-800">
                  عداد المزاد ({matchState.timer ?? 30}ث)
                </span>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy || auctionRunning}
                    onClick={() => startAuctionTimer()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-800 px-8 py-3 font-bold text-white transition hover:bg-gray-900 disabled:opacity-50 sm:flex-initial"
                  >
                    <Play size={20} aria-hidden />
                    تشغيل
                  </button>
                  <button
                    type="button"
                    disabled={!auctionRunning}
                    onClick={pauseAuctionTimer}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-8 py-3 font-bold text-gray-800 transition hover:bg-gray-200 disabled:opacity-40 sm:flex-initial"
                  >
                    <Pause size={20} aria-hidden />
                    إيقاف
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={resetAuctionTimer}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-100 px-8 py-3 font-bold text-amber-900 transition hover:bg-amber-200 disabled:opacity-40 sm:flex-initial"
                  >
                    تصفير
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                disabled={isFirstSegment || busy}
                onClick={() => void handlePrevSegment()}
                className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-8 py-5 text-xl font-bold text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={24} aria-hidden />
                السابق
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleNextSegment()}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-5 text-xl font-bold transition-all",
                  isLastSegment
                    ? "bg-gray-800 text-white hover:bg-gray-900"
                    : "bg-purple-600 text-white shadow-lg shadow-purple-200 hover:bg-purple-700",
                )}
              >
                {isLastSegment ? (
                  <>
                    <Trophy size={24} aria-hidden />
                    إنهاء المباراة
                  </>
                ) : (
                  <>
                    التالي
                    <ChevronLeft size={24} aria-hidden />
                  </>
                )}
              </button>
            </div>

          </motion.div>
        )}
      </main>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm("هل أنت متأكد من إنهاء المباراة الآن وإظهار النتائج؟")) {
            void handleEndMatch();
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
      >
        <Trophy size={16} aria-hidden />
        إنهاء وإظهار النتائج
      </button>
    </div>
  );
}
