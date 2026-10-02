'use client';
import Link from 'next/link';
import { Children, isValidElement } from 'react';
import {
  AudioLines,
  ArrowUpRight,
  Star,
  Check,
  ArrowRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`logo ${light ? 'logo-light' : ''}`}
      aria-label="RevuPing home"
    >
      <span className="logo-mark">
        <AudioLines size={22} />
      </span>
      revu<span className="logo-last">ping</span>
      <span className="logo-dot">.</span>
    </Link>
  );
}
export function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} fill={n <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}
export function Reveal({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ y: 0 }}
      whileInView={{ y: reduce ? 0 : [12, 0] }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: reduce ? 0 : 0.4 }}
    >
      {children}
    </motion.div>
  );
}
export function Badge({
  children,
  mint = false,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  mint?: boolean;
  tone?: 'neutral' | 'accent' | 'danger';
}) {
  return (
    <span
      className={`badge inline-flex self-start items-center gap-1.5 whitespace-nowrap rounded-[5px] border px-2 py-1 text-xs font-semibold leading-4 ${mint ? 'mint border-positive-line bg-positive text-positive-ink' : tone === 'danger' ? 'border-danger bg-danger-soft text-danger' : tone === 'accent' ? 'border-accent-line bg-selected text-accent' : 'border-line bg-soft text-muted'}`}
    >
      {children}
    </span>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  text,
  className = '',
}: {
  eyebrow: string;
  title: string;
  text?: string;
  className?: string;
}) {
  return (
    <div className={`section-title ${className}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}
export function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="check-item">
      <Check size={16} />
      {children}
    </div>
  );
}
export function TextLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      {external ? <ArrowUpRight size={16} /> : <ArrowRight size={16} />}
    </Link>
  );
}

export function Field({
  children,
  as: Component = 'label',
}: {
  children: React.ReactNode;
  as?: 'label' | 'div';
}) {
  const parts = Children.toArray(children);
  const firstControl = parts.findIndex(
    (child) => isValidElement(child) && child.type !== 'span',
  );
  const heading = firstControl < 0 ? parts : parts.slice(0, firstControl);
  const controls = firstControl < 0 ? [] : parts.slice(firstControl);
  return (
    <Component className="field [&_[aria-invalid=true]]:border-danger [&_[aria-invalid=true]]:bg-danger-soft mb-5 flex flex-col gap-2 text-sm font-semibold text-navy [&_input]:min-h-12 [&_input]:rounded-lg [&_input]:border [&_input]:border-control [&_input]:bg-input [&_input]:px-3.5 [&_input]:py-3 [&_input]:font-normal [&_textarea]:rounded-lg [&_textarea]:border [&_textarea]:border-control [&_textarea]:bg-input [&_textarea]:p-3.5 [&_textarea]:font-normal [&_select]:min-h-12 [&_select]:rounded-lg [&_select]:border [&_select]:border-line [&_select]:bg-input [&_select]:px-3.5 [&_select]:font-normal max-md:[&_input]:text-base max-md:[&_textarea]:text-base max-md:[&_select]:text-base">
      {heading.length > 0 && (
        <span className="flex flex-wrap items-baseline gap-x-1">{heading}</span>
      )}
      {controls}
    </Component>
  );
}

export const panelSurface = 'panel overflow-hidden rounded-xl border';

export function Panel({
  children,
  className = '',
  as: Component = 'section',
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' }) {
  return (
    <Component
      className={`${panelSurface} border-line bg-surface ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
