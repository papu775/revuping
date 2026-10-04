import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const variants = cva(
  'button whitespace-nowrap inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border px-5 py-3 text-sm font-semibold leading-5 transition-[background-color,border-color,box-shadow] duration-200 active:brightness-95 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violet/60 disabled:cursor-not-allowed disabled:border-disabled-line disabled:bg-disabled disabled:text-disabled-ink disabled:opacity-100 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none [&_svg]:size-[17px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        danger:
          'button-danger border-danger/30 bg-danger-soft text-danger hover:border-danger',
        default:
          'button-primary border-transparent bg-action text-white shadow-[0_8px_24px_var(--shadow-color)] hover:bg-action-hover',
        secondary:
          'button-secondary border-control bg-surface text-navy hover:border-violet/40 hover:bg-selected',
        ghost:
          'button-ghost border-transparent bg-transparent text-violet hover:bg-selected',
      },
      size: {
        default: '',
        small: 'button-small min-h-11 px-4 py-2.5 text-[13px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);
export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof variants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      className={twMerge(clsx(variants({ variant, size }), className))}
      {...props}
    />
  );
}
