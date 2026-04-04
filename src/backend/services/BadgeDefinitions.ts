import { Badge } from '../models/Badge';

export const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Stimmabgabe in der ersten Stunde nach dem wöchentlichen Chart-Reset',
    category: 'fan',
    criteria: {
      type: 'voting_time',
      parameters: { timeWindow: 3600000 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'dauergast',
    name: 'Dauergast',
    description: 'Vier Wochen in Folge aktiv am Voting teilgenommen',
    category: 'fan',
    criteria: {
      type: 'consecutive_weeks',
      parameters: { weeks: 4 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'genre_scout',
    name: 'Genre-Scout',
    description: 'Stimmen für Artists aus mindestens fünf verschiedenen Genres abgegeben',
    category: 'fan',
    criteria: {
      type: 'genre_diversity',
      parameters: { minGenres: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'trueffelschwein',
    name: 'Trüffelschwein',
    description: 'Für eine Band gestimmt, bevor diese zum ersten Mal die Top 10 erreichte',
    category: 'fan',
    criteria: {
      type: 'early_supporter',
      parameters: { topPosition: 10 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'thronwaechter',
    name: 'Thronwächter',
    description: 'Für die aktuelle Nummer 1 der Charts gestimmt',
    category: 'fan',
    criteria: {
      type: 'top_position_vote',
      parameters: { position: 1 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'underdog_support',
    name: 'Underdog-Support',
    description: 'Für einen Artist im unteren Viertel der Platzierungen gestimmt',
    category: 'fan',
    criteria: {
      type: 'underdog_support',
      parameters: { minPosition: 40 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'nachteule',
    name: 'Nachteule',
    description: 'Voting-Aktivität zwischen 02:00 und 05:00 Uhr nachts',
    category: 'fan',
    criteria: {
      type: 'voting_time',
      parameters: { startHour: 2, endHour: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'trend_analyst',
    name: 'Trend-Analyst',
    description: 'In drei aufeinanderfolgenden Wochen für einen Aufsteiger gestimmt',
    category: 'fan',
    criteria: {
      type: 'trend_analyst',
      parameters: { consecutiveWeeks: 3 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'pionier',
    name: 'Pionier',
    description: 'Registrierung des Accounts während der ersten Plattform-Phase',
    category: 'fan',
    criteria: {
      type: 'pioneer',
      parameters: { cutoffDate: '2024-12-31' }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'stimmgewalt_bronze',
    name: 'Stimmgewalt Bronze',
    description: 'Insgesamt 10 gültige Stimmen im System hinterlegt',
    category: 'fan',
    criteria: {
      type: 'vote_count',
      parameters: { count: 10 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'stimmgewalt_silber',
    name: 'Stimmgewalt Silber',
    description: 'Insgesamt 50 gültige Stimmen im System hinterlegt',
    category: 'fan',
    criteria: {
      type: 'vote_count',
      parameters: { count: 50 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'stimmgewalt_gold',
    name: 'Stimmgewalt Gold',
    description: 'Insgesamt 100 gültige Stimmen im System hinterlegt',
    category: 'fan',
    criteria: {
      type: 'vote_count',
      parameters: { count: 100 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'kurator',
    name: 'Kurator',
    description: 'Eine eigene öffentliche Top 10 Liste im Profil zusammengestellt',
    category: 'fan',
    criteria: {
      type: 'curator',
      parameters: { listSize: 10 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'erste_sahne',
    name: 'Erste Sahne',
    description: 'Die allererste Stimme nach der Account-Erstellung abgegeben',
    category: 'fan',
    criteria: {
      type: 'first_vote',
      parameters: {}
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'sonntagsritual',
    name: 'Sonntagsritual',
    description: 'An jedem Sonntag eines Kalendermonats abgestimmt',
    category: 'fan',
    criteria: {
      type: 'sunday_ritual',
      parameters: { month: 'current' }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'allrounder',
    name: 'Allrounder',
    description: 'In einer Woche für einen Artist, einen DJ und ein Label-Profil gestimmt',
    category: 'fan',
    criteria: {
      type: 'allrounder',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'deep_diver',
    name: 'Deep Diver',
    description: 'Mehr als 50 verschiedene Artist-Profile im Detail aufgerufen',
    category: 'fan',
    criteria: {
      type: 'profile_visits',
      parameters: { count: 50 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'vanguard',
    name: 'Vanguard',
    description: 'Für eine Band mit weniger als 100 registrierten Followern gestimmt',
    category: 'fan',
    criteria: {
      type: 'low_follower_support',
      parameters: { maxFollowers: 100 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'stammwaehler',
    name: 'Stammwähler',
    description: 'Insgesamt 10 Wochen lang Aktivität im System gezeigt',
    category: 'fan',
    criteria: {
      type: 'weekly_active',
      parameters: { weeks: 10 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'genre_hopper',
    name: 'Genre-Hopper',
    description: 'Über vier Wochen hinweg jede Woche für ein anderes Genre gestimmt',
    category: 'fan',
    criteria: {
      type: 'genre_hopper',
      parameters: { weeks: 4 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'orakel',
    name: 'Orakel',
    description: 'Die korrekte Top 3 der Experten-Charts für eine Woche vorausgesagt',
    category: 'dj',
    criteria: {
      type: 'oracle',
      parameters: { positions: 3 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'goldenes_ohr',
    name: 'Goldenes Ohr',
    description: 'Experten-Stimme für einen New Entry abgegeben, der in der Folgewoche stieg',
    category: 'dj',
    criteria: {
      type: 'golden_ear',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'techno_viking',
    name: 'Techno-Viking',
    description: 'Fokus der Experten-Stimmen liegt zu 80% auf elektronischen Genres',
    category: 'dj',
    criteria: {
      type: 'genre_focus',
      parameters: { focusGenre: 'electronic', percentage: 80 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'rock_steady',
    name: 'Rock-Steady',
    description: 'Fokus der Experten-Stimmen liegt zu 80% auf Rock- und Metal-Genres',
    category: 'dj',
    criteria: {
      type: 'genre_focus',
      parameters: { focusGenre: 'metal', percentage: 80 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'genre_meister',
    name: 'Genre-Meister',
    description: 'Experten-Votes in über zehn verschiedenen Genres verteilt',
    category: 'dj',
    criteria: {
      type: 'genre_diversity',
      parameters: { minGenres: 10 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'wochenwache',
    name: 'Wochenwache',
    description: 'Zehn Wochen am Stück am Experten-Voting teilgenommen',
    category: 'dj',
    criteria: {
      type: 'expert_consecutive',
      parameters: { weeks: 10 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'selektor',
    name: 'Selektor',
    description: 'Fünf gewählte Artists sind in der Folgewoche alle in den Charts geblieben',
    category: 'dj',
    criteria: {
      type: 'selector',
      parameters: { artists: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'spotlight_maker',
    name: 'Spotlight-Maker',
    description: 'Einen Artist erfolgreich für den wöchentlichen Spotlight-Slot nominiert',
    category: 'dj',
    criteria: {
      type: 'spotlight_maker',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'geschmacks_instanz',
    name: 'Geschmacks-Instanz',
    description: 'Hohe Übereinstimmung zwischen Experten-Vote und Fan-Endergebnis',
    category: 'dj',
    criteria: {
      type: 'taste_alignment',
      parameters: { threshold: 70 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'rebell',
    name: 'Rebell',
    description: 'Experten-Stimme weicht in 90% der Fälle vom Fan-Mainstream ab',
    category: 'dj',
    criteria: {
      type: 'rebel',
      parameters: { threshold: 90 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Seit über sechs Monaten als verifizierter DJ auf der Plattform aktiv',
    category: 'dj',
    criteria: {
      type: 'veteran',
      parameters: { months: 6 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'legende',
    name: 'Legende',
    description: 'Seit über einem Jahr als verifizierter DJ auf der Plattform aktiv',
    category: 'dj',
    criteria: {
      type: 'legend',
      parameters: { months: 12 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'praezision',
    name: 'Präzision',
    description: 'Fünfmal in Folge die korrekte Nummer 1 der Experten-Charts getippt',
    category: 'dj',
    criteria: {
      type: 'precision',
      parameters: { streak: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'schnelldenker',
    name: 'Schnelldenker',
    description: 'Experten-Vote innerhalb von 24 Stunden nach Chart-Release abgegeben',
    category: 'dj',
    criteria: {
      type: 'quick_thinker',
      parameters: { hours: 24 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'weltenbummler',
    name: 'Weltenbummler',
    description: 'Für Artists aus fünf verschiedenen Herkunftsländern gestimmt',
    category: 'dj',
    criteria: {
      type: 'world_traveler',
      parameters: { countries: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'supporter',
    name: 'Supporter',
    description: 'Mehr als 20 verschiedene Bands zur persönlichen Watchlist hinzugefügt',
    category: 'dj',
    criteria: {
      type: 'supporter',
      parameters: { count: 20 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Gehört zu den aktivsten 5% der Experten auf der gesamten Plattform',
    category: 'dj',
    criteria: {
      type: 'elite',
      parameters: { percentile: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'trendsetter',
    name: 'Trendsetter',
    description: 'Als erster Experte für einen späteren Top 10 Aufsteiger gestimmt',
    category: 'dj',
    criteria: {
      type: 'trendsetter',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: '26 Wochen ununterbrochene Aktivität im Experten-Bereich',
    category: 'dj',
    criteria: {
      type: 'marathon',
      parameters: { weeks: 26 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'archivar',
    name: 'Archivar',
    description: 'Mehr als 100 historische Chart-Snapshots in der Datenbank abgerufen',
    category: 'dj',
    criteria: {
      type: 'archivist',
      parameters: { count: 100 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'chart_breaker',
    name: 'Chart-Breaker',
    description: 'Der erste Einzug in die Top 10 der Plattform-Charts',
    category: 'band',
    criteria: {
      type: 'chart_breaker',
      parameters: { position: 10 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'platzhirsch',
    name: 'Platzhirsch',
    description: 'Erreichen des ersten Platzes im wöchentlichen Ranking',
    category: 'band',
    criteria: {
      type: 'top_position',
      parameters: { position: 1 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'unsterblich',
    name: 'Unsterblich',
    description: 'Seit zehn Wochen ununterbrochen in den Charts vertreten',
    category: 'band',
    criteria: {
      type: 'chart_stability',
      parameters: { weeks: 10 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'senkrechtstarter',
    name: 'Senkrechtstarter',
    description: 'Ein Aufstieg von mehr als 20 Plätzen innerhalb einer Woche',
    category: 'band',
    criteria: {
      type: 'rapid_rise',
      parameters: { positions: 20 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'fan_magnet',
    name: 'Fan-Magnet',
    description: 'Erhalt von mehr als 100 neuen Followern innerhalb von sieben Tagen',
    category: 'band',
    criteria: {
      type: 'fan_magnet',
      parameters: { followers: 100, days: 7 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'heissphase',
    name: 'Heißphase',
    description: 'Drei Wochen in Folge eine Platzierung in den Top 5 gehalten',
    category: 'band',
    criteria: {
      type: 'hot_streak',
      parameters: { weeks: 3, position: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'stehaufmaennchen',
    name: 'Stehaufmännchen',
    description: 'Wiedereinstieg in die Charts nach einer Pause von über vier Wochen',
    category: 'band',
    criteria: {
      type: 'comeback',
      parameters: { pauseWeeks: 4 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'export_schlager',
    name: 'Export-Schlager',
    description: 'Stimmen aus mehr als fünf verschiedenen Regionen erhalten',
    category: 'band',
    criteria: {
      type: 'export_hit',
      parameters: { regions: 5 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'aufsteiger_der_woche',
    name: 'Aufsteiger der Woche',
    description: 'Die höchste positive Platzierungsänderung der gesamten Liste erzielt',
    category: 'band',
    criteria: {
      type: 'climber_of_week',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'publikumsliebling',
    name: 'Publikumsliebling',
    description: 'Ein Community-Power-Wert von über 80% im finalen Score',
    category: 'band',
    criteria: {
      type: 'fan_favorite',
      parameters: { threshold: 80 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'experten_tipp',
    name: 'Experten-Tipp',
    description: 'Ein Expert-Power-Wert von über 50% im finalen Score',
    category: 'band',
    criteria: {
      type: 'expert_pick',
      parameters: { threshold: 50 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'produktiv',
    name: 'Produktiv',
    description: 'Mindestens drei verschiedene Releases im Profil mit Spotify verknüpft',
    category: 'band',
    criteria: {
      type: 'productive',
      parameters: { releases: 3 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'offenes_buch',
    name: 'Offenes Buch',
    description: 'Alle Profilfelder inklusive Bio, Links und Artworks vollständig ausgefüllt',
    category: 'band',
    criteria: {
      type: 'complete_profile',
      parameters: {}
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'verifiziert',
    name: 'Verifiziert',
    description: 'Erfolgreicher Abschluss des Identitäts-Checks für Bands',
    category: 'band',
    criteria: {
      type: 'verified',
      parameters: {}
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'ueberlebenskuenstler',
    name: 'Überlebenskünstler',
    description: 'Fünf Wochen lang in der kritischen Zone (Plätze 40-50) verblieben',
    category: 'band',
    criteria: {
      type: 'survivor',
      parameters: { weeks: 5, minPosition: 40, maxPosition: 50 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'viral_geher',
    name: 'Viral-Geher',
    description: 'Mehr als 1000 Einzelstimmen innerhalb einer einzigen Woche erhalten',
    category: 'band',
    criteria: {
      type: 'viral',
      parameters: { votes: 1000 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'monats_bester',
    name: 'Monats-Bester',
    description: 'Die erfolgreichste Neuvorstellung innerhalb eines Kalendermonats',
    category: 'band',
    criteria: {
      type: 'monthly_best',
      parameters: {}
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'lokalmatador',
    name: 'Lokalmatador',
    description: 'Die Mehrheit der Stimmen aus der eigenen Heimatregion erhalten',
    category: 'band',
    criteria: {
      type: 'local_hero',
      parameters: { threshold: 50 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'konstante',
    name: 'Konstante',
    description: 'Die Platzierung hat sich über fünf Wochen um maximal zwei Plätze verändert',
    category: 'band',
    criteria: {
      type: 'consistent',
      parameters: { weeks: 5, maxChange: 2 }
    },
    isOneTime: false,
    createdAt: new Date('2024-01-01')
  },
  {
    id: 'ruhmeshalle',
    name: 'Ruhmeshalle',
    description: 'Insgesamt dreimal den ersten Platz der Charts belegt',
    category: 'band',
    criteria: {
      type: 'hall_of_fame',
      parameters: { count: 3 }
    },
    isOneTime: true,
    createdAt: new Date('2024-01-01')
  }
];
