'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getLegalConfig } from '@/lib/legal-config';

export function PrivacyPolicyView() {
  const legal = getLegalConfig();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-8 px-4">
      <div className="space-y-2">
        <h1 className="font-display text-3xl uppercase text-foreground">Datenschutzerklärung</h1>
        <p className="text-muted-foreground text-sm">Stand: Juni 2026</p>
        {!legal.isConfigured && (
          <p className="text-amber-500 text-xs font-ui border border-amber-500/30 bg-amber-500/10 p-3 rounded">
            Hinweis für Betreiber: Vollständige Anbieterdaten müssen über NEXT_PUBLIC_LEGAL_* Umgebungsvariablen
            konfiguriert werden, bevor die Plattform öffentlich geht.
          </p>
        )}
      </div>

      <Card className="p-6 bg-card border-border">
        <div className="space-y-8 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO:
            </p>
            <address className="not-italic mt-3 space-y-1 text-sm">
              <p className="text-foreground font-medium">{legal.name}</p>
              <p>{legal.legalForm}</p>
              <p>{legal.street}</p>
              <p>{legal.zip} {legal.city}</p>
              <p>{legal.country}</p>
            </address>
            <p className="mt-3 text-sm">
              Datenschutz-Anfragen:{' '}
              <a href={`mailto:${legal.privacyEmail}`} className="text-accent hover:text-primary underline">
                {legal.privacyEmail}
              </a>
            </p>
            <p className="mt-2 text-sm">
              Weitere Angaben im <Link href="/imprint" className="text-accent hover:text-primary underline">Impressum</Link>.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">2. Registrierung & Authentifizierung</h2>
            <h3 className="font-display text-sm uppercase text-accent mb-2">2.1 E-Mail-Registrierung</h3>
            <p className="mb-3 text-sm">
              Verarbeitete Daten: E-Mail-Adresse, Passwort (als kryptografischer Hash), gewählte Rolle (Fan/DJ/Band/Label).
              Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertrag/Account).
            </p>
            <h3 className="font-display text-sm uppercase text-accent mb-2">2.2 Spotify OAuth</h3>
            <p className="mb-3 text-sm">
              Daten: E-Mail, Anzeigename, Spotify-Nutzer-ID, Profilbild (optional). Empfänger: Spotify AB (Drittland USA;
              Übermittlung auf Basis von Standardvertragsklauseln). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
            <h3 className="font-display text-sm uppercase text-accent mb-2">2.3 Google OAuth</h3>
            <p className="text-sm">
              Daten: E-Mail, Name, Profilbild, Google-Nutzer-ID. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">3. Voting-Daten</h2>
            <p className="mb-3 text-sm">
              Bei Abstimmungen speichern wir: Nutzer-ID (über Fan-/DJ-Profil), Release-ID, Zeitstempel, zugewiesene
              Stimmen und Credit-Kosten (quadratisches Voting).
            </p>
            <p className="text-sm">
              IP-Adressen werden nicht dauerhaft gespeichert. Zur Missbrauchsprävention können IP-Adressen vorübergehend
              im Arbeitsspeicher für Rate Limiting (max. ca. 2 Minuten pro Serverinstanz) verarbeitet werden.
              Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (Integrität der Charts).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">4. Auftragsverarbeiter & Hosting</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li><strong>Supabase Inc.</strong> — Datenbank, Nutzerdaten</li>
              <li><strong>Vercel Inc.</strong> — Hosting, Serverless-Funktionen</li>
              <li><strong>Cloudflare Inc.</strong> — R2 Object Storage (Cover-Artworks, sofern konfiguriert)</li>
              <li><strong>Spotify / Google</strong> — OAuth-Anbieter</li>
              <li><strong>song.link / Odesli</strong> — Streaming-Metadaten und Deeplinks</li>
            </ul>
            <p className="mt-3 text-xs italic">
              Kostenpflichtige Werbebuchungen (Spotlight) über Stripe sind geplant; bei Aktivierung werden entsprechende
              Zahlungsdaten durch Stripe verarbeitet.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">5. Cookies & lokale Speicherung</h2>
            <div className="overflow-x-auto text-sm">
              <table className="w-full border border-border text-left text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="p-2">Speicher</th>
                    <th className="p-2">Zweck</th>
                    <th className="p-2">Dauer</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="p-2">auth-token</td>
                    <td className="p-2">Session / JWT</td>
                    <td className="p-2">bis Logout / Ablauf</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-2">oauth-tokens-*</td>
                    <td className="p-2">OAuth-Session</td>
                    <td className="p-2">bis Logout</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="p-2">cookie-consent</td>
                    <td className="p-2">Einwilligungsnachweis</td>
                    <td className="p-2">12 Monate</td>
                  </tr>
                  <tr>
                    <td className="p-2">language</td>
                    <td className="p-2">Spracheinstellung</td>
                    <td className="p-2">persistent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">6. Ihre Rechte</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li>Auskunft (Art. 15 DSGVO)</li>
              <li>Berichtigung (Art. 16 DSGVO)</li>
              <li>Löschung (Art. 17 DSGVO) — per E-Mail oder über „Konto löschen“ im Profil</li>
              <li>Einschränkung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch (Art. 21 DSGVO)</li>
              <li>Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
            </ul>
            <p className="mt-3 text-sm">
              Anfragen an{' '}
              <a href={`mailto:${legal.privacyEmail}`} className="text-accent underline">{legal.privacyEmail}</a>
              {' '}— Bearbeitung innerhalb von 30 Tagen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">7. Speicherdauer</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li>Account-Daten: bis zur Löschung des Kontos</li>
              <li>Voting-Daten: für Chart-Integrität; bei Kontolöschung werden personenbezogene Verknüpfungen entfernt</li>
              <li>Server-Logs (Vercel): gemäß Anbieter-Richtlinien, typisch bis 30 Tage</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">8. Datensicherheit</h2>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li>Verschlüsselte Übertragung (TLS/HTTPS)</li>
              <li>Passwort-Hashing (bcrypt)</li>
              <li>Rate Limiting gegen Brute-Force-Angriffe</li>
            </ul>
          </section>
        </div>
      </Card>
    </div>
  );
}