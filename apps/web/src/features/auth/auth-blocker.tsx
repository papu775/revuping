'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AudioLines } from 'lucide-react';

export function AuthBlocker({
  label,
  children,
}: {
  label: string | null;
  children: React.ReactNode;
}) {
  const content = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [details, setDetails] = useState(false);
  useEffect(() => {
    if (!label) return;
    const timer = setTimeout(() => setDetails(true), 120);
    return () => {
      clearTimeout(timer);
      setDetails(false);
    };
  }, [label]);
  useLayoutEffect(() => {
    if (!label) return;
    const previous = previousFocus.current;
    const covered: Array<{ element: HTMLElement; inert: boolean }> = [];
    let branch: HTMLElement | null = content.current;
    while (branch?.parentElement) {
      for (const sibling of Array.from(branch.parentElement.children)) {
        if (
          sibling instanceof HTMLElement &&
          sibling !== branch &&
          !sibling.contains(overlay.current) &&
          !sibling.classList.contains('toast-stack')
        ) {
          covered.push({ element: sibling, inert: sibling.inert });
          sibling.inert = true;
        }
      }
      if (branch.parentElement === document.body) break;
      branch = branch.parentElement;
    }
    overlay.current?.focus({ preventScroll: true });
    const element = overlay.current;
    const stopScroll = (event: Event) => event.preventDefault();
    element?.addEventListener('wheel', stopScroll, { passive: false });
    const viewport = window.visualViewport;
    const place = () => {
      if (!overlay.current || !viewport) return;
      Object.assign(overlay.current.style, {
        top: `${viewport.offsetTop}px`,
        left: `${viewport.offsetLeft}px`,
        width: `${viewport.width}px`,
        height: `${viewport.height}px`,
      });
    };
    place();
    viewport?.addEventListener('resize', place);
    viewport?.addEventListener('scroll', place);
    return () => {
      for (const item of covered) item.element.inert = item.inert;
      viewport?.removeEventListener('resize', place);
      viewport?.removeEventListener('scroll', place);
      element?.removeEventListener('wheel', stopScroll);
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, [label]);
  return (
    <>
      <div
        ref={content}
        inert={!!label}
        aria-busy={!!label}
        className="auth-blocking-content"
        onFocusCapture={(event) => {
          if (event.target instanceof HTMLElement)
            previousFocus.current = event.target;
        }}
      >
        {children}
      </div>
      {label && (
        <div
          ref={overlay}
          className="auth-blocking-overlay"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (
              [
                'Tab',
                'PageDown',
                'PageUp',
                'Home',
                'End',
                'ArrowDown',
                'ArrowUp',
                ' ',
              ].includes(event.key)
            )
              event.preventDefault();
          }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className={`auth-blocking-panel ${details ? 'is-ready' : ''}`}
          >
            <AudioLines
              size={34}
              aria-hidden="true"
              className="brand-loading-mark"
            />
            <span>{label}</span>
          </div>
        </div>
      )}
    </>
  );
}
