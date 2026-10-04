import 'server-only';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Button } from '@/components/ui/button';
import { workspaceRoute } from '@/server/workspace-route';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const query = await searchParams;
  const state = await workspaceRoute(query.workspace);
  if (state.destination !== 'dashboard')
    redirect(
      `/workspace${state.workspace ? `?workspace=${state.workspace.id}` : ''}`,
    );
  const { workspace, onboarding, workspaces, session } = state;
  if (!workspace || !onboarding) redirect('/workspace');
  const draft = onboarding.draft;
  return (
    <DashboardShell
      real={{ workspace, onboarding, workspaces, userId: session.user.id }}
    >
      <PageHeading
        eyebrow="Your business"
        title={draft.name}
        text="Your business setup is complete. Here’s what you can do next."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="setup-card">
          <div className="flex flex-wrap items-center gap-4">
            {onboarding.hasLogo && (
              <img
                src={`/api/backend/workspaces/${workspace.id}/logo?v=${onboarding.revision}`}
                width={80}
                height={48}
                className="h-12 w-20 object-contain"
                alt={`${draft.name} logo`}
              />
            )}
            <h2>Business details</h2>
          </div>
          <p>
            {draft.category} · {draft.locationName}
          </p>
          <p>
            {draft.address || 'No address provided'} · {draft.timezone}
          </p>
          {workspace.role === 'OWNER' && (
            <Button asChild variant="secondary">
              <Link href={`/workspace?workspace=${workspace.id}&edit=business`}>
                Edit business details
              </Link>
            </Button>
          )}
        </section>
        <section className="setup-card">
          <h2>Your next steps</h2>
          <p>
            Your business details, hours and brand colour are ready to review.
          </p>
          <p>
            Create your location’s QR card to collect private feedback and link
            to Google reviews. Campaigns and integrations remain unavailable.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/workspace/qr-studio?workspace=${workspace.id}`}>
                Open QR studio
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/workspace/feedback?workspace=${workspace.id}`}>
                Open feedback inbox
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/dashboard">Explore the separate fictional demo</Link>
            </Button>
          </div>
        </section>
        <section className="setup-card lg:col-span-2">
          <h2>Activity</h2>
          <p>
            Activity reporting is not available yet. Your Feedback Inbox
            contains private customer responses; Google review clicks do not
            confirm a published review.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
