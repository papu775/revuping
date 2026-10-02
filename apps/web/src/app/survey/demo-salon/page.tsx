import { PublicSurvey } from '@/features/product/surveys';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <PublicSurvey surveyId={id ? Number(id) : 1} />;
}
