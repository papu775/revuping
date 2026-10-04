'use client';
import { DashboardShell } from '@/components/dashboard-shell';
import { useDemoWorkspace } from '@/data-access/demo-workspace';
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = useDemoWorkspace();
  return <DashboardShell demo={demo}>{children}</DashboardShell>;
}
