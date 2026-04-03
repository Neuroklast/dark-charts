# Dark Charts - Architecture Documentation

## UI/Data Separation Architecture

Die App wurde so entwickelt, dass die Benutzeroberfläche vollständig von der Datenbeschaffung getrennt ist. Dies ermöglicht es dir, später nahtlos dein eigenes Backend anzubinden, ohne die UI-Komponenten umschreiben zu müssen.

## Architektur-Übersicht

### 1. Service Layer (`src/services/`)

Alle Datenbeschaffungslogik ist in Services abstrahiert:

- **`dataFetchService.ts`**: Zentraler Service für asynchrone Datenbeschaffung
  - Enrichment von Track-Daten (Artwork, Preview URLs, Streaming Links)
  - Internes Caching von API-Requests
  - Verhindert doppelte Anfragen

- **`IDataService` Interface** (`src/types/index.ts`):
  ```typescript
  interface IDataService {
    getAllCharts(): Promise<ChartData>;
    getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]>;
    calculateOverallChart(weights: ChartWeights): Track[];
    vote(trackId: string, credits: number): Promise<void>;
    getVotes(trackId: string): Promise<number>;
    getUserVotesForTrack(trackId: string): Promise<number>;
    getNextChartPublicationDate(): Date;
  }
  ```

- **`IAuthService` Interface** (`src/types/index.ts`):
  ```typescript
  interface IAuthService {
    getCurrentUser(): Promise<AuthUser | null>;
    login(provider: 'spotify' | 'apple' | 'mock'): Promise<AuthUser>;
    logout(): Promise<void>;
    updateProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  }
  ```

### 2. Context Layer (`src/contexts/`)

React Context Provider für globales State-Management:

**DataContext.tsx**:
```typescript
export const DataProvider: React.FC<DataProviderProps> = ({ 
  children, 
  dataService = new ComprehensiveDataService(), // ← Standard-Implementierung
  authService = new MockAuthService()           // ← Standard-Implementierung
}) => {
  return (
    <DataContext.Provider value={{ dataService, authService }}>
      {children}
    </DataContext.Provider>
  );
};
```

### 3. Custom Hooks (`src/hooks/`)

Hooks trennen Daten-Loading von UI-Logik:

**`use-track-data.ts`**:
- Lädt asynchron Track-Enrichment-Daten
- Exposed Loading-States für UI
- Cached Ergebnisse automatisch

```typescript
const {
  enrichedTrack,
  isLoadingArtwork,
  isLoadingPreview,
  isLoadingStreamingLinks,
  artworkUrl,
  previewUrl,
  hasStreamingLinks,
  refresh
} = useTrackData(track);
```

### 4. UI Components (`src/components/`)

UI-Komponenten sind rein präsentational und kennen keine Implementierungsdetails:

**TrackDetailModal.tsx**:
- Öffnet sofort (ohne auf Daten zu warten)
- Zeigt Loading-Indikatoren während Daten nachgeladen werden
- Nutzt `useTrackData` Hook für asynchrone Daten

**AlbumArtwork.tsx**:
- Zeigt Loading-Spinner während Artwork lädt
- Fallback zu Platzhalter bei Fehler
- Intelligentes Caching

## Dein eigenes Backend anbinden

### Schritt 1: Implementiere deine Service-Klassen

Erstelle `src/services/myBackendDataService.ts`:

```typescript
import { IDataService, ChartData, Track, ChartWeights } from '@/types';

export class MyBackendDataService implements IDataService {
  private apiBaseUrl = 'https://api.mein-backend.de';

  async getAllCharts(): Promise<ChartData> {
    const response = await fetch(`${this.apiBaseUrl}/charts`);
    const data = await response.json();
    return {
      fanCharts: data.fan_charts.map(this.mapTrackFromAPI),
      expertCharts: data.expert_charts.map(this.mapTrackFromAPI),
      streamingCharts: data.streaming_charts.map(this.mapTrackFromAPI),
    };
  }

  async getChartByType(type: 'fan' | 'expert' | 'streaming'): Promise<Track[]> {
    const response = await fetch(`${this.apiBaseUrl}/charts/${type}`);
    const data = await response.json();
    return data.tracks.map(this.mapTrackFromAPI);
  }

  calculateOverallChart(weights: ChartWeights): Track[] {
    // Implementiere deine Logik oder rufe Backend-Endpunkt auf
  }

  async vote(trackId: string, credits: number): Promise<void> {
    await fetch(`${this.apiBaseUrl}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_id: trackId, credits })
    });
  }

  // ... weitere Methoden

  private mapTrackFromAPI(apiTrack: any): Track {
    return {
      id: apiTrack.id,
      rank: apiTrack.rank,
      artist: apiTrack.artist_name,
      title: apiTrack.title,
      // ... restliche Felder mappen
    };
  }
}
```

Erstelle `src/services/myBackendAuthService.ts`:

```typescript
import { IAuthService, AuthUser, UserProfile } from '@/types';

export class MyBackendAuthService implements IAuthService {
  private apiBaseUrl = 'https://api.mein-backend.de';

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    const response = await fetch(`${this.apiBaseUrl}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return this.mapUserFromAPI(data);
  }

  async login(provider: 'spotify' | 'apple' | 'mock'): Promise<AuthUser> {
    // Implementiere OAuth-Flow mit deinem Backend
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    await fetch(`${this.apiBaseUrl}/auth/logout`, { method: 'POST' });
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    // Implementiere Profil-Update
  }

  private mapUserFromAPI(apiUser: any): AuthUser {
    // Mappe API-Response zu AuthUser
  }
}
```

### Schritt 2: Injiziere deine Services

In `src/App.tsx`:

```typescript
import { MyBackendDataService } from '@/services/myBackendDataService';
import { MyBackendAuthService } from '@/services/myBackendAuthService';

function App() {
  const myDataService = new MyBackendDataService();
  const myAuthService = new MyBackendAuthService();

  return (
    <AuthProvider>
      <DataProvider 
        dataService={myDataService}     // ← Dein Backend-Service
        authService={myAuthService}     // ← Dein Auth-Service
      >
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
}
```

### Schritt 3: Optional - Erweitere den DataFetchService

Wenn du zusätzliche asynchrone Daten brauchst, erweitere `dataFetchService.ts`:

```typescript
export interface IDataFetchService {
  enrichTrackData(track: Track): Promise<TrackEnrichmentData>;
  fetchArtwork(track: Track): Promise<string | undefined>;
  fetchPreviewUrl(track: Track): Promise<string | undefined>;
  fetchStreamingLinks(track: Track): Promise<OdesliData | undefined>;
  // Füge neue Methoden hinzu:
  fetchArtistBio(artistId: string): Promise<string | undefined>;
  fetchSimilarTracks(trackId: string): Promise<Track[]>;
}

export class MyDataFetchService implements IDataFetchService {
  async fetchArtwork(track: Track): Promise<string | undefined> {
    // Rufe dein Backend für High-Res Artwork auf
    const response = await fetch(`https://api.mein-backend.de/artwork/${track.id}`);
    const data = await response.json();
    return data.high_res_url;
  }

  // ... weitere Implementierungen
}
```

## Loading-States & UI-Verhalten

### Sofortiges Öffnen von Overlays

Das TrackDetailModal öffnet sich **sofort**, ohne auf Daten zu warten:

```typescript
// Modal öffnet sich sofort mit grundlegenden Track-Daten
<TrackDetailModal 
  track={track}          // Basis-Daten (immer verfügbar)
  isOpen={isModalOpen}   // Öffnet sofort
  onClose={onClose}
/>

// Im Modal selbst:
const {
  enrichedTrack,        // Enthält angereicherte Daten (wenn geladen)
  isLoadingArtwork,     // true während Artwork lädt
  isLoadingPreview,     // true während Preview lädt
  artworkUrl            // undefined bis geladen
} = useTrackData(isOpen ? track : null);

// UI zeigt Loading-Indikatoren:
{isLoadingArtwork && <div className="animate-pulse">Loading...</div>}
{!isLoadingArtwork && artworkUrl && <img src={artworkUrl} />}
```

### Artwork mit Loading-Indikator

```typescript
<AlbumArtwork
  src={track.albumArt}
  alt={`${track.artist} - ${track.title}`}
  artist={track.artist}
  title={track.title}
  showLoadingIndicator={true}  // Zeigt Spinner während des Ladens
/>
```

Intern:
- Zeigt Pulsing-Spinner während Bild lädt
- Cached geladene Bilder automatisch
- Fallback zu Platzhalter bei Fehler

## Best Practices

### 1. Nutze funktionale Updates für useKV

```typescript
// ❌ FALSCH - Nutzt stale closure-Wert
setTodos([...todos, newTodo]);

// ✅ RICHTIG - Nutzt aktuellen Wert
setTodos((currentTodos) => [...currentTodos, newTodo]);
```

### 2. Trenne persistente und flüchtige States

```typescript
// Persistente Daten (überleben Page Refresh)
const [userVotes, setUserVotes] = useKV('user-votes', []);

// Flüchtige UI-States (verschwinden bei Refresh)
const [isModalOpen, setIsModalOpen] = useState(false);
```

### 3. Nutze den DataFetchService für alle asynchronen Operationen

```typescript
// Im Service - nicht direkt in Komponenten!
const data = await dataFetchService.enrichTrackData(track);
```

### 4. Fehlerbehandlung

Alle Services sollten Fehler gracefully behandeln:

```typescript
async fetchArtwork(track: Track): Promise<string | undefined> {
  try {
    const response = await fetch(`/api/artwork/${track.id}`);
    if (!response.ok) return undefined;
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Failed to fetch artwork:', error);
    return undefined;  // Fallback
  }
}
```

## Zusammenfassung

✅ **UI ist vollständig von Daten getrennt**
✅ **Alle Datenbeschaffung über Service-Interfaces**
✅ **React Context für globales State-Management**
✅ **Custom Hooks für asynchrone Datenlogik**
✅ **Loading-States für alle async Operationen**
✅ **Overlays öffnen sofort, Daten laden nach**
✅ **Einfacher Austausch der Services ohne UI-Änderungen**

Du kannst jetzt dein eigenes Backend anbinden, indem du einfach die Service-Implementierungen ersetzt - **ohne eine einzige UI-Komponente anfassen zu müssen**! 🚀
