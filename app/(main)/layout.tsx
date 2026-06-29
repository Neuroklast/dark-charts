'use client';

import { ChartShellClient } from './_components/ChartShellClient';
import { MainLayoutClient } from './_components/MainLayoutClient';

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChartShellClient>
      <MainLayoutClient>{children}</MainLayoutClient>
    </ChartShellClient>
  );
}