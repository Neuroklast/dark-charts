'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { DataSourceBanner } from '@/components/DataSourceBanner';
import { PromotionalSlot } from '@/components/PromotionalSlot';
import { useChartShell } from './ChartShellClient';

interface MainLayoutClientProps {
  children: ReactNode;
}

function shouldShowSpotlight(pathname: string): boolean {
  if (pathname.startsWith('/voting')) return false;
  if (pathname.startsWith('/profile')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/oauth')) return false;
  return true;
}

export function MainLayoutClient({ children }: MainLayoutClientProps) {
  const pathname = usePathname();
  const { activePromotion } = useChartShell();

  return (
    <div className="min-h-[70vh] bg-background relative">
      <main id="main-content" className="public-content relative z-10 mx-auto w-full max-w-7xl px-4 pt-8 pb-24 sm:px-6 md:px-8 md:pt-12 xl:px-10">
        <DataSourceBanner />
        {children}
        {activePromotion && shouldShowSpotlight(pathname) && (
          <div className="mt-8">
            <PromotionalSlot
              type={activePromotion.type}
              name={activePromotion.name}
              imageUrl={activePromotion.imageUrl}
            />
          </div>
        )}
      </main>
    </div>
  );
}
