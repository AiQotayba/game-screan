"use client";

import { Trophy } from "lucide-react";
import { getSocketBase } from "@/lib/api-client";
import { useMatchStore } from "@/store/matchStore";

interface AdminActionsProps {
  activeId: string | null;
  busy: boolean;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
  showToast: (msg: string) => void;
}

export function AdminActions({ activeId, busy, setBusy, setError, showToast }: AdminActionsProps) {
  const setMatchState = useMatchStore((s) => s.setMatchState);

  const handleEndMatch = async () => {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getSocketBase()}/api/match`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeId, data: { status: "FINISHED" } }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("فشل إنهاء المباراة");
      
      const json = await res.json();
      setMatchState(json);
      showToast("تم إنهاء المباراة وعرض النتائج");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteMatch = async () => {
    if (!activeId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getSocketBase()}/api/match/${activeId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل الحذف");
      }
      setMatchState(null);
      showToast("تم حذف المباراة بشكل نهائي");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  const handleClearAll = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${getSocketBase()}/api/match/clear`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل تنظيف البيانات");
      }
      setMatchState(null);
      showToast("تم تنظيف جميع البيانات");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      <button
        type="button"
        disabled={busy || !activeId}
        onClick={() => {
          if (window.confirm("هل أنت متأكد من إنهاء المباراة الآن وإظهار النتائج؟")) {
            void handleEndMatch();
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
      >
        <Trophy size={16} aria-hidden />
        إنهاء وإظهار النتائج
      </button>

      <button
        type="button"
        disabled={busy || !activeId}
        onClick={() => {
          if (window.confirm("هل أنت متأكد من حذف هذه المباراة تماماً؟ لا يمكن التراجع عن هذا الإجراء.")) {
            void handleDeleteMatch();
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-gray-900 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
        حذف المباراة
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm("تحذير! سيتم حذف جميع المباريات والبيانات نهائياً. هل أنت متأكد؟")) {
            void handleClearAll();
          }
        }}
        className="flex items-center gap-2 rounded-xl bg-orange-700 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-orange-800 disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        تنظيف كل البيانات
      </button>
    </div>
  );
}
