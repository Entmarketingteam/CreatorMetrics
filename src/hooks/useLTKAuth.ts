import { useState, useEffect } from 'react';
import { LTKApiClient } from '../lib/ltkApiClient';

export interface LTKTokens {
  accessToken: string;
  idToken: string;
}

export function useLTKAuth() {
  const [tokens, setTokens] = useState<LTKTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedTokens = localStorage.getItem('ltk_tokens');
    if (savedTokens) {
      try {
        setTokens(JSON.parse(savedTokens));
      } catch (error) {
        console.error('Failed to parse saved LTK tokens:', error);
        localStorage.removeItem('ltk_tokens');
      }
    }
    setIsLoading(false);
  }, []);

  const saveTokens = (newTokens: LTKTokens) => {
    setTokens(newTokens);
    localStorage.setItem('ltk_tokens', JSON.stringify(newTokens));
  };

  const clearTokens = () => {
    setTokens(null);
    localStorage.removeItem('ltk_tokens');
  };

  const createClient = (): LTKApiClient | null => {
    if (!tokens) return null;
    
    return new LTKApiClient(
      () => tokens.accessToken,
      () => tokens.idToken
    );
  };

  return {
    tokens,
    isLoading,
    isAuthenticated: !!tokens,
    saveTokens,
    clearTokens,
    createClient,
  };
}
