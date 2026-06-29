'use client';

import { type ReactNode } from 'react';
import { TopNavigation } from '@/components/TopNavigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChartNavigation } from './ChartNavigation';
import { SiteFooter } from '@/components/SiteFooter';

interface MainLayoutClientProps {
  children: ReactNode;
}

export function MainLayoutClient({ children }: MainLayoutClientProps) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-32">
      <div className="cyber-crt-overlay" />

      <svg
        className="fixed inset-0 w-full h-full pointer-events-none z-[2] opacity-[0.015]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>

      <ErrorBoundary level="component">
        <TopNavigation linkMode />
      </ErrorBoundary>

      <ChartNavigation />

      <div className="relative z-10">{children}</div>

      <SiteFooter />
    </div>
  );
}