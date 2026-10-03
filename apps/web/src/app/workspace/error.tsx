'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="dashboard-content">
      <h1>Your session is temporarily unavailable</h1>
      <p>Check your connection and try again.</p>
      <Button onClick={reset}>Try again</Button>
      <Link href="/login">Back to login</Link>
    </main>
  );
}
