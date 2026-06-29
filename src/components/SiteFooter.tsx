'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="relative z-10 border-t border-border bg-card/50 backdrop-blur-sm mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-wider"
          aria-label={t('footer.legalNav') || 'Legal'}
        >
          <Link href="/imprint" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.imprint') || 'Impressum'}
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.privacy') || 'Datenschutz'}
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.terms') || 'AGB'}
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.about') || 'Über uns'}
          </Link>
          <Link href="/methodology" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.methodology') || 'Methodik'}
          </Link>
          <Link href="/spotlight" className="text-muted-foreground hover:text-primary transition-colors">
            {t('footer.spotlight') || 'Spotlight'}
          </Link>
        </nav>
        <p className="text-center text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          {t('footer.tagline') ||
            'Unabhängige Charts für die Metal- & Gothic-Szene. Rankings basieren auf Fan-Voting, Expertenbewertungen und Streaming-Daten — nicht auf Bezahlung.'}
        </p>
        <p className="text-center text-xs text-muted-foreground/60">
          © {new Date().getFullYear()} Dark Charts
        </p>
      </div>
    </footer>
  );
}