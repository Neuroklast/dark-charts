'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartHistoryView } from '@/components/ChartHistoryView';

export default function HistoryPage() {
  return (
    <ErrorBoundary level="component">
      <ChartHistoryView />
    </ErrorBoundary>
  );
}