'use client';
import { CustomerDirectory } from '@/features/product/customers';
import { Campaigns, Referrals } from '@/features/product/campaigns';
import {
  StaffInsights,
  Reports,
  Competitors,
} from '@/features/product/insights';
import { Surveys } from '@/features/product/surveys';
import { Widgets } from '@/features/product/widgets';
import {
  BusinessSettings,
  Integrations,
  Billing,
} from '@/features/product/settings';
export function ProductModule({
  section,
  selectedId,
}: {
  section: string;
  selectedId?: number;
}) {
  switch (section) {
    case 'customers':
      return <CustomerDirectory selectedId={selectedId} />;
    case 'campaigns':
      return <Campaigns selectedId={selectedId} />;
    case 'reminders':
      return <Campaigns kind="Reminder" selectedId={selectedId} />;
    case 'repeat-visits':
      return <Campaigns kind="Repeat visit" selectedId={selectedId} />;
    case 'referrals':
      return <Referrals />;
    case 'staff':
      return <StaffInsights />;
    case 'reports':
      return <Reports />;
    case 'surveys':
      return <Surveys selectedId={selectedId} />;
    case 'widgets':
      return <Widgets />;
    case 'competitors':
      return <Competitors />;
    case 'integrations':
      return <Integrations />;
    case 'settings':
      return <BusinessSettings />;
    case 'billing':
      return <Billing />;
    case 'onboarding':
      return <BusinessSettings onboarding />;
    default:
      return null;
  }
}
