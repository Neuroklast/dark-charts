'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SpotlightBookingView } from '@/components/SpotlightBookingView';

export default function SpotlightPage() {
  return (
    <div className="px-4 py-8">
      <ErrorBoundary level="component">
        <SpotlightBookingView />
      </ErrorBoundary>
    </div>
  );
}