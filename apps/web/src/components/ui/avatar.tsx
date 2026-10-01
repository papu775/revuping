import { cva } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
export function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.length
    ? (
        words[0][0] +
        (words.length > 1 ? words[words.length - 1][0] : words[0][1] || '')
      ).toUpperCase()
    : '?';
}
const avatar = cva(
  'avatar inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full text-center font-semibold leading-none select-none',
  {
    variants: {
      size: {
        default: 'size-11 text-[13px]',
        large: 'size-16 text-xl',
        small: 'size-9 text-xs',
      },
      tone: {
        lavender: 'bg-selected text-accent',
        peach: 'bg-warm text-warm-ink',
        sage: 'bg-positive text-positive-ink',
        neutral: 'bg-soft text-muted',
      },
    },
    defaultVariants: { size: 'default', tone: 'lavender' },
  },
);
export function Avatar({
  name,
  initials,
  size = 'default',
  tone = 'lavender',
  className,
}: {
  name?: string;
  initials?: string;
  size?: 'small' | 'default' | 'large';
  tone?: 'lavender' | 'peach' | 'sage' | 'neutral';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={twMerge(avatar({ size, tone }), className)}
    >
      {initials?.trim().slice(0, 2).toUpperCase() || initialsFor(name || '')}
    </span>
  );
}
