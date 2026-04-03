# Dark Charts - Spotify Integration

## Übersicht

Diese Anwendung enthält eine vollständige Spotify API-Integration für automatische Release-Synchronisation von Artists in der Metal & Gothic Scene.

## Features

### 1. Spotify API Service (`spotifyService.ts`)
- **OAuth 2.0 Authentifizierung**: Vollständiger OAuth-Flow mit State-Validierung
- **Token-Management**: Automatisches Token-Refresh bei Ablauf
- **Rate-Limiting**: Eingebautes Throttling (max. 10 Requests/Sekunde)
- **Artist-Suche**: Suche nach Künstlern auf Spotify
- **Album-Sync**: Automatische Synchronisation aller Releases eines Artists
- **Track-Details**: Abruf von Preview-URLs, Artwork und ISRC

### 2. Artist Management Service (`artistManagementService.ts`)
- **CRUD-Operationen**: Erstellen, Lesen, Aktualisieren und Löschen von Artists
- **Release-Cache**: Lokales Caching aller Artist-Releases
- **Automatische Synchronisation**: Wöchentliche Auto-Sync mit konfigurierbarem Intervall
- **Status-Tracking**: Sync-Status, Fehlerbehandlung und nächster Sync-Zeitpunkt
- **Fallback**: Automatisches Fallback auf Mock-Daten bei API-Fehlern

### 3. UI-Komponenten

#### SpotifyAuthButton
- Anzeige des Verbindungsstatus
- Login/Logout-Funktionalität
- Visuelles Feedback (grün = verbunden)

#### AdminArtistManagement (erweitert)
- Artist-Verwaltung mit Spotify-Integration
- Anzeige von Sync-Status und Release-Anzahl
- Manuelle und automatische Synchronisation
- Release-Übersicht pro Artist

## Verwendung

### Spotify-Authentifizierung

1. **Spotify Developer Dashboard**:
   - Erstelle eine neue App auf [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
   - Füge `http://localhost:3000/spotify-callback` als Redirect URI hinzu (für Entwicklung)
   - Kopiere die Client ID

2. **Konfiguration**:
   ```typescript
   // In spotifyService.ts:
   private readonly CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID';
   ```

3. **OAuth-Flow**:
   - Klicke auf "Spotify verbinden" im Admin-Bereich
   - Autorisiere die Anwendung
   - Werde automatisch zurück zur App geleitet

### Artist hinzufügen

```typescript
// Manuell über UI:
1. Navigiere zu Admin-Bereich
2. Klicke auf "Artist hinzufügen"
3. Gib Artist-Name und Spotify Artist ID ein
4. Speichern - automatischer Sync startet

// Programmatisch:
const artist = await artistManagementService.createArtist({
  name: 'Lacuna Coil',
  spotifyId: '3Kg5qHXUcg1E65tDqDiE0X',
  genres: ['Gothic Metal', 'Symphonic Metal'],
});
```

### Release-Synchronisation

```typescript
// Einzelner Artist:
await artistManagementService.syncArtistReleases(artistId);

// Alle Artists:
await artistManagementService.syncAllArtists();
```

### Automatische Synchronisation

Die Synchronisation läuft automatisch alle 7 Tage für jeden Artist. Der Status kann im Admin-Panel überprüft werden.

## Datenstruktur

### Artist
```typescript
interface Artist {
  id: string;
  name: string;
  spotifyId?: string;
  appleMusicId?: string;
  genres: Genre[];
  artwork?: string;
  bio?: string;
  createdAt: number;
  updatedAt: number;
}
```

### Release
```typescript
interface Release {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseDate: string;
  albumArt?: string;
  spotifyUri?: string;
  appleMusicUrl?: string;
  type: 'album' | 'single' | 'ep';
  tracks?: ReleaseTrack[];
  createdAt: number;
  lastCached: number;
}
```

### Cache Status
```typescript
interface ArtistCacheStatus {
  artistId: string;
  lastSync: number;
  nextSync: number;
  releaseCount: number;
  status: 'syncing' | 'success' | 'error';
  errorMessage?: string;
}
```

## API-Endpunkte (Spotify)

Die Integration nutzt folgende Spotify Web API-Endpunkte:

- `GET /v1/artists/{id}` - Artist-Details
- `GET /v1/artists/{id}/albums` - Artist-Alben
- `GET /v1/albums/{id}` - Album-Details mit Trackliste
- `GET /v1/tracks/{id}` - Track-Details mit Preview-URL
- `GET /v1/search` - Artist-Suche

## Fehlerbehandlung

### Token-Fehler
Bei abgelaufenen oder ungültigen Tokens erfolgt automatisches Token-Refresh. Bei Fehler wird der Benutzer aufgefordert, sich neu zu authentifizieren.

### API-Rate-Limits
Die Implementierung beinhaltet Request-Throttling:
- Max. 10 Requests pro Sekunde
- Queue-basierte Verarbeitung
- Automatisches Retry bei 429-Fehlern

### Sync-Fehler
Bei Sync-Fehlern:
- Fehler wird geloggt und im Admin-Panel angezeigt
- Automatisches Fallback auf Mock-Daten
- Nächster Sync-Versuch beim nächsten geplanten Intervall

## Persistenz

Alle Daten werden mit der Spark KV-API gespeichert:

```typescript
// Artists
`artist:${artistId}` → Artist

// Releases
`release:${releaseId}` → Release

// Cache Status
`artist-cache-status:${artistId}` → ArtistCacheStatus

// Spotify Tokens
`spotify-tokens` → SpotifyAuthTokens
```

## Übersetzungen

Die UI ist vollständig zweisprachig (Deutsch/Englisch) mit folgenden Keys:

- `admin.connectSpotify` - "Spotify verbinden" / "Connect Spotify"
- `admin.spotifyConnected` - "Spotify verbunden" / "Spotify Connected"
- `admin.searchSpotify` - "Spotify-Künstler suchen" / "Search Spotify Artists"
- `admin.sync` - "Sync" / "Sync"
- `admin.syncAll` - "Alle synchronisieren" / "Sync All"

## Sicherheit

### OAuth State-Validierung
- Zufälliger State-Parameter wird generiert und validiert
- Schutz gegen CSRF-Angriffe

### Token-Speicherung
- Tokens werden in der Spark KV-Datenbank gespeichert
- Nur Client-seitige Authentifizierung (keine Server-Komponente nötig)

### Scopes
Minimal nötige Scopes:
- `user-read-email`
- `user-read-private`
- `user-library-read`

## Zukünftige Erweiterungen

1. **Apple Music Integration**: Ähnlicher Service für Apple Music API
2. **Bandcamp Integration**: Sync mit Bandcamp-Releases
3. **Automatische Track-Metadaten**: Genre-Erkennung und Tagging
4. **Playlist-Export**: Export von Charts als Spotify-Playlists
5. **Artist-Benachrichtigungen**: Benachrichtigung bei neuen Releases

## Troubleshooting

### "Spotify not authenticated" Fehler
- Überprüfe ob CLIENT_ID korrekt ist
- Stelle sicher, dass Redirect URI in Spotify Dashboard konfiguriert ist
- Lösche alte Tokens: `await spark.kv.delete('spotify-tokens')`

### Sync schlägt fehl
- Überprüfe Artist-Spotify-ID (sollte Format `3Kg5qHXUcg1E65tDqDiE0X` haben)
- Prüfe API-Rate-Limits im Spotify Dashboard
- Überprüfe Netzwerkverbindung

### Mock-Daten werden verwendet
- Spotify-Authentifizierung ist nicht aktiv
- API-Fehler → Automatisches Fallback

## Dokumentation

- [Spotify Web API Reference](https://developer.spotify.com/documentation/web-api)
- [OAuth 2.0 Flow](https://developer.spotify.com/documentation/general/guides/authorization/code-flow/)
- [Rate Limiting](https://developer.spotify.com/documentation/web-api/guides/rate-limits/)
