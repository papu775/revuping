'use client';
import { useReducedMotion } from 'motion/react';
export function scrollToSection(href: string, reduced: boolean | null) {
  const target = document.getElementById(href.slice(1));
  if (!target) return;
  if (window.location.hash !== href) window.history.pushState(null, '', href);
  requestAnimationFrame(() =>
    target.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'start',
    }),
  );
}
export function SectionLink({
  href,
  onClick,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const reduced = useReducedMotion();
  return (
    <a
      href={href}
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        scrollToSection(href, reduced);
      }}
    />
  );
}
