'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UNIQUE_VOTER_WEIGHT } from '@/lib/math/fan-scoring';
import { useLanguage } from '@/contexts/LanguageContext';

export function MethodologyView() {
  const { language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">
          {isEn ? 'Chart Methodology' : 'Chart-Methodik'}
        </h1>
        <p className="text-muted-foreground text-sm font-ui">
          {isEn
            ? 'Transparent documentation of Dark Charts calculations. Updated: June 2026'
            : 'Transparente Dokumentation der Dark-Charts-Berechnung. Stand: Juni 2026'}
        </p>
      </div>

      <Card className="p-6 bg-card border-border space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Three Pillars' : 'Drei Säulen'}
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong className="text-foreground">Fan Charts</strong> — {isEn ? 'quadratic voting (QV), weekly' : 'quadratisches Voting (QV), wöchentlich'}</li>
            <li><strong className="text-foreground">Expert Charts</strong> — {isEn ? 'weekly top-10 from verified DJs' : 'wöchentliche Top-10-Rankings verifizierter DJs'}</li>
            <li><strong className="text-foreground">Streaming Charts</strong> — {isEn ? 'Spotify + YouTube signals (85/15 blend)' : 'Spotify + YouTube Signale (85/15 Blend)'}</li>
            <li><strong className="text-foreground">Combined Chart</strong> — {isEn ? 'weighted merge of all pillars' : 'gewichtete Zusammenführung aller drei Säulen'}</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Fan Score (Sybil-resistant)' : 'Fan-Score (Sybil-resistent)'}
          </h2>
          <pre className="bg-secondary/40 border border-border p-4 text-xs font-mono text-foreground overflow-x-auto">
{`fanScore = weightedUniqueVoters × ${UNIQUE_VOTER_WEIGHT} + Σ(√(costᵢ) × trustWeight)`}
          </pre>
          <p className="mt-3">
            {isEn
              ? 'Trust weights: unverified email 0.1×, verified email 0.5×, OAuth 1.0×, Spotify listening history 1.25×.'
              : 'Trust-Gewichte: unverifizierte E-Mail 0.1×, verifizierte E-Mail 0.5×, OAuth 1.0×, Spotify-Hörhistorie 1.25×.'}
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Genre Charts' : 'Genre-Charts'}
          </h2>
          <p>
            {isEn
              ? 'Subgenre and main-genre charts are aggregated server-side weekly. A subgenre chart requires at least 5 fan votes in that genre for the week.'
              : 'Subgenre- und Main-Genre-Charts werden wöchentlich serverseitig aggregiert. Mindestens 5 Fan-Votes pro Genre und Woche.'}
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Spotlight Ads' : 'Spotlight-Werbung'}
          </h2>
          <p>
            {isEn
              ? 'Paid Spotlight slots appear above chart content, clearly labeled as advertising. They never affect rankings. Bands and Labels can book slots via self-service checkout on'
              : 'Bezahlte Spotlight-Slots erscheinen oberhalb der Charts, klar als Anzeige gekennzeichnet. Sie beeinflussen Rankings nicht. Bands und Labels buchen Slots per Selbstbuchung unter'}{' '}
            <Link href="/spotlight" className="text-accent underline">/spotlight</Link>.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Anomaly Detection' : 'Anomalie-Erkennung'}
          </h2>
          <p>
            {isEn
              ? 'Weekly aggregation flags suspicious vote patterns (e.g. low-trust clusters, new-account surges) for admin review. Unresolved high-severity anomalies automatically suspend voting on affected releases until moderators resolve the case.'
              : 'Die Wochenaggregation markiert verdächtige Vote-Muster (z. B. Low-Trust-Cluster, New-Account-Spikes) zur Admin-Prüfung. Ungeklärte Anomalien mit hoher Schwere setzen Abstimmungen auf betroffene Releases automatisch aus, bis Moderatoren den Fall schließen.'}
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Known Limitations' : 'Bekannte Limitierungen'}
          </h2>
          <ul className="list-disc list-inside ml-2 space-y-2 text-xs">
            <li>{isEn ? 'Trust weights reduce but do not eliminate multi-accounting' : 'Trust-Gewichte reduzieren Multi-Accounting, beseitigen es aber nicht vollständig'}</li>
            <li>{isEn ? 'YouTube metrics require YOUTUBE_API_KEY configuration' : 'YouTube-Metriken benötigen YOUTUBE_API_KEY Konfiguration'}</li>
            <li>{isEn ? 'Streaming uses estimated popularity, not official stream counts' : 'Streaming nutzt geschätzte Popularität, keine offiziellen Stream-Zahlen'}</li>
          </ul>
          <p className="mt-4 text-xs">
            {isEn ? 'Questions:' : 'Fragen:'}{' '}
            <Link href="/imprint" className="text-accent underline">{isEn ? 'Imprint' : 'Impressum'}</Link>
          </p>
        </section>
      </Card>
    </div>
  );
}