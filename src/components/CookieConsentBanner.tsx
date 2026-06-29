'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useKV } from '@/hooks/useKV';

export function CookieConsentBanner() {
  const [consentGiven, setConsentGiven] = useKV<'unset' | 'acceptedAll' | 'essentialOnly'>('cookie-consent', 'unset');
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (consentGiven === 'unset') {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [consentGiven]);

  const handleAccept = () => {
    setConsentGiven('acceptedAll');
    setShowBanner(false);
  };

  const handleReject = () => {
    setConsentGiven('essentialOnly');
    setShowBanner(false);
  };

  if (!showBanner || consentGiven !== 'unset') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 pointer-events-none">
      <Card className="bg-card border border-primary shadow-lg pointer-events-auto max-w-5xl mx-auto">
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <h3 className="font-display text-lg uppercase text-foreground">
              Cookie-Hinweis / Cookie Notice
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wir verwenden technisch notwendige Speicher (Login-Session, Spracheinstellung, Cookie-Einwilligung).
              Optionale Drittanbieter-Cookies werden erst nach Ihrer Einwilligung geladen, sobald entsprechende
              Dienste aktiviert werden.
            </p>
            <p className="text-xs text-muted-foreground">
              Weitere Informationen in unserer{' '}
              <Link href="/privacy" className="text-accent hover:text-primary transition-colors underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAccept}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
            >
              Alle akzeptieren / Accept All
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="border-border text-foreground hover:bg-secondary flex-1 sm:flex-none"
            >
              Nur notwendige / Essential Only
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}