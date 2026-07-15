"use client";

import { useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { CreateMatchInput } from "@game-screan/shared";
import { uploadPlayerImage } from "@/lib/api-client";
import { resolvePlayerImageSrc } from "@/lib/player-image";
import { cn } from "@/lib/cn";
import { ImagePlus, Loader2 } from "lucide-react";

type Field = "playerA" | "playerB";

export function PlayerPhotoField({
  field,
  side,
  name,
}: {
  field: Field;
  side: "A" | "B";
  name: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { register, setValue, watch } = useFormContext<CreateMatchInput>();
  const image = watch(`${field}.image`) ?? "";
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const src = resolvePlayerImageSrc(image);
  const initial = name.trim().charAt(0) || side;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadPlayerImage(file);
      setValue(`${field}.image`, url, { shouldValidate: true, shouldDirty: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطأ في الرفع");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input type="hidden" {...register(`${field}.image`)} />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative mb-4 size-24 overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow-md transition hover:ring-2 hover:ring-purple-300",
          uploading && "cursor-wait opacity-70",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-3xl font-black text-gray-400">
            {initial}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="size-8 animate-spin text-white" aria-hidden />
          ) : (
            <ImagePlus className="size-8 text-white" aria-hidden />
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      <label className="mb-2 block w-full text-center text-sm font-bold text-gray-500">
        اللاعب {side}
      </label>
      <input
        type="text"
        {...register(`${field}.name`)}
        className="mb-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-lg font-bold text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
        placeholder="الاسم..."
      />
      <p className="text-center text-xs text-gray-400">
        اضغط على الصورة لرفع صورة اللاعب
      </p>
      {error && <p className="mt-1 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
