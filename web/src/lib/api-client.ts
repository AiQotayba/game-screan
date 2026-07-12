const DEFAULT_API = "http://localhost:4000";

/** HTTP عبر Next (rewrites) في المتصفح؛ مباشرة إلى الـ API على السيرفر. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/\/$/, "");
  }
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
  return url.replace(/\/$/, "");
}

/**
 * Socket.io يجب أن يتصل مباشرة بالـ API — بروكسي Next لا يدعم WebSocket/long-polling بشكل موثوق.
 */
export function getSocketBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }

  return DEFAULT_API;
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${getApiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });
}

export async function uploadPlayerImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch(`${getApiBase()}/api/upload/player`, {
      method: "POST",
      body: form,
      cache: "no-store",
    });

    const json = (await res.json().catch(() => ({}))) as {
      url?: string;
      error?: string;
    };

    if (!res.ok) {
      throw new Error(json.error ?? "فشل رفع الصورة");
    }

    if (!json.url) {
      throw new Error("لم يُرجع الرابط");
    }

    return json.url;
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error(
        "لا يمكن الاتصال بالخادم. من مجلد المشروع شغّل: npm run dev (يشغّل الواجهة والـ API معاً)",
      );
    }
    throw err;
  }
}
