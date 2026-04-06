import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightning, CheckCircle, WarningCircle, CaretRight, ArrowLeft } from '@phosphor-icons/react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlbumArtwork } from './AlbumArtwork';
import { Skeleton } from '@/components/ui/skeleton';
import { PromotionalSlot } from '@/components/PromotionalSlot';

interface VoteReceipt {
  id: string;
  releaseId: string;
  allocatedVotes: number;
  cost: number;
  createdAt: string;
  release: {
    id: string;
    title: string;
    itunesArtworkUrl?: string;
    artist: {
      id: string;
      name: string;
    };
  };
}

export function VoteConfirmationView({ onNavigate }: { onNavigate?: (view: any) => void }) {
  const { getAuthToken } = useAuth();
  const { t } = useLanguage();
  const [votes, setVotes] = useState<VoteReceipt[]>([]);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePromotion, setActivePromotion] = useState<{ type?: string; name?: string; imageUrl?: string } | null>(null);

  useEffect(() => {
    fetch('/api/promotions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.promotions && data.promotions.length > 0) {
          const promo = data.promotions[0];
          setActivePromotion({
            type: promo.label || promo.type,
            name: promo.name,
            imageUrl: promo.imageUrl
          });
        }
      })
      .catch(err => console.error('Failed to load promotions', err));
  }, []);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setError('Unauthorized');
          return;
        }

        const res = await fetch('/api/vote/receipt', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch receipt');
        }

        const data = await res.json();
        setVotes(data.votes || []);
        setRemainingCredits(data.remainingCredits ?? null);
      } catch (err) {
        console.error('Error fetching vote receipt:', err);
        setError('Could not load your receipt.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [getAuthToken]);

  const totalCost = votes.reduce((sum, v) => sum + v.cost, 0);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <WarningCircle size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-xl font-display uppercase tracking-wider text-foreground mb-2">Error</h2>
        <p className="text-muted-foreground font-ui">{error}</p>
        <Button
          variant="outline"
          className="mt-6 uppercase tracking-wider font-ui"
          onClick={() => onNavigate?.('profile')}
        >
          Zurück zum Profil
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {activePromotion && (
        <PromotionalSlot type={activePromotion.type} name={activePromotion.name} imageUrl={activePromotion.imageUrl} />
      )}

      <div className="text-center space-y-4 pt-8">
        <div className="mx-auto w-16 h-16 bg-primary/20 flex items-center justify-center rounded-full mb-6">
          <CheckCircle size={32} weight="fill" className="text-primary" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl uppercase tracking-wider text-foreground">
          Voting Eingereicht
        </h1>
        <p className="font-ui text-muted-foreground max-w-lg mx-auto leading-relaxed border border-border p-4 bg-card">
          Deine Stimmen für diese Woche sind sicher in der Datenbank. Die Wahlkabine ist für dich geschlossen.
        </p>
      </div>

      <Card className="bg-card border-border border-2 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20" />

        <div className="p-6 border-b border-border bg-secondary/50">
          <h2 className="font-ui text-sm uppercase tracking-[0.2em] text-foreground font-bold flex items-center gap-2">
            <Lightning size={16} className="text-accent" />
            Digitaler Kassenbeleg
          </h2>
        </div>

        <div className="divide-y divide-border">
          {votes.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground font-ui text-sm">
              Keine Stimmen für diese Woche gefunden.
            </div>
          ) : (
            votes.map((vote) => (
              <div key={vote.id} className="p-4 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                <div className="w-12 h-12 shrink-0">
                  <AlbumArtwork
                    src={vote.release.itunesArtworkUrl}
                    alt={vote.release.title}
                    artist={vote.release.artist.name}
                    title={vote.release.title}
                    size="small"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-display text-lg truncate text-foreground leading-tight mb-1">
                    {vote.release.title}
                  </div>
                  <div className="font-ui text-xs text-muted-foreground truncate uppercase tracking-wider">
                    {vote.release.artist.name}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <span className="data-font text-lg font-bold">{vote.allocatedVotes}</span>
                    <span className="font-ui text-[10px] text-muted-foreground uppercase tracking-widest ml-1">Stimmen</span>
                  </div>
                  <CaretRight size={16} className="text-border hidden sm:block" />
                  <div className="bg-accent/10 px-3 py-1.5 border border-accent/20 min-w-[100px]">
                    <span className="data-font text-xl font-bold text-accent">{vote.cost}</span>
                    <span className="font-ui text-[10px] text-accent/70 uppercase tracking-widest ml-1">Credits</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-secondary/50 border-t border-border flex justify-between items-center">
          <span className="font-ui text-sm uppercase tracking-wider text-muted-foreground">
            Verbrauchte Credits
          </span>
          <div className="text-right">
            <span className="data-font text-2xl font-bold text-foreground">{totalCost}</span>
            <span className="font-ui text-xs text-muted-foreground ml-2">/ 150</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <Button
          variant="outline"
          className="h-14 font-ui uppercase tracking-widest flex items-center justify-center gap-2"
          onClick={() => onNavigate?.('profile')}
        >
          <ArrowLeft size={16} />
          Zurück zum Profil
        </Button>
        <Button
          variant="secondary"
          className="h-14 font-ui uppercase tracking-widest bg-secondary hover:bg-secondary/80 text-foreground border border-border"
          onClick={() => onNavigate?.('history')}
        >
          Chart-Archiv ansehen
        </Button>
      </div>

    </div>
  );
}
