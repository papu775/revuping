import { notFound } from 'next/navigation';
import {
  QrStudio,
  FeedbackInbox,
  Requests,
  Reviews,
} from '../../../components/dashboard';
export function generateStaticParams() {
  return ['qr', 'feedback', 'requests', 'reviews'].map((section) => ({
    section,
  }));
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ add?: string; status?: string }>;
}) {
  const { section } = await params;
  if (section === 'feedback')
    return (
      <FeedbackInbox
        initialAttention={(await searchParams).status === 'attention'}
      />
    );
  if (section === 'requests')
    return <Requests initialAdd={(await searchParams).add === 'true'} />;
  const pages: Record<string, React.ComponentType> = {
    qr: QrStudio,
    feedback: FeedbackInbox,
    requests: Requests,
    reviews: Reviews,
  };
  const Component = pages[section];
  if (!Component) notFound();
  return <Component />;
}
