/**
 * LTK Refresh Scheduler
 * Automatically refreshes LTK data at configurable intervals
 */

import { ltkApi, LTKStatsResponse, LTKApiResponse } from './ltkApi';
import { ltkTokenManager } from './ltkTokenManager';
import { supabase } from '../lib/supabase';

export interface RefreshConfig {
  enabled: boolean;
  intervalMinutes: number;
  onSuccess?: (data: LTKStatsResponse) => void;
  onError?: (error: string) => void;
  onTokenExpired?: () => void;
}

export interface RefreshStatus {
  isRunning: boolean;
  lastRefresh?: string;
  nextRefresh?: string;
  consecutiveErrors: number;
  lastError?: string;
}

/**
 * Scheduler for automatic LTK data refresh
 */
export class LTKRefreshScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private config: RefreshConfig = {
    enabled: false,
    intervalMinutes: 15, // Default: refresh every 15 minutes
  };
  private status: RefreshStatus = {
    isRunning: false,
    consecutiveErrors: 0,
  };
  private isRefreshing: boolean = false;

  /**
   * Start the auto-refresh scheduler
   */
  async start(config: Partial<RefreshConfig> = {}): Promise<void> {
    // Update config
    this.config = {
      ...this.config,
      ...config,
      enabled: true,
    };

    // Check if credentials exist
    const hasCredentials = await ltkTokenManager.hasCredentials();
    if (!hasCredentials) {
      console.warn('No LTK credentials found. Cannot start auto-refresh.');
      return;
    }

    // Load credentials into API service
    const credentials = await ltkTokenManager.getCredentials();
    if (credentials) {
      ltkApi.setCredentials(credentials);
    }

    // Stop existing interval if running
    this.stop();

    // Run first refresh immediately
    await this.refresh();

    // Set up recurring refresh
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    this.intervalId = setInterval(() => {
      this.refresh();
    }, intervalMs);

    this.status.isRunning = true;
    this.updateNextRefreshTime();

    console.log(`LTK auto-refresh started: Every ${this.config.intervalMinutes} minutes`);
  }

  /**
   * Stop the auto-refresh scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.isRunning = false;
    this.status.nextRefresh = undefined;

    console.log('LTK auto-refresh stopped');
  }

  /**
   * Perform a single refresh
   */
  async refresh(): Promise<LTKApiResponse<LTKStatsResponse>> {
    // Prevent concurrent refreshes
    if (this.isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return { success: false, error: 'Refresh already in progress' };
    }

    this.isRefreshing = true;

    try {
      // Check if credentials are expired
      const isExpired = await ltkTokenManager.isExpired();
      if (isExpired) {
        this.handleTokenExpired();
        return { success: false, error: 'Token expired' };
      }

      // Fetch stats from LTK
      console.log('Fetching LTK stats...');
      const result = await ltkApi.fetchStats('week');

      if (result.success && result.data) {
        // Update last refresh time
        this.status.lastRefresh = new Date().toISOString();
        this.status.consecutiveErrors = 0;
        this.status.lastError = undefined;
        this.updateNextRefreshTime();

        // Update last validated timestamp
        await ltkTokenManager.updateLastValidated();

        // Store data in database
        await this.storeDataInDatabase(result.data);

        // Call success callback
        if (this.config.onSuccess) {
          this.config.onSuccess(result.data);
        }

        console.log('LTK stats refreshed successfully');
        return result;
      } else {
        // Handle error
        this.status.consecutiveErrors++;
        this.status.lastError = result.error || 'Unknown error';

        // If too many consecutive errors, check if token is invalid
        if (this.status.consecutiveErrors >= 3) {
          console.error('Multiple consecutive errors. Token may be invalid.');
          this.handleTokenExpired();
        }

        // Call error callback
        if (this.config.onError) {
          this.config.onError(result.error || 'Unknown error');
        }

        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error refreshing LTK data:', error);

      this.status.consecutiveErrors++;
      this.status.lastError = errorMessage;

      if (this.config.onError) {
        this.config.onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle token expiration
   */
  private handleTokenExpired(): void {
    console.warn('LTK token expired');
    this.stop();

    if (this.config.onTokenExpired) {
      this.config.onTokenExpired();
    }
  }

  /**
   * Store fetched data in database
   */
  private async storeDataInDatabase(data: LTKStatsResponse): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.warn('No authenticated user, skipping database storage');
        return;
      }

      // Store in platform_metrics table
      const { error } = await supabase.from('platform_metrics').insert({
        user_id: user.data.user.id,
        platform: 'ltk',
        metric_type: 'stats',
        metric_value: data.earnings,
        clicks: data.clicks,
        sales: data.sales,
        metadata: {
          topProducts: data.topProducts,
        },
        recorded_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error storing LTK data in database:', error);
      } else {
        console.log('LTK data stored in database successfully');
      }
    } catch (error) {
      console.error('Error storing data in database:', error);
    }
  }

  /**
   * Update next refresh time in status
   */
  private updateNextRefreshTime(): void {
    if (this.status.isRunning && this.config.enabled) {
      const nextRefreshMs = Date.now() + (this.config.intervalMinutes * 60 * 1000);
      this.status.nextRefresh = new Date(nextRefreshMs).toISOString();
    }
  }

  /**
   * Get current refresh status
   */
  getStatus(): RefreshStatus {
    return { ...this.status };
  }

  /**
   * Update refresh interval
   */
  setInterval(minutes: number): void {
    this.config.intervalMinutes = minutes;

    // Restart if currently running
    if (this.status.isRunning) {
      this.start(this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): RefreshConfig {
    return { ...this.config };
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.status.isRunning;
  }

  /**
   * Force an immediate refresh (ignores the schedule)
   */
  async forceRefresh(): Promise<LTKApiResponse<LTKStatsResponse>> {
    console.log('Forcing immediate refresh...');
    return await this.refresh();
  }

  /**
   * Pause auto-refresh temporarily (can be resumed)
   */
  pause(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.isRunning = false;
    console.log('LTK auto-refresh paused');
  }

  /**
   * Resume auto-refresh after pause
   */
  resume(): void {
    if (!this.config.enabled) {
      console.warn('Cannot resume: refresh is not enabled');
      return;
    }

    this.start(this.config);
  }
}

// Export singleton instance
export const ltkRefreshScheduler = new LTKRefreshScheduler();

/**
 * Initialize LTK auto-refresh on app startup
 */
export async function initializeLTKAutoRefresh(): Promise<void> {
  const hasCredentials = await ltkTokenManager.hasCredentials();

  if (hasCredentials) {
    // Start with default config
    await ltkRefreshScheduler.start({
      intervalMinutes: 15,
      onError: (error) => {
        console.error('LTK auto-refresh error:', error);
        // Could show a toast notification here
      },
      onTokenExpired: () => {
        console.warn('LTK token expired, please re-authenticate');
        // Could show a notification to the user
      },
    });
  }
}
