'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';
import { ChevronDown } from 'lucide-react';

export function TemplateMotion({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </MotionConfig>
  );
}

/** Decorative motion is isolated from text, CTAs and the functional QR studio. */
export function HeroScene({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.15 });
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [fine, setFine] = useState(false);
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const rotateX = useSpring(x, { stiffness: 90, damping: 24 });
  const rotateY = useSpring(y, { stiffness: 90, damping: 24 });
  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointer = () => setFine(media.matches);
    const updateVisibility = () => setVisible(!document.hidden);
    updatePointer();
    updateVisibility();
    media.addEventListener('change', updatePointer);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      media.removeEventListener('change', updatePointer);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  const enabled = fine && !reduced;
  useEffect(() => {
    if (!enabled || !inView || !visible) {
      x.set(0);
      y.set(0);
    }
  }, [enabled, inView, visible, x, y]);
  return (
    <div ref={ref} className="hero-depth" style={{ perspective: 1200 }}>
      <motion.div
        className="hero-composition"
        data-floating={enabled && inView && visible ? 'running' : 'paused'}
        style={{
          rotateX: reduced ? 0 : rotateX,
          rotateY: reduced ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        onPointerMove={(event) => {
          if (!enabled) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const bounded = (value: number) =>
            Math.max(-0.5, Math.min(0.5, value - 0.5));
          x.set(-bounded((event.clientY - rect.top) / rect.height) * 3);
          y.set(bounded((event.clientX - rect.left) / rect.width) * 4);
        }}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function FaqItem({
  question,
  answer,
  index,
}: {
  question: string;
  answer: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  return (
    <div className="border-b border-[#dedcd5] first:border-t">
      <h3>
        <button
          id={`faq-question-${index}`}
          aria-expanded={open}
          aria-controls={`faq-answer-${index}`}
          onClick={() => setOpen(!open)}
          className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-left text-base font-semibold leading-6 text-navy transition-colors hover:text-violet focus-visible:rounded-lg"
        >
          {question}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="shrink-0"
          >
            <ChevronDown size={18} />
          </motion.span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-answer-${index}`}
            role="region"
            aria-labelledby={`faq-question-${index}`}
            initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.24 }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-7 text-base leading-7 text-[#535768]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Animate measured content height rather than scaling product-preview text. */
export function AnimatedHeight({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = content.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) =>
      setHeight(entry.contentRect.height),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <motion.div
      initial={false}
      animate={{ height: height ?? 'auto' }}
      transition={{ duration: reduced ? 0 : 0.24 }}
      className={`overflow-hidden ${className}`}
    >
      <div ref={content}>{children}</div>
    </motion.div>
  );
}

export function HeroIntro({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="hero-copy"
      initial={{ opacity: 1 }}
      animate={{ opacity: reduced ? 1 : [0.8, 1] }}
      transition={{ duration: reduced ? 0 : 0.3 }}
    >
      {children}
    </motion.div>
  );
}
