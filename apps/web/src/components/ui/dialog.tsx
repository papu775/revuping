'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  compact = false,
  wide = false,
  footer,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
  wide?: boolean;
  footer?: React.ReactNode;
}) {
  const reduced = useReducedMotion();
  const returnFocus = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <DialogPrimitive.Overlay forceMount asChild key="overlay">
              <motion.div
                className="dialog-overlay"
                initial={{ opacity: reduced ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              />
            </DialogPrimitive.Overlay>
          )}
          {open && (
            <DialogPrimitive.Content
              forceMount
              asChild
              key="content"
              onOpenAutoFocus={() => {
                const element = document.activeElement;
                returnFocus.current =
                  element instanceof HTMLElement ? element : null;
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                if (returnFocus.current?.isConnected)
                  returnFocus.current.focus();
              }}
            >
              <motion.div
                className={`dialog-content flex flex-col !overflow-hidden !p-0 ${wide ? '!w-[calc(100%-32px)] max-w-[860px]' : compact ? 'max-w-[440px]' : 'max-w-[560px]'}`}
                style={{ x: '-50%', y: '-50%' }}
                initial={{
                  opacity: reduced ? 1 : 0,
                  scale: reduced ? 1 : 0.98,
                }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <div className="dialog-header shrink-0 border-b border-line px-6 py-5 pr-16">
                  <DialogPrimitive.Title className="text-[23px] font-semibold leading-tight tracking-[-0.5px]">
                    {title}
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="mt-2 text-sm leading-6 text-muted">
                    {description}
                  </DialogPrimitive.Description>
                  <DialogPrimitive.Close
                    className="icon-button dialog-close"
                    aria-label="Close dialog"
                  >
                    <X size={20} />
                  </DialogPrimitive.Close>
                </div>
                <div className="dialog-body min-h-0 overflow-y-auto overscroll-contain px-6 py-5 [&>.field:first-child]:!mt-0 [&>.button]:mr-3 [&>.button]:mt-5">
                  {children}
                </div>
                {footer && (
                  <div className="dialog-footer shrink-0 border-t border-line bg-soft px-6 py-4">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
