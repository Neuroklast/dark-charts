import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Envelope, MapPin, IdentificationCard } from '@phosphor-icons/react';

export function ImprintView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border border-border p-8">
        <h1 className="font-display text-3xl uppercase text-foreground mb-8 tracking-tight">
          Impressum / Legal Notice
        </h1>

        <div className="space-y-8 font-ui text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4 flex items-center gap-3">
              <IdentificationCard size={24} weight="bold" className="text-accent" />
              Angaben gemäß § 5 TMG
            </h2>
            <div className="space-y-2">
              <p className="font-data text-foreground">
                <strong>Betreiber:</strong> [Ihr Name / Firma]
              </p>
              <p className="font-data">
                <strong>Rechtsform:</strong> [z.B. Einzelunternehmen, GmbH]
              </p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4 flex items-center gap-3">
              <MapPin size={24} weight="bold" className="text-accent" />
              Anschrift
            </h2>
            <address className="not-italic font-data space-y-1">
              <p>[Straße und Hausnummer]</p>
              <p>[PLZ] [Ort]</p>
              <p>[Land]</p>
            </address>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4 flex items-center gap-3">
              <Envelope size={24} weight="bold" className="text-accent" />
              Kontakt
            </h2>
            <div className="font-data space-y-2">
              <p>
                <strong>E-Mail:</strong>{' '}
                <a href="mailto:info@darkcharts.example" className="text-accent hover:text-primary transition-colors">
                  info@darkcharts.example
                </a>
              </p>
              <p>
                <strong>Telefon:</strong> [Optional: Telefonnummer]
              </p>
            </div>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Umsatzsteuer-ID</h2>
            <p className="font-data">
              Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
              <strong>DE [Ihre USt-IdNr.]</strong>
            </p>
            <p className="mt-4 text-xs">
              (Falls zutreffend – nur erforderlich, wenn Sie unternehmerisch tätig sind)
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Verantwortlich für den Inhalt</h2>
            <p className="font-data">
              Verantwortlich nach § 55 Abs. 2 RStV:<br />
              <strong>[Ihr Name]</strong><br />
              [Adresse wie oben]
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">EU-Streitschlichtung</h2>
            <p className="mb-4">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            </p>
            <p>
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-primary transition-colors font-data"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mt-4">
              Unsere E-Mail-Adresse finden Sie oben im Impressum.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Verbraucher­streit­beilegung</h2>
            <p>
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Haftung für Inhalte</h2>
            <p className="mb-4">
              Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p>
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
              der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Haftung für Links</h2>
            <p className="mb-4">
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
              Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
              verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
            </p>
            <p>
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
              Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche
              Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht
              zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Urheberrecht</h2>
            <p className="mb-4">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
              Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der
              Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
            </p>
            <p>
              Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte
              Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem
              auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis.
              Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Musikmetadaten und APIs</h2>
            <p className="mb-4">
              Diese Plattform nutzt folgende Drittanbieter-APIs zur Bereitstellung von Musikmetadaten und Streaming-Links:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Spotify Web API:</strong> Musikmetadaten, Artworks, Previews</li>
              <li><strong>Odesli / song.link:</strong> Multi-Platform Streaming Links</li>
            </ul>
            <p className="mt-4">
              Alle Markenrechte und Logos der genannten Dienste liegen bei den jeweiligen Rechteinhabern.
              Wir verwenden diese ausschließlich zur Darstellung von Musikinformationen im Rahmen der API-Nutzungsbedingungen.
            </p>
          </section>

          <div className="pt-8 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Quelle: <a href="https://www.e-recht24.de" className="text-accent hover:text-primary transition-colors">e-recht24.de</a> (adaptiert)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
