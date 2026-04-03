import { useEffect, useState } from 'react';
import { oauthService } from '@/services/oauthService';
import { CircleNotch } from '@phosphor-icons/react';
import { Card } from '@/components/ui/card';

export function OAuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const provider = params.get('provider') as 'spotify' | 'google' | null;

        if (!code || !state || !provider) {
          throw new Error('Ungültige Callback-Parameter');
        }

        const success = await oauthService.handleCallback(code, state, provider);
        
        if (success) {
          setStatus('success');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          throw new Error('Authentifizierung fehlgeschlagen');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full text-center bg-card border border-border">
        {status === 'loading' && (
          <>
            <CircleNotch className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="display-font text-xl mb-2">Authentifizierung läuft...</h2>
            <p className="text-sm text-muted-foreground">Bitte warten Sie einen Moment.</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-primary rounded-full" />
            </div>
            <h2 className="display-font text-xl mb-2">Erfolgreich!</h2>
            <p className="text-sm text-muted-foreground">Sie werden weitergeleitet...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-destructive rounded-full" />
            </div>
            <h2 className="display-font text-xl mb-2">Fehler</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <a 
              href="/" 
              className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
            >
              Zurück zur Startseite
            </a>
          </>
        )}
      </Card>
    </div>
  );
}
