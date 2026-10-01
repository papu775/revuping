'use client';
import { motion, useReducedMotion } from 'motion/react';
const paths = {
  hero: [
    'M580 30C350 5 520 230 300 280S160 350 35 365',
    'M590 50C375 32 550 253 330 304',
  ],
  workflow: [
    'M35 335C110 335 70 190 168 165S245 70 370 70',
    'M380 70a24 24 0 1 0 48 0a24 24 0 1 0-48 0',
  ],
  closing: [
    'M30 70C140 15 200 210 355 165S510 230 580 335',
    'M42 90C145 40 190 235 348 190',
  ],
  auth: [
    'M510 20C375 45 555 190 425 248S465 348 340 390',
    'M405 280a18 18 0 1 0 36 0a18 18 0 1 0-36 0',
  ],
};
/** Original conversation paths. One entrance draw, with no continuous travel. */
export function ConversationCurves({
  variant,
  className = '',
}: {
  variant: keyof typeof paths;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <svg
      viewBox="0 0 600 400"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={`pointer-events-none absolute z-0 overflow-hidden text-violet opacity-[0.14] dark:opacity-[0.22] ${className}`}
    >
      {paths[variant].map((d, index) => (
        <motion.path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={index ? 1 : 1.5}
          strokeLinecap="round"
          className={index ? 'hidden sm:block' : ''}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{
            duration: reduced ? 0 : 1.8,
            delay: reduced ? 0 : index * 0.18,
            ease: 'easeOut',
          }}
        />
      ))}
    </svg>
  );
}
