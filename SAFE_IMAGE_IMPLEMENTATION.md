# SafeImage Implementation - Artwork Loading System

## KRITISCHE ANFORDERUNGEN

### 1. NIEMALS MOCK-DATEN VERWENDEN
- Alle Bilder müssen von den echten URLs aus den Track-Daten geladen werden
- Keine Platzhalter-Logik, die Mock-Bilder generiert
- Wenn `track.albumArt` oder `track.artworkHighRes` vorhanden ist, MUSS diese URL verwendet werden

### 2. wsrv.nl PROXY - ZWINGEND
- **ALLE** Bild-URLs werden durch wsrv.nl geleitet
- Format: `https://wsrv.nl/?url={ENCODED_URL}&w={WIDTH}&h={HEIGHT}&fit=cover&dpr=2&output=webp&q=85`
- Dies cached die Bilder weltweit und optimiert Performance

### 3. SafeImage Komponente
Die `SafeImage` Komponente (`/src/components/SafeImage.tsx`) ist die zentrale Komponente für ALLE Bilder in der App.

#### Features:
- **Isolierter State**: Jede Instanz verwaltet ihren eigenen Loading/Error-State
- **Skeleton Loading**: Zeigt `bg-zinc-800 animate-pulse` während des Ladens
- **Fehlerbehandlung**: Bei Fehler wird ein lokales Fallback-Bild angezeigt
- **Keine Endlosschleifen**: Fallback wird nur EINMAL versucht
- **Progressive Opacity**: Sanftes Einblenden wenn Bild geladen ist

#### Verwendung:
```tsx
import { SafeImage } from '@/components/SafeImage';

<SafeImage
  src={track.albumArt}  // ECHTE URL aus den Daten!
  alt={`${track.artist} - ${track.title}`}
  width={200}
  height={200}
  priority={false}  // true für Above-the-fold Bilder
/>
```

### 4. AlbumArtwork Komponente
Die `AlbumArtwork` Komponente nutzt intern `SafeImage` und fügt zusätzliche Features hinzu:
- Hover-Effekte mit Chromatic Aberration
- Glow-Effekte (primary, accent, violet)
- Größen-Varianten (small, medium, large)

### 5. Chart-Listen Rendering
**WICHTIG**: Listen-Daten (Bandnamen, Rankings, Votes) werden SOFORT gerendert.
- Das Rendering wird NICHT durch ladende Bilder blockiert
- Bilder laden asynchron im Hintergrund
- Skeleton-Boxen reservieren den Platz

### 6. Artwork Cache Service
Der `artworkCacheService` (`/src/services/artworkCacheService.ts`):
- Cached geladene Bilder im Memory
- Verhindert doppelte Requests
- Priorisiert sichtbare und kommende Tracks
- KEIN MOCKING - nur echte URLs

## Integration in bestehende Komponenten

### ChartEntry.tsx
```tsx
<AlbumArtwork
  src={track.albumArt}  // ← ECHTE URL
  alt={`${track.artist} - ${track.title}`}
  size="medium"
  glowColor={glowColor}
/>
```

### ChartCategory.tsx
Ähnlich wie ChartEntry - nutzt AlbumArtwork Komponente

### Profil-Ansichten
Sollen ebenfalls SafeImage verwenden für:
- Profilbilder
- Cover-Images
- Badge-Icons

## Anti-Patterns (VERBOTEN!)

❌ **NIEMALS** Mock-URLs generieren
❌ **NIEMALS** Platzhalter-Logik in AlbumArtwork
❌ **NIEMALS** direktes `<img src={url}>` ohne wsrv.nl
❌ **NIEMALS** Endlosschleifen bei Fallback-Bildern
❌ **NIEMALS** Listen-Rendering durch Bilder blockieren

## Debugging

Wenn Bilder nicht laden:
1. Console öffnen - werden Fehler angezeigt?
2. Network-Tab: Sieht man wsrv.nl-Requests?
3. Sind die Original-URLs in den Track-Daten korrekt?
4. Cache-Stats prüfen: `artworkCacheService.getCacheStats()`

## Performance-Optimierung

- **Priority Loading**: Above-the-fold Bilder mit `priority={true}`
- **Lazy Loading**: Off-screen Bilder mit `loading="lazy"`
- **WebP Format**: wsrv.nl konvertiert automatisch zu WebP
- **Batch-Loading**: Max 3 Bilder parallel im Cache-Service

## Zusammenfassung

Die SafeImage-Architektur stellt sicher, dass:
✅ Alle Bilder über wsrv.nl gecached werden
✅ UI-Listen sofort rendern (Text-Daten)
✅ Bilder asynchron nachgeladen werden
✅ Fehler elegant behandelt werden
✅ KEINE Mock-Daten verwendet werden
✅ Performance optimal ist
