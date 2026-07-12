"use client";

import Image from "next/image";
import {
  ROUND_DISPLAY_LABELS,
  type MatchState,
  type Round,
} from "@game-screan/shared";
import { fontTjwal } from "@/lib/font-tjwal";

function LogoBanner() {
  return (
    <Image
      src="/images/challenge-logo-banner.png"
      alt="تحدي 30 ثانية"
      width={300}
      height={150}
      className="w-[clamp(140px,20vw,280px)] object-contain"
      priority
    />
  );
}

function Gov() {
  return (
    <div
      className="flex w-full max-w-md items-center justify-center gap-[clamp(0.5rem,2vw,1rem)]"
      dir="rtl"
    >
      <Image
        src="/images/gov-eagle.png"
        alt=""
        width={180}
        height={180}
        className="h-[clamp(40px,7vw,72px)] w-auto shrink-0 object-contain mix-blend-lighten drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]"
        aria-hidden
        priority
      />
      <p
        className={`${fontTjwal.className} flex flex-col items-center justify-center gap-0.5 text-start font-bold leading-tight`}
      >
        <span className="text-[clamp(0.85rem,1.5vw,1.1rem)] font-bold text-white">
          مديرية الرياضة والشباب
        </span>
        <span className="text-[clamp(0.75rem,1.5vw,1.1rem)] pt-2 font-bold text-white/90">
          فـــــــي محـــــــافظة إدلــــــــب
        </span>
      </p>

      <Image
        src="/images/violet-logo.png"
        alt="شعار بنفسج"
        width={180}
        height={120}
        className="h-[clamp(34px,6vw,62px)] w-auto shrink-0 object-contain"
        priority
      />
    </div>
  );
}

function LevelLabel({ level }: { level: Round | "" }) {
  if (!level) return <span className="size-4 shrink-0" aria-hidden />;

  const label = ROUND_DISPLAY_LABELS[level];

  return (
    // <div className="font-azkadina w-full absolute justify-center items-center display-title-shadow text-right shrink-0">
      <p className="flex justify-center absolute top-18 left-0 right-0 origin-top scale-110 leading-none mx-auto text-[clamp(1.5rem,3.5vw,2.75rem)] text-white w-full whitespace-nowrap">
        {level === "ROUND_16" ? (
          <Image src="/images/16.png" alt="دور الـ16" width={150} height={150} />
        ) : level === "ROUND_8" ? (
          <Image src="/images/8.png" alt="دور الـ8" width={150} height={150} />
        ) : level === "QUARTER_FINAL" ? (
          <Image src="/images/4.png" alt="ربع النهائي" width={150} height={150} />
        ) : level === "SEMI_FINAL" ? (
          <Image src="/images/2.png" alt="نصف النهائي" width={150} height={150} />
        ) : level === "FINAL" ? (
          <Image src="/images/final.png" alt="النهائي" width={150} height={150} />
        ) : (
          label
        )}
      </p>
    // </div>
  );
}

export default function NavLayout({ state }: { state: MatchState | null }) {
  return (
    <header className="flex flex-row justify-between gap-4 p-4 px-[clamp(1rem,3vw,2.5rem)]">
      <LevelLabel level={state?.round ?? ("" as const)} />
      {/* <Gov /> */}
      {/* <LogoBanner /> */}
    </header>
  );
}
