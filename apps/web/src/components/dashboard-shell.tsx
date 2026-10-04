'use client';
import { refreshAccountRoutes } from '@/app/account-actions';
import { BrandScene } from '@/components/brand-scene';
import { AccountMenu } from '@/components/ui/account-menu';
import { useRouter } from 'next/navigation';
import { type WorkspaceResponse, type OnboardingResponse } from 'api-contracts';
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
  Users,
  ChevronDown,
  Menu,
  X,
  ArrowUpRight,
  Leaf,
} from 'lucide-react';
import { ThemeControl } from '@/components/theme';
import { Select } from '@/components/ui/select';
import { Logo } from '@/components/shared';
import { navigationGroups, sectionLabel } from '@/data-access/product-data';
const icons = {
  Reputation: QrCode,
  Campaigns: Send,
  Insights: Star,
  'Tools & settings': Leaf,
};
export function DashboardShell({
  children,
  demo,
  real,
}: {
  children: React.ReactNode;
  demo?: {
    feedbackItems: { resolved: boolean }[];
    product: { location: string; business: { name: string; category: string } };
    updateProduct: (patch: { location: string }) => void;
  };
  real?: {
    workspace: WorkspaceResponse;
    workspaces: WorkspaceResponse[];
    onboarding: OnboardingResponse;
    userId: string;
  };
}) {
  const router = useRouter();
  const path = usePathname();
  const product = demo?.product ?? {
    location: real?.onboarding.draft.locationName ?? '',
    business: {
      name: real?.onboarding.draft.name ?? '',
      category: real?.onboarding.draft.category ?? '',
    },
  };
  const attention =
    demo?.feedbackItems.filter((item) => !item.resolved).length ?? 0;
  const base = real
    ? `/workspace/dashboard?workspace=${real.workspace.id}`
    : '/dashboard';
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
      // Nested menus own their keys; Escape dismisses the menu before the drawer.
      if (
        event.target instanceof Element &&
        event.target.closest('[role="menu"]')
      )
        return;
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab' || !sidebar) return;
      const focusable = [
        ...sidebar.querySelectorAll<HTMLElement>('a, button, summary'),
      ].filter(
        (element) => element.tabIndex >= 0 && element.getClientRects().length,
      );
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
  useEffect(() => {
    if (real)
      document.cookie = `rp_workspace_${real.userId}=${real.workspace.id}; Path=/; SameSite=Lax; Max-Age=31536000${window.location.protocol === 'https:' ? '; Secure' : ''}`;
  }, [real?.userId, real?.workspace.id]);
  const location = product.location;
  const setLocation = (location: string) => demo?.updateProduct({ location });
  return (
    <div
      className={`dashboard-shell visual-shell flex min-h-screen bg-canvas ${real ? 'real-dashboard' : ''}`}
    >
      <BrandScene backdrop />
      <AnimatePresence initial={false}>
        {(!mobile || open) && (
          <motion.aside
            initial={{ x: mobile && !reduced ? -260 : 0 }}
            animate={{ x: 0 }}
            exit={{ x: mobile && !reduced ? -260 : 0 }}
            transition={{ duration: reduced ? 0 : 0.22 }}
            ref={sidebarRef}
            id="workspace-navigation"
            className={`sidebar bg-section ${open ? 'sidebar-open' : ''}`}
          >
            <div className="sidebar-brand">
              {real ? <strong>Your workspace</strong> : <Logo />}
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
                {real?.onboarding.hasLogo ? (
                  <img
                    src={`/api/backend/workspaces/${real.workspace.id}/logo?v=${real.onboarding.revision}`}
                    width={40}
                    height={40}
                    alt={`${product.business.name} logo`}
                    className="object-contain"
                  />
                ) : (
                  <Leaf size={19} />
                )}
              </span>
              <div>
                <strong title={product.business.name}>
                  {product.business.name}
                </strong>
                <small>{product.business.category}</small>
              </div>
            </div>
            <nav className="workspace-nav" aria-label="Product navigation">
              <Link
                href={base}
                className={
                  path === (real ? '/workspace/dashboard' : '/dashboard')
                    ? 'active'
                    : ''
                }
                aria-current={
                  path === (real ? '/workspace/dashboard' : '/dashboard')
                    ? 'page'
                    : undefined
                }
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={19} />
                Overview
              </Link>
              {real && (
                <Link
                  href={`/workspace/qr-studio?workspace=${real.workspace.id}`}
                  className={path === '/workspace/qr-studio' ? 'active' : ''}
                  aria-current={
                    path === '/workspace/qr-studio' ? 'page' : undefined
                  }
                  onClick={() => setOpen(false)}
                >
                  <QrCode size={19} />
                  QR studio
                </Link>
              )}
              {demo && (
                <>
                  <Link
                    href="/dashboard/customers"
                    className={path === '/dashboard/customers' ? 'active' : ''}
                    aria-current={
                      path === '/dashboard/customers' ? 'page' : undefined
                    }
                    onClick={() => setOpen(false)}
                  >
                    <Users size={19} />
                    Customers
                  </Link>
                  {navigationGroups.map((group) => {
                    const Icon = icons[group.label as keyof typeof icons];
                    return (
                      <details
                        key={group.label}
                        open={group.items.some(
                          ([, section]) => path === `/dashboard/${section}`,
                        )}
                      >
                        <summary>
                          <Icon size={18} />
                          <span>{group.label}</span>
                          <ChevronDown size={15} />
                        </summary>
                        {group.items.map(([label, section]) => (
                          <Link
                            key={section}
                            href={`/dashboard/${section}`}
                            className={
                              path === `/dashboard/${section}` ? 'active' : ''
                            }
                            aria-current={
                              path === `/dashboard/${section}`
                                ? 'page'
                                : undefined
                            }
                            onClick={() => setOpen(false)}
                          >
                            {section === 'feedback' ? (
                              <MessageSquare size={16} />
                            ) : (
                              <span
                                className="nav-item-dot"
                                aria-hidden="true"
                              />
                            )}
                            {label}
                            {section === 'feedback' && (
                              <span className="nav-count">{attention}</span>
                            )}
                          </Link>
                        ))}
                      </details>
                    );
                  })}
                </>
              )}
              {real?.workspace.role === 'OWNER' && (
                <Link
                  href={`/workspace?workspace=${real.workspace.id}&edit=business`}
                >
                  Business details
                </Link>
              )}
            </nav>
            <div className="sidebar-bottom">
              {demo && (
                <div className="demo-sidebar">
                  <span className="live-dot" />
                  <strong>Demo workspace</strong>
                  <p>Fictional data. Changes reset on reload.</p>
                  <Link href="/r/demo-salon">
                    See the customer view <ArrowUpRight size={14} />
                  </Link>
                </div>
              )}
              <Link href="/" className="back-site">
                ← Back to RevuPing
              </Link>
              {demo && <AccountMenu />}
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
        <header className="dashboard-topbar sticky top-0 z-40 flex h-[77px] items-center justify-between gap-4 border-b border-line bg-canvas px-8 max-[1100px]:px-6 max-[800px]:h-[72px] max-[800px]:px-5 max-[600px]:gap-2 max-[600px]:px-4">
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
                {real
                  ? path === '/workspace/qr-studio'
                    ? 'QR studio'
                    : 'Overview'
                  : sectionLabel(path)}
              </strong>
            </span>
          </div>
          <div className="topbar-right !gap-2">
            <span className="demo-label">
              {demo ? 'Demo workspace' : 'Your workspace'}
            </span>
            {demo && <ThemeControl />}
            {demo ? (
              <Select
                label="Business location"
                value={location}
                onValueChange={setLocation}
                className="w-[210px] max-[800px]:w-[180px] max-[600px]:w-[140px]"
                icon={<Leaf size={15} className="max-[600px]:hidden" />}
                options={[
                  { value: 'Notting Hill', label: 'Notting Hill' },
                  { value: 'All locations', label: 'All sample locations' },
                  {
                    value: 'Richmond',
                    label: 'Richmond (sample)',
                    description: 'Separate sample report fixtures',
                  },
                ]}
              />
            ) : (
              real && (
                <Select
                  label="Workspace"
                  value={real.workspace.id}
                  className="w-[210px] max-[600px]:w-[140px]"
                  options={real.workspaces.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onValueChange={async (id) => {
                    await refreshAccountRoutes();
                    document.cookie = `rp_workspace_${real.userId}=${id}; Path=/; SameSite=Lax; Max-Age=31536000${window.location.protocol === 'https:' ? '; Secure' : ''}`;
                    router.replace(`/workspace?workspace=${id}`);
                  }}
                />
              )
            )}
          </div>
        </header>
        <main className="dashboard-content mx-auto max-w-[1500px] p-8 max-[1100px]:px-6 max-[1100px]:py-7 max-[800px]:px-5 max-[600px]:px-[18px] max-[600px]:pb-9 max-[600px]:pt-6">
          <div key={path} className="route-content">
            {demo && location.includes('Richmond') && (
              <div className="info-banner">
                <p>
                  Richmond location preview selected. Reports show a separate
                  fictional dataset. Other screens share the demo workspace.
                </p>
              </div>
            )}
            {children}
          </div>
        </main>
        <footer className="dashboard-footer flex flex-wrap justify-between gap-2 px-8 py-5 text-xs text-muted max-[600px]:px-[18px]">
          {demo ? 'Bloom & Co. · Fictional salon' : product.business.name}
          <span>
            {demo
              ? 'RevuPing prototype · No live integrations'
              : 'Your saved business · No live integrations'}
          </span>
        </footer>
      </div>
    </div>
  );
}
