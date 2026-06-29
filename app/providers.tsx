'use client';

import type { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AppProviders } from '@/providers/AppProviders';
import { Toaster } from '@/components/ui/sonner';
import { LenisProvider } from '@/components/animations/LenisProvider';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { ErrorFallback } from '@/ErrorFallback';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LenisProvider>
        <AppProviders>
          {children}
          <CookieConsentBanner />
          <Toaster position="bottom-right" theme="dark" />
        </AppProviders>
      </LenisProvider>
    </ErrorBoundary>
  );
}