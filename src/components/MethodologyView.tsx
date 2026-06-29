'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UNIQUE_VOTER_WEIGHT } from '@/lib/math/fan-scoring';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatHybridWeightsPercent } from '@/lib/math/normalization';
import { DEFAULT_CHART_WEIGHTS } from '@/lib/api/systemSettings';
import type { ChartWeights } from '@/types';

export function MethodologyView() {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const [weights, setWeights] = useState<ChartWeights>(DEFAULT_CHART_WEIGHTS);

  useEffect(() => {
    fetch('/api/charts/weights')
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) setWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const pct = formatHybridWeightsPercent(weights);
  const formulaLine = isEn
    ? `Overall Chart = ${pct.fan}% community votes + ${pct.expert}% verified club DJ rankings`
    : `Gesamt-Chart = ${pct.fan}% Community-Votes + ${pct.expert}% Club-DJ-Rankings`;

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

      <Card className="p-6 bg-primary/10 border-primary/30">
        <p className="text-lg font-semibold text-foreground">{formulaLine}</p>
        <p className="text-sm text-muted-foreground mt-2">
          {isEn
            ? 'Unlike legacy charts, our weighting is public and adjustable by admins — never pay-to-play.'
            : 'Anders als bei Legacy-Charts ist unsere Gewichtung öffentlich und admin-konfigurierbar — kein Pay-to-Play.'}
        </p>
      </Card>

      <Card className="p-6 bg-card border-border space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Two Sources + Hybrid' : 'Zwei Quellen + Hybrid'}
          </h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-foreground">{isEn ? 'Fan Charts' : 'Fan-Charts'}</strong> —{' '}
              {isEn ? 'quadratic voting (QV), weekly community votes' : 'quadratisches Voting (QV), wöchentliche Community-Votes'}
            </li>
            <li>
              <strong className="text-foreground">{isEn ? 'Club Charts' : 'Club-Charts'}</strong> —{' '}
              {isEn ? 'weekly rankings from verified DJs only' : 'wöchentliche Rankings nur von verifizierten DJs'}
            </li>
            <li>
              <strong className="text-foreground">{isEn ? 'Overall Chart' : 'Gesamt-Chart'}</strong> —{' '}
              {t('chart.weightsFormula')
                .replace('{fan}', String(pct.fan))
                .replace('{expert}', String(pct.expert))}
            </li>
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
              ? 'Main-genre charts use four pillars: Gothic, Metal, Dark Electro, and Crossover. Subgenre drill-downs exist but are not shown in the main navigation.'
              : 'Main-Genre-Charts nutzen vier Säulen: Gothic, Metal, Dark Electro und Crossover. Subgenre-Drilldowns existieren, sind aber nicht in der Hauptnavigation.'}
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">
            {isEn ? 'Spotlight Ads' : 'Spotlight-Werbung'}
          </h2>
          <p>
            {isEn
              ? 'Paid Spotlight slots appear above chart content, clearly labeled as advertising. They never affect rankings.'
              : 'Bezahlte Spotlight-Slots erscheinen oberhalb der Charts, klar als Anzeige gekennzeichnet. Sie beeinflussen Rankings nicht.'}{' '}
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
              ? 'Weekly aggregation flags suspicious vote patterns for admin review.'
              : 'Die Wochenaggregation markiert verdächtige Vote-Muster zur Admin-Prüfung.'}
          </p>
        </section>
      </Card>
    </div>
  );
}