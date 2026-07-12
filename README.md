# تحدي 30 ثانية — Monorepo

المشروع مفصول إلى فرونت وباك مع حزمة مشتركة.

## الهيكل

```
game-screan/
├── web/                 # Next.js — لوحة التحكم + شاشة العرض (منفذ 3000)
├── apps/api/            # Express + Socket.io — REST + بث الحالة (منفذ 4000)
└── packages/shared/     # أنواع، Zod، تسميات، state-engine
```

## التشغيل

من جذر المشروع:

```bash
npm install
npm run dev
```

أو كل خدمة لوحدها:

```bash
npm run dev:api   # http://localhost:4000
npm run dev:web   # http://localhost:3000
```

## المتغيرات

**web** — انسخ `web/.env.local.example` إلى `web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

**api** — انسخ `apps/api/.env.example` إلى `apps/api/.env` (اختياري):

```
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

البيانات تُحفظ في `apps/api/data/app-state.json`.

## ملاحظة الكاش

طلبات الـ API من الفرونت تستخدم `cache: 'no-store'`، والباك يرسل `Cache-Control: no-store` على `/api/match`.
