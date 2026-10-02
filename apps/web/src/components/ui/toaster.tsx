'use client';
import {
  createContext,
  useContext,
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
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const reduced = useReducedMotion();
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useLayoutEffect(() => {
    const element = stack.current;
    if (!element || !notices.length) return;
    function place() {
      if (!element) return;
      const box = element.getBoundingClientRect();
      const height = element.offsetHeight;
      const bottom =
        window.innerHeight - (window.innerWidth < 768 ? 88 : 24) - height;
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
      for (let y = bottom - 8; y >= 88; y -= 8) candidates.push(y);
      const safe = candidates.find((y) =>
        controls.every(
          (rect) => rect.bottom + 8 <= y || rect.top - 8 >= y + height,
        ),
      );
      element.style.top = `${Math.max(88, safe ?? bottom)}px`;
      element.style.bottom = 'auto';
    }
    place();
    const observer = new ResizeObserver(place);
    observer.observe(element);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
      document.removeEventListener('scroll', place, true);
    };
  }, [notices]);
  function notify(message: string, kind: Notice['kind'] = 'success') {
    const id = ++sequence.current;
    setNotices((current) =>
      [
        ...current.filter((n) => n.message !== message),
        { id, message, kind },
      ].slice(-1),
    );
    timers.current.push(
      setTimeout(
        () => setNotices((current) => current.filter((n) => n.id !== id)),
        5500,
      ),
    );
  }
  return (
    <Context.Provider value={notify}>
      {children}
      <div
        ref={stack}
        className="toast-stack"
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions text"
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
                <button
                  aria-label="Dismiss notification"
                  onClick={() =>
                    setNotices((current) =>
                      current.filter((n) => n.id !== notice.id),
                    )
                  }
                >
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
