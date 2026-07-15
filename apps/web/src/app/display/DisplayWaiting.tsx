"use client";

import { motion } from "framer-motion";
import { resolvePlayerImageSrc } from "@/lib/player-image";

type Props = {
  nameA?: string;
  nameB?: string;
  imageA?: string;
  imageB?: string;
};

function NextSlot({
  label,
  name,
  image,
}: {
  label: string;
  name?: string;
  image?: string;
}) {
  const showName = Boolean(name?.trim());
  const photoSrc = resolvePlayerImageSrc(image);

  return (
    <div className="display-waiting__slot origin-center scale-[2]">
      <motion.div
        className="display-waiting__avatar"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
      >
        {photoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoSrc}
            alt={name?.trim() ?? ""}
            className="display-waiting__photo size-full object-cover"
          />
        ) : showName ? (
          <span className="display-waiting__initial">
            {name!.trim().charAt(0)}
          </span>
        ) : (
          <svg viewBox="0 0 100 100" className="display-waiting__silhouette" aria-hidden>
            <circle cx="50" cy="34" r="16" fill="currentColor" />
            <path d="M22 88c5-20 22-28 28-28s23 8 28 28" fill="currentColor" />
          </svg>
        )}
      </motion.div>
      <p className="display-waiting__name">
        {showName ? name!.trim() : ""}
      </p>
      <span className="display-waiting__label">{label}</span>
    </div>
  );
}

/** شاشة انتظار مبسطة للجمهور — المتسابقين التاليين */
export function DisplayWaiting({ nameA, nameB, imageA, imageB }: Props) {
  return (
    <motion.section
      className="display-waiting mt-52 origin-center scale-[2]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      aria-live="polite"
    >
      <p className="font-azkadina display-waiting__heading display-title-shadow">
        المتسابقين 
      </p>

      <div className="display-waiting__row  mt-8" dir="ltr">
        <NextSlot label="المتسابق الأول" name={nameA} image={imageA} />
        <span className="display-waiting__vs font-['GraphicSchool']" aria-hidden>
          VS
        </span>
        <NextSlot label="المتسابق الثاني" name={nameB} image={imageB} />
      </div>

    </motion.section>
  );
}
