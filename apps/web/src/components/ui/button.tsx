import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
const variants = cva(
  'button whitespace-nowrap inline-flex min-h-12 items-center justify-center gap-2.5 rounded-lg border px-5 py-3 text-sm font-semibold leading-5 transition-[background-color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px active:translate-y-0 active:shadow-inner focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-violet/60 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-[#deddd8] disabled:bg-[#eeede9] disabled:text-[#777981] disabled:opacity-100 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none [&_svg]:size-[17px] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'button-primary border-transparent bg-violet text-white shadow-[0_3px_8px_#6b52b921] hover:bg-[#574098]',
        secondary:
          'button-secondary border-[#d8d5df] bg-white text-navy hover:border-violet/40 hover:bg-[#f5f2fb]',
        ghost:
          'button-ghost border-transparent bg-transparent text-violet hover:bg-[#eeeaf8]',
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
