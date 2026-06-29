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
            'Privacy requests: contact address in the imprint.',
          ],
        },
        {
          title: '2. Registration & Authentication',
          paragraphs: [
            '2.1 Email registration: we process email address, password hash, and selected role (Fan/DJ/Band/Label). Legal basis: Art. 6(1)(b) GDPR.',
            '2.2 Spotify OAuth: email, display name, Spotify user ID, optional profile image. Recipient: Spotify AB (third country USA; transfer based on Standard Contractual Clauses). Legal basis: Art. 6(1)(b) GDPR.',
            '2.3 Google OAuth: email, name, profile image, Google user ID. Legal basis: Art. 6(1)(b) GDPR.',
            '2.4 Email verification: we send transactional emails via Resend to confirm your address before voting.',
            '2.5 Optional Spotify listening history (trust boost): top artists/tracks for Sybil resistance only — not used for advertising. Legal basis: Art. 6(1)(f) GDPR (chart integrity).',
          ],
        },
        {
          title: '3. Voting Data',
          paragraphs: [
            'When you vote we store profile ID, release ID, timestamp, allocated votes, and quadratic credit cost.',
            'IP addresses are not stored permanently. They may be processed briefly in memory for rate limiting (approx. 2 minutes per instance). Legal basis: Art. 6(1)(f) GDPR (chart integrity).',
            'Automated anomaly detection may flag suspicious voting patterns. High-severity, unresolved anomalies can temporarily suspend voting on affected releases.',
          ],
        },
        {
          title: '4. Processors & Hosting',
          list: [
            'Supabase Inc. — database and user data',
            'Vercel Inc. — hosting and serverless functions',
            'Cloudflare Inc. — R2 artwork storage (if configured)',
            'Spotify / Google — OAuth providers',
            'Resend — transactional email (verification)',
            'song.link / Odesli — streaming metadata and deeplinks',
            'Stripe Inc. — payment processing for Spotlight bookings (card data processed by Stripe only)',
          ],
          paragraphs: [],
        },
        {
          title: '5. Cookies & Local Storage',
          list: [
            'auth-token — session / JWT — until logout or expiry',
            'oauth-tokens-* — OAuth session — until logout',
            'cookie-consent — consent record — 12 months',
            'language — language preference — persistent',
          ],
          paragraphs: [],
        },
        {
          title: '6. Your Rights',
          list: [
            'Access (Art. 15 GDPR)',
            'Rectification (Art. 16 GDPR)',
            'Erasure (Art. 17 GDPR) — via email or “Delete account” in profile',
            'Restriction (Art. 18 GDPR)',
            'Data portability (Art. 20 GDPR)',
            'Objection (Art. 21 GDPR)',
            'Complaint to a supervisory authority (Art. 77 GDPR)',
          ],
          paragraphs: ['We respond to requests within 30 days.'],
        },
        {
          title: '7. Retention',
          list: [
            'Account data: until account deletion',
            'Voting data: retained for chart integrity; personal links removed on account deletion',
            'Server logs (Vercel): per provider policy, typically up to 30 days',
            'Spotlight booking records: retained for accounting and dispute resolution as required by law',
          ],
          paragraphs: [],
        },
        {
          title: '8. Data Security',
          list: [
            'Encrypted transmission (TLS/HTTPS)',
            'Password hashing (bcrypt)',
            'Rate limiting against brute-force attacks',
          ],
          paragraphs: [],
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
          '2.1 E-Mail-Registrierung: E-Mail-Adresse, Passwort-Hash, gewählte Rolle (Fan/DJ/Band/Label). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
          '2.2 Spotify OAuth: E-Mail, Anzeigename, Spotify-Nutzer-ID, Profilbild (optional). Empfänger: Spotify AB (Drittland USA; Standardvertragsklauseln). Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
          '2.3 Google OAuth: E-Mail, Name, Profilbild, Google-Nutzer-ID. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.',
          '2.4 E-Mail-Verifizierung: Transaktions-E-Mails über Resend zur Bestätigung vor Abstimmungen.',
          '2.5 Optionale Spotify-Hörhistorie (Trust-Boost): Top-Künstler/Tracks nur zur Sybil-Resistenz — nicht für Werbung. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
        ],
      },
      {
        title: '3. Voting-Daten',
        paragraphs: [
          'Bei Abstimmungen speichern wir Profil-ID, Release-ID, Zeitstempel, Stimmen und Credit-Kosten (quadratisches Voting).',
          'IP-Adressen werden nicht dauerhaft gespeichert; kurzzeitig im Arbeitsspeicher für Rate Limiting (max. ca. 2 Minuten pro Instanz). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.',
          'Automatisierte Anomalie-Erkennung kann verdächtige Abstimmungsmuster markieren. Ungeklärte Anomalien mit hoher Schwere können Abstimmungen auf betroffene Releases vorübergehend aussetzen.',
        ],
      },
      {
        title: '4. Auftragsverarbeiter & Hosting',
        list: [
          'Supabase Inc. — Datenbank, Nutzerdaten',
          'Vercel Inc. — Hosting, Serverless-Funktionen',
          'Cloudflare Inc. — R2 Object Storage (Cover-Artworks, sofern konfiguriert)',
          'Spotify / Google — OAuth-Anbieter',
          'Resend — Transaktions-E-Mails',
          'song.link / Odesli — Streaming-Metadaten und Deeplinks',
          'Stripe Inc. — Zahlungsabwicklung für Spotlight-Buchungen (Kartendaten nur bei Stripe)',
        ],
        paragraphs: [],
      },
      {
        title: '5. Cookies & lokale Speicherung',
        list: [
          'auth-token — Session / JWT — bis Logout / Ablauf',
          'oauth-tokens-* — OAuth-Session — bis Logout',
          'cookie-consent — Einwilligungsnachweis — 12 Monate',
          'language — Spracheinstellung — persistent',
        ],
        paragraphs: [],
      },
      {
        title: '6. Ihre Rechte',
        list: [
          'Auskunft (Art. 15 DSGVO)',
          'Berichtigung (Art. 16 DSGVO)',
          'Löschung (Art. 17 DSGVO) — per E-Mail oder „Konto löschen“ im Profil',
          'Einschränkung (Art. 18 DSGVO)',
          'Datenübertragbarkeit (Art. 20 DSGVO)',
          'Widerspruch (Art. 21 DSGVO)',
          'Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)',
        ],
        paragraphs: ['Bearbeitung innerhalb von 30 Tagen.'],
      },
      {
        title: '7. Speicherdauer',
        list: [
          'Account-Daten: bis zur Löschung des Kontos',
          'Voting-Daten: für Chart-Integrität; bei Kontolöschung werden personenbezogene Verknüpfungen entfernt',
          'Server-Logs (Vercel): gemäß Anbieter-Richtlinien, typisch bis 30 Tage',
          'Spotlight-Buchungen: Aufbewahrung für Buchhaltung und Streitfälle nach gesetzlichen Vorgaben',
        ],
        paragraphs: [],
      },
      {
        title: '8. Datensicherheit',
        list: [
          'Verschlüsselte Übertragung (TLS/HTTPS)',
          'Passwort-Hashing (bcrypt)',
          'Rate Limiting gegen Brute-Force-Angriffe',
        ],
        paragraphs: [],
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
            'These Terms govern use of the Dark Charts platform and related services. By registering you accept these Terms.',
          ],
        },
        {
          title: '2. Registration and Account',
          paragraphs: [
            'Voting requires a registered account (email/password or OAuth). You agree to provide accurate information, maintain one account per person, keep credentials confidential, and notify us of unauthorized access.',
            'We may suspend or delete accounts that violate these Terms.',
          ],
        },
        {
          title: '3. Permitted Use and Prohibited Activities',
          paragraphs: [
            'You may browse charts, vote with weekly credits, maintain your public profile, and create playlists or custom charts.',
          ],
          list: [
            'Manipulation: bots, scripts, or automated voting tools',
            'Multi-accounting to bypass voting limits',
            'Spam or fake profiles',
            'Harassment or discrimination',
            'Copyright infringement',
          ],
        },
        {
          title: '4. Voting System and Credits',
          paragraphs: [
            'Fans receive weekly voting credits and may distribute them freely (minimum 1 per track). Fan votes affect Fan Charts; expert DJ votes affect Expert Charts with separate weighting.',
            'Fan votes are submitted once per week and cannot be changed afterward. Experts may resubmit their weekly Top 10 via bulk submit.',
            'Automated anomaly detection is active. Unresolved high-severity anomalies may temporarily suspend voting on affected releases until review.',
          ],
        },
        {
          title: '5. Spotlight Advertising and Payments',
          paragraphs: [
            'Bands and Labels may book paid Spotlight placements via self-service checkout (Stripe). Spotlight slots are clearly labeled advertisements and do not affect chart rankings.',
            'Prices are shown on the booking page. The slot runs on the booked calendar day after successful payment. Spotlight does not guarantee chart placement.',
            'Cancellations: full refund before campaign start; pro-rata refund for remaining days during an active campaign; no refund after the campaign ends. Refund requests by email, processed within 7 business days.',
            'Consumers may have a 14-day withdrawal right for distance contracts where applicable. EU model withdrawal form: https://ec.europa.eu/consumers/odr',
          ],
        },
        {
          title: '6. Verification (DJs, Bands, Labels)',
          paragraphs: [
            'Users may apply for verification by submitting social proof links (e.g. Mixcloud, SoundCloud, Spotify Artist, Bandcamp, label shop, Discogs).',
            'Verification is reviewed manually. There is no legal entitlement to verification.',
          ],
        },
        {
          title: '7. Reporting and Moderation',
          paragraphs: [
            'Users may report violations. Moderators may issue warnings, suspend voting rights, ban accounts, or delete accounts for serious violations.',
          ],
        },
        {
          title: '8. Intellectual Property',
          paragraphs: [
            'Platform design, code, and texts are protected by copyright. Music metadata and artwork are sourced via licensed APIs (e.g. Spotify).',
            'Users uploading content grant a non-exclusive right to display it on the platform and warrant they hold necessary rights.',
          ],
        },
        {
          title: '9. Disclaimer',
          paragraphs: [
            'The platform is provided “as is”. We do not warrant completeness of chart data, uninterrupted availability, or error-free operation.',
            'Liability for slight negligence is excluded where permitted by law; liability for intent and gross negligence remains unaffected.',
          ],
        },
        {
          title: '10. Changes to these Terms',
          paragraphs: [
            'We may amend these Terms at any time. Material changes will be communicated by email. Continued use after changes constitutes acceptance.',
          ],
        },
        {
          title: '11. Final Provisions',
          paragraphs: [
            'German law applies excluding the UN Convention on Contracts for the International Sale of Goods. Mandatory consumer protection rules of the user’s EU residence state remain applicable.',
            'Place of jurisdiction at the operator’s seat applies only for merchants and public-law entities (see imprint).',
          ],
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
          'Diese AGB gelten für die Nutzung von Dark Charts und verbundener Services. Mit der Registrierung akzeptieren Sie diese Bedingungen.',
        ],
      },
      {
        title: '2. Registrierung und Account',
        paragraphs: [
          'Voting erfordert ein registriertes Konto (E-Mail/Passwort oder OAuth). Sie verpflichten sich zu wahrheitsgemäßen Angaben, einem Account pro Person, vertraulicher Behandlung der Zugangsdaten und unverzüglicher Meldung unbefugter Zugriffe.',
          'Wir können Accounts bei Verstößen sperren oder löschen.',
        ],
      },
      {
        title: '3. Nutzungsrechte und Pflichten',
        paragraphs: ['Sie dürfen Charts ansehen, mit wöchentlichen Credits abstimmen, Ihr Profil pflegen und Playlists/Custom Charts erstellen.'],
        list: [
          'Manipulation: Bots, Skripte oder automatisiertes Voting',
          'Multi-Accounting zur Umgehung von Voting-Limits',
          'Spam oder Fake-Profile',
          'Belästigung oder Diskriminierung',
          'Urheberrechtsverletzungen',
        ],
      },
      {
        title: '4. Voting-System und Credits',
        paragraphs: [
          'Fans erhalten wöchentlich Voting-Credits und können diese frei verteilen (min. 1 pro Track). Fan-Votes beeinflussen Fan Charts; Expert-DJ-Votes fließen mit eigenem Gewicht in Expert Charts.',
          'Fan-Abstimmungen sind pro Woche einmalig und nach Einreichung nicht änderbar. Experten können ihre wöchentliche Top-10 per Bulk-Submit erneut einreichen.',
          'Automatisierte Anomalie-Erkennung ist aktiv. Ungeklärte Anomalien mit hoher Schwere können Abstimmungen auf betroffene Releases vorübergehend aussetzen.',
        ],
      },
      {
        title: '5. Werbeplätze und Zahlungen (Spotlight)',
        paragraphs: [
          'Bands und Labels können kostenpflichtige Spotlight-Placements per Selbstbuchung (Stripe) buchen. Spotlight-Slots sind als Werbung gekennzeichnet und beeinflussen Chart-Rankings nicht.',
          'Preise werden auf der Buchungsseite angezeigt. Die Laufzeit beginnt am gebuchten Kalendertag nach erfolgreicher Zahlung. Spotlight garantiert keine Chart-Platzierung.',
          'Stornierung: volle Rückerstattung vor Kampagnenstart; anteilige Rückerstattung für verbleibende Tage während laufender Kampagne; keine Rückerstattung nach Kampagnenende. Anfragen per E-Mail, Bearbeitung innerhalb von 7 Werktagen.',
          'Verbrauchern steht bei Fernabsatzverträgen ein 14-tägiges Widerrufsrecht zu, sofern gesetzlich anwendbar. Muster-Widerrufsformular: https://ec.europa.eu/consumers/odr',
        ],
      },
      {
        title: '6. Verifizierung (DJs, Bands, Labels)',
        paragraphs: [
          'Nutzer können Verifizierung beantragen durch Social-Proof-Links (z. B. Mixcloud, SoundCloud, Spotify Artist, Bandcamp, Label-Shop, Discogs).',
          'Die Verifizierung wird manuell geprüft. Es besteht kein Rechtsanspruch.',
        ],
      },
      {
        title: '7. Meldesystem und Moderation',
        paragraphs: [
          'Nutzer können Verstöße melden. Moderatoren können verwarnen, Voting-Rechte einschränken, Accounts sperren oder bei schweren Verstößen löschen.',
        ],
      },
      {
        title: '8. Geistiges Eigentum',
        paragraphs: [
          'Design, Code und Texte der Plattform sind urheberrechtlich geschützt. Musikmetadaten und Artworks stammen über lizenzierte APIs (z. B. Spotify).',
          'Nutzer, die Inhalte hochladen, gewähren ein nicht-exklusives Nutzungsrecht zur Darstellung und garantieren die erforderlichen Rechte.',
        ],
      },
      {
        title: '9. Haftungsausschluss',
        paragraphs: [
          'Die Plattform wird „wie besehen“ bereitgestellt. Keine Gewähr für Vollständigkeit der Chart-Daten, ununterbrochene Verfügbarkeit oder Fehlerfreiheit.',
          'Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit gesetzlich zulässig; Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.',
        ],
      },
      {
        title: '10. Änderungen der AGB',
        paragraphs: [
          'Wir können diese AGB jederzeit ändern. Wesentliche Änderungen werden per E-Mail mitgeteilt. Fortgesetzte Nutzung gilt als Zustimmung.',
        ],
      },
      {
        title: '11. Schlussbestimmungen',
        paragraphs: [
          'Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Zwingende Verbraucherschutzvorschriften des Wohnsitzstaates in der EU bleiben anwendbar.',
          'Gerichtsstand am Sitz des Betreibers gilt nur für Kaufleute und juristische Personen des öffentlichen Rechts (siehe Impressum).',
        ],
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
          title: 'VAT identification number',
          paragraphs: ['If applicable, see NEXT_PUBLIC_LEGAL_VAT_ID in configuration.'],
        },
        {
          title: 'Dispute resolution',
          paragraphs: [
            'We are not obliged to participate in consumer arbitration proceedings before a consumer arbitration board.',
            'The European Commission provides an online dispute resolution platform at https://ec.europa.eu/consumers/odr',
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
        title: 'Umsatzsteuer-ID',
        paragraphs: ['Sofern vorhanden: NEXT_PUBLIC_LEGAL_VAT_ID in der Konfiguration.'],
      },
      {
        title: 'Streitbeilegung',
        paragraphs: [
          'Wir sind nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.',
          'Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: https://ec.europa.eu/consumers/odr',
        ],
      },
    ],
  };
}