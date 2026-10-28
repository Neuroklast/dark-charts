'use client';

import { Button } from '@/components/ui/button';

export interface AdminPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  disabled?: boolean;
}

export function AdminPagination({ page, pageSize, total, onPageChange, onPageSizeChange, disabled }: AdminPaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(0, page), pages - 1);
  const first = total ? current * pageSize + 1 : 0;
  const last = Math.min(total, (current + 1) * pageSize);
  return (
    <nav aria-label="Seitennavigation" className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-sm">
      <span className="text-muted-foreground">{first.toLocaleString('de-DE')}–{last.toLocaleString('de-DE')} von {total.toLocaleString('de-DE')}</span>
      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange && <label className="flex items-center gap-2 text-muted-foreground">
          Pro Seite
          <select aria-label="Einträge pro Seite" className="h-9 rounded-md border border-border bg-background px-2 text-foreground"
            value={pageSize} onChange={e => onPageSizeChange(Number(e.target.value))}>
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>}
        <Button type="button" size="sm" variant="outline" disabled={disabled || current === 0} onClick={() => onPageChange(0)}>«</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled || current === 0} onClick={() => onPageChange(current - 1)}>Zurück</Button>
        <span className="min-w-24 text-center text-muted-foreground">Seite {current + 1} / {pages}</span>
        <Button type="button" size="sm" variant="outline" disabled={disabled || current >= pages - 1} onClick={() => onPageChange(current + 1)}>Weiter</Button>
        <Button type="button" size="sm" variant="outline" disabled={disabled || current >= pages - 1} onClick={() => onPageChange(pages - 1)}>»</Button>
      </div>
    </nav>
  );
}
