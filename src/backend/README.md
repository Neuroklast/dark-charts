# Backend CMS Architecture

## Übersicht

Dieses Dokument beschreibt die vollständige Backend-Architektur für das Dark Charts CMS. Die Architektur folgt strikten Schichtenprinzipien mit maximaler Entkopplung, um eine einfache Migration der Datenbank und Infrastruktur in der Zukunft zu ermöglichen.

## Architektur-Prinzipien

### 1. Strikte Schichtenarchitektur

Die Backend-Architektur ist in drei voneinander getrennte Schichten unterteilt:

```
┌─────────────────────────────────────┐
│    Controller Layer (API Routes)    │  ← Validierung & Routing
├─────────────────────────────────────┤
│      Service Layer (Business)       │  ← Geschäftslogik
├─────────────────────────────────────┤
│   Repository Layer (Data Access)    │  ← Datenzugriff
└─────────────────────────────────────┘
```

### 2. Repository Pattern

- Die Service-Schicht kommuniziert **niemals** direkt mit der Datenbank
- Alle Datenzugriffe erfolgen über Interfaces (`IArtistRepository`, `IChartRepository`)
- Konkrete Implementierungen (z.B. `SparkKVArtistRepository`) können ausgetauscht werden
- Ermöglicht einfache Migration zu PostgreSQL, MongoDB, MySQL etc.

### 3. Infrastruktur-Unabhängigkeit

- Kernmodelle (`Artist`, `ChartEntry`) sind vollständig unabhängig von spezifischen Datenbankmodellen
- Services enthalten **reine Geschäftslogik**, keinerlei Infrastruktur-Code
- DTOs (Data Transfer Objects) für klare Schnittstellen

## Ordnerstruktur

```
src/backend/
├── models/              # Domänenmodelle (infrastruktur-unabhängig)
│   ├── Artist.ts        # Artist-Entität mit DTOs
│   └── ChartEntry.ts    # ChartEntry-Entität mit DTOs
│
├── repositories/        # Repository-Pattern Interfaces & Implementierungen
│   ├── IArtistRepository.ts          # Artist Repository Interface
│   ├── IChartRepository.ts           # Chart Repository Interface
│   ├── SparkKVArtistRepository.ts    # Spark KV Implementierung
│   └── SparkKVChartRepository.ts     # Spark KV Implementierung
│
└── services/            # Geschäftslogik (reine Services)
    ├── ArtistService.ts # Artist-Verwaltung
    └── ChartService.ts  # Chart-Verwaltung
```

## Datenmodelle

### Artist

```typescript
interface Artist {
  id: string;
  name: string;
  bio?: string;
  country?: string;
  foundedYear?: number;
  imageUrl?: string;
  genres: string[];
  verified: boolean;
  socialLinks?: {
    spotify?: string;
    bandcamp?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### ChartEntry

```typescript
interface ChartEntry {
  id: string;
  trackId: string;
  artistId: string;
  chartType: 'fan' | 'expert' | 'streaming';
  position: number;
  previousPosition: number | null;
  weeksInChart: number;
  votes: number;
  score: number;
  weekNumber: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Repository Layer

### Interface-Definition

Repositories definieren ausschließlich **WAS** gemacht wird, nicht **WIE**:

```typescript
interface IArtistRepository {
  findAll(): Promise<Artist[]>;
  findById(id: string): Promise<Artist | null>;
  create(dto: CreateArtistDTO): Promise<Artist>;
  update(id: string, dto: UpdateArtistDTO): Promise<Artist | null>;
  delete(id: string): Promise<boolean>;
  // ...weitere Methoden
}
```

### Aktuelle Implementierung: Spark KV

Die Repositories nutzen derzeit die Spark KV API für die Datenpersistenz:

```typescript
class SparkKVArtistRepository implements IArtistRepository {
  private readonly ARTISTS_KEY = 'cms:artists';
  private readonly ARTIST_PREFIX = 'cms:artist:';

  async findAll(): Promise<Artist[]> {
    const artists = await window.spark.kv.get<Artist[]>(this.ARTISTS_KEY);
    return artists || [];
  }
  // ...
}
```

### Einfache Migration

Um auf eine PostgreSQL-Datenbank zu migrieren, erstellen Sie einfach:

```typescript
class PostgresArtistRepository implements IArtistRepository {
  constructor(private dbClient: PostgresClient) {}

  async findAll(): Promise<Artist[]> {
    const result = await this.dbClient.query('SELECT * FROM artists');
    return result.rows;
  }
  // ...
}
```

Die Services müssen **nicht** geändert werden!

## Service Layer

Services enthalten die reine Geschäftslogik:

- Validierung von Geschäftsregeln
- Orchestrierung von Repository-Aufrufen
- Keine direkten Datenbankzugriffe
- Keine UI-Logik

### Beispiel: ArtistService

```typescript
class ArtistService {
  constructor(private artistRepository: IArtistRepository) {}

  async createArtist(dto: CreateArtistDTO): Promise<Artist> {
    // Geschäftsregel: Name muss eindeutig sein
    const existing = await this.artistRepository.findByName(dto.name);
    if (existing) {
      throw new Error(`Artist "${dto.name}" existiert bereits`);
    }

    // Validierung
    this.validateCreateArtistDTO(dto);

    // Repository aufrufen
    return this.artistRepository.create(dto);
  }
}
```

## Controller Layer (zukünftig)

Die Controller-Schicht wird API-Routen bereitstellen:

```typescript
// Beispiel für zukünftige Implementierung
class ArtistController {
  constructor(private artistService: ArtistService) {}

  async getAllArtists(req: Request, res: Response) {
    try {
      const artists = await this.artistService.getAllArtists();
      res.json({ success: true, data: artists });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
```

## Verwendung

### 1. Repository instanziieren

```typescript
const artistRepo = new SparkKVArtistRepository();
const chartRepo = new SparkKVChartRepository();
```

### 2. Service instanziieren

```typescript
const artistService = new ArtistService(artistRepo);
const chartService = new ChartService(chartRepo);
```

### 3. Service nutzen

```typescript
// Artist erstellen
const newArtist = await artistService.createArtist({
  name: 'Eisbrecher',
  genres: ['Neue Deutsche Härte', 'Industrial Metal'],
  country: 'Germany',
  foundedYear: 2003
});

// Charts abrufen
const currentFanCharts = await chartService.getCurrentWeekChart('fan');
```

## Migration-Strategie

### Schritt 1: Neue Repository-Implementierung

Erstellen Sie eine neue Repository-Klasse, die das Interface implementiert:

```typescript
class PostgresArtistRepository implements IArtistRepository {
  // Implementierung mit PostgreSQL
}
```

### Schritt 2: Dependency Injection anpassen

Ändern Sie nur die Instanziierung:

```typescript
// Alt:
const artistRepo = new SparkKVArtistRepository();

// Neu:
const artistRepo = new PostgresArtistRepository(dbConnection);

// Service bleibt unverändert!
const artistService = new ArtistService(artistRepo);
```

### Schritt 3: Fertig!

Die gesamte Geschäftslogik bleibt intakt, keine Änderungen an Services oder UI notwendig.

## Best Practices

1. **Services bleiben rein**: Niemals direkte `window.spark.kv`-Aufrufe in Services
2. **Interfaces first**: Zuerst Interface definieren, dann implementieren
3. **DTOs nutzen**: Klare Trennung zwischen Eingabe-Daten und Domänenmodellen
4. **Validierung in Services**: Geschäftsregeln gehören in die Service-Schicht
5. **Error Handling**: Services werfen Fehler, Controller fangen sie ab

## Vorteile dieser Architektur

✅ **Einfache Testbarkeit**: Services können mit Mock-Repositories getestet werden  
✅ **Maximale Flexibilität**: Datenbank-Technologie ist austauschbar  
✅ **Klare Verantwortlichkeiten**: Jede Schicht hat eine einzige, klar definierte Aufgabe  
✅ **Wiederverwendbarkeit**: Services können mit verschiedenen Repository-Implementierungen genutzt werden  
✅ **Skalierbarkeit**: Einfaches Hinzufügen neuer Features ohne Refactoring

## Nächste Schritte

1. Controller-Layer implementieren (API-Routen)
2. Authentifizierungs-Service hinzufügen
3. API-Validierungs-Middleware
4. PostgreSQL-Repository-Implementierungen erstellen
5. Unit-Tests für Services schreiben
