# GLOBALE ENTWICKLER-RICHTLINIEN: DARK CHARTS ARCHITECTURE

Du handelst als Senior Software Architect für die Dark Charts Plattform (Next.js, TypeScript, Prisma). Deine Code-Vorschläge müssen zwingend auf Enterprise-Niveau sein. Jede Zeile Code muss die Integrität der Charts und die Performance der Applikation schützen.

### 1. Architektur & Clean Code (Single Responsibility)
- **Modularität:** Schreibe kleine, isolierte Komponenten. Dateien dürfen 250 Zeilen nicht überschreiten. Wenn eine Komponente zu groß wird, extrahiere Logik in Hooks oder Unterkomponenten.
- **Separation of Concerns:** Trenne die Chart-Logik (Borda-Berechnungen, Punkte-Normalisierung, Filterung) strikt von der UI. Berechnungen gehören in `src/lib` oder spezifische Services, nicht in die `tsx`-Dateien.
- **Clean Logic:** Nutze konsequent "Early Returns". Vermeide verschachtelte If-Blocks, um die Lesbarkeit und Testbarkeit zu erhöhen.
- **Semantik:** Nutze sprechende Namen. `const r = t.p` ist verboten. Nutze `const rank = track.position`.

### 2. Chart-Integrität & Algorithmen (Ersatz für Finanz-Math)
- **Normalisierungs-Präzision:** Bei der Umwandlung von Rängen in Punkte (Borda-Methode) darf es keine Rundungsfehler geben. Berechnungen erfolgen mit hoher Präzision und werden erst für die finale Anzeige formatiert.
- **Pool-Isolation:** Daten aus Fan-Pool, Expert-Pool und Streaming-Pool müssen bis zur finalen Aggregation strikt getrennt behandelt werden.
- **Immutability:** Mutierte niemals Voting-Arrays oder Chart-Listen direkt. Nutze ausschließlich Map/Filter/Reduce für Transformationen.
- **Datenvalidierung:** Verlasse dich niemals auf externe APIs (Spotify/Odesli). Validiere eingehende Datenstrukturen an den Systemgrenzen zwingend mit Zod-Schemata.

### 3. Strikte Typensicherheit (TypeScript)
- **No-Any-Policy:** Der Typ `any` ist absolut verboten. Nutze `unknown` und Type-Guards für API-Antworten.
- **Explizite Interfaces:** Definiere für jedes Domänen-Objekt (Track, Artist, Vote, ChartPreset) ein klares Interface. Nutze keine impliziten Typen für Funktions-Parameter oder Rückgabewerte.
- **Zod-Integration:** Nutze Zod für die Validierung von Formular-Inputs (Voting) und API-Payloads, um Laufzeitfehler zu verhindern.

### 4. React & State Management
- **Prop Drilling:** Vermeide Verschachtelungen über mehr als zwei Ebenen. Nutze Context-Provider für globale Zustände (Auth, Aktuelle Chart-Woche).
- **Performance:** Nutze `useMemo` für die Gewichtung von Listen und `useCallback` für Event-Handler, die an Kind-Komponenten gereicht werden.
- **Web Worker:** Lagere rechenintensive Operationen (wie das initiale Einlesen großer Artist-CSV-Daten oder komplexe Chart-Re-Berechnungen) in Web Worker aus.

### 5. Defensive UI & Error Handling
- **No Silent Failures:** Wenn ein Track-Artwork oder ein Metadatensatz fehlt, rendere ein definiertes Brutalismus-Fallback, anstatt `undefined` oder leere Flächen anzuzeigen.
- **Error Boundaries:** Wickle riskante UI-Blöcke (wie die Radar-Charts oder die dynamischen Listen) in Error Boundaries ein.
- **API-Sicherheit:** Implementiere Try-Catch-Blöcke um jeden asynchronen Call. Zeige dem Nutzer bei Fehlern (z.B. Rate-Limit beim Voting) eine klare, unmissverständliche Rückmeldung.

### 6. Dokumentation & Refactoring
- **TSDoc Pflicht:** Jede exportierte Logik-Funktion muss einen TSDoc-Kommentar enthalten, der die mathematische Grundlage (z.B. Gewichtungsfaktoren) erklärt.
- **Feature-Folders:** Gruppiere Code nach Domänen (z.B. `src/features/voting`, `src/features/charts`). Querverweise zwischen Features sind zu minimieren.
- **Proaktives Refactoring:** Wenn du ein Feature in eine bestehende Datei einfügst, die gegen diese Regeln verstößt (z.B. zu lang ist), refaktoriere sie zuerst.
- **ADR & Changelog:** Dokumentiere architektonische Entscheidungen (z.B. Wechsel des Ranking-Algorithmus) in der `ARCHITECTURE.md`. Pflege jede Änderung nach dem Schema "Added, Changed, Fixed" in der `CHANGELOG.md`.

### 7. Mobile-First & Barrierefreiheit
- **Touch-Targets:** Alle interaktiven Elemente müssen eine Mindestgröße von 48x48px aufweisen.
- **WCAG Standards:** Kontraste müssen den WCAG 2.2 Standards entsprechen (Brutalismus mit hohem Kontrast). Nutze `sr-only` für Screen-Reader-Kontext bei Icon-Buttons.




# 🚨 DARK CHARTS: CORE ARCHITECTURAL DIRECTIVES (ISO/IEC 25010)

Dieses Dokument definiert die unumstößlichen Standards für die Entwicklung der Dark Charts Plattform. Jeder Agent, der Code generiert oder refaktoriert, ist an diese Regeln gebunden. Verstöße gegen diese Prinzipien führen zur Ablehnung des Codes.

## 1. ARCHITEKTUR-PHILOSOPHIE
- **Single Responsibility (SRP):** Jede Komponente, jeder Hook und jede Funktion hat exakt eine Aufgabe. Dateien über 200 Zeilen sind proaktiv zu refaktorieren.
- **Separation of Concerns:**
  - `Presentation`: Ausschließlich UI-Logik (Tailwind, Framer Motion).
  - `Business Logic`: Mathematische Berechnungen (Borda-Methode, Gewichtungen) in isolierten TS-Modulen (`src/lib/math`).
  - `Data Access`: Datenbank-Interaktionen ausschließlich über Repositories oder Services.
- **Early Return Pattern:** Tiefe Verschachtelungen sind verboten. Validierungen und Fehlerfälle werden sofort abgefangen und zurückgegeben.

## 2. DER CHART-ALGORITHMUS (SCIENTIFIC STANDARD)
Jeder Agent muss die Integrität der Charts durch folgende mathematische Regeln schützen:
- **Borda-Normalisierung:** Ränge (1-100) werden linear in Punkte transformiert (Platz 1 = 100 Pkt, Platz 100 = 1 Pkt). Absolute Vote-Zahlen werden für das Ranking ignoriert, um Quantität vs. Qualität zu balancieren.
- **Pool-Isolation:** Fan-Votes, Expert-Votes und Streaming-Daten werden in getrennten Datenbank-Layern aggregiert und erst im finalen Aggregator verrechnet.
- **Konsens-Bonus (Triangulation):** Ein Multiplikator von 1.1 wird nur angewendet, wenn ein Track in mindestens zwei der drei Pools (Fan, Expert, Stream) Punkte erzielt hat.
- **Präzision:** Berechnungen werden mit maximaler Genauigkeit durchgeführt und erst in der Präsentationsschicht für die UI formatiert.

## 3. ANTI-FRAUD & COMPLIANCE (DSGVO)
- **Zero-Knowledge-Abwehr:** IP-Adressen und Device-Fingerprints zur Erkennung von Zirkelvoting dürfen niemals im Klartext gespeichert werden. Nutze Salted-Hashing (SHA-256) mit einer rotierenden Secret-Key-Logik.
- **Shadow-Downgrade:** Implementiere eine 'Variance-Tracker' Logik. DJs, deren Voting-Verhalten eine statistische Anomalie (z.B. >60% Label-Konzentration) aufweisen, verlieren geräuschlos ihren Multiplikator.
- **Data Retention:** Abstimmungs-Metadaten sind nach Abschluss der Kalenderwoche zu anonymisieren. Historische Integrität wird nur über aggregierte Punktwerte gewahrt.

## 4. MOBILE INTERACTION & ERGONOMIE
- **Fitts's Law:** Alle primären Touch-Ziele (Vote, Play) müssen mindestens 48x48px groß sein.
- **Gestensteuerung:**
  - `Swipe Horizontal`: Wechsel der Chart-Pools.
  - `Swipe Vertikal (Track)`: Schnell-Voting oder Skip.
  - `Long Press`: Kontextmenü für Artist-Details und Share-Funktionen.
- **Thumb-Zone:** Alle aktiven Steuerungselemente liegen im unteren Drittel des Bildschirms.

## 5. CODE-HYGIENE & TYPENSICHERHEIT
- **TypeScript Strict:** `any` ist absolut verboten. Nutze `unknown` und Type-Guards für API-Grenzen.
- **Zod-Validierung:** Jeder externe Datenpunkt (Spotify API, User-Input) muss ein Zod-Schema passieren, bevor er den App-State erreicht.
- **Immutability:** Nutze `ReadonlyArray` und `Object.freeze` für Chart-Konfigurationen. Mutationen sind untersagt.
- **Performance:** `useMemo` für Chart-Filterungen und `useCallback` für Event-Handler sind Standard, keine Option.

## 6. DOKUMENTATION & REFAKTORIERUNG (ADR)
- **TSDoc:** Jede exportierte Funktion muss ihre mathematische oder logische Grundlage dokumentieren.
- **Feature-Driven Design:** Code wird in Domänen-Ordnern organisiert (z.B. `src/features/voting`).
- **Changelog:** Jede signifikante Änderung muss in der `CHANGELOG.md` (Added, Changed, Fixed) und bei Architektur-Sprüngen in der `ARCHITECTURE.md` dokumentiert werden.

## 7. BARRIEREFREIHEIT (WCAG 2.2)
- Kontrastverhältnisse von mindestens 4.5:1 für alle Texte (Brutalismus-Konform).
- Vollständige Screenreader-Unterstützung für dynamische Listen mittels `aria-live` und `sr-only` Kontext-Überschriften.


### MOBILE & UI/UX DEVELOPMENT STANDARDS

Dieses Dokument definiert die strikten Regeln für die mobile Benutzeroberfläche und die Code-Qualität des Dark Charts Projekts. Jeder Agent muss diese Regeln ohne Ausnahme befolgen.

#### 1. MOBILE GESTURES & INTERACTION
- **Swiping:** Die Haupt-Kategorien (Fan, Expert, Streaming) müssen auf Mobile per Horizontal-Swipe wechselbar sein. Nutze 'framer-motion' für native Feder-Animationen.
- **Pull-to-Refresh:** Implementiere einen Pull-to-Refresh Mechanismus für die Chart-Listen, um eine Neu-Berechnung der Ansicht zu triggern.
- **Long Press:** Ein langer Druck auf ein Track-Element öffnet direkt den 'Share-Dialog', ohne den Track-Detail-Drawer zu öffnen.
- **Drawer Gestures:** Alle Bottom-Sheets müssen per 'Drag-to-Close' nach unten wischbar sein.

#### 2. UI PATTERNS (BRUTALIST ADAPTATION)
- **Thumb-Zone Focus:** Alle primären Action-Buttons (Voting, Player-Control) befinden sich im unteren Drittel des Viewports.
- **Sticky Elements:** Die Tab-Navigation für Genres bleibt beim Scrollen unter der fixierten Top-Bar kleben (Sticky Sub-Navigation).
- **Touch Targets:** Jedes interaktive Element (Icons, Tabs, Buttons) hat eine Mindest-Klickfläche von 48x48px, auch wenn es visuell kleiner erscheint (nutze unsichtbare Paddings).

#### 3. ARCHITEKTUR & CODE ANTI-PATTERNS (Verboten)
- **Hardcoded Z-Indices:** Nutze niemals willkürliche Werte wie 'z-[9999]'. Verwende ein strukturiertes Z-Index-System in der Tailwind-Konfiguration.
- **Inline Media Queries:** Verwende keine Media-Queries in CSS-Dateien. Nutze ausschließlich Tailwind-Breakpoints (sm:, md:, lg:).
- **Client-Side Data Overload:** Lade niemals alle 100 Tracks einer Liste sofort auf Mobile. Implementiere 'Infinite Scroll' mit einem Intersection Observer.
- **Layout Thrashing:** Vermeide Layout-Verschiebungen (CLS). Artworks müssen immer eine feste Aspect-Ratio Box besitzen, bevor das Bild geladen ist.

#### 4. ACCESSIBILITY (WCAG 2.2)
- **Contrast:** Alle Texte müssen ein Kontrastverhältnis von mindestens 4.5:1 zum Hintergrund aufweisen.
- **Screen Reader Context:** Jede Chart-Karte muss eine versteckte Überschrift ('sr-only') besitzen, die den Kontext (z.B. "Platz 1, Fan Charts") vorliest.
- **Focus Rings:** Implementiere die 'Custom Focus Rings' (harte Neon-Rahmen) für die Tastaturnavigation.

#### 5. PERFORMANCE METRICS
- **Image Optimization:** Nutze die Next.js Image Komponente. Artworks auf Mobile dürfen die Größe von 200px (WebP Format) nicht überschreiten.
- **Bundle Size:** Importiere keine kompletten Icon-Bibliotheken. Nutze ausschließlich Tree-shaking-fähige Einzel-Imports.
