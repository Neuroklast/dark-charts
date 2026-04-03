import { createContext, useContext, ReactNode } from 'react';
import { useKV } from '@github/spark/hooks';

type Language = 'en' | 'de';

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
  en: {
    'nav.home': 'Home',
    'nav.voting': 'Voting',
    'nav.history': 'History',
    'nav.custom': 'Custom Charts',
    'nav.profile': 'Profile',
    'nav.about': 'About',
    
    'pillar.overview': 'Overview',
    'pillar.fan': 'Fan Charts',
    'pillar.expert': 'Expert Charts',
    'pillar.streaming': 'Streaming Charts',
    
    'genre.overall': 'Overall',
    'genre.gothic': 'Gothic',
    'genre.metal': 'Metal',
    'genre.darkelectro': 'Dark Electro',
    'genre.crossover': 'Crossover',
    
    'subgenre.Gothic Rock': 'Gothic Rock',
    'subgenre.Dark Wave': 'Dark Wave',
    'subgenre.Post Punk': 'Post Punk',
    'subgenre.Deathrock': 'Deathrock',
    'subgenre.Cold Wave': 'Cold Wave',
    'subgenre.Ethereal Wave': 'Ethereal Wave',
    'subgenre.Neoklassik': 'Neoclassical',
    'subgenre.Neue Deutsche Todeskunst': 'Neue Deutsche Todeskunst',
    'subgenre.Batcave': 'Batcave',
    'subgenre.Neofolk': 'Neofolk',
    'subgenre.Pagan Folk': 'Pagan Folk',
    'subgenre.Nordic Folk': 'Nordic Folk',
    'subgenre.Ritual Ambient': 'Ritual Ambient',
    'subgenre.Gothic Metal': 'Gothic Metal',
    'subgenre.Dark Metal': 'Dark Metal',
    'subgenre.Symphonic Metal': 'Symphonic Metal',
    'subgenre.Doom Metal': 'Doom Metal',
    'subgenre.Symphonic Black Metal': 'Symphonic Black Metal',
    'subgenre.Atmospheric Black Metal': 'Atmospheric Black Metal',
    'subgenre.Death Doom': 'Death Doom',
    'subgenre.Pagan Metal': 'Pagan Metal',
    'subgenre.Electronic Body Music': 'Electronic Body Music',
    'subgenre.Dark Electro': 'Dark Electro',
    'subgenre.Electro Industrial': 'Electro Industrial',
    'subgenre.Aggrotech': 'Aggrotech',
    'subgenre.Future Pop': 'Future Pop',
    'subgenre.Industrial': 'Industrial',
    'subgenre.Rhythmic Noise': 'Rhythmic Noise',
    'subgenre.Dark Synthpop': 'Dark Synthpop',
    'subgenre.Harsh EBM': 'Harsh EBM',
    'subgenre.Industrial Metal': 'Industrial Metal',
    'subgenre.Neue Deutsche Härte': 'Neue Deutsche Härte',
    'subgenre.Mittelalter Rock': 'Medieval Rock',
    'subgenre.Darksynth': 'Darksynth',
    'subgenre.Cybergoth': 'Cybergoth',
    'subgenre.Death Industrial': 'Death Industrial',
    'subgenre.Folk Metal': 'Folk Metal',
    'subgenre.Dark Techno': 'Dark Techno',
    'subgenre.Industrial Techno': 'Industrial Techno',
    'subgenre.Darkstep': 'Darkstep',
    'subgenre.Crossbreed': 'Crossbreed',
    'subgenre.Techstep': 'Techstep',
    'subgenre.Neurofunk': 'Neurofunk',
    
    'chart.fanCharts': 'Fan Charts',
    'chart.expertCharts': 'Expert Charts',
    'chart.streamingCharts': 'Streaming Charts',
    'chart.overallCharts': 'Overall Charts',
    'chart.top3': 'Top 3',
    'chart.position': 'Position',
    
    'track.artist': 'Artist',
    'track.title': 'Title',
    'track.album': 'Album',
    'track.releaseDate': 'Release Date',
    'track.genres': 'Genres',
    'track.votes': 'Votes',
    'track.streams': 'Streams',
    'track.playOn': 'Play on',
    'track.details': 'Track Details',
    'track.appearsIn': 'Appears in Charts',
    'track.noChartPositions': 'No chart positions',
    
    'player.nowPlaying': 'Now Playing',
    'player.previous': 'Previous',
    'player.next': 'Next',
    'player.noTrack': 'No track selected',
    
    'voting.title': 'Vote for Your Favorites',
    'voting.description': 'Cast your votes to influence the fan charts',
    'voting.search': 'Search tracks...',
    'voting.filterGenres': 'Filter by genres',
    'voting.clearFilters': 'Clear filters',
    'voting.vote': 'Vote',
    'voting.voted': 'Voted',
    'voting.votesRemaining': 'votes remaining',
    'voting.allVotesUsed': 'All votes used',
    'voting.resetIn': 'Reset in',
    'voting.hours': 'hours',
    'voting.minutes': 'minutes',
    
    'custom.title': 'Custom Charts',
    'custom.description': 'Create your own personalized charts',
    'custom.createChart': 'Create New Chart',
    'custom.chartName': 'Chart Name',
    'custom.selectTracks': 'Select Tracks',
    'custom.save': 'Save',
    'custom.cancel': 'Cancel',
    'custom.delete': 'Delete',
    'custom.edit': 'Edit',
    'custom.noCharts': 'No custom charts yet',
    'custom.createFirst': 'Create your first custom chart',
    
    'history.title': 'Chart History',
    'history.description': 'View historical chart positions',
    'history.selectTrack': 'Select a track',
    'history.week': 'Week',
    'history.noData': 'No historical data available',
    
    'profile.title': 'Profile',
    'profile.username': 'Username',
    'profile.email': 'Email',
    'profile.memberSince': 'Member since',
    'profile.totalVotes': 'Total Votes',
    'profile.customCharts': 'Custom Charts',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.saveChanges': 'Save Changes',
    
    'about.title': 'About Dark Charts',
    'about.description': 'Independent music charts for Metal & Gothic scene',
    'about.mission': 'Mission',
    'about.missionText': 'Fair, transparent, and free from pay-to-win mechanics.',
    'about.principles': 'Principles',
    'about.principle1': 'No pay-to-play',
    'about.principle2': 'Community-driven',
    'about.principle3': 'Transparent ranking',
    'about.principle4': 'Scene-focused',
    'about.howItWorks': 'How It Works',
    'about.builtFor': 'Built for fans, by fans. Supporting underground artists through fair representation and authentic community engagement.',
    
    'footer.tagline': 'Independent music charts for Metal & Gothic scene. Fair, transparent, and free from pay-to-win mechanics.',
    'footer.underground': 'Underground Never Dies',
    
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.viewDetails': 'View Details',
    'common.genres': 'Genres',
    'common.all': 'All',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.ascending': 'Ascending',
    'common.descending': 'Descending',
    
    'header.subtitle': 'Metal • Gothic • Alternative • Dark Electro',
  },
  de: {
    'nav.home': 'Startseite',
    'nav.voting': 'Abstimmen',
    'nav.history': 'Verlauf',
    'nav.custom': 'Eigene Charts',
    'nav.profile': 'Profil',
    'nav.about': 'Über uns',
    
    'pillar.overview': 'Übersicht',
    'pillar.fan': 'Fan-Charts',
    'pillar.expert': 'Experten-Charts',
    'pillar.streaming': 'Streaming-Charts',
    
    'genre.overall': 'Gesamt',
    'genre.gothic': 'Gothic',
    'genre.metal': 'Metal',
    'genre.darkelectro': 'Dark Electro',
    'genre.crossover': 'Crossover',
    
    'subgenre.Gothic Rock': 'Gothic Rock',
    'subgenre.Dark Wave': 'Dark Wave',
    'subgenre.Post Punk': 'Post Punk',
    'subgenre.Deathrock': 'Deathrock',
    'subgenre.Cold Wave': 'Cold Wave',
    'subgenre.Ethereal Wave': 'Ethereal Wave',
    'subgenre.Neoklassik': 'Neoklassik',
    'subgenre.Neue Deutsche Todeskunst': 'Neue Deutsche Todeskunst',
    'subgenre.Batcave': 'Batcave',
    'subgenre.Neofolk': 'Neofolk',
    'subgenre.Pagan Folk': 'Pagan Folk',
    'subgenre.Nordic Folk': 'Nordic Folk',
    'subgenre.Ritual Ambient': 'Ritual Ambient',
    'subgenre.Gothic Metal': 'Gothic Metal',
    'subgenre.Dark Metal': 'Dark Metal',
    'subgenre.Symphonic Metal': 'Symphonic Metal',
    'subgenre.Doom Metal': 'Doom Metal',
    'subgenre.Symphonic Black Metal': 'Symphonic Black Metal',
    'subgenre.Atmospheric Black Metal': 'Atmospheric Black Metal',
    'subgenre.Death Doom': 'Death Doom',
    'subgenre.Pagan Metal': 'Pagan Metal',
    'subgenre.Electronic Body Music': 'Electronic Body Music',
    'subgenre.Dark Electro': 'Dark Electro',
    'subgenre.Electro Industrial': 'Electro Industrial',
    'subgenre.Aggrotech': 'Aggrotech',
    'subgenre.Future Pop': 'Future Pop',
    'subgenre.Industrial': 'Industrial',
    'subgenre.Rhythmic Noise': 'Rhythmic Noise',
    'subgenre.Dark Synthpop': 'Dark Synthpop',
    'subgenre.Harsh EBM': 'Harsh EBM',
    'subgenre.Industrial Metal': 'Industrial Metal',
    'subgenre.Neue Deutsche Härte': 'Neue Deutsche Härte',
    'subgenre.Mittelalter Rock': 'Mittelalter Rock',
    'subgenre.Darksynth': 'Darksynth',
    'subgenre.Cybergoth': 'Cybergoth',
    'subgenre.Death Industrial': 'Death Industrial',
    'subgenre.Folk Metal': 'Folk Metal',
    'subgenre.Dark Techno': 'Dark Techno',
    'subgenre.Industrial Techno': 'Industrial Techno',
    'subgenre.Darkstep': 'Darkstep',
    'subgenre.Crossbreed': 'Crossbreed',
    'subgenre.Techstep': 'Techstep',
    'subgenre.Neurofunk': 'Neurofunk',
    
    'chart.fanCharts': 'Fan-Charts',
    'chart.expertCharts': 'Experten-Charts',
    'chart.streamingCharts': 'Streaming-Charts',
    'chart.overallCharts': 'Gesamt-Charts',
    'chart.top3': 'Top 3',
    'chart.position': 'Position',
    
    'track.artist': 'Künstler',
    'track.title': 'Titel',
    'track.album': 'Album',
    'track.releaseDate': 'Veröffentlichungsdatum',
    'track.genres': 'Genres',
    'track.votes': 'Stimmen',
    'track.streams': 'Streams',
    'track.playOn': 'Abspielen auf',
    'track.details': 'Track-Details',
    'track.appearsIn': 'Erscheint in Charts',
    'track.noChartPositions': 'Keine Chart-Positionen',
    
    'player.nowPlaying': 'Läuft gerade',
    'player.previous': 'Zurück',
    'player.next': 'Weiter',
    'player.noTrack': 'Kein Track ausgewählt',
    
    'voting.title': 'Stimme für deine Favoriten',
    'voting.description': 'Gib deine Stimmen ab, um die Fan-Charts zu beeinflussen',
    'voting.search': 'Tracks durchsuchen...',
    'voting.filterGenres': 'Nach Genres filtern',
    'voting.clearFilters': 'Filter löschen',
    'voting.vote': 'Abstimmen',
    'voting.voted': 'Abgestimmt',
    'voting.votesRemaining': 'Stimmen übrig',
    'voting.allVotesUsed': 'Alle Stimmen verbraucht',
    'voting.resetIn': 'Zurücksetzen in',
    'voting.hours': 'Stunden',
    'voting.minutes': 'Minuten',
    
    'custom.title': 'Eigene Charts',
    'custom.description': 'Erstelle deine eigenen personalisierten Charts',
    'custom.createChart': 'Neue Chart erstellen',
    'custom.chartName': 'Chart-Name',
    'custom.selectTracks': 'Tracks auswählen',
    'custom.save': 'Speichern',
    'custom.cancel': 'Abbrechen',
    'custom.delete': 'Löschen',
    'custom.edit': 'Bearbeiten',
    'custom.noCharts': 'Noch keine eigenen Charts',
    'custom.createFirst': 'Erstelle deine erste eigene Chart',
    
    'history.title': 'Chart-Verlauf',
    'history.description': 'Historische Chart-Positionen ansehen',
    'history.selectTrack': 'Wähle einen Track',
    'history.week': 'Woche',
    'history.noData': 'Keine historischen Daten verfügbar',
    
    'profile.title': 'Profil',
    'profile.username': 'Benutzername',
    'profile.email': 'E-Mail',
    'profile.memberSince': 'Mitglied seit',
    'profile.totalVotes': 'Gesamte Stimmen',
    'profile.customCharts': 'Eigene Charts',
    'profile.settings': 'Einstellungen',
    'profile.language': 'Sprache',
    'profile.saveChanges': 'Änderungen speichern',
    
    'about.title': 'Über Dark Charts',
    'about.description': 'Unabhängige Musik-Charts für die Metal & Gothic-Szene',
    'about.mission': 'Mission',
    'about.missionText': 'Fair, transparent und frei von Pay-to-Win-Mechaniken.',
    'about.principles': 'Grundsätze',
    'about.principle1': 'Kein Pay-to-Play',
    'about.principle2': 'Community-gesteuert',
    'about.principle3': 'Transparentes Ranking',
    'about.principle4': 'Szene-fokussiert',
    'about.howItWorks': 'Wie es funktioniert',
    'about.builtFor': 'Von Fans für Fans gebaut. Unterstützung von Underground-Künstlern durch faire Repräsentation und authentisches Community-Engagement.',
    
    'footer.tagline': 'Unabhängige Musik-Charts für die Metal & Gothic-Szene. Fair, transparent und frei von Pay-to-Win-Mechaniken.',
    'footer.underground': 'Underground stirbt nie',
    
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.close': 'Schließen',
    'common.back': 'Zurück',
    'common.viewDetails': 'Details ansehen',
    'common.genres': 'Genres',
    'common.all': 'Alle',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.sort': 'Sortieren',
    'common.ascending': 'Aufsteigend',
    'common.descending': 'Absteigend',
    
    'header.subtitle': 'Metal • Gothic • Alternative • Dark Electro',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useKV<Language>('app-language', 'en');

  const t = (key: string): string => {
    const currentLang = language || 'en';
    return translations[currentLang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language: language || 'en', setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
