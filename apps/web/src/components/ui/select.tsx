'use client';
import * as Primitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};
export function Select({
  value,
  onValueChange,
  options,
  label,
  placeholder = 'Choose an option',
  className,
  icon,
  compact = false,
  name,
  disabled = false,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  label: string;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  compact?: boolean;
  name?: string;
  disabled?: boolean;
}) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  return (
    <Primitive.Root
      open={open}
      onOpenChange={setOpen}
      value={value || undefined}
      onValueChange={onValueChange}
      name={name}
      disabled={disabled}
    >
      <Primitive.Trigger
        aria-label={label}
        title={
          compact
            ? `${label}: ${options.find((o) => o.value === value)?.label || placeholder}`
            : undefined
        }
        className={twMerge(
          'inline-flex min-h-12 min-w-0 items-center justify-between gap-2 rounded-lg border border-control bg-input px-3.5 text-sm font-medium text-ink shadow-sm transition-colors hover:border-accent/60 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-accent/60 disabled:cursor-not-allowed disabled:opacity-50 max-md:text-base [&>span]:truncate',
          compact && 'size-11 min-h-11 justify-center px-0',
          className,
        )}
      >
        {icon}
        {compact ? (
          <span className="sr-only">
            <Primitive.Value placeholder={placeholder}>
              {options.find((option) => option.value === value)?.label}
            </Primitive.Value>
          </span>
        ) : (
          <Primitive.Value placeholder={placeholder}>
            {options.find((option) => option.value === value)?.label}
          </Primitive.Value>
        )}
        {!compact && (
          <Primitive.Icon>
            <ChevronDown size={16} className="text-muted" />
          </Primitive.Icon>
        )}
      </Primitive.Trigger>
      <Primitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <Primitive.Content
              forceMount
              position="popper"
              align="end"
              sideOffset={8}
              collisionPadding={12}
              asChild
            >
              <motion.div
                initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -4 }}
                transition={{ duration: reduced ? 0 : 0.16 }}
                className="z-[200] max-h-[var(--radix-select-content-available-height)] min-w-[max(180px,var(--radix-select-trigger-width))] overflow-hidden rounded-xl border border-line bg-surface text-ink shadow-[0_12px_36px_var(--shadow-color)]"
              >
                <Primitive.ScrollUpButton className="flex justify-center py-1 text-muted">
                  <ChevronUp size={16} />
                </Primitive.ScrollUpButton>
                <Primitive.Viewport className="p-1.5">
                  {options.map((option) => (
                    <Primitive.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="relative flex min-h-11 cursor-default select-none items-center gap-3 rounded-lg py-2.5 pl-3 pr-9 text-sm outline-none data-[highlighted]:bg-selected data-[highlighted]:text-ink data-[disabled]:opacity-45"
                    >
                      <div>
                        <Primitive.ItemText>{option.label}</Primitive.ItemText>
                        {option.description && (
                          <p className="mt-0.5 text-xs text-muted">
                            {option.description}
                          </p>
                        )}
                      </div>
                      <Primitive.ItemIndicator className="absolute right-3 text-accent">
                        <Check size={16} />
                      </Primitive.ItemIndicator>
                    </Primitive.Item>
                  ))}
                </Primitive.Viewport>
                <Primitive.ScrollDownButton className="flex justify-center py-1 text-muted">
                  <ChevronDown size={16} />
                </Primitive.ScrollDownButton>
              </motion.div>
            </Primitive.Content>
          )}
        </AnimatePresence>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
