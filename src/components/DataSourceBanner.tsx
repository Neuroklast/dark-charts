'use client';

import { Warning } from '@phosphor-icons/react';
import { useDataService } from '@/contexts/DataContext';
import { ApiDataService } from '@/services/apiDataService';

export function DataSourceBanner() {
  const dataService = useDataService();
  const isUsingMockData =
    dataService instanceof ApiDataService && dataService.isUsingMockData;

  if (!isUsingMockData) return null;

  return (
    <div
      role="status"
      className="mx-4 mb-4 flex items-start gap-3 rounded border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
    >
      <Warning size={20} weight="fill" className="shrink-0 mt-0.5" aria-hidden />
      <div>
        <p className="font-ui font-semibold uppercase tracking-wider text-xs text-amber-300">
          Demo-Daten
        </p>
        <p className="font-ui text-xs text-amber-100/90 mt-1 leading-relaxed">
          Es sind noch keine Live-Chart-Daten verfügbar. Die angezeigten Rankings sind Beispieldaten
          und spiegeln keine echten Abstimmungen wider.
        </p>
      </div>
    </div>
  );
}