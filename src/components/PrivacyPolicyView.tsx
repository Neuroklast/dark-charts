import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function PrivacyPolicyView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">Datenschutzerklärung</h1>
        <p className="text-muted-foreground text-sm">Stand: April 2026</p>
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="space-y-8">
          {/* 1. Verantwortliche Stelle */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">1. Verantwortliche Stelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist im Impressum angegeben.
            </p>
          </section>

          <Separator />

          {/* 2. Erfassung und Authentifizierung */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">2. Spotify-Authentifizierung</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Wir bieten Ihnen die Möglichkeit, sich über Spotify zu authentifizieren. Dabei werden folgende Daten von Spotify übertragen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>E-Mail-Adresse</li>
              <li>Öffentlicher Benutzername</li>
              <li>Spotify-Benutzer-ID</li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground italic">
              Die Rechtsgrundlage für die Verarbeitung ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <Separator />

          {/* 3. Voting-Daten */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">3. Erfassung von Voting-Daten</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Um die Charts zu generieren, werden bei jeder Stimmabgabe folgende Informationen erfasst:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Track-ID des bewerteten Songs</li>
              <li>Zeitstempel des Votings</li>
              <li>IP-Adresse (anonymisiert, zur Missbrauchsprävention)</li>
            </ul>
          </section>

          <Separator />

          {/* 4. Hosting & Infrastruktur */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">4. Infrastruktur & Hosting</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Unsere Dienste werden bei folgenden Anbietern betrieben:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li><strong>Vercel</strong> (Hosting & Edge Functions) - Globaler Anbieter</li>
              <li><strong>Upstash</strong> (Redis Cache) - EU-basierter Datenspeicher</li>
            </ul>
          </section>

          <Separator />

          {/* 5. Cookies */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">5. Cookies & Lokale Speicherung</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
              Wir verwenden technisch notwendige Cookies und den Local Storage Ihres Browsers:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Session-Tokens zur Aufrechterhaltung des Logins</li>
              <li>Präferenzen wie Sprach- oder Designeinstellungen</li>
            </ul>
          </section>

          <Separator />

          {/* 6. Ihre Rechte */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">6. Ihre Rechte</h2>
            <ul className="list-disc list-inside space-y-3 ml-4 text-muted-foreground">
              <li><strong>Recht auf Auskunft</strong> (Art. 15 DSGVO): Sie können eine Kopie Ihrer Daten anfordern.</li>
              <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO): Sie können die Löschung Ihres Kontos verlangen.</li>
              <li><strong>Widerspruchsrecht</strong>: Sie können der künftigen Verarbeitung widersprechen.</li>
            </ul>
          </section>

          <Separator />

          {/* 7. Speicherdauer */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">7. Speicherdauer</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Voting-Historie: Anonymisiert nach Account-Löschung zur Chart-Integrität.</li>
              <li>Server-Logs: Automatisierte Löschung nach 30 Tagen.</li>
            </ul>
          </section>

          <Separator />

          {/* 8. Datensicherheit */}
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">8. Datensicherheit</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
              <li>Verschlüsselung (SSL/TLS) aller Übertragungen</li>
              <li>Regelmäßige Sicherheitsaudits der Infrastruktur</li>
              <li>Rate Limiting zum Schutz vor Brute-Force-Angriffen</li>
            </ul>
          </section>

          <Separator />

          <section>
            <p className="text-muted-foreground leading-relaxed">
              Die aktuelle Version der Datenschutzerklärung finden Sie stets auf dieser Seite.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Letzte Aktualisierung: April 2026. Diese Erklärung unterliegt dem Recht der Bundesrepublik Deutschland.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}