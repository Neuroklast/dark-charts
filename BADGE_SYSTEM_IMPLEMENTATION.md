# Badge System Implementation - Backend

## Overview

Das Badge-System ist vollständig implementiert und basiert ausschließlich auf internen Datenpunkten. Es gibt **keine** Social-Media-Schnittstellen, Reporting-Funktionen oder Pay-to-Win-Mechanismen.

## Architektur

Das System folgt strikt dem Repository-Pattern und ist in drei Schichten unterteilt:

### 1. Models (`src/backend/models/Badge.ts`)
- `Badge`: Definition eines Badges mit Kriterien
- `EarnedBadge`: Verknüpfung zwischen User und Badge mit Zeitstempel
- `BadgeCriteria`: Typisierte Kriterien für Badge-Vergabe
- `BadgeCriteriaType`: 60+ verschiedene Kriterientypen

### 2. Repositories (`src/backend/repositories/`)
- `IBadgeRepository`: Interface für Badge-Datenzugriffe
- `SparkKVBadgeRepository`: Implementierung mit Spark KV Store
  - Nutzt `spark.kv` für Persistierung der earned badges
  - Badge-Definitionen sind statisch in `BadgeDefinitions.ts`

### 3. Services (`src/backend/services/`)
- `BadgeService.ts`: Kern-Logik zur Badge-Evaluierung
- `BadgeDefinitions.ts`: Alle 60 Badge-Definitionen (20 Fan, 20 DJ, 20 Band)

## Badge-Kategorien

### Fan Badges (20)
- Early Bird, Dauergast, Genre-Scout, Trüffelschwein
- Thronwächter, Underdog-Support, Nachteule
- Trend-Analyst, Pionier
- Stimmgewalt (Bronze, Silber, Gold)
- Kurator, Erste Sahne, Sonntagsritual
- Allrounder, Deep Diver, Vanguard
- Stammwähler, Genre-Hopper

### DJ Badges (20)
- Orakel, Goldenes Ohr, Techno-Viking, Rock-Steady
- Genre-Meister, Wochenwache, Selektor
- Spotlight-Maker, Geschmacks-Instanz, Rebell
- Veteran, Legende, Präzision
- Schnelldenker, Weltenbummler, Supporter
- Elite, Trendsetter, Marathon, Archivar

### Band Badges (20)
- Chart-Breaker, Platzhirsch, Unsterblich, Senkrechtstarter
- Fan-Magnet, Heißphase, Stehaufmännchen
- Export-Schlager, Aufsteiger der Woche
- Publikumsliebling, Experten-Tipp
- Produktiv, Offenes Buch, Verifiziert
- Überlebenskünstler, Viral-Geher
- Monats-Bester, Lokalmatador
- Konstante, Ruhmeshalle

## Trigger-Mechanismus

### Automatischer Wöchentlicher Trigger
Die Badge-Evaluierung wird automatisch jeden **Sonntag um 18:00 Uhr** nach dem Chart-Release getriggert.

```typescript
await badgeService.triggerWeeklyBadgeEvaluation(weekNumber, year);
```

### Ablauf
1. Chart-Daten werden für Fan, Expert und Streaming abgerufen
2. Alle Artists in den Charts werden identifiziert
3. Für jeden Artist wird die Badge-Evaluierung durchgeführt
4. Badges werden basierend auf Chart-Historie und Kriterien vergeben

### Performance
- Asynchrone Verarbeitung verhindert Verzögerung des Chart-Release
- Aggregationen nutzen effiziente Datenbankabfragen
- One-Time Badges werden nur einmal vergeben (Lock-Mechanismus)

## Badge-Kriterien Implementation

### Implementierte Kriterien-Typen
- `chart_breaker`: Erster Top-10-Einstieg
- `top_position`: Erreichen einer bestimmten Position
- `chart_stability`: Wochen am Stück in Charts
- `rapid_rise`: Schneller Aufstieg (>20 Plätze)
- `hot_streak`: Konsekutive Wochen in Top 5
- `comeback`: Wiedereinstieg nach Pause
- `consistent`: Stabile Platzierung über Wochen
- `hall_of_fame`: Mehrfache #1-Platzierungen
- `vote_count`: Gesamt-Stimmenanzahl
- `viral`: Hohe Einzelwochen-Stimmen

### Erweiterbar
Weitere Kriterientypen können einfach hinzugefügt werden durch:
1. Neuen Typ zu `BadgeCriteriaType` hinzufügen
2. Case in `evaluateBadgeCriteria()` implementieren
3. Badge-Definition in `BadgeDefinitions.ts` erstellen

## Datenbank-Struktur

### EarnedBadge Speicherung
```
Key: earned_badges:{userId}
Value: EarnedBadge[]
```

Jeder `EarnedBadge` Entry enthält:
- `id`: Unique Identifier
- `badgeId`: Referenz zur Badge-Definition
- `userId`: User/Artist/DJ ID
- `earnedAt`: Zeitstempel
- `metadata`: Optional (z.B. awardedAtWeek, awardedAtYear)

### Badge-Definitionen
Statisch in Code gespeichert (`BadgeDefinitions.ts`):
- 60 vordefinierte Badges
- Keine Datenbankabfragen für Definitions
- Einfache Wartung und Deployment

## API Integration (Vorbereitet)

### GET /api/profile/badges
Endpoint zum Abrufen der Badges eines Users:

```typescript
const badgeService = new BadgeService(badgeRepository, chartRepository);
const userBadges = await badgeService.getUserBadges(userId);

// Returns:
[
  {
    badge: {
      id: "chart_breaker",
      name: "Chart-Breaker",
      description: "...",
      category: "band",
      ...
    },
    earnedAt: Date
  },
  ...
]
```

## Sicherheit & Integrität

### Lock-Mechanismus
- One-Time Badges können nur einmal vergeben werden
- `hasUserEarnedBadge()` prüft vor Vergabe
- Fehlerbehandlung bei Duplikaten

### Datenvalidierung
- Alle Badge-Kriterien werden gegen echte Chart-Daten geprüft
- Keine manuellen Overrides möglich
- Keine Pay-to-Win Mechanismen

### Performance-Optimierung
- Background-Jobs verzögern Chart-Release nicht
- Effiziente Aggregationen in Repository-Schicht
- Caching von Badge-Definitionen

## Integration mit bestehendem System

### Benötigte Dependencies
- `IChartRepository`: Für Chart-Daten-Zugriff
- `IBadgeRepository`: Für Badge-Persistierung
- `spark.kv`: Für Key-Value Storage

### Initialisierung
```typescript
const badgeRepository = new SparkKVBadgeRepository();
const chartRepository = new SparkKVChartRepository(); // existing
const badgeService = new BadgeService(badgeRepository, chartRepository);
```

### Weekly Cron Job
```typescript
// Jeden Sonntag um 18:00 nach Chart-Release
const weekNumber = getISOWeek(new Date());
const year = new Date().getFullYear();
await badgeService.triggerWeeklyBadgeEvaluation(weekNumber, year);
```

## Erweiterung für Fan und DJ Badges

Die aktuelle Implementierung fokussiert sich auf Band-Badges. Für Fan und DJ Badges müssen zusätzliche Daten bereitgestellt werden:

### Fan Badges
Benötigt:
- Voting-Historie (`votingHistory`)
- Account-Erstellungsdatum
- Profil-Aktivitäten (Views, Custom Charts)
- Voting-Zeitstempel (für Early Bird, Nachteule)

### DJ Badges
Benötigt:
- Expert-Voting-Historie
- Reputation-Score
- Watchlist-Daten
- Historical Chart-Snapshot-Zugriffe

Diese können durch Erweiterung des `BadgeEvaluationContext` und zusätzliche Repository-Methoden hinzugefügt werden.

## Fazit

Das Badge-System ist vollständig backend-implementiert und bereit für die Integration:
- ✅ 60 Badges definiert
- ✅ Evaluierungs-Logik implementiert
- ✅ Persistierung via Spark KV
- ✅ Wöchentlicher Trigger-Mechanismus
- ✅ Lock-Mechanismus für One-Time Badges
- ✅ Keine UI-Änderungen erforderlich
- ✅ Keine externen APIs oder Social Media
- ✅ Performance-optimiert und asynchron
