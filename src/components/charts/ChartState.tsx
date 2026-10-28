'use client';
import Link from 'next/link';
import { ArrowClockwise, ArrowUpRight, ChartBar, MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export function ChartState({ error = false, onRetry, message }: { error?: boolean; onRetry?: () => void; message?: string }) {
  const { t, language } = useLanguage();
  const de = language.startsWith('de');
  return (
    <div className="chart-state" role={error ? 'alert' : 'status'}>
      <div className="chart-state-icon">{error ? <MagnifyingGlass size={30} aria-hidden="true" /> : <ChartBar size={30} weight="duotone" aria-hidden="true" />}</div>
      <span className="chart-state-kicker">{error ? (de ? 'VERBINDUNGSFEHLER' : 'CONNECTION ERROR') : (de ? 'DIE NÄCHSTE AUSGABE ENTSTEHT' : 'THE NEXT EDITION IS COMING')}</span>
      <h2>{error ? t('chart.loadError') : (message ?? t('ui.empty'))}</h2>
      <p>{error ? (de ? 'Die Charts konnten nicht geladen werden. Bitte versuche es erneut.' : 'We could not load the charts. Please retry.') : (de ? 'Hier erscheinen ausschließlich überprüfte Chart-Ergebnisse. Entdecke solange neue Releases oder beteilige dich an der nächsten Abstimmung.' : 'Only verified chart results appear here. Explore releases or take part in the next vote.')}</p>
      <div className="chart-state-actions">
        {error ? onRetry && <Button variant="outline" onClick={onRetry}><ArrowClockwise size={17} />{t('ui.retry')}</Button> : <>
          <Link className="chart-state-primary" href="/search">{de ? 'Musik entdecken' : 'Discover music'}<ArrowUpRight size={17} aria-hidden="true" /></Link>
          <Link className="chart-state-secondary" href="/voting">{t('nav.voting')}</Link>
        </>}
      </div>
    </div>
  );
}
