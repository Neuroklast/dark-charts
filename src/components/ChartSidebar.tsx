'use client';
import Link from 'next/link';
import { ArrowUpRight, MicrophoneStage } from '@phosphor-icons/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

export function ChartSidebar({ hasVoted = false }: { hasVoted?: boolean }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const de = language.startsWith('de');
  return (
    <aside className="chart-next">
      <div className="chart-next-copy">
        <div className="chart-next-label"><MicrophoneStage size={17} weight="duotone" aria-hidden="true" /> {de ? 'DIE COMMUNITY ENTSCHEIDET' : 'COMMUNITY DRIVEN'}</div>
        <h2>{t('ui.voteLead')}</h2>
        <p>{user && hasVoted ? t('sidebar.votedThisWeek') : t('ui.voteBody')}</p>
      </div>
      <div className="chart-next-actions">
        <Link className="vote-header-link" href="/voting">{t('nav.voting')}<ArrowUpRight size={18} aria-hidden="true" /></Link>
        <Link className="text-link" href="/djs">{t('djs.title')}<ArrowUpRight size={16} aria-hidden="true" /></Link>
      </div>
    </aside>
  );
}
