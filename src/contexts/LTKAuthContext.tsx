import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ltkAuthService, LTKAuthState, LTKTokens } from '../lib/ltkAuth';

interface LTKAuthContextType extends LTKAuthState {
  refreshToken: () => Promise<void>;
  clearAuth: () => void;
  setTokensManually: (tokens: LTKTokens) => void;
}

const LTKAuthContext = createContext<LTKAuthContextType | undefined>(undefined);

export function LTKAuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<LTKAuthState>(() => 
    ltkAuthService.getAuthState()
  );

  // Update state when tokens change
  useEffect(() => {
    const updateState = () => {
      setAuthState(ltkAuthService.getAuthState());
    };

    // Subscribe to token refresh events
    const unsubscribe = ltkAuthService.onTokenRefresh(() => {
      updateState();
    });

    // Subscribe to auth errors
    const unsubscribeError = ltkAuthService.onAuthError((error) => {
      console.error('LTK Auth Error:', error);
      updateState();
    });

    // CRITICAL FIX: Reschedule auto-refresh on mount if tokens exist
    // This ensures auto-refresh survives page reloads
    const existingTokens = ltkAuthService.getTokens();
    if (existingTokens) {
      ltkAuthService.scheduleTokenRefreshOnInit(existingTokens);
    }

    // Check for immediate refresh needs on mount
    if (ltkAuthService.needsRefresh()) {
      ltkAuthService.refreshAccessToken().catch(console.error);
    }

    return () => {
      unsubscribe();
      unsubscribeError();
    };
  }, []);

  // Update state every second to reflect expiration countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = ltkAuthService.getAuthState();
      if (newState.expiresIn !== authState.expiresIn) {
        setAuthState(newState);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [authState.expiresIn]);

  const refreshToken = async () => {
    try {
      await ltkAuthService.refreshAccessToken();
      setAuthState(ltkAuthService.getAuthState());
    } catch (error) {
      console.error('Manual refresh failed:', error);
      throw error;
    }
  };

  const clearAuth = () => {
    ltkAuthService.clearTokens();
    setAuthState(ltkAuthService.getAuthState());
  };

  const setTokensManually = (tokens: LTKTokens) => {
    ltkAuthService.storeTokens(tokens);
    setAuthState(ltkAuthService.getAuthState());
  };

  return (
    <LTKAuthContext.Provider
      value={{
        ...authState,
        refreshToken,
        clearAuth,
        setTokensManually,
      }}
    >
      {children}
    </LTKAuthContext.Provider>
  );
}

export function useLTKAuth() {
  const context = useContext(LTKAuthContext);
  if (!context) {
    throw new Error('useLTKAuth must be used within LTKAuthProvider');
  }
  return context;
}
