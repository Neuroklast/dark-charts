// Use window.spark.kv (set up in main.tsx as a localStorage polyfill when not on Spark)
const kv = {
  get: <T>(key: string): Promise<T | null> => window.spark.kv.get<T>(key),
  set: (key: string, value: unknown): Promise<void> => window.spark.kv.set(key, value),
  delete: (key: string): Promise<void> => window.spark.kv.delete(key),
};

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  provider: 'spotify' | 'google';
  scope?: string;
}

export interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider: 'spotify' | 'google';
}

class OAuthService {
  private readonly SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
  private readonly SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';
  private readonly GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  private readonly GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
  private readonly REDIRECT_URI = `${window.location.origin}/oauth/callback`;

  private readonly SPOTIFY_SCOPES = [
    'user-read-email',
    'user-read-private',
    'user-library-read',
    'user-top-read',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

  private readonly GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ].join(' ');

  async initiateSpotifyAuth(): Promise<void> {
    const state = this.generateRandomString(16);
    const codeVerifier = this.generateRandomString(128);
    const codeChallenge = await this.generateCodeChallenge(codeVerifier);

    await kv.set('oauth-state', { state, codeVerifier, provider: 'spotify' });

    const params = new URLSearchParams({
      client_id: this.SPOTIFY_CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      state: state,
      scope: this.SPOTIFY_SCOPES,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async initiateGoogleAuth(): Promise<void> {
    const state = this.generateRandomString(16);
    const nonce = this.generateRandomString(16);

    await kv.set('oauth-state', { state, nonce, provider: 'google' });

    const params = new URLSearchParams({
      client_id: this.GOOGLE_CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI,
      state: state,
      scope: this.GOOGLE_SCOPES,
      nonce: nonce,
      access_type: 'offline',
      prompt: 'consent',
    });

    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, state: string, provider: 'spotify' | 'google'): Promise<boolean> {
    try {
      const savedState = await kv.get<{ state: string; codeVerifier?: string; nonce?: string; provider: string }>('oauth-state');
      
      if (!savedState || state !== savedState.state || provider !== savedState.provider) {
        throw new Error('State mismatch or invalid provider');
      }

      let tokens: OAuthTokens;
      let user: OAuthUser;

      if (provider === 'spotify') {
        tokens = await this.exchangeSpotifyCode(code, savedState.codeVerifier!);
        user = await this.getSpotifyUser(tokens.accessToken);
      } else {
        tokens = await this.exchangeGoogleCode(code);
        user = await this.getGoogleUser(tokens.accessToken);
      }

      await this.saveTokens(provider, tokens);
      await this.saveUser(user);
      await kv.delete('oauth-state');
      
      return true;
    } catch (error) {
      console.error('OAuth callback error:', error);
      return false;
    }
  }

  private async exchangeSpotifyCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.SPOTIFY_CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Spotify token exchange failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      provider: 'spotify',
      scope: data.scope,
    };
  }

  private async exchangeGoogleCode(code: string): Promise<OAuthTokens> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.REDIRECT_URI,
        client_id: this.GOOGLE_CLIENT_ID,
        client_secret: this.GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google token exchange failed: ${error.error_description || error.error}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      provider: 'google',
      scope: data.scope,
    };
  }

  private async getSpotifyUser(accessToken: string): Promise<OAuthUser> {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify user');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.display_name || data.id,
      picture: data.images?.[0]?.url,
      provider: 'spotify',
    };
  }

  private async getGoogleUser(accessToken: string): Promise<OAuthUser> {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Google user');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      provider: 'google',
    };
  }

  async refreshSpotifyToken(): Promise<string> {
    const tokens = await this.getTokens('spotify');
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: this.SPOTIFY_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Spotify token');
    }

    const data = await response.json();
    const newTokens: OAuthTokens = {
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    await this.saveTokens('spotify', newTokens);
    return newTokens.accessToken;
  }

  async refreshGoogleToken(): Promise<string> {
    const tokens = await this.getTokens('google');
    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refreshToken,
        client_id: this.GOOGLE_CLIENT_ID,
        client_secret: this.GOOGLE_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google token');
    }

    const data = await response.json();
    const newTokens: OAuthTokens = {
      ...tokens,
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
    };

    await this.saveTokens('google', newTokens);
    return newTokens.accessToken;
  }

  async getAccessToken(provider: 'spotify' | 'google'): Promise<string> {
    const tokens = await this.getTokens(provider);
    if (!tokens) {
      throw new Error(`Not authenticated with ${provider}`);
    }

    if (Date.now() >= tokens.expiresAt - 60000) {
      return provider === 'spotify' 
        ? await this.refreshSpotifyToken() 
        : await this.refreshGoogleToken();
    }

    return tokens.accessToken;
  }

  private async saveTokens(provider: 'spotify' | 'google', tokens: OAuthTokens): Promise<void> {
    await kv.set(`oauth-tokens-${provider}`, tokens);
  }

  async getTokens(provider: 'spotify' | 'google'): Promise<OAuthTokens | null> {
    return await kv.get<OAuthTokens>(`oauth-tokens-${provider}`);
  }

  private async saveUser(user: OAuthUser): Promise<void> {
    await kv.set(`oauth-user-${user.provider}`, user);
  }

  async getUser(provider: 'spotify' | 'google'): Promise<OAuthUser | null> {
    return await kv.get<OAuthUser>(`oauth-user-${provider}`);
  }

  async isAuthenticated(provider: 'spotify' | 'google'): Promise<boolean> {
    const tokens = await this.getTokens(provider);
    return !!tokens?.accessToken;
  }

  async logout(provider: 'spotify' | 'google'): Promise<void> {
    await kv.delete(`oauth-tokens-${provider}`);
    await kv.delete(`oauth-user-${provider}`);
  }

  async logoutAll(): Promise<void> {
    await Promise.all([
      this.logout('spotify'),
      this.logout('google'),
    ]);
  }

  private generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  }

  private async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

export const oauthService = new OAuthService();
