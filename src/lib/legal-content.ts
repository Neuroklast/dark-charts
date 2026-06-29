import type { Language } from '@/contexts/LanguageContext';

export interface LegalSection {
  title: string;
  paragraphs: string[];
  list?: string[];
}

export interface LegalPageContent {
  title: string;
  updated: string;
  configWarning: string;
  sections: LegalSection[];
}

export function getPrivacyContent(lang: Language): LegalPageContent {
  if (lang === 'en') {
    return {
      title: 'Privacy Policy',
      updated: 'Last updated: June 2026',
      configWarning:
        'Operator notice: Complete provider details must be configured via NEXT_PUBLIC_LEGAL_* environment variables before public launch.',
      sections: [
        {
          title: '1. Data Controller',
          paragraphs: [
            'The controller within the meaning of the GDPR is the operator listed in our imprint.',
            'Privacy requests: see the contact address in the imprint.',
          ],
        },
        {
          title: '2. Registration & Authentication',
          paragraphs: [
            'Email registration: we process email address, password hash, and selected role (Fan/DJ/Band/Label). Legal basis: Art. 6(1)(b) GDPR.',
            'Spotify/Google OAuth: we receive email, display name, provider user ID, and optional profile image. Legal basis: Art. 6(1)(b) GDPR.',
            'Optional Spotify listening history (trust boost): top artists/tracks for Sybil resistance only — not used for advertising.',
          ],
        },
        {
          title: '3. Voting Data',
          paragraphs: [
            'When you vote we store profile ID, release ID, timestamp, allocated votes, and quadratic credit cost.',
            'IP addresses are not stored permanently. They may be processed briefly in memory for rate limiting (approx. 2 minutes per instance). Legal basis: Art. 6(1)(f) GDPR (chart integrity).',
          ],
        },
        {
          title: '4. Processors & Hosting',
          list: [
            'Supabase Inc. — database',
            'Vercel Inc. — hosting',
            'Cloudflare Inc. — R2 artwork storage (if configured)',
            'Spotify / Google — OAuth providers',
            'Resend — transactional email (verification)',
          ],
          paragraphs: [],
        },
        {
          title: '5. Your Rights',
          list: [
            'Access, rectification, erasure, restriction, portability, objection (GDPR Arts. 15–21)',
            'Complaint to a supervisory authority (Art. 77 GDPR)',
            'Account deletion and data export via profile settings',
          ],
          paragraphs: ['We respond to requests within 30 days.'],
        },
      ],
    };
  }

  return {
    title: 'Datenschutzerklärung',
    updated: 'Stand: Juni 2026',
    configWarning:
      'Hinweis für Betreiber: Vollständige Anbieterdaten müssen über NEXT_PUBLIC_LEGAL_* Umgebungsvariablen konfiguriert werden, bevor die Plattform öffentlich geht.',
    sections: [
      {
        title: '1. Verantwortliche Stelle',
        paragraphs: [
          'Verantwortlicher im Sinne der DSGVO ist der im Impressum genannte Betreiber.',
          'Datenschutz-Anfragen: Kontaktadresse im Impressum.',
        ],
      },
      {
        title: '2. Registrierung & Authentifizierung',
        paragraphs: [
          'E-Mail-Registrierung: E-Mail-Adresse, Passwort-Hash, gewählte Rolle. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
          'Spotify/Google OAuth: E-Mail, Anzeigename, Provider-ID, optional Profilbild. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
          'Optionale Spotify-Hörhistorie (Trust-Boost): Top-Künstler/Tracks nur zur Sybil-Resistenz — nicht für Werbung.',
        ],
      },
      {
        title: '3. Voting-Daten',
        paragraphs: [
          'Bei Abstimmungen speichern wir Profil-ID, Release-ID, Zeitstempel, Stimmen und Credit-Kosten.',
          'IP-Adressen werden nicht dauerhaft gespeichert; kurzzeitig im Arbeitsspeicher für Rate Limiting. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
        ],
      },
      {
        title: '4. Auftragsverarbeiter',
        list: [
          'Supabase Inc. — Datenbank',
          'Vercel Inc. — Hosting',
          'Cloudflare Inc. — R2 Speicher (optional)',
          'Spotify / Google — OAuth',
          'Resend — Transaktions-E-Mails',
        ],
        paragraphs: [],
      },
      {
        title: '5. Ihre Rechte',
        list: [
          'Auskunft, Berichtigung, Löschung, Einschränkung, Übertragbarkeit, Widerspruch (DSGVO)',
          'Beschwerde bei einer Aufsichtsbehörde',
          'Konto löschen und Datenexport im Profil',
        ],
        paragraphs: ['Bearbeitung innerhalb von 30 Tagen.'],
      },
    ],
  };
}

export function getTermsContent(lang: Language): LegalPageContent {
  if (lang === 'en') {
    return {
      title: 'Terms of Service',
      updated: 'Last updated: June 2026',
      configWarning: '',
      sections: [
        {
          title: '1. Scope',
          paragraphs: [
            'These Terms govern use of the Dark Charts platform. By registering you accept these Terms.',
          ],
        },
        {
          title: '2. Accounts & Voting',
          paragraphs: [
            'Voting requires a verified account (email confirmation or OAuth).',
            'One vote submission per week for fans; expert DJs must hold verified expert status.',
            'Manipulating rankings via multiple accounts or automated tools is prohibited.',
          ],
        },
        {
          title: '3. Charts & Methodology',
          paragraphs: [
            'Rankings are calculated from fan, expert, and streaming signals as documented on /methodology.',
            'Paid Spotlight placements are clearly labeled advertisements and do not affect chart rankings.',
          ],
        },
        {
          title: '4. Spotlight Advertising',
          list: [
            'Spotlight slots are paid promotional placements',
            'No guarantee of chart placement',
            'Must be labeled as advertising (Anzeige)',
          ],
          paragraphs: ['Self-service booking may be introduced later with separate payment terms.'],
        },
      ],
    };
  }

  return {
    title: 'Allgemeine Geschäftsbedingungen',
    updated: 'Stand: Juni 2026',
    configWarning: '',
    sections: [
      {
        title: '1. Geltungsbereich',
        paragraphs: [
          'Diese AGB gelten für die Nutzung von Dark Charts. Mit der Registrierung akzeptieren Sie diese Bedingungen.',
        ],
      },
      {
        title: '2. Accounts & Voting',
        paragraphs: [
          'Abstimmungen erfordern ein verifiziertes Konto (E-Mail-Bestätigung oder OAuth).',
          'Ein Fan-Vote pro Woche; Expert-DJs benötigen verifizierten Expert-Status.',
          'Manipulation durch Mehrfachaccounts oder Automatisierung ist untersagt.',
        ],
      },
      {
        title: '3. Charts & Methodik',
        paragraphs: [
          'Rankings basieren auf Fan-, Expert- und Streaming-Signalen (siehe /methodology).',
          'Bezahlte Spotlight-Placements sind als Werbung gekennzeichnet und beeinflussen Charts nicht.',
        ],
      },
      {
        title: '4. Spotlight-Werbung',
        list: [
          'Spotlight-Slots sind kostenpflichtige Werbeplätze',
          'Keine Garantie für Chart-Platzierung',
          'Als Anzeige gekennzeichnet',
        ],
        paragraphs: ['Selbstbuchung kann später mit separaten Zahlungsbedingungen eingeführt werden.'],
      },
    ],
  };
}

export function getImprintContent(lang: Language): LegalPageContent {
  if (lang === 'en') {
    return {
      title: 'Imprint / Legal Notice',
      updated: '',
      configWarning:
        'This imprint is incomplete. Set NEXT_PUBLIC_LEGAL_* variables before public launch.',
      sections: [
        {
          title: 'Information according to § 5 DDG (Germany)',
          paragraphs: [
            'Operator, address, and contact details are loaded from environment configuration.',
          ],
        },
        {
          title: 'Responsible for content',
          paragraphs: ['See operator name in configured legal data.'],
        },
        {
          title: 'Dispute resolution',
          paragraphs: [
            'We are not obliged to participate in consumer arbitration proceedings.',
          ],
        },
      ],
    };
  }

  return {
    title: 'Impressum',
    updated: '',
    configWarning:
      'Dieses Impressum ist unvollständig. NEXT_PUBLIC_LEGAL_* Variablen vor Launch setzen (§ 5 DDG).',
    sections: [
      {
        title: 'Angaben gemäß § 5 DDG',
        paragraphs: ['Betreiber, Adresse und Kontakt werden aus der Umgebungskonfiguration geladen.'],
      },
      {
        title: 'Verantwortlich für den Inhalt',
        paragraphs: ['Siehe konfigurierten Betreibernamen.'],
      },
      {
        title: 'Streitbeilegung',
        paragraphs: [
          'Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
        ],
      },
    ],
  };
}