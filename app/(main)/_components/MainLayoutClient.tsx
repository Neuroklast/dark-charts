'use client';

import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartNavigation } from './ChartNavigation';

interface MainLayoutClientProps {
  children: ReactNode;
}

export function MainLayoutClient({ children }: MainLayoutClientProps) {
  return (
    <div id="main-content" className="min-h-screen bg-background relative overflow-x-hidden pb-32 pt-16">
      <ErrorBoundary level="component">
        <ChartNavigation />
      </ErrorBoundary>

      <div className="relative z-10">{children}</div>
    </div>
  );
}