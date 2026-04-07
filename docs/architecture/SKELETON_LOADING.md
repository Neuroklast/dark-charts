# Skeleton Loading System - Implementierung

## Übersicht

Die Dark Charts App verfügt jetzt über ein vollständiges, hochwertiges Skeleton Loading System, das während des Ladens asynchroner Daten angezeigt wird.

## Implementierte Komponenten

### 1. ChartEntrySkeleton (`src/components/skeletons/ChartEntrySkeleton.tsx`)
- Skeleton für einzelne Chart-Einträge in den vollständigen Listen
- Zeigt Platzhalter für: Rang, Album-Cover, Titel, Artist, Genres, Wochen, Votes und Spotify-Embed
- Nutzt gestaffelte Verzögerungen (staggered delays) basierend auf dem Index
- Dunkle Farbgebung (`bg-zinc-800/80`) passend zum Brutalismus-Design

### 2. ChartCategorySkeleton (`src/components/skeletons/ChartCategorySkeleton.tsx`)
- Skeleton für die Top-3-Karten auf der Übersichtsseite
- Zeigt 3 kompakte Chart-Einträge mit gestaffelten Animationen
- Behält die Cyber-Card-Ästhetik bei

### 3. ProfileSkeleton (`src/components/skeletons/ProfileSkeleton.tsx`)
- Skeleton für Profil-Daten
- Zeigt Avatar, Benutzername und Statistik-Karten
- Gestaffelte Animationen für organisches Erscheinungsbild

### 4. GenreChartsSkeleton (`src/components/skeletons/GenreChartsSkeleton.tsx`)
- Skeleton für Genre-spezifische Charts
- Nutzt 10 ChartEntrySkeletons mit gestaffelten Delays

## Integration

### ChartCategory.tsx
- Ersetzt den alten, generischen Skeleton-Code
- Nutzt jetzt die spezialisierte `ChartCategorySkeleton`-Komponente

### App.tsx
- Integriert `ChartEntrySkeleton` in allen drei Pillars (Fan, Expert, Streaming)
- Zeigt 10 Skeleton-Einträge während des Ladens

### GenreCharts.tsx
- Zeigt Skeleton-Komponenten während des Ladens der Genre-Charts
- Behält die Chart-Header bei für bessere UX

## Mock-Data-Service

### Künstliche Verzögerung
Die `MockDataService` (`src/services/mockDataService.ts`) wurde aktualisiert:
- Standard-Verzögerung: **1800ms (1,8 Sekunden)**
- Simuliert realistische Netzwerk-Ladezeiten
- Erlaubt dem Benutzer, die Skeleton-Animationen zu sehen

## Design-Prinzipien

### Dark Metal Aesthetic
- **Dunkle Farben**: `bg-zinc-800/80` statt generisches Grau
- **Pulsing Animation**: Sanfte `animate-pulse` Effekte
- **Staggered Reveals**: Verzögerte Animationen (100ms pro Item) für organisches Erscheinungsbild
- **Exakte Geometrie**: Skeletons spiegeln die finalen Elemente genau wider

### Struktur-Treue
Jedes Skeleton behält die exakte Struktur des finalen Elements bei:
- Quadrate für Album-Cover (w-20 h-20)
- Schmale Balken für Titel (h-6 w-3/4)
- Kleine Blöcke für Metadaten (Votes, Wochen, etc.)
- Cyber-Card-Border und Scanline-Effekte

## Erhaltene Features

✅ **Alle bestehenden Features bleiben intakt:**
- Custom Weighting Engine (Slider)
- Error Boundaries
- Framer Motion Animationen
- Album Artwork Loading (mit SpinnerGap in AlbumArtwork.tsx)
- Spotify Embeds
- Genre-Filter
- Navigation
- Alle Chart-Typen (Fan, Expert, Streaming, Overall)
- Main Genre und Sub-Genre Navigation

## Keine Entfernungen

❌ **NICHTS wurde entfernt:**
- Keine UI-Elemente
- Keine Features
- Keine Komponenten
- Keine Funktionalität

## Verwendung

Das Skeleton-System aktiviert sich automatisch basierend auf dem `isLoading`-State:

```tsx
{isLoading ? (
  <div>
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
      <ChartEntrySkeleton key={index} index={index} />
    ))}
  </div>
) : (
  // Echte Daten
)}
```

## Staggered Animation Details

- **ChartEntry**: 100ms Verzögerung pro Index
- **ChartCategory**: 150ms Verzögerung pro Item
- **Profile Cards**: 100ms Verzögerung pro Card

Dies erzeugt einen wellenartigen, organischen Ladeeffekt.
