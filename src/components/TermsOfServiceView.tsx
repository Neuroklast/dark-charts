import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export function TermsOfServiceView() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="bg-card border border-border p-8">
        <h1 className="font-display text-3xl uppercase text-foreground mb-8 tracking-tight">
          Allgemeine Geschäftsbedingungen / Terms of Service
        </h1>

        <div className="space-y-8 font-ui text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform "Dark Charts" 
              und aller damit verbundenen Services. Mit der Registrierung und Nutzung akzeptieren Sie diese Bedingungen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">2. Registrierung und Account</h2>
            <p className="mb-4">
              Die Nutzung der Voting-Funktionen erfordert eine Registrierung über OAuth (Spotify). 
              Bei der Registrierung verpflichten Sie sich:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Wahrheitsgemäße Angaben zu machen</li>
              <li>Nur einen Account pro Person zu erstellen</li>
              <li>Die Zugangsdaten vertraulich zu behandeln</li>
              <li>Uns unverzüglich über unbefugte Zugriffe zu informieren</li>
            </ul>
            <p className="mt-4">
              Wir behalten uns das Recht vor, Accounts bei Verstoß gegen diese Bedingungen zu sperren oder zu löschen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">3. Nutzungsrechte und Pflichten</h2>
            <h3 className="font-display text-lg uppercase text-accent mb-3 mt-6">3.1 Erlaubte Nutzung</h3>
            <p className="mb-4">
              Sie dürfen die Plattform nutzen, um:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Charts anzusehen und Musik zu entdecken</li>
              <li>Mit Ihren Voting-Credits für Tracks zu stimmen</li>
              <li>Ihr öffentliches Profil zu pflegen (Fans, DJs, Bands, Labels)</li>
              <li>Playlists und Custom Charts zu erstellen</li>
            </ul>

            <h3 className="font-display text-lg uppercase text-accent mb-3 mt-6">3.2 Verbotene Aktivitäten</h3>
            <p className="mb-4">
              Folgende Aktivitäten sind ausdrücklich untersagt:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Manipulation:</strong> Einsatz von Bots, Skripten oder automatisierten Tools zum Voting</li>
              <li><strong>Multi-Accounting:</strong> Erstellen mehrerer Accounts zur Umgehung von Voting-Limits</li>
              <li><strong>Spam:</strong> Massenhafte Erstellung von Fake-Profilen oder irrelevanten Inhalten</li>
              <li><strong>Harassment:</strong> Belästigung, Bedrohung oder Diskriminierung anderer Nutzer</li>
              <li><strong>Copyright-Verstöße:</strong> Hochladen von Inhalten, für die Sie keine Rechte besitzen</li>
            </ul>
            <p className="mt-4 text-accent">
              Bei Verdacht auf Manipulation behalten wir uns vor, Accounts ohne Vorwarnung auf <strong>RESTRICTED</strong> zu setzen 
              oder vollständig zu löschen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">4. Voting-System und Credits</h2>
            <p className="mb-4">
              Das Voting-System funktioniert folgendermaßen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Jeder Fan erhält wöchentlich eine festgelegte Anzahl an Voting-Credits</li>
              <li>Credits können frei auf Tracks verteilt werden (min. 1, max. alle auf einen Track)</li>
              <li>Votes beeinflussen die Fan Charts</li>
              <li>DJ-Votes haben erhöhtes Gewicht in den Expert Charts</li>
              <li>Votes sind endgültig und können nicht rückgängig gemacht werden</li>
            </ul>
            <p className="mt-4">
              Wir überwachen das Voting-Verhalten algorithmisch. Auffällige Muster (z.B. koordiniertes Voting) 
              können zur Sperrung führen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">5. Werbeplätze und Zahlungen (Spotlight)</h2>
            <h3 className="font-display text-lg uppercase text-accent mb-3">5.1 Buchung</h3>
            <p className="mb-4">
              Bands und Labels können kostenpflichtige Werbeplätze ("Spotlight") buchen. Die Buchung erfolgt über Stripe.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Preise werden transparent auf der Buchungsseite angezeigt</li>
              <li>Die Laufzeit beginnt nach Zahlungseingang</li>
              <li>Spotlight-Placements garantieren keine Chart-Platzierung</li>
            </ul>

            <h3 className="font-display text-lg uppercase text-accent mb-3 mt-6">5.2 Stornierung und Rückerstattung</h3>
            <p className="mb-4">
              Gebuchte Werbeplätze können unter folgenden Bedingungen storniert werden:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Vor Start der Kampagne:</strong> Volle Rückerstattung möglich</li>
              <li><strong>Während laufender Kampagne:</strong> Anteilige Rückerstattung für verbleibende Tage</li>
              <li><strong>Nach Ablauf der Kampagne:</strong> Keine Rückerstattung</li>
            </ul>
            <p className="mt-4">
              Rückerstattungsanfragen müssen per E-Mail gestellt werden und werden innerhalb von 7 Werktagen bearbeitet.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">6. Verifizierung (DJs, Bands, Labels)</h2>
            <p className="mb-4">
              Nutzer können eine Verifizierung beantragen, um ihre Identität zu bestätigen. Dazu müssen Social Proof Links eingereicht werden:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>DJs:</strong> Mixcloud, SoundCloud, Resident Advisor Profil</li>
              <li><strong>Bands:</strong> Spotify Artist Profil, Bandcamp, Official Website</li>
              <li><strong>Labels:</strong> Offizieller Labelshop, Discogs Profil</li>
            </ul>
            <p className="mt-4">
              Die Verifizierung wird manuell durch Moderatoren geprüft. Es besteht kein Rechtsanspruch auf Verifizierung.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">7. Meldesystem und Moderation</h2>
            <p className="mb-4">
              Nutzer können Verstöße gegen diese AGB melden. Wir unterscheiden zwischen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Spam / Fake Profiles:</strong> Verdacht auf Bot-Accounts</li>
              <li><strong>Harassment:</strong> Belästigung oder toxisches Verhalten</li>
              <li><strong>Inappropriate Content:</strong> Verstöße gegen Community-Standards</li>
            </ul>
            <p className="mt-4">
              Moderatoren können folgende Maßnahmen ergreifen:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><strong>Warnung:</strong> Hinweis auf Verstoß</li>
              <li><strong>RESTRICTED:</strong> Einschränkung von Voting-Rechten (Soft Ban)</li>
              <li><strong>BANNED:</strong> Vollständige Sperrung des Accounts</li>
              <li><strong>Deletion:</strong> Permanente Löschung bei schwerwiegenden Verstößen</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">8. Geistiges Eigentum</h2>
            <p className="mb-4">
              Alle Inhalte auf dieser Plattform (Design, Code, Texte, Grafiken) sind urheberrechtlich geschützt. 
              Die Musikmetadaten und Artworks werden über Spotify und andere lizenzierte APIs bezogen.
            </p>
            <p className="mt-4">
              Nutzer, die Inhalte hochladen (Profilbilder, Biografien), garantieren, dass sie die notwendigen Rechte besitzen 
              und räumen uns ein nicht-exklusives Nutzungsrecht zur Darstellung auf der Plattform ein.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">9. Haftungsausschluss</h2>
            <p className="mb-4">
              Wir stellen die Plattform "as is" zur Verfügung. Wir übernehmen keine Gewähr für:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Vollständigkeit und Richtigkeit der Chart-Daten</li>
              <li>Ununterbrochene Verfügbarkeit der Services</li>
              <li>Fehlerfreiheit der Plattform</li>
            </ul>
            <p className="mt-4">
              Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig. 
              Die Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">10. Änderungen der AGB</h2>
            <p>
              Wir behalten uns vor, diese AGB jederzeit zu ändern. Nutzer werden bei wesentlichen Änderungen 
              per E-Mail informiert. Die Fortsetzung der Nutzung nach Änderung gilt als Zustimmung.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">11. Schlussbestimmungen</h2>
            <p className="mb-4">
              Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist der Sitz des Betreibers (siehe Impressum).
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
