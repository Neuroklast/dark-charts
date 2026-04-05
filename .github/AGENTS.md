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
