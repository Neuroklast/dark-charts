'use client';

import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Envelope, MapPin, IdentificationCard, Warning } from '@phosphor-icons/react';
import { getLegalConfig } from '@/lib/legal-config';

export function ImprintView() {
  const legal = getLegalConfig();

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 py-8 px-4">
      {!legal.isConfigured && (
        <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 p-4 rounded text-sm text-amber-200">
          <Warning size={20} weight="fill" className="shrink-0" />
          <p className="font-ui text-xs leading-relaxed">
            Dieses Impressum ist unvollständig. Vor dem öffentlichen Launch müssen NEXT_PUBLIC_LEGAL_OPERATOR_NAME,
            NEXT_PUBLIC_LEGAL_STREET, NEXT_PUBLIC_LEGAL_CITY und NEXT_PUBLIC_LEGAL_EMAIL in der Umgebung gesetzt werden
            (§ 5 DDG).
          </p>
        </div>
      )}

      <Card className="bg-card border border-border p-8">
        <h1 className="font-display text-3xl uppercase text-foreground mb-8 tracking-tight">
          Impressum / Legal Notice
        </h1>

        <div className="space-y-8 font-ui text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4 flex items-center gap-3">
              <IdentificationCard size={24} weight="bold" className="text-accent" />
              Angaben gemäß § 5 DDG
            </h2>
            <div className="space-y-2">
              <p className="font-data text-foreground">
                <strong>Betreiber:</strong> {legal.name}
              </p>
              <p className="font-data">
                <strong>Rechtsform:</strong> {legal.legalForm}
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
              <p>{legal.street}</p>
              <p>{legal.zip} {legal.city}</p>
              <p>{legal.country}</p>
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
                <a href={`mailto:${legal.email}`} className="text-accent hover:text-primary transition-colors">
                  {legal.email}
                </a>
              </p>
              {legal.phone && (
                <p>
                  <strong>Telefon:</strong> {legal.phone}
                </p>
              )}
            </div>
          </section>

          {legal.vatId && (
            <>
              <Separator />
              <section>
                <h2 className="font-display text-xl uppercase text-foreground mb-4">Umsatzsteuer-ID</h2>
                <p className="font-data">
                  Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: <strong>{legal.vatId}</strong>
                </p>
              </section>
            </>
          )}

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Verantwortlich für den Inhalt</h2>
            <p className="font-data">
              Verantwortlich nach § 18 Abs. 2 MStV:<br />
              <strong>{legal.representative || legal.name}</strong><br />
              {legal.street}, {legal.zip} {legal.city}
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
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Verbraucher­streit­beilegung</h2>
            <p>
              Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              teilzunehmen.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="font-display text-xl uppercase text-foreground mb-4">Musikmetadaten und APIs</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Spotify Web API:</strong> Musikmetadaten, Artworks</li>
              <li><strong>Apple iTunes Search API:</strong> Cover-Artworks</li>
              <li><strong>Odesli / song.link:</strong> Multi-Platform Streaming Links</li>
              <li><strong>Supabase, Vercel, Cloudflare R2:</strong> Infrastruktur</li>
            </ul>
          </section>
        </div>
      </Card>
    </div>
  );
}