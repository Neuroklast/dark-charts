'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { UNIQUE_VOTER_WEIGHT } from '@/lib/math/fan-scoring';

export function MethodologyView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">Chart-Methodik</h1>
        <p className="text-muted-foreground text-sm font-ui">
          Transparente Dokumentation der Dark-Charts-Berechnung. Stand: Juni 2026
        </p>
      </div>

      <Card className="p-6 bg-card border-border space-y-8 text-sm text-muted-foreground leading-relaxed">
        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Drei Säulen</h2>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong className="text-foreground">Fan Charts</strong> — quadratisches Voting (QV), wöchentlich</li>
            <li><strong className="text-foreground">Expert Charts</strong> — wöchentliche Top-10-Rankings verifizierter DJs</li>
            <li><strong className="text-foreground">Streaming Charts</strong> — Spotify-Popularität mit Wachstums- und Engagement-Faktoren</li>
            <li><strong className="text-foreground">Combined Chart</strong> — gewichtete Zusammenführung aller drei Säulen</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Wochengrenzen</h2>
          <p>
            Voting und Aggregation nutzen ISO-Wochen mit Montag 00:00 UTC als Start. Fan-Abstimmungen sind
            pro Woche einmalig. Charts werden sonntags um 23:55 UTC aggregiert und Credits werden danach
            auf das konfigurierte Wochenbudget zurückgesetzt.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Fan-Score (Sybil-resistent)</h2>
          <p className="mb-3">
            Pro Release und Woche gilt:
          </p>
          <pre className="bg-secondary/40 border border-border p-4 text-xs font-mono text-foreground overflow-x-auto">
{`fanScore = uniqueVoters × ${UNIQUE_VOTER_WEIGHT} + Σ√(costᵢ)`}
          </pre>
          <p className="mt-3">
            Einzelne Accounts können Leidenschaft via QV ausdrücken (√cost × Trust-Gewicht), aber die <strong className="text-foreground">gewichtete
            Breite der Unterstützung</strong> dominiert. Trust-Gewichte: unverifizierte E-Mail 0.1×, verifizierte E-Mail 0.5×,
            OAuth 1.0×, OAuth + Hörhistorie (geplant) 1.25×.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Genre-Charts</h2>
          <p>
            Subgenre- und Main-Genre-Charts werden wöchentlich serverseitig aggregiert (nicht nur clientseitig gefiltert).
            Ein Subgenre-Chart erscheint erst ab mindestens 5 Fan-Votes in der jeweiligen Woche und Genre-Zuordnung.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">E-Mail-Verifizierung</h2>
          <p>
            E-Mail-Registrierungen müssen die Adresse bestätigen, bevor Votes gezählt werden. OAuth-Accounts (Spotify/Google)
            gelten als verifiziert und erhalten Trust-Level 2.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Expert-Score</h2>
          <p>
            Punkte pro Rang (1→10, 2→8, 3→6, 4→4, 5→2, 6–10→1), multipliziert mit{' '}
            <code className="text-accent">max(1, reputationScore)</code>. Nur DJs mit{' '}
            <code className="text-accent">expertStatus = true</code> werden gezählt.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Streaming-Score</h2>
          <p>
            Basis: <code className="text-accent">log₁₀(estimatedStreams + 1) × 100</code>, wobei estimatedStreams aus
            Spotify-Popularity abgeleitet wird. Multiplikatoren: Wochenwachstum (0.5–3.0) und Engagement-Ratio
            (Follower vs. Streams, max 2.0). Pro Artist wird das aktuellste sichtbare Release repräsentiert.
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Combined-Gewichtung</h2>
          <p className="mb-3">
            Standard-Gewichte (administrativ konfigurierbar in <code className="text-accent">system_settings</code>):
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>Fan: 50%</li>
            <li>Expert: 35%</li>
            <li>Streaming: 15%</li>
          </ul>
          <p className="mt-3">
            Jede Säule wird auf den Wochen-Maximalwert normalisiert, dann gewichtet summiert.
            <strong className="text-foreground"> Community Power</strong> = Anteil des Fan-Scores am Gesamt-Fan-Score der Woche (%).
          </p>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Was Charts NICHT beeinflusst</h2>
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li>Spotlight-Werbeplätze (als „Anzeige“ gekennzeichnet, separater Bereich)</li>
            <li>Bezahlte Promotions ohne Chart-Einfluss</li>
            <li>Admin-Eingriffe in Rankings (nur Gewichte/Budgets, keine manuellen Platzierungen)</li>
          </ul>
        </section>

        <Separator />

        <section>
          <h2 className="font-display text-xl uppercase text-foreground mb-3">Bekannte Limitierungen</h2>
          <ul className="list-disc list-inside ml-2 space-y-2 text-xs">
            <li>Sybil-Schutz durch Trust-Gewichte reduziert, beseitigt aber nicht vollständig Multi-Accounting</li>
            <li>OAuth-Hörhistorie (Trust-Level 3) noch nicht implementiert</li>
            <li>Streaming basiert auf Spotify-Popularity, nicht auf echten Stream-Zahlen</li>
            <li>Neue Genre-Charts benötigen eine Aggregationswoche mit mindestens 5 Fan-Votes im Genre</li>
          </ul>
          <p className="mt-4 text-xs">
            Fragen: <Link href="/imprint" className="text-accent underline">Impressum</Link>
          </p>
        </section>
      </Card>
    </div>
  );
}