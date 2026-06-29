'use client';

import type { ReactNode } from 'react';

interface AdminPageShellProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AdminPageShell({ title, description, children, actions }: AdminPageShellProps) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b border-border bg-card px-6 py-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}