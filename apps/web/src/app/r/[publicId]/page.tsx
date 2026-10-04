import { PublicCustomerPage } from '@/features/qr/public-customer';
export default async function Page({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  return <PublicCustomerPage key={publicId} publicId={publicId} />;
}
