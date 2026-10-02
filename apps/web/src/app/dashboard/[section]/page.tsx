import { ProductModule } from '@/features/product';
import { productSections } from '@/data-access/product-data';
import { notFound } from 'next/navigation';
import {
  QrStudio,
  FeedbackInbox,
  Requests,
  Reviews,
} from '@/features/dashboard/dashboard';
export function generateStaticParams() {
  return ['qr', 'feedback', 'requests', 'reviews', ...productSections].map(
    (section) => ({
      section,
    }),
  );
}
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{
    add?: string;
    status?: string;
    item?: string;
    staff?: string;
  }>;
}) {
  const { section } = await params;
  const search = await searchParams;
  if (productSections.some((item) => item === section))
    return (
      <ProductModule
        section={section}
        selectedId={search.item ? Number(search.item) : undefined}
      />
    );
  if (section === 'reviews')
    return (
      <Reviews initialId={search.item ? Number(search.item) : undefined} />
    );
  if (section === 'feedback')
    return (
      <FeedbackInbox
        initialAttention={search.status === 'attention'}
        initialOverdue={search.status === 'overdue'}
        initialId={search.item ? Number(search.item) : undefined}
        initialQuery={search.staff || ''}
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
