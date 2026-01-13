/**
 * LTK OAuth Authentication Service
 * 
 * 📚 REFERENCE: For complete authentication flow documentation, token refresh implementation,
 * and all Auth0 details, see: docs/LTK-API-COMPLETE-REFERENCE.md
 * 
 * SECURITY NOTICE - PRODUCTION DEPLOYMENT REQUIREMENTS:
 * 
 * This implementation is designed for DEVELOPMENT AND TESTING only.
 * Before deploying to production, you MUST implement the following security measures:
 * 
 * 1. BACKEND PROXY FOR OAuth FLOWS:
 *    - Never send client_secret from the browser
 *    - Create backend endpoints for token exchange and refresh
 *    - Keep client credentials server-side only
 * 
 * 2. SECURE TOKEN STORAGE:
 *    - Replace localStorage with httpOnly cookies
 *    - Implement CSRF protection
 *    - Add XSS mitigation (Content Security Policy)
 * 
 * 3. AUTO-REFRESH PERSISTENCE:
 *    - This service reschedules token refresh on page reload (implemented)
 *    - Ensure refresh timer survives navigation and reloads
 * 
 * See individual method documentation for specific security requirements.
 */

import { jwtDecode } from 'jwt-decode';

export interface LTKTokens {
  access_token: string;
  id_token: string; // ID token required for new API gateway
  refresh_token: string;
  expires_at: number; // Unix timestamp in seconds
  token_type: string;
}

export interface LTKTokenPayload {
  sub: string; // User ID
  email?: string;
  name?: string;
  exp: number; // Expiration timestamp
  iat: number; // Issued at timestamp
  [key: string]: any; // Other claims
}

export interface LTKAuthState {
  tokens: LTKTokens | null;
  decodedToken: LTKTokenPayload | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  expiresIn: number | null; // Seconds until expiration
}

const LTK_TOKENS_KEY = 'ltk_tokens';
const REFRESH_BUFFER = 5 * 60; // Refresh 5 minutes before expiration

export class LTKAuthService {
  private refreshTimer: NodeJS.Timeout | null = null;
  private onTokenRefreshCallbacks: Array<(tokens: LTKTokens) => void> = [];
  private onAuthErrorCallbacks: Array<(error: Error) => void> = [];

  /**
   * Store LTK tokens securely in localStorage
   */
  storeTokens(tokens: LTKTokens): void {
    localStorage.setItem(LTK_TOKENS_KEY, JSON.stringify(tokens));
    this.scheduleTokenRefresh(tokens);
    this.notifyTokenRefresh(tokens);
  }

  /**
   * Retrieve stored LTK tokens
   */
  getTokens(): LTKTokens | null {
    try {
      const stored = localStorage.getItem(LTK_TOKENS_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      // Validate that tokens have required fields (especially id_token for new API gateway)
      if (parsed && parsed.access_token) {
        // If old format (missing id_token), return null to force re-auth
        if (!parsed.id_token) {
          console.warn('Old token format detected (missing id_token), clearing tokens');
          this.clearTokens();
          return null;
        }
        return parsed;
      }
      return null;
    } catch (error) {
      // Silently handle any errors - corrupted localStorage, etc.
      console.warn('Error reading tokens from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens and cancel refresh timer
   */
  clearTokens(): void {
    localStorage.removeItem(LTK_TOKENS_KEY);
    this.cancelTokenRefresh();
  }

  /**
   * Decode JWT access token to extract payload
   */
  decodeToken(accessToken: string): LTKTokenPayload | null {
    try {
      return jwtDecode<LTKTokenPayload>(accessToken);
    } catch (error) {
      // Silently handle invalid tokens - they may not exist or be malformed
      return null;
    }
  }

  /**
   * Get current authentication state
   */
  getAuthState(): LTKAuthState {
    try {
      const tokens = this.getTokens();
      
      if (!tokens) {
        return {
          tokens: null,
          decodedToken: null,
          isAuthenticated: false,
          isExpired: false,
          expiresIn: null,
        };
      }

      const decodedToken = this.decodeToken(tokens.access_token);
      const now = Math.floor(Date.now() / 1000);
      const isExpired = tokens.expires_at <= now;
      const expiresIn = tokens.expires_at - now;

      return {
        tokens,
        decodedToken,
        isAuthenticated: !isExpired,
        isExpired,
        expiresIn: expiresIn > 0 ? expiresIn : null,
      };
    } catch (error) {
      console.error('Error getting auth state:', error);
      return {
        tokens: null,
        decodedToken: null,
        isAuthenticated: false,
        isExpired: false,
        expiresIn: null,
      };
    }
  }

  /**
   * Check if token needs refresh (within 5 minutes of expiration)
   */
  needsRefresh(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;

    const now = Math.floor(Date.now() / 1000);
    return tokens.expires_at - now <= REFRESH_BUFFER;
  }

  /**
   * Refresh the access token using refresh token via Auth0 Token Endpoint
   * 
   * Uses Auth0 Token Endpoint: https://creator-auth.shopltk.com/oauth/token
   * Client ID: iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
   * 
   * IMPORTANT: Captures both access_token AND id_token from the response.
   * Both tokens are required for the new API gateway.
   * 
   * SECURITY WARNING: This implementation is for TESTING ONLY!
   * 
   * Production requirements:
   * 1. NEVER send client_secret from the browser - it exposes credentials to all users
   * 2. Create a backend proxy endpoint (e.g., POST /api/ltk/refresh-token) that:
   *    - Receives only the refresh_token from the frontend
   *    - Adds client_id and client_secret server-side
   *    - Forwards the request to LTK's Auth0 endpoint
   *    - Returns the new tokens to the frontend
   * 3. Use httpOnly cookies instead of localStorage for production token storage
   */
  async refreshAccessToken(): Promise<LTKTokens> {
    const tokens = this.getTokens();
    if (!tokens || !tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // Use Auth0 Token Endpoint
      const auth0TokenEndpoint = 'https://creator-auth.shopltk.com/oauth/token';
      const clientId = 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT';
      
      const response = await fetch(auth0TokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokens.refresh_token,
          client_id: clientId,
          // WARNING: In production, client_secret should be added by backend proxy
          // For now, this may work if Auth0 is configured as a public client
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // CRITICAL: Capture both access_token AND id_token
      if (!data.access_token) {
        throw new Error('Missing access_token in refresh response');
      }
      if (!data.id_token) {
        throw new Error('Missing id_token in refresh response - required for new API gateway');
      }

      const newTokens: LTKTokens = {
        access_token: data.access_token,
        id_token: data.id_token, // Required for X-id-token header
        refresh_token: data.refresh_token || tokens.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        token_type: data.token_type || 'Bearer',
      };

      this.storeTokens(newTokens);
      return newTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.notifyAuthError(error as Error);
      throw error;
    }
  }

  /**
   * Refresh LTK tokens using refresh token (standalone function)
   * 
   * This is the function specified in the requirements.
   * Uses Auth0 Token Endpoint and captures both access_token and id_token.
   */
  async refresh_ltk_tokens(refresh_token: string): Promise<LTKTokens> {
    const auth0TokenEndpoint = 'https://creator-auth.shopltk.com/oauth/token';
    const clientId = 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT';
    
    const response = await fetch(auth0TokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: clientId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // CRITICAL: Capture both access_token AND id_token
    if (!data.access_token) {
      throw new Error('Missing access_token in refresh response');
    }
    if (!data.id_token) {
      throw new Error('Missing id_token in refresh response - required for new API gateway');
    }

    const tokens: LTKTokens = {
      access_token: data.access_token,
      id_token: data.id_token, // Required for X-id-token header
      refresh_token: data.refresh_token || refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
      token_type: data.token_type || 'Bearer',
    };

    this.storeTokens(tokens);
    return tokens;
  }

  /**
   * Exchange authorization code for tokens (OAuth callback)
   * 
   * SECURITY WARNING: This implementation is for TESTING ONLY!
   * In production, create a backend endpoint that handles the code exchange
   * to keep client_secret secure on the server side.
   */
  async exchangeCodeForTokens(code: string): Promise<LTKTokens> {
    try {
      // PRODUCTION: Replace with backend proxy endpoint
      const backendProxyUrl = import.meta.env.VITE_LTK_TOKEN_ENDPOINT || 'https://api.ltk.ai/oauth/token';
      
      const response = await fetch(backendProxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          // WARNING: In production, client_id and client_secret should be added by backend
          client_id: import.meta.env.VITE_LTK_CLIENT_ID || '',
          client_secret: import.meta.env.VITE_LTK_CLIENT_SECRET || '', // INSECURE! Remove in production
          redirect_uri: `${window.location.origin}/auth/ltk/callback`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const data = await response.json();
      
      // CRITICAL: Capture both access_token AND id_token
      if (!data.access_token) {
        throw new Error('Missing access_token in token exchange response');
      }
      if (!data.id_token) {
        throw new Error('Missing id_token in token exchange response - required for new API gateway');
      }

      const tokens: LTKTokens = {
        access_token: data.access_token,
        id_token: data.id_token, // Required for X-id-token header
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
        token_type: data.token_type || 'Bearer',
      };

      this.storeTokens(tokens);
      return tokens;
    } catch (error) {
      console.error('Code exchange failed:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic token refresh before expiration
   */
  private scheduleTokenRefresh(tokens: LTKTokens): void {
    this.cancelTokenRefresh();

    const now = Math.floor(Date.now() / 1000);
    const timeUntilRefresh = (tokens.expires_at - now - REFRESH_BUFFER) * 1000;

    if (timeUntilRefresh > 0) {
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, timeUntilRefresh);
    }
  }

  /**
   * Public method to schedule refresh on initialization (e.g., after page reload)
   * CRITICAL: Call this when provider mounts with existing tokens
   */
  scheduleTokenRefreshOnInit(tokens: LTKTokens): void {
    this.scheduleTokenRefresh(tokens);
  }

  /**
   * Cancel scheduled token refresh
   */
  private cancelTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Register callback for token refresh events
   */
  onTokenRefresh(callback: (tokens: LTKTokens) => void): () => void {
    this.onTokenRefreshCallbacks.push(callback);
    return () => {
      this.onTokenRefreshCallbacks = this.onTokenRefreshCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register callback for authentication errors
   */
  onAuthError(callback: (error: Error) => void): () => void {
    this.onAuthErrorCallbacks.push(callback);
    return () => {
      this.onAuthErrorCallbacks = this.onAuthErrorCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all token refresh callbacks
   */
  private notifyTokenRefresh(tokens: LTKTokens): void {
    this.onTokenRefreshCallbacks.forEach(callback => callback(tokens));
  }

  /**
   * Notify all error callbacks
   */
  private notifyAuthError(error: Error): void {
    this.onAuthErrorCallbacks.forEach(callback => callback(error));
  }

  /**
   * Initiate LTK OAuth flow
   * Redirects user to Auth0 for authentication
   */
  initiateOAuthFlow(): void {
    const clientId = 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT';
    const redirectUri = `${window.location.origin}/auth/ltk/callback`;
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Store state in sessionStorage for verification on callback
    sessionStorage.setItem('ltk_oauth_state', state);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email ltk.publisher offline_access',
      state: state,
    });

    // Redirect to Auth0 authorization endpoint
    window.location.href = `https://creator-auth.shopltk.com/authorize?${params.toString()}`;
  }

  /**
   * Parse OAuth callback URL for authorization code
   */
  parseOAuthCallback(url: string): string | null {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('code');
  }
}

// Export singleton instance
export const ltkAuthService = new LTKAuthService();
