'use client';
import Link from 'next/link';
import { ArrowUpRight, ChartLineUp, Pulse } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { ChartEdition } from '@/types';
import { getIsoWeekYear } from '@/lib/week';

export function ChartHeader({ title, lead, edition }: { title: string; lead?: string; edition?: ChartEdition }) {
  const { t, language } = useLanguage();
  const isGerman = language.startsWith('de');
  const date = edition ? new Date(edition.weekStart) : null;
  const week = date && Number.isFinite(date.getTime()) ? getIsoWeekYear(date) : null;
  const editionLabel = week ? `${String(week.weekNumber).padStart(2, '0')} / ${week.year}` : (isGerman ? 'Noch keine Ausgabe' : 'No edition yet');
  return (
    <header className="chart-heading">
      <div className="chart-heading-copy">
        <div className="edition-label"><span className="edition-line" aria-hidden="true" />{t('ui.edition')} <span className="edition-badge">{editionLabel}</span></div>
        <h1>{title}</h1>
        <p>{lead ?? t('ui.chartLead')}</p>
        {date && <span className="edition-date">{date.toLocaleDateString(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</span>}
        <div className="chart-hero-meta"><Pulse size={15} aria-hidden="true" /><span>{isGerman ? 'Unabhängige Charts für dunkle Musik' : 'Independent charts for dark music'}</span></div>
      </div>
      <Link href="/methodology" className="chart-method-card">
        <div className="chart-method-icon"><ChartLineUp size={23} weight="duotone" aria-hidden="true" /></div>
        <div>
          <span className="chart-method-eyebrow">{isGerman ? 'TRANSPARENTE WERTUNG' : 'TRANSPARENT RANKING'}</span>
          <strong>{t('ui.method')}</strong>
          <span className="chart-method-description">{isGerman ? 'Fans, Club-DJs und messbare Signale – ohne erfundene Ergebnisse.' : 'Fans, club DJs and verified signals – never invented rankings.'}</span>
        </div>
        <ArrowUpRight size={18} className="chart-method-arrow" aria-hidden="true" />
      </Link>
    </header>
  );
}
