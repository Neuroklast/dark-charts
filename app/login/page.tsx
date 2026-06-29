import { Suspense } from 'react';
import { CentralLoginForm } from './_components/CentralLoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <CentralLoginForm />
    </Suspense>
  );
}