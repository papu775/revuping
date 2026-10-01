'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
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
  const [open, setOpen] = useState(false);
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
    <div className="dashboard-shell">
      <aside
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
        <span className="sidebar-label">YOUR WORKSPACE</span>
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
            <span className="avatar lavender">JC</span>
            <div>
              <strong>Jamie Carter</strong>
              <small>Demo salon owner</small>
            </div>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
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
            <span className="demo-label">DEMO WORKSPACE</span>
            <label className="location-select">
              <Leaf size={14} />
              <select
                aria-label="Business location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option>Bloom & Co. · Notting Hill</option>
                <option>Bloom & Co. · Richmond (sample)</option>
              </select>
              <ChevronDown size={12} />
            </label>
          </div>
        </header>
        <main className="dashboard-content">
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
        <footer className="dashboard-footer">
          Bloom & Co. · Fictional salon{' '}
          <span>RevuPing prototype · No live integrations</span>
        </footer>
      </div>
    </div>
  );
}
