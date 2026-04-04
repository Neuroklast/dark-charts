# Streaming Chart Calculation Service

## Überblick

Der `StreamingChartCalculationService` berechnet faire Rankings für die Streaming-Charts der Dark Charts Plattform. Der Service implementiert einen mathematischen Algorithmus, der kleine und große Bands gleichermaßen fair bewertet.

## Mathematische Grundlagen

Der Service kombiniert drei unabhängige Metriken zu einem finalen Score:

### 1. Logarithmische Skalierung (Absolute Streams)

**Formel:**
```
logarithmicScore = log₁₀(totalStreams + 1) × 100
```

**Prinzip:**
- Die Punktedifferenz zwischen 10 und 100 Streams ist deutlich größer als zwischen 10.000 und 100.000 Streams
- Verhindert, dass etablierte Bands mit Millionen Streams automatisch dominieren
- Gibt kleinen Bands mit wenigen, aber loyalen Hörern eine faire Chance

**Beispielwerte:**
- 10 Streams → Score: ~104
- 100 Streams → Score: ~200
- 1.000 Streams → Score: ~300
- 10.000 Streams → Score: ~400
- 100.000 Streams → Score: ~500

**Differenzen:**
- 10 → 100 Streams: +96 Punkte
- 10.000 → 100.000 Streams: +100 Punkte (trotz 10x mehr absoluter Streams)

### 2. Wachstumsfaktor (Prozentuale Veränderung)

**Formel für positives Wachstum:**
```
growthFactor = 1 + (log₁₀(weeklyGrowthPercentage + 1) / 10)
```
**Obergrenze:** 3.0 (300% Multiplikator)

**Formel für negatives Wachstum:**
```
growthFactor = max(0.5, 1 + (weeklyGrowthPercentage / 100))
```
**Untergrenze:** 0.5 (50% des Basis-Scores)

**Prinzip:**
- Hohes prozentuales Wachstum wird stark belohnt
- Ein Track, der von 50 auf 150 Streams wächst (+200%), erhält einen deutlich höheren Boost als ein Track, der von 100.000 auf 110.000 Streams wächst (+10%)
- Negative Trends werden abgestraft, aber nicht vernichtend bestraft

**Beispielwerte:**
- 0% Wachstum → Faktor: 1.0 (neutral)
- +50% Wachstum → Faktor: ~1.17
- +100% Wachstum → Faktor: ~1.30
- +500% Wachstum → Faktor: ~1.77
- -20% Wachstum → Faktor: 0.80
- -50% Wachstum → Faktor: 0.50 (Minimum)

### 3. Engagement Ratio (Streams pro Follower)

**Formel:**
```
engagementRatio = log₁₀((totalStreams / followerCount) + 1) / 2
```
**Obergrenze:** 2.0 (200% Bonus)

**Prinzip:**
- Bewertet die Intensität der Hörerschaft relativ zur Fanbase-Größe
- Eine kleine Band mit 100 Followern und 500 Streams hat ein besseres Engagement als eine große Band mit 10.000 Followern und 15.000 Streams
- Verhindert, dass reine Followerzahlen das Ranking dominieren

**Beispielwerte:**
- 1.000 Streams / 1.000 Follower (1:1) → Bonus: ~0.15
- 5.000 Streams / 500 Follower (10:1) → Bonus: ~0.52
- 10.000 Streams / 200 Follower (50:1) → Bonus: ~0.86

**Spezialfall:**
- Band ohne Follower, aber mit Streams → Maximaler Bonus: 2.0

### 4. Finale Scoreberechnung

**Formel:**
```
finalScore = logarithmicScore × growthFactor × (1 + engagementRatio)
```

**Erklärung:**
- Der logarithmische Score bildet die Basis
- Der Wachstumsfaktor multipliziert den Score (Trend-Boost)
- Die Engagement Ratio addiert einen proportionalen Bonus (Loyalitäts-Boost)

## Implementierungsdetails

### Service-Architektur

```typescript
export class StreamingChartCalculationService {
  constructor(private artistRepository: IArtistRepository) {}
  
  async calculateStreamingCharts(): Promise<StreamingChartResult[]>
  private calculateScore(metrics: StreamingMetrics): StreamingScore
  private calculateLogarithmicScore(totalStreams: number): number
  private calculateGrowthFactor(weeklyGrowthPercentage: number): number
  private calculateEngagementRatio(totalStreams: number, followerCount: number): number
}
```

### Workflow

1. **Daten sammeln:** Alle Artist-Einträge werden aus dem Repository geladen
2. **Metriken aggregieren:** Für jeden Artist werden aktuelle Streams, vorherige Streams und Follower abgerufen
3. **Scores berechnen:** Die drei Komponenten werden für jeden Artist berechnet
4. **Ranking erstellen:** Die Artists werden nach finalScore absteigend sortiert
5. **Ergebnis zurückgeben:** Top 10 (oder konfigurierbare Anzahl) werden zurückgegeben

### Fehlerbehandlung

- Artists ohne verfügbare Daten werden übersprungen (nicht das gesamte Ranking blockiert)
- Null-Checks auf allen externen Daten
- Defensive Programmierung gegen Division durch Null
- Logging aller Fehler für Monitoring

## Verwendung

```typescript
import { StreamingChartCalculationService } from './backend/services/StreamingChartCalculationService';
import { SparkKVArtistRepository } from './backend/repositories/SparkKVArtistRepository';

const artistRepo = new SparkKVArtistRepository();
const streamingService = new StreamingChartCalculationService(artistRepo);

const rankings = await streamingService.calculateStreamingCharts();

rankings.forEach((entry, index) => {
  console.log(`${index + 1}. ${entry.artistName} - Score: ${entry.score.toFixed(2)}`);
  console.log(`   Streams: ${entry.totalStreams}, Growth: ${entry.weeklyGrowth}%`);
  console.log(`   Engagement: ${entry.engagementRatio.toFixed(2)}`);
});
```

## Integration mit DataService

Der Service kann in den bestehenden `DataService` integriert werden:

```typescript
class DataService {
  async getStreamingCharts(): Promise<StreamingChartResult[]> {
    const service = new StreamingChartCalculationService(this.artistRepository);
    return await service.calculateStreamingCharts();
  }
}
```

## Erweiterbarkeit

Der Service ist so konzipiert, dass er leicht erweitert werden kann:

- **Zusätzliche Metriken:** Neue Faktoren (z.B. geografische Diversität) können hinzugefügt werden
- **Anpassbare Gewichtung:** Die Multiplikatoren können über Konfiguration gesteuert werden
- **Genre-spezifische Algorithmen:** Unterschiedliche Formeln für verschiedene Subgenres
- **Zeitbasierte Analysen:** Monatliche statt wöchentliche Auswertungen für Nischen-Genres

## Mathematische Fairness-Garantien

1. **Anti-Major-Label-Bias:** Logarithmische Skalierung verhindert, dass absolute Größe dominiert
2. **Pro-Emerging-Artists:** Wachstumsfaktor belohnt aufstrebende Acts überproportional
3. **Pro-Loyalität:** Engagement Ratio bevorzugt intensive Hörerschaft über passive Follower
4. **Sybil-Resistent:** Alle Metriken basieren auf schwer zu fälschenden Plattformdaten (Spotify/Apple Music)

## Performance-Überlegungen

- **Caching:** Streaming-Daten sollten zwischengespeichert werden (24h Cache)
- **Batch-Verarbeitung:** Artists sollten in Batches verarbeitet werden (z.B. 50 parallel)
- **Rate Limiting:** Externe API-Calls müssen throttled werden
- **Incremental Updates:** Nur geänderte Daten sollten neu berechnet werden

## Testing

Unit Tests sollten folgende Szenarien abdecken:

```typescript
describe('StreamingChartCalculationService', () => {
  it('berechnet höhere Scores für hohes Wachstum', () => {
    // Band A: 1000 Streams, +200% Wachstum
    // Band B: 10000 Streams, +10% Wachstum
    // Erwartung: Band A hat relativ besseren Score
  });
  
  it('bevorzugt hohes Engagement bei kleiner Base', () => {
    // Band A: 500 Streams, 100 Follower (5:1)
    // Band B: 5000 Streams, 5000 Follower (1:1)
    // Erwartung: Band A erhält höheren Engagement-Bonus
  });
  
  it('behandelt negative Trends fair', () => {
    // Band mit -30% Wachstum sollte nicht auf 0 fallen
  });
});
```

## Offene TODOs

- [ ] Integration mit Spotify Web API für echte Streaming-Daten
- [ ] Implementierung von Apple Music API
- [ ] Caching-Layer für Metriken
- [ ] Admin-Panel zur Anpassung der Algorithmus-Parameter
- [ ] A/B-Testing verschiedener Gewichtungen
- [ ] Historische Score-Persistierung für Trendanalysen
