import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from '@phosphor-icons/react';
import { useKV } from '@github/spark/hooks';

export function CookieConsentBanner() {
  const [consentGiven, setConsentGiven] = useKV('cookie-consent', false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (!consentGiven) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [consentGiven]);

  const handleAccept = () => {
    setConsentGiven(true);
    setShowBanner(false);
  };

  const handleReject = () => {
    setConsentGiven(true);
    setShowBanner(false);
  };

  if (!showBanner || consentGiven) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 pointer-events-none">
      <Card className="bg-card border border-primary shadow-lg pointer-events-auto max-w-5xl mx-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <h3 className="font-display text-lg uppercase text-foreground">
                Cookie-Hinweis / Cookie Notice
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Wir verwenden Cookies und ähnliche Technologien, um die Funktionalität dieser Website zu gewährleisten.
                Dazu gehören technisch notwendige Cookies für Authentifizierung sowie Drittanbieter-Cookies von Spotify
                und Stripe. Durch Klicken auf "Akzeptieren" stimmen Sie der Verwendung zu.
              </p>
              <p className="text-xs text-muted-foreground">
                Weitere Informationen finden Sie in unserer{' '}
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-privacy'));
                    setShowBanner(false);
                  }}
                  className="text-accent hover:text-primary transition-colors underline"
                >
                  Datenschutzerklärung
                </button>
                .
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Banner schließen"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={handleAccept}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 sm:flex-none"
            >
              Akzeptieren / Accept
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
