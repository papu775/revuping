'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  LayoutDashboard,
  QrCode,
  MessageSquare,
  Send,
  Star,
  Menu,
  X,
  ArrowUpRight,
  Leaf,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../../components/shared';
import { navItems } from '../../lib/mock-data';
const icons = [LayoutDashboard, QrCode, MessageSquare, Send, Star];
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const reduced = useReducedMotion();
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!mobile || !open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobile, open]);
  const sidebarRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = sidebarRef.current;
    sidebar?.querySelector<HTMLElement>('nav a[aria-current="page"]')?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !sidebar) return;
      const focusable = [
        ...sidebar.querySelectorAll<HTMLElement>('a, button'),
      ].filter((element) => element.getClientRects().length);
      const first = focusable[0],
        last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [open]);
  const [location, setLocation] = useState('Bloom & Co. · Notting Hill');
  return (
    <div className="dashboard-shell flex min-h-screen bg-[#f8f7f4]">
      <AnimatePresence initial={false}>
        {(!mobile || open) && (
          <motion.aside
            initial={{ x: mobile && !reduced ? -260 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: mobile && !reduced ? -260 : 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            ref={sidebarRef}
            id="workspace-navigation"
            className={`sidebar ${open ? 'sidebar-open' : ''}`}
          >
            <div className="sidebar-brand">
              <Logo />
              <button
                className="icon-button mobile-toggle"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X />
              </button>
            </div>
            <div className="business-switch">
              <span className="business-icon">
                <Leaf size={19} />
              </span>
              <div>
                <strong>Bloom & Co.</strong>
                <small>Salon & beauty</small>
              </div>
            </div>
            <span className="sidebar-label">Your workspace</span>
            <nav>
              {navItems.map(([label, href], i) => {
                const Icon = icons[i];
                return (
                  <Link
                    key={href}
                    href={href}
                    className={path === href ? 'active' : ''}
                    aria-current={path === href ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={19} />
                    {label}
                    {i === 2 && <span className="nav-count">3</span>}
                  </Link>
                );
              })}
            </nav>
            <div className="sidebar-bottom">
              <div className="demo-sidebar">
                <span className="live-dot" />
                <strong>Demo workspace</strong>
                <p>
                  You’re exploring a demo.
                  <br />
                  All data is fictional.
                </p>
                <Link href="/r/demo-salon">
                  See the customer view <ArrowUpRight size={14} />
                </Link>
              </div>
              <Link href="/" className="back-site">
                ← Back to RevuPing
              </Link>
              <div className="profile">
                <span className="avatar lavender">DO</span>
                <div>
                  <strong>Demo Owner</strong>
                  <small>Demo salon owner</small>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <motion.button
            initial={{ opacity: reduced ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            className="sidebar-scrim"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          />
        )}
      </AnimatePresence>
      <div className="dashboard-main min-w-0 flex-1 ml-[248px] max-[1100px]:ml-[226px] max-[800px]:ml-[208px] max-[600px]:ml-0">
        <header className="dashboard-topbar flex h-[77px] items-center justify-between gap-4 border-b border-[#e1dfd9] bg-[#fffcf7] px-8 max-[1100px]:px-6 max-[800px]:h-[72px] max-[800px]:px-5 max-[600px]:gap-2 max-[600px]:px-4">
          <div>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-expanded={open}
              aria-controls="workspace-navigation"
            >
              <Menu />
            </button>
            <span>
              Workspace <span className="breadcrumb-slash">/</span>{' '}
              <strong>
                {navItems.find(([, href]) => href === path)?.[0] || 'Overview'}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="demo-label">Demo workspace</span>
            <label className="location-select">
              <Leaf size={14} />
              <select
                className="min-w-0 flex-1"
                aria-label="Business location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="Bloom & Co. · Notting Hill">Notting Hill</option>
                <option value="Bloom & Co. · Richmond (sample)">
                  Richmond (sample)
                </option>
              </select>
              <ChevronDown size={12} />
            </label>
          </div>
        </header>
        <main className="dashboard-content mx-auto max-w-[1500px] p-8 max-[1100px]:px-6 max-[1100px]:py-7 max-[800px]:px-5 max-[600px]:px-[18px] max-[600px]:pb-9 max-[600px]:pt-6">
          {location.includes('Richmond') && (
            <div className="info-banner">
              <p>
                Richmond location preview selected. Both locations use the same
                illustrative dataset in this prototype.
              </p>
            </div>
          )}
          {children}
        </main>
        <footer className="dashboard-footer flex flex-wrap justify-between gap-2 px-8 py-5 text-xs text-[#575b68] max-[600px]:px-[18px]">
          Bloom & Co. · Fictional salon{' '}
          <span>RevuPing prototype · No live integrations</span>
        </footer>
      </div>
    </div>
  );
}
