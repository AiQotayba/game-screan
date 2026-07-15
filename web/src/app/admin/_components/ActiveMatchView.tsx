"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ROUND_LABELS,
  SEGMENT_LABELS,
  SEGMENT_ORDER,
  toMatchState,
  type Match,
} from "@game-screan/shared";
import { getSocketBase } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import { useMatchStore } from "@/store/matchStore";

async function patchMatch(id: string, data: Record<string, unknown>) {
  const base = getSocketBase();
  const res = await fetch(`${base}/api/match`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, data }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "فشل التحديث");
  }
  return res.json() as Promise<Match>;
}

interface ActiveMatchViewProps {
  activeId: string;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
  showToast: (msg: string) => void;
}

export function ActiveMatchView({ activeId, busy, setBusy, setError, showToast }: ActiveMatchViewProps) {
  const matchState = useMatchStore((s) => s.matchState);
  const setMatchState = useMatchStore((s) => s.setMatchState);

  const [pendingA, setPendingA] = useState(0);
  const [pendingB, setPendingB] = useState(0);
  const [auctionRunning, setAuctionRunning] = useState(false);
  const auctionTickRef = useRef(matchState?.timer ?? 30);
  const [stapValue, setStapValue] = useState(
    matchState?.segment ? SEGMENT_LABELS[matchState.segment] : SEGMENT_LABELS[SEGMENT_ORDER[0]]
  );

  const patchAndSync = async (id: string, data: Record<string, unknown>) => {
    const match = await patchMatch(id, data);
    setMatchState(toMatchState(match));
    return match;
  };

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
  }, [auctionRunning, activeId, matchState?.segment]);

  const segmentIndex = useMemo(() => {
    if (!matchState) return 0;
    return Math.max(0, SEGMENT_ORDER.indexOf(matchState.segment));
  }, [matchState]);

  const currentSegmentId = matchState?.segment ?? "WHAT_DO_YOU_KNOW";
  const currentSegmentLabel = SEGMENT_LABELS[currentSegmentId];
  const isFirstSegment = segmentIndex === 0;
  const isLastSegment = segmentIndex === SEGMENT_ORDER.length - 1;

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
      const nextA = side === "A" ? matchState.playerA.rank + amount : matchState.playerA.rank;
      const nextB = side === "B" ? matchState.playerB.rank + amount : matchState.playerB.rank;
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
      showToast(`تحديث X لـ ${side === "A" ? matchState.playerA.name : matchState.playerB.name}`);
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
      showToast(`${active ? "تفعيل" : "إلغاء"} PASS لـ ${side === "A" ? matchState.playerA.name : matchState.playerB.name}`);
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
    void patchAndSync(activeId, { timer: 30 }).then(() => {
      showToast("تصفير المزاد");
    }).catch((e) => {
      setError(e instanceof Error ? e.message : "خطأ");
    });
  };

  if (!matchState) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <span className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-bold text-gray-600">
          {ROUND_LABELS[matchState.round]}
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
        {(["B", "A"] as const).map((side) => {
          const isA = side === "A";
          const name = isA ? matchState.playerA.name : matchState.playerB.name;
          const score = isA ? matchState.playerA.rank : matchState.playerB.rank;
          const misses = isA ? (matchState.playerA.misses ?? 0) : (matchState.playerB.misses ?? 0);
          const passActive = isA ? (matchState.playerA.passActive ?? false) : (matchState.playerB.passActive ?? false);
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
  );
}
