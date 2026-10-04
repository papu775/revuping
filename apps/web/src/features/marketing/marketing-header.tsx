'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Logo } from '@/components/shared';
import { SectionLink, scrollToSection } from '@/components/ui/section-link';
import { ThemeControl } from '@/components/theme';
import { Button } from '@/components/ui/button';
const links = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['Pricing', '#pricing'],
] as const;
export function MarketingHeader() {
  const [open, setOpen] = useState(false),
    [scrolled, setScrolled] = useState(false),
    [active, setActive] = useState('');
  const trigger = useRef<HTMLButtonElement>(null),
    nav = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const pendingAnchor = useRef<string | null>(null);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 12);
    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
      },
      { rootMargin: '-90px 0px -55% 0px' },
    );
    links.forEach(([, href]) => {
      const target = document.querySelector(href);
      if (target) observer.observe(target);
    });
    return () => {
      window.removeEventListener('scroll', scroll);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const media = window.matchMedia('(min-width: 1024px)');
    const resize = () => {
      if (media.matches) setOpen(false);
    };
    document.addEventListener('keydown', close);
    media.addEventListener('change', resize);
    return () => {
      document.removeEventListener('keydown', close);
      media.removeEventListener('change', resize);
    };
  }, [open]);
  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200 ${scrolled || open ? 'border-line bg-ivory/95 shadow-[0_4px_18px_var(--shadow-color)] backdrop-blur-md' : 'border-transparent bg-ivory'}`}
    >
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-3 px-4 md:gap-5 md:px-8 xl:px-10 [&_.logo]:text-[22px] md:[&_.logo]:text-[26px] [&_.logo-mark]:size-7 md:[&_.logo-mark]:size-8">
        <Logo />
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 whitespace-nowrap lg:flex"
        >
          {links.map(([label, href]) => (
            <SectionLink
              key={href}
              href={href}
              aria-current={active === href ? 'location' : undefined}
              className={`rounded-md py-2 text-[15px] font-medium transition-colors hover:text-violet ${active === href ? 'text-violet' : 'text-muted'}`}
            >
              {label}
            </SectionLink>
          ))}
        </nav>
        <div className="flex items-center gap-4 max-lg:gap-2">
          <Link
            href="/login"
            className="hidden rounded-md py-2 text-sm font-medium hover:text-violet lg:inline-flex"
          >
            Log in
          </Link>
          <ThemeControl />
          <Button
            asChild
            variant="secondary"
            size="small"
            className="hidden lg:inline-flex"
          >
            <Link href="/dashboard" aria-label="Try the demo">
              <span className="hidden min-[480px]:inline">Try the demo</span>
              <span className="min-[480px]:hidden">Demo</span> <ArrowUpRight />
            </Link>
          </Button>
          <Button asChild size="small">
            <Link href="/signup" aria-label="Create account">
              <span className="hidden min-[480px]:inline">Create account</span>
              <span className="min-[480px]:hidden">Sign up</span>
            </Link>
          </Button>
          <button
            ref={trigger}
            className="mobile-toggle flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-canvas lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
            aria-expanded={open}
            aria-controls="marketing-mobile-menu"
          >
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
      <AnimatePresence
        initial={false}
        onExitComplete={() => {
          const href = pendingAnchor.current;
          pendingAnchor.current = null;
          if (href) scrollToSection(href, reduced);
        }}
      >
        {open && (
          <motion.nav
            ref={nav}
            id="marketing-mobile-menu"
            aria-label="Mobile navigation"
            initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="overflow-hidden border-t border-line lg:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              {[
                ...links,
                ['Log in', '/login'],
                ['Try the demo', '/dashboard'],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={(event) => {
                    if (href.startsWith('#')) {
                      event.preventDefault();
                      pendingAnchor.current = href;
                    }
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                  className="rounded-lg px-3 py-3 text-base font-medium hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
