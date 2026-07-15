import Link from "next/link";

export default function Home() {
  return (
    <main
      className="flex min-h-full flex-col items-center justify-center gap-6 bg-[#05070a] px-6 py-16 text-white"
      dir="rtl"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">مسابقة كرة القدم</p>
        <h1 className="mt-3 text-3xl font-bold">شاشات التحكم والعرض</h1>
        <p className="mt-2 text-sm text-white/55">اختر وجهتك للبدء</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          className="rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
          href="/admin"
        >
          لوحة التحكم
        </Link>
        <Link
          className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
          href="/display"
        >
          شاشة العرض
        </Link>
      </div>
    </main>
  );
}
