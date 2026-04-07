# OAuth Integration für Dark Charts

## Übersicht

Diese Anwendung implementiert eine vollständige OAuth 2.0 Integration für **Spotify** und **Google** mit PKCE (Proof Key for Code Exchange) für erhöhte Sicherheit.

## Funktionen

- ✅ Spotify OAuth 2.0 mit PKCE
- ✅ Google OAuth 2.0 
- ✅ Automatisches Token Refresh
- ✅ Sichere Token-Speicherung mit Spark KV
- ✅ Mehrsprachige UI (Deutsch/Englisch)
- ✅ Callback-Handling
- ✅ Logout-Funktionalität

## Einrichtung

### 1. Spotify App erstellen

1. Gehe zu [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Klicke auf "Create an App"
3. Fülle Name und Beschreibung aus
4. Nach Erstellung, kopiere **Client ID**
5. Füge Redirect URI hinzu: `https://your-domain.com/oauth/callback` oder `http://localhost:5173/oauth/callback` für lokale Entwicklung
6. Aktiviere die Checkboxen für Benutzer-Berechtigungen

### 2. Google OAuth App erstellen

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com/)
2. Erstelle ein neues Projekt oder wähle ein bestehendes
3. Navigiere zu "APIs & Services" > "Credentials"
4. Klicke auf "Create Credentials" > "OAuth client ID"
5. Wähle "Web application"
6. Füge Redirect URIs hinzu:
   - `https://your-domain.com/oauth/callback`
   - `http://localhost:5173/oauth/callback` (für lokale Entwicklung)
7. Kopiere **Client ID** und **Client Secret**

### 3. Umgebungsvariablen

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Spotify OAuth
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret
```

**Wichtig:** Füge `.env` zur `.gitignore` hinzu, um Secrets nicht zu committen!

## Verwendung

### In React Komponenten

```typescript
import { OAuthLoginButtons } from '@/components/OAuthLoginButtons';

function ProfileView() {
  return (
    <div>
      <h2>Authentifizierung</h2>
      <OAuthLoginButtons 
        onSuccess={() => {
          console.log('Erfolgreich angemeldet!');
        }}
      />
    </div>
  );
}
```

### OAuth Service direkt verwenden

```typescript
import { oauthService } from '@/services/oauthService';

// Spotify Login initiieren
await oauthService.initiateSpotifyAuth();

// Google Login initiieren
await oauthService.initiateGoogleAuth();

// Aktuellen Benutzer abrufen
const spotifyUser = await oauthService.getUser('spotify');
const googleUser = await oauthService.getUser('google');

// Prüfen ob authentifiziert
const isSpotifyAuth = await oauthService.isAuthenticated('spotify');
const isGoogleAuth = await oauthService.isAuthenticated('google');

// Access Token abrufen (mit automatischem Refresh)
const spotifyToken = await oauthService.getAccessToken('spotify');
const googleToken = await oauthService.getAccessToken('google');

// Logout
await oauthService.logout('spotify');
await oauthService.logout('google');
await oauthService.logoutAll(); // Alle Dienste
```

## OAuth Flow

### 1. Initiierung

```typescript
// Benutzer klickt auf "Mit Spotify verbinden"
await oauthService.initiateSpotifyAuth();

// Service generiert:
// - Random state (für CSRF-Schutz)
// - Code verifier (für PKCE)
// - Code challenge (SHA-256 hash des verifiers)
// - Speichert state & verifier in Spark KV
// - Leitet zu Spotify OAuth weiter
```

### 2. Callback

```typescript
// Nach Genehmigung leitet Spotify zurück zu:
// https://your-app.com/oauth/callback?code=XXX&state=YYY

// OAuthCallback Komponente:
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  
  const success = await oauthService.handleCallback(code, state, 'spotify');
  
  if (success) {
    // Weiterleitung zur App
    window.location.href = '/';
  }
}, []);
```

### 3. Token Exchange

```typescript
// OAuth Service tauscht Code gegen Tokens:
const tokens = await exchangeSpotifyCode(code, codeVerifier);

// Tokens enthalten:
{
  accessToken: '...', // Für API-Aufrufe
  refreshToken: '...', // Für Token-Refresh
  expiresAt: 1234567890, // Timestamp
  provider: 'spotify',
  scope: '...'
}

// Tokens werden in Spark KV gespeichert
await spark.kv.set(`oauth-tokens-spotify`, tokens);
```

### 4. Automatisches Token Refresh

```typescript
async getAccessToken(provider: 'spotify' | 'google'): Promise<string> {
  const tokens = await this.getTokens(provider);
  
  // Prüfen ob Token bald abläuft (< 1 Minute)
  if (Date.now() >= tokens.expiresAt - 60000) {
    return provider === 'spotify' 
      ? await this.refreshSpotifyToken() 
      : await this.refreshGoogleToken();
  }
  
  return tokens.accessToken;
}
```

## Sicherheit

### PKCE (Proof Key for Code Exchange)

Spotify OAuth verwendet PKCE für erhöhte Sicherheit:

1. **Code Verifier**: Random string (128 Zeichen)
2. **Code Challenge**: SHA-256 Hash des Verifiers, base64-encoded
3. Beim Token-Exchange wird der Verifier mitgeschickt
4. Spotify validiert dass Challenge vom Verifier stammt

```typescript
private async generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

### State Parameter

Verhindert CSRF-Attacken:

```typescript
// Bei Auth-Initiierung
const state = generateRandomString(16);
await spark.kv.set('oauth-state', { state, provider: 'spotify' });

// Bei Callback
const savedState = await spark.kv.get('oauth-state');
if (state !== savedState.state) {
  throw new Error('State mismatch - possible CSRF attack');
}
```

### Token-Speicherung

- Tokens werden verschlüsselt in Spark KV gespeichert
- Niemals in localStorage oder sessionStorage
- Automatische Bereinigung bei Logout

## API-Endpunkte

### Spotify

```typescript
// Benutzer-Info
GET https://api.spotify.com/v1/me
Authorization: Bearer {accessToken}

// Artist-Suche
GET https://api.spotify.com/v1/search?q={query}&type=artist
Authorization: Bearer {accessToken}

// Artist-Alben
GET https://api.spotify.com/v1/artists/{id}/albums
Authorization: Bearer {accessToken}
```

### Google

```typescript
// Benutzer-Info
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer {accessToken}
```

## Komponenten

### OAuthLoginButtons

Vollständige Login/Logout UI für beide Dienste:

```typescript
<OAuthLoginButtons 
  onSuccess={() => {
    // Nach erfolgreicher Anmeldung
  }}
/>
```

Features:
- Zeigt Login-Buttons wenn nicht authentifiziert
- Zeigt Benutzer-Info wenn authentifiziert
- Logout-Funktionalität
- Loading-States
- Error-Handling mit Toast-Notifications

### OAuthCallback

Behandelt den OAuth Callback und zeigt Status:

```typescript
// In App.tsx oder Router
{window.location.pathname === '/oauth/callback' && <OAuthCallback />}
```

## Fehlerbehandlung

```typescript
try {
  await oauthService.initiateSpotifyAuth();
} catch (error) {
  console.error('OAuth failed:', error);
  toast.error('Anmeldung fehlgeschlagen');
}
```

Mögliche Fehler:
- `State mismatch`: CSRF-Attacke oder Session-Timeout
- `Token exchange failed`: Ungültiger Code oder abgelaufener Code
- `Failed to refresh token`: Refresh-Token ungültig oder zurückgezogen
- `Not authenticated`: Keine gültigen Tokens vorhanden

## Berechtigungen (Scopes)

### Spotify

```typescript
const SPOTIFY_SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-library-read',
  'user-top-read',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');
```

### Google

```typescript
const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid'
].join(' ');
```

## Testen

### Lokale Entwicklung

1. Starte Dev-Server: `npm run dev`
2. Öffne http://localhost:5173
3. Klicke auf OAuth-Login-Button
4. Nach Genehmigung wirst du zu http://localhost:5173/oauth/callback weitergeleitet
5. Automatische Weiterleitung zur App

### Produktions-URLs aktualisieren

In den OAuth-App-Einstellungen müssen die Redirect URIs aktualisiert werden:
- Spotify: `https://your-production-domain.com/oauth/callback`
- Google: `https://your-production-domain.com/oauth/callback`

## Troubleshooting

### "Redirect URI mismatch"

- Prüfe dass die Redirect URI in der OAuth-App-Konfiguration exakt mit der verwendeten URI übereinstimmt
- Achte auf trailing slashes (`/oauth/callback` vs `/oauth/callback/`)
- HTTP vs HTTPS

### "Invalid client"

- Prüfe dass Client ID und Client Secret korrekt sind
- Prüfe dass die Umgebungsvariablen geladen werden

### "State mismatch"

- State wurde möglicherweise aus dem KV-Store gelöscht
- Session-Timeout während OAuth-Flow
- Benutzer hat mehrere gleichzeitige Login-Versuche

### Token Refresh schlägt fehl

- Refresh-Token wurde zurückgezogen (Benutzer hat App-Zugriff widerrufen)
- Refresh-Token ist abgelaufen (selten, meist sehr lang gültig)
- Lösung: Benutzer muss sich erneut anmelden

## Best Practices

1. **Niemals Secrets committen**: Verwende Umgebungsvariablen
2. **State validieren**: Immer state-Parameter prüfen gegen CSRF
3. **Tokens sicher speichern**: Nur in Spark KV, niemals in localStorage
4. **Scopes minimal halten**: Nur erforderliche Berechtigungen anfordern
5. **Error-Handling**: Benutzer-freundliche Fehlermeldungen
6. **Token Refresh**: Automatisch vor Ablauf refreshen (1 Min Buffer)
7. **Logout implementieren**: Tokens aus Storage löschen

## Weiterführende Ressourcen

- [Spotify OAuth Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [PKCE RFC](https://datatracker.ietf.org/doc/html/rfc7636)
