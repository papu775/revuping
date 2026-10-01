'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export function PasswordField(
  props: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
) {
  const [show, setShow] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selection = useRef<{
    start: number;
    end: number;
    focused: boolean;
  } | null>(null);
  useLayoutEffect(() => {
    const saved = selection.current;
    if (saved && input.current) {
      const restore = () => {
        if (saved.focused) input.current?.focus({ preventScroll: true });
        input.current?.setSelectionRange(saved.start, saved.end);
      };
      restore();
      selection.current = null;
      // Chromium can restore the controlled input again at the end of the click.
      const frame = requestAnimationFrame(restore);
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [show]);
  return (
    <div className="password-field relative flex items-center">
      <input
        {...props}
        ref={input}
        aria-label={props['aria-label'] || 'Password'}
        type={show ? 'text' : 'password'}
        className={`w-full !pr-14 ${props.className || ''}`}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-1 inline-flex w-11 items-center justify-center rounded-md text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-accent"
        aria-label={show ? 'Hide password' : 'Show password'}
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          event.preventDefault();
          const field = input.current;
          const focused = document.activeElement === field;
          const start = field?.selectionStart ?? 0;
          const end = field?.selectionEnd ?? start;
          selection.current = { start, end, focused };
          setShow((value) => !value);
        }}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
