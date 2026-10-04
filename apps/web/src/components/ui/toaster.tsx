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
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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
      const viewport = window.visualViewport;
      element.style.top = `${(viewport?.offsetTop ?? 0) + 16}px`;
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
      {mounted &&
        createPortal(
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
          </div>,
          document.body,
        )}
    </Context.Provider>
  );
}
export const useToast = () => useContext(Context);
