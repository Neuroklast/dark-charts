# Deployment Dokumentation

## Manueller Build-Trigger für Vercel

Um unnötige Build-Kosten zu vermeiden, wird Vercel **nicht** bei jedem Commit einen Build starten.

### Build manuell triggern

Wenn du in Spark einen Arbeitsschritt abgeschlossen hast und das Deployment auf Vercel aktualisieren möchtest, nutze folgenden Befehl:

```
Führe einen Commit mit der Nachricht [RELEASE] aus
```

**Beispiel:**
```
[RELEASE] Neue Chart-Features implementiert
```

Nur Commits, die `[RELEASE]` in der Commit-Nachricht enthalten, lösen einen Vercel Build aus.

## Umgebungsvariablen

Stelle sicher, dass alle Variablen aus der `.env.example` Datei in den Vercel Project Settings konfiguriert sind:

- `DATABASE_URL` - PostgreSQL Verbindung (Neon)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob Storage Token
- `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`

## Deployment-Prozess

1. Code in Spark bearbeiten
2. Features testen
3. Commit mit `[RELEASE]` Nachricht erstellen
4. Vercel startet automatisch den Build
5. Nach erfolgreichem Build ist die App live

## Kosten-Optimierung

- Builds werden nur bei `[RELEASE]` Commits ausgeführt
- Reguläre Entwicklungs-Commits verursachen keine Build-Kosten
- GitHub Spark Editierbarkeit bleibt vollständig erhalten
