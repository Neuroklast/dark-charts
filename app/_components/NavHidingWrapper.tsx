'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

const HIDDEN_PREFIXES = ['/admin', '/login'];

export function NavHidingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (hidden) return null;
  return <>{children}</>;
}