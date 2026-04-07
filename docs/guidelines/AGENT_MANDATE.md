# AGENT MANDATE

> **Verbindliches Regelwerk für alle Agenten und Entwickler.**  
> Diese Datei ist vor dem Start jedes neuen Sprints zu lesen.

---

## 1. Architekturprinzipien

- **SOLID-Prinzipien** sind kompromisslos einzuhalten:
  - **S**ingle Responsibility – jede Klasse/Funktion hat genau eine Verantwortung.
  - **O**pen/Closed – offen für Erweiterungen, geschlossen für Modifikationen.
  - **L**iskov Substitution – Untertypen müssen durch ihre Basistypen ersetzbar sein.
  - **I**nterface Segregation – keine erzwungene Abhängigkeit von nicht genutzten Schnittstellen.
  - **D**ependency Inversion – High-Level-Module hängen von Abstraktionen ab, nicht von konkreten Implementierungen.
- **Test Driven Development (TDD)** ist der einzige akzeptierte Entwicklungsansatz: Tests werden vor dem Produktionscode geschrieben.

---

## 2. Softwarequalität

- Strikte Einhaltung der **ISO/IEC 25010**-Normen für:
  - **Wartbarkeit** (Modifiability, Analysability, Testability)
  - **Zuverlässigkeit** (Fault Tolerance, Recoverability, Availability)
- Jede neue Funktion muss nachweislich wartbar und testbar sein.

---

## 3. Clean Code

- Sprechende Variablen- und Funktionsnamen – Kommentare erklären das *Warum*, nicht das *Was*.
- Komplexe Logik erfordert zwingend präzise Inline-Dokumentation.
- Funktionen und Methoden bleiben kurz und fokussiert (max. ~20 Zeilen als Richtwert).

---

## 4. Code-Hygiene

- Bekannte Anti-Pattern (God Object, Magic Numbers, Copy-Paste-Code, etc.) sind bei Entdeckung sofort aufzulösen.
- **Dependency Injection** hat absolute Priorität gegenüber direkter Instanziierung.
- Saubere Entwurfsmuster werden konsequent angewendet.

---

## 5. Iterativer Arbeitsablauf

| Schritt | Aktion |
|---------|--------|
| **1 – Planen** | Aufgabe analysieren, detaillierten Lösungsplan erstellen und dokumentieren. |
| **2 – Implementieren** | Lösung exakt nach Plan programmieren. |
| **3 – Testen** | Alle Testfehler umgehend beheben. |
| **4 – Abbruch & Neuplanung** | Bei Blockade oder >3 Fehlversuchen: sofortiger Abbruch, kein Push von fehlerhaftem Code, zurück zu Schritt 1 mit neuem Architekturansatz. |
| **5 – Erkenntnisse** | Gescheiterte Ansätze und finale Lösung in `docs/guidelines/LESSONS_LEARNED.md` dokumentieren. |
| **6 – Dokumentation** | Nach jedem erfolgreichen Feature alle relevanten Dokumente in `docs/architecture/` aktualisieren. |

---

## 6. Definition of Done (DoD)

Vor jedem Abschluss einer Aufgabe ist diese Checkliste vollständig abzuarbeiten:

- [ ] Code auf Sicherheitslücken geprüft (OWASP Top 10, Abhängigkeiten geprüft).
- [ ] Vollständige Typprüfung durchgeführt (`tsc --noEmit` o. Ä.) – keine versteckten Typfehler.
- [ ] `CHANGELOG.md` mit technischer Beschreibung der exakten Änderungen aktualisiert.
- [ ] Alle Tests grün.
- [ ] Dokumentation in `docs/architecture/` auf aktuellem Stand.
