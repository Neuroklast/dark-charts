'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AboutView } from '@/components/AboutView';

export default function AboutPage() {
  return (
    <ErrorBoundary level="component">
      <AboutView />
    </ErrorBoundary>
  );
}