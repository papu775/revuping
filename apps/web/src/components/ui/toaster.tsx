'use client';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
type Notice = {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
};
const Context = createContext<(message: string, kind?: Notice['kind']) => void>(
  () => undefined,
);
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const sequence = useRef(0);
  const stack = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active = useRef<Notice | null>(null);
  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    active.current = null;
    setNotices([]);
  }, []);
  const resume = useCallback(() => {
    if (!active.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(dismiss, 5500);
  }, [dismiss]);
  const reduced = useReducedMotion();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  useLayoutEffect(() => {
    const element = stack.current;
    if (!element || !notices.length) return;
    function place() {
      if (!element) return;
      const box = element.getBoundingClientRect();
      const height = element.offsetHeight;
      const viewport = window.visualViewport;
      const top = (viewport?.offsetTop ?? 0) + 16;
      const keyboard = viewport && viewport.height < window.innerHeight * 0.8;
      const bottom =
        (viewport?.offsetTop ?? 0) +
        (viewport?.height ?? window.innerHeight) -
        (window.innerWidth < 768 && !keyboard ? 88 : 24) -
        height;
      const controls = Array.from(
        document.querySelectorAll(
          'button, input, textarea, select, a, [role="combobox"]',
        ),
      )
        .filter((node) => !element.contains(node))
        .map((node) => node.getBoundingClientRect())
        .filter(
          (rect) =>
            rect.width &&
            rect.height &&
            rect.right > box.left &&
            rect.left < box.right,
        );
      const candidates = [bottom];
      for (let y = bottom - 8; y >= top; y -= 8) candidates.push(y);
      const safe = candidates.find((y) =>
        controls.every(
          (rect) => rect.bottom + 8 <= y || rect.top - 8 >= y + height,
        ),
      );
      element.style.top = `${Math.max(top, safe ?? bottom)}px`;
      element.style.bottom = 'auto';
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    window.visualViewport?.addEventListener('resize', place);
    window.visualViewport?.addEventListener('scroll', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
      window.visualViewport?.removeEventListener('resize', place);
      window.visualViewport?.removeEventListener('scroll', place);
    };
  }, [notices]);
  const notify = useCallback(
    (message: string, kind: Notice['kind'] = 'success') => {
      if (active.current?.message === message && active.current.kind === kind)
        return;
      const id = ++sequence.current;
      active.current = { id, message, kind };
      setNotices([active.current]);
      resume();
    },
    [resume],
  );
  return (
    <Context.Provider value={notify}>
      {children}
      <div
        ref={stack}
        className="toast-stack"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions text"
        onMouseEnter={() => {
          if (timer.current) clearTimeout(timer.current);
        }}
        onMouseLeave={resume}
        onFocus={() => {
          if (timer.current) clearTimeout(timer.current);
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) resume();
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          {notices.map((notice) => {
            const Icon =
              notice.kind === 'success'
                ? CheckCircle2
                : notice.kind === 'error'
                  ? CircleAlert
                  : Info;
            return (
              <motion.div
                key={notice.id}
                className={`brand-toast ${notice.kind}`}
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : 8 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{notice.message}</span>
                <button aria-label="Dismiss notification" onClick={dismiss}>
                  <X size={16} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
