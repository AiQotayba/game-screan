"use client";

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toMatchState } from "@game-screan/shared";
import { useMatchStore } from "@/store/matchStore";
import { getSocketBase } from "@/lib/api-client";
import { getSocket } from "@/lib/socket-client";

import { CreateMatchView } from "./_components/CreateMatchView";
import { ActiveMatchView } from "./_components/ActiveMatchView";
import { AdminActions } from "./_components/AdminActions";

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
  const { message: toast, show: showToast } = useToast();

  const applyRemoteState = useCallback(
    (payload: ReturnType<typeof toMatchState> | null) => {
      setMatchState(payload);
    },
    [setMatchState]
  );

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`${getSocketBase()}/health`, { cache: "no-store" });
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
          const res = await fetch(`${getSocketBase()}/api/match?active=true`, { cache: "no-store" });
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
          <CreateMatchView
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            showToast={showToast}
          />
        ) : (
          <ActiveMatchView
            activeId={activeId}
            busy={busy}
            setBusy={setBusy}
            setError={setError}
            showToast={showToast}
          />
        )}
      </main>

      <AdminActions
        activeId={activeId}
        busy={busy}
        setBusy={setBusy}
        setError={setError}
        showToast={showToast}
      />
    </div>
  );
}
