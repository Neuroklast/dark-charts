'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OAuthCallback } from '@/components/OAuthCallback';

export default function OAuthCallbackPage() {
  return (
    <ErrorBoundary level="component">
      <OAuthCallback />
    </ErrorBoundary>
  );
}