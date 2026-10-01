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
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
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
                returnFocus.current =
                  document.activeElement as HTMLElement | null;
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                if (returnFocus.current?.isConnected)
                  returnFocus.current.focus();
              }}
            >
              <motion.div
                className="dialog-content"
                style={{ x: '-50%', y: '-50%' }}
                initial={{
                  opacity: reduced ? 1 : 0,
                  scale: reduced ? 1 : 0.98,
                }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: reduced ? 1 : 0.98 }}
                transition={{ duration: reduced ? 0 : 0.18 }}
              >
                <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
                <DialogPrimitive.Description>
                  {description}
                </DialogPrimitive.Description>
                <DialogPrimitive.Close
                  className="icon-button dialog-close"
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </DialogPrimitive.Close>
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
