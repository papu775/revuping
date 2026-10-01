'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useInView,
  useReducedMotion,
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
    <div className="border-b border-line first:border-t">
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
            <p className="pb-5 pr-7 text-base leading-7 text-muted">{answer}</p>
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

/** Slow decorative movement; form controls never inherit this transform. */
export function FloatingSample({
  children,
  className,
  amplitude = 5,
  duration = 7,
}: {
  children: React.ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.2 });
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  const running = inView && visible && !reduced;
  return (
    <motion.div
      ref={ref}
      className={className}
      data-floating={running ? 'running' : 'paused'}
      initial={false}
      animate={{ y: running ? [0, -amplitude, 0] : 0 }}
      transition={
        running
          ? { duration, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0 }
      }
    >
      {children}
    </motion.div>
  );
}
