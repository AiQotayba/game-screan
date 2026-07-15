import Image from "next/image";
import { cn } from "@/lib/cn";
import { resolvePlayerImageSrc } from "@/lib/player-image";

function PlayerAvatar({ name, image }: { name: string; image: string }) {
    const src = resolvePlayerImageSrc(image);
    return (
        <div className="player-avatar relative size-[clamp(120px,18vw,200px)] border-4 border-s-gray-300 shrink-0 origin-center scale-[1.5] overflow-hidden rounded-full bg-[#b8bcc8] shadow-lg">
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={name} className="size-full object-cover scale-[1.2]" />
            ) : (
                <div className="flex size-full items-center justify-center">
                    <svg viewBox="0 0 100 100" className="h-[70%] w-[70%] text-[#1a1d45]" aria-hidden>
                        <circle cx="50" cy="36" r="18" fill="currentColor" />
                        <path d="M20 92c4-22 24-32 30-32s26 10 30 32" fill="currentColor" />
                    </svg>
                </div>
            )}
        </div>
    );
}

function PlayerScore({
    score,
    side,
}: {
    score: number;
    side: "A" | "B";
}) {
    return (
        <div
            className={cn(
                "player-score relative flex shrink-0 origin-center scale-[1.3] items-center justify-center",
                side === "B" && "player-score--b",
            )}
        >
            <Image
                src="/images/m.png"
                alt=""
                width={220}
                height={190}
                className={cn(
                    "player-score__shape h-[clamp(72px,12vw,120px)] w-auto object-contain",
                    side === "B" && "-scale-x-100",
                )}
                aria-hidden
            />
            <span className="player-score__value absolute inset-0 flex items-center justify-center pt-1 text-[clamp(2.25rem,5.5vw,4rem)] leading-none tabular-nums text-[#1a1d45]">
                {score}
            </span>
        </div>
    );
}

function PlayerNamePlate({ name }: { name: string }) {
    return (
        <div className="player-name-plate relative mt-18 flex w-full max-w-[min(100%,280px)] origin-center scale-[1.3] items-center justify-center px-6 py-4">
            <Image
                src="/images/b.png"
                alt=""
                width={320}
                height={150}
                className="pointer-events-none absolute inset-0 size-full object-fill"
                aria-hidden
            />
            <p className="font-azkadina  player-name-plate__text relative z-10 px-2 text-center text-[clamp(1.45rem,3.5vw,2.5rem)] leading-none text-[#f4d03f]">
                {name}
            </p>
        </div>
    );
}

export type PlayerProps = {
    name: string;
    image: string;
    score: number;
    side: "A" | "B";
    misses?: number;
    passActive?: boolean;
    showMisses?: boolean;
};


export default function PlayerMisses({
    side,
    misses = 0,
    passActive = false,
}: {
    side: "A" | "B";
    misses?: number;
    passActive?: boolean;
}) {
    const clampedMisses = Math.max(0, Math.min(3, misses));
    const actives = [0, 1, 2].map((i) => i < clampedMisses);
    const showPass = passActive;

    return (
        <div
            className={cn("flex justify-end items-center mb-10 w-[170%] gap-2", side === "A" ? "justify-end" : "justify-start flex-row")}>
            {showPass && side === "B" && (
                <span className={cn("font-black text-4xl leading-none h-min")}>
                    PASS
                </span>
            )}
            <div className={
                cn("inline-flex items-center justify-center gap-6 border-[3.5px] border-black rounded-[14px] px-6 py-2.5 min-w-[160px] h-[52px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] select-none",
                    side === "A" ? "ml-14 flex-row" : "mr-14 flex-row-reverse"
                )}>
                {actives.map((active, idx) => (
                    <span
                        key={idx}
                        className={cn(
                            "font-black text-4xl tracking-wide transition-colors duration-200 outline-none",
                            !active && "text-transparent",
                            active && idx < 2 && "text-white",
                            active && idx === 2 && "text-red-500",
                        )}
                    >
                        X
                    </span>
                ))}
            </div>

            {showPass && side === "A" && (
                <span className={cn("font-black text-4xl leading-none h-min ")}>
                    PASS
                </span>
            )}
        </div>
    );
}
export function Player({
    name,
    image,
    score,
    side,
    misses = 0,
    passActive = false,
    showMisses = true,
}: PlayerProps) {
    return (
        <div
            className={cn(
                "player-card relative flex flex-row items-center gap-[clamp(0.75rem,2vw,1.25rem)]",
                side === "A" ? "player-card--a" : "player-card--b",
                side === "B" && "flex-row-reverse",
            )}
        >
            <div className="flex w-full max-w-[min(100%,360px)] flex-col items-center justify-center gap-[clamp(0.25rem,1.5vw,0.75rem)]">
                {showMisses && (
                    <PlayerMisses side={side} misses={misses} passActive={passActive} />
                )}

                <PlayerAvatar name={name} image={image} />
                <PlayerNamePlate name={name} />
            </div>
            <PlayerScore score={score} side={side} />
        </div>
    );
}
