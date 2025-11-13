/**
 * React Hook for LTK Integration
 * Provides easy access to LTK data, status, and controls
 */

import { useState, useEffect, useCallback } from 'react';
import { ltkApi, LTKStatsResponse, LTKCredentials } from '../services/ltkApi';
import { ltkTokenManager } from '../services/ltkTokenManager';
import { ltkRefreshScheduler, RefreshStatus } from '../services/ltkRefreshScheduler';

export interface LTKData {
  stats: LTKStatsResponse | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshStatus: RefreshStatus | null;
}

export interface LTKActions {
  connect: (credentials: LTKCredentials) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  refresh: () => Promise<void>;
  testConnection: (credentials: LTKCredentials) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Custom hook for LTK integration
 */
export function useLTK() {
  const [data, setData] = useState<LTKData>({
    stats: null,
    isConnected: false,
    isLoading: true,
    error: null,
    refreshStatus: null,
  });

  // Load initial connection status
  useEffect(() => {
    loadConnectionStatus();

    // Update refresh status every 5 seconds
    const interval = setInterval(() => {
      const status = ltkRefreshScheduler.getStatus();
      setData(prev => ({
        ...prev,
        refreshStatus: status,
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadConnectionStatus = async () => {
    try {
      const metadata = await ltkTokenManager.getMetadata();
      const isConnected = metadata.hasCredentials && !metadata.isExpired;
      const refreshStatus = ltkRefreshScheduler.getStatus();

      setData(prev => ({
        ...prev,
        isConnected,
        refreshStatus,
        isLoading: false,
      }));

      // If connected, try to get initial data
      if (isConnected) {
        const credentials = await ltkTokenManager.getCredentials();
        if (credentials) {
          ltkApi.setCredentials(credentials);
          // Try to fetch stats (will use cache if available)
          const result = await ltkApi.fetchStats();
          if (result.success && result.data) {
            setData(prev => ({
              ...prev,
              stats: result.data || null,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error loading LTK connection status:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load connection status',
      }));
    }
  };

  const connect = useCallback(async (credentials: LTKCredentials): Promise<{ success: boolean; error?: string }> => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate format
      const validation = ltkTokenManager.validateCredentialsFormat(credentials);
      if (!validation.valid) {
        setData(prev => ({ ...prev, isLoading: false, error: validation.error }));
        return { success: false, error: validation.error };
      }

      // Test connection first
      ltkApi.setCredentials(credentials);
      const testResult = await ltkApi.testConnection();

      if (!testResult.success) {
        setData(prev => ({ ...prev, isLoading: false, error: testResult.error }));
        return { success: false, error: testResult.error };
      }

      // Store credentials
      await ltkTokenManager.storeCredentials(credentials);

      // Start auto-refresh
      await ltkRefreshScheduler.start({
        intervalMinutes: 15,
        onSuccess: (stats) => {
          setData(prev => ({
            ...prev,
            stats,
            error: null,
          }));
        },
        onError: (error) => {
          setData(prev => ({
            ...prev,
            error,
          }));
        },
        onTokenExpired: () => {
          setData(prev => ({
            ...prev,
            isConnected: false,
            error: 'Token expired. Please reconnect.',
          }));
        },
      });

      // Get initial data
      const result = await ltkApi.fetchStats();

      setData(prev => ({
        ...prev,
        isConnected: true,
        isLoading: false,
        stats: result.success ? result.data || null : null,
        error: result.success ? null : result.error || null,
      }));

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await ltkTokenManager.clearCredentials();
      ltkApi.clearCredentials();
      ltkRefreshScheduler.stop();

      setData({
        stats: null,
        isConnected: false,
        isLoading: false,
        error: null,
        refreshStatus: null,
      });
    } catch (error) {
      console.error('Error disconnecting from LTK:', error);
    }
  }, []);

  const refresh = useCallback(async () => {
    setData(prev => ({ ...prev, error: null }));

    try {
      const result = await ltkRefreshScheduler.forceRefresh();

      if (result.success && result.data) {
        setData(prev => ({
          ...prev,
          stats: result.data || null,
          error: null,
          refreshStatus: ltkRefreshScheduler.getStatus(),
        }));
      } else {
        setData(prev => ({
          ...prev,
          error: result.error || 'Refresh failed',
          refreshStatus: ltkRefreshScheduler.getStatus(),
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Refresh failed';
      setData(prev => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  const testConnection = useCallback(async (credentials: LTKCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      ltkApi.setCredentials(credentials);
      const result = await ltkApi.testConnection();
      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      };
    }
  }, []);

  const actions: LTKActions = {
    connect,
    disconnect,
    refresh,
    testConnection,
  };

  return {
    ...data,
    ...actions,
  };
}
