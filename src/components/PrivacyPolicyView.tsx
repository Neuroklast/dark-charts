import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function PrivacyPolicyView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border border-border p-8">
        <h1 className="font-display text-3xl uppercase text-foreground mb-8 tracking-tight">
          Datenschutzerklärung / Privacy Policy
        </h1>

        <div className="space-y-8 font-ui text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">1. Verantwortliche Stelle</h2>
            <p>
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist im Impressum angegeben.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">2. Erfassung allgemeiner Informationen</h2>
            <p className="mb-4">
              Beim Aufruf dieser Website werden durch den Internet-Browser automatisch Informationen an unseren Server übermittelt. 
              Diese Informationen werden temporär in einem sogenannten Logfile gespeichert.
            </p>
            <p className="mb-4">
              Folgende Informationen werden dabei ohne Ihr Zutun erfasst und bis zur automatisierten Löschung gespeichert:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>IP-Adresse des anfragenden Rechners</li>
              <li>Datum und Uhrzeit des Zugriffs</li>
              <li>Name und URL der abgerufenen Datei</li>
              <li>Website, von der aus der Zugriff erfolgt (Referrer-URL)</li>
              <li>Verwendeter Browser und ggf. das Betriebssystem Ihres Rechners</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">3. OAuth-Authentifizierung (Spotify)</h2>
            <p className="mb-4">
              Wir bieten Ihnen die Möglichkeit, sich über Spotify zu authentifizieren. Dabei werden folgende Daten von Spotify übermittelt:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Spotify-Benutzer-ID</li>
              <li>E-Mail-Adresse</li>
              <li>Profilbild (falls vorhanden)</li>
              <li>Öffentlicher Benutzername</li>
            </ul>
            <p className="mt-4">
              Diese Daten werden zur Erstellung und Verwaltung Ihres Accounts auf unserer Plattform verwendet. 
              Die Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">4. Nutzungsdaten und Voting</h2>
            <p className="mb-4">
              Wenn Sie auf unserer Plattform Votes abgeben, werden diese Daten gespeichert, um die Charts zu berechnen. 
              Folgende Informationen werden erfasst:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Benutzer-ID (pseudonymisiert)</li>
              <li>Track-ID des bewerteten Songs</li>
              <li>Anzahl der eingesetzten Voting-Credits</li>
              <li>Zeitstempel des Votings</li>
            </ul>
            <p className="mt-4">
              Diese Daten werden zur Berechnung der Fan Charts verwendet. Nach Löschung Ihres Accounts werden die Votes anonymisiert, 
              um die historische Integrität der Charts zu bewahren.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">5. Auftragsverarbeiter</h2>
            <p className="mb-4">
              Wir nutzen folgende externe Dienstleister zur Bereitstellung unserer Services:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Vercel Inc.</strong> (Hosting und CDN) - USA, Privacy Shield zertifiziert</li>
              <li><strong>Neon</strong> (Datenbank-Hosting) - EU-basiert</li>
              <li><strong>Upstash</strong> (Redis Cache) - EU-basiert</li>
              <li><strong>Spotify AB</strong> (OAuth und Musik-Metadaten) - Schweden</li>
              <li><strong>Stripe Inc.</strong> (Zahlungsabwicklung für Werbeplätze) - USA, DSGVO-konform</li>
            </ul>
            <p className="mt-4">
              Mit allen Dienstleistern wurden Auftragsverarbeitungsverträge (AVV) gemäß Art. 28 DSGVO geschlossen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">6. Cookies und Tracking</h2>
            <p className="mb-4">
              Unsere Website verwendet Cookies, um die Benutzerfreundlichkeit zu verbessern. Cookies sind kleine Textdateien, 
              die auf Ihrem Gerät gespeichert werden.
            </p>
            <p className="mb-4">
              Wir verwenden folgende Arten von Cookies:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Technisch notwendige Cookies:</strong> Session-Management, Authentifizierung</li>
              <li><strong>Funktionale Cookies:</strong> Speicherung von Einstellungen (Theme, Sprache)</li>
              <li><strong>Drittanbieter-Cookies:</strong> Spotify-Embeds, Stripe-Zahlungsformulare</li>
            </ul>
            <p className="mt-4">
              Sie können Ihren Browser so einstellen, dass Cookies blockiert werden. Dies kann jedoch die Funktionalität der Website einschränken.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">7. Ihre Rechte (DSGVO)</h2>
            <p className="mb-4">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Recht auf Auskunft</strong> (Art. 15 DSGVO): Sie können eine Kopie aller über Sie gespeicherten Daten anfordern</li>
              <li><strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO): Korrektur falscher Daten</li>
              <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO): "Right to be forgotten" - siehe Profil-Einstellungen</li>
              <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO): Export Ihrer Daten als JSON</li>
              <li><strong>Recht auf Widerspruch</strong> (Art. 21 DSGVO): Widerspruch gegen die Verarbeitung</li>
            </ul>
            <p className="mt-4">
              Diese Funktionen stehen Ihnen direkt in Ihrem Profil zur Verfügung. Alternativ können Sie sich per E-Mail an uns wenden.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">8. Speicherdauer</h2>
            <p className="mb-4">
              Wir speichern Ihre Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account-Daten: Bis zur Löschung des Accounts</li>
              <li>Voting-Historie: Anonymisiert nach Account-Löschung, historisch archiviert für Chart-Integrität</li>
              <li>Zahlungsdaten: 10 Jahre (gesetzliche Aufbewahrungspflicht)</li>
              <li>Server-Logs: 30 Tage</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">9. Sicherheit</h2>
            <p>
              Wir verwenden technische und organisatorische Sicherheitsmaßnahmen, um Ihre Daten zu schützen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>HTTPS-Verschlüsselung für alle Datenübertragungen</li>
              <li>JWT-Tokens mit HttpOnly-Cookies für Authentifizierung</li>
              <li>Regelmäßige Sicherheitsaudits</li>
              <li>Passwort-Hashing mit bcrypt</li>
              <li>Rate Limiting gegen Brute-Force-Angriffe</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">10. Änderungen dieser Datenschutzerklärung</h2>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage oder Änderungen unserer Services anzupassen. 
              Die aktuelle Version finden Sie stets auf dieser Seite.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
