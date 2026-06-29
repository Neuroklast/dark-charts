'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CustomChartsView } from '@/components/CustomChartsView';

export default function CustomChartsPage() {
  return (
    <ErrorBoundary level="component">
      <CustomChartsView />
    </ErrorBoundary>
  );
}