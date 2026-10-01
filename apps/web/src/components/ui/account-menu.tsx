'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronUp, ArrowUpRight } from 'lucide-react';
import { Avatar } from './avatar';
const actions = [
  ['Customer demo', '/r/demo-salon'],
  ['Back to website', '/'],
  ['Demo login', '/login'],
] as const;
export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  return (
    <div
      ref={root}
      className="relative mt-4"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label="Demo owner account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="demo-account-menu"
        onClick={() => setOpen(!open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="flex min-h-14 w-full items-center gap-2 rounded-xl border border-line bg-surface px-2 py-2 text-left transition-colors duration-200 hover:bg-selected"
      >
        <Avatar initials="DO" tone="lavender" size="small" />
        <span className="min-w-0 flex-1">
          <strong className="block whitespace-nowrap text-sm">
            Demo Owner
          </strong>
          <span className="block text-xs text-muted">Account options</span>
        </span>
        <ChevronUp size={16} className="shrink-0 text-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            id="demo-account-menu"
            role="menu"
            aria-label="Demo account options"
            initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.18 }}
            className="absolute inset-x-0 bottom-[calc(100%+8px)] z-[60] rounded-xl border border-line bg-surface p-1.5 shadow-[0_12px_36px_var(--shadow-color)]"
            onKeyDown={(event) => {
              const items = [
                ...event.currentTarget.querySelectorAll<HTMLElement>(
                  '[role="menuitem"]',
                ),
              ];
              const index = items.indexOf(
                document.activeElement as HTMLElement,
              );
              if (event.key === 'Escape' || event.key === 'Tab') {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                trigger.current?.focus();
              }
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                event.preventDefault();
                items[
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? items.length - 1
                      : (index +
                          (event.key === 'ArrowUp' ? -1 : 1) +
                          items.length) %
                        items.length
                ]?.focus();
              }
            }}
          >
            {actions.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center justify-between rounded-lg px-3 text-sm hover:bg-selected focus:bg-selected focus:outline-none"
              >
                {label}
                <ArrowUpRight size={15} />
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
