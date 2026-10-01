'use client';
import Link from 'next/link';
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
      initial={reduce ? false : { y: 12 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.45 }}
    >
      {children}
    </motion.div>
  );
}
export function Badge({
  children,
  mint = false,
}: {
  children: React.ReactNode;
  mint?: boolean;
}) {
  return <span className={`badge ${mint ? 'mint' : ''}`}>{children}</span>;
}
export function SectionTitle({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="section-title">
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
