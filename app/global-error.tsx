'use client';

import { ErrorFallback } from '@/ErrorFallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body>
        <ErrorFallback error={error} resetErrorBoundary={reset} />
      </body>
    </html>
  );
}