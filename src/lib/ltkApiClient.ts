/**
 * LTK API Client
 * 
 * Handles authenticated requests to LTK's API Gateway using Auth0 ID tokens.
 * Implements automatic token refresh and retry logic for 401 responses.
 * 
 * Usage:
 * ```typescript
 * const client = new LTKApiClient(() => ltkAuthService.getTokens()?.access_token);
 * const contributors = await client.getContributors();
 * const heroData = await client.getHeroChart({
 *   start_date: '2025-09-25T00:00:00Z',
 *   end_date: '2025-10-02T23:59:59Z',
 *   publisher_ids: '293045,987693288',
 *   interval: 'day',
 *   platform: 'rs,ltk',
 *   timezone: 'UTC'
 * });
 * ```
 */

const API_BASE = 'https://api-gateway.rewardstyle.com';

export interface HeroChartParams {
  start_date: string; // ISO 8601: '2025-09-25T00:00:00Z'
  end_date: string;   // ISO 8601: '2025-10-02T23:59:59Z'
  publisher_ids: string; // Comma-separated: '293045,987693288'
  interval?: 'day' | 'week' | 'month';
  platform: 'rs' | 'ltk' | 'rs,ltk';
  timezone?: string; // Default: 'UTC'
}

export interface PerformanceSummaryParams {
  start_date: string;
  end_date: string;
  publisher_ids: string;
  platform?: string;
}

export interface PerformanceStatsParams {
  start: string;
  end: string;
  currency?: string; // Default: 'USD'
}

export interface ItemsSoldParams {
  limit?: number;
  currency?: string;
  start_date?: string;
  end_date?: string;
}

export interface CommissionsSummaryParams {
  currency?: string;
  start_date?: string;
  end_date?: string;
}

export interface TopPerformersParams {
  start_date: string;
  end_date: string;
  publisher_ids: string;
  platform?: string;
  timezone?: string;
  limit?: number;
}

/**
 * LTK API Client
 * Authenticated client for LTK's API Gateway
 */
export class LTKApiClient {
  private getIdToken: () => string | null;
  private onTokenRefresh?: () => Promise<void>;

  constructor(
    getIdToken: () => string | null,
    onTokenRefresh?: () => Promise<void>
  ) {
    this.getIdToken = getIdToken;
    this.onTokenRefresh = onTokenRefresh;
  }

  /**
   * Make authenticated request to LTK API
   * Automatically retries once on 401 after attempting token refresh
   */
  private async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const idToken = this.getIdToken();
    if (!idToken) {
      throw new Error('Not authenticated - no ID token available');
    }

    const url = `${API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'x-id-token': idToken, // LTK uses x-id-token, not Authorization
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Handle 401 Unauthorized - try to refresh token and retry
    if (response.status === 401) {
      if (this.onTokenRefresh) {
        try {
          await this.onTokenRefresh();
          
          // Retry with new token
          const newToken = this.getIdToken();
          if (!newToken) throw new Error('Token refresh failed');
          
          const retryResponse = await fetch(url, {
            ...options,
            headers: {
              'x-id-token': newToken,
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error(`LTK API error: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          
          return retryResponse.json();
        } catch (error) {
          throw new Error('Authentication failed after token refresh');
        }
      }
      throw new Error('Unauthorized - token expired and no refresh handler configured');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LTK API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Build query string from params object
   */
  private buildQuery(params: Record<string, any>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        query.append(key, String(value));
      }
    });
    return query.toString();
  }

  // ============================================================================
  // ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get list of contributor/publisher accounts
   * Returns all publisher accounts associated with the authenticated user
   */
  async getContributors(): Promise<any> {
    return this.fetch('/analytics/contributors');
  }

  /**
   * Get hero chart data (main dashboard metrics over time)
   * Returns time-series data for clicks, sales, revenue by day/week/month
   */
  async getHeroChart(params: HeroChartParams): Promise<any> {
    const query = this.buildQuery(params);
    return this.fetch(`/analytics/hero_chart?${query}`);
  }

  /**
   * Get performance summary (aggregated metrics)
   * Returns total clicks, sales, revenue, commission for date range
   */
  async getPerformanceSummary(params: PerformanceSummaryParams): Promise<any> {
    const query = this.buildQuery(params);
    return this.fetch(`/api/creator-analytics/v1/performance_summary?${query}`);
  }

  /**
   * Get detailed performance stats
   */
  async getPerformanceStats(params: PerformanceStatsParams): Promise<any> {
    const query = this.buildQuery(params);
    return this.fetch(`/api/creator-analytics/v1/performance_stats?${query}`);
  }

  /**
   * Get top performing links
   * Returns array of best-performing affiliate links with metrics
   */
  async getTopPerformers(params: TopPerformersParams): Promise<any> {
    const query = this.buildQuery(params);
    return this.fetch(`/analytics/top_performers/links?${query}`);
  }

  /**
   * Get items sold
   * Returns list of products that generated sales
   */
  async getItemsSold(params: ItemsSoldParams = {}): Promise<any> {
    const query = this.buildQuery({ limit: 50, currency: 'USD', ...params });
    return this.fetch(`/api/creator-analytics/v1/items_sold/?${query}`);
  }

  /**
   * Get commissions summary
   * Returns earnings/commission breakdown
   */
  async getCommissionsSummary(params: CommissionsSummaryParams = {}): Promise<any> {
    const query = this.buildQuery({ currency: 'USD', ...params });
    return this.fetch(`/api/creator-analytics/v1/commissions_summary?${query}`);
  }

  // ============================================================================
  // USER & ACCOUNT ENDPOINTS
  // ============================================================================

  /**
   * Get user profile
   */
  async getUser(userId: number): Promise<any> {
    return this.fetch(`/api/creator-account-service/v1/users/${userId}`);
  }

  /**
   * Get account details
   */
  async getAccount(accountId: number): Promise<any> {
    return this.fetch(`/api/creator-account-service/v1/accounts/${accountId}`);
  }

  /**
   * Get account users
   */
  async getAccountUsers(accountId: number): Promise<any> {
    return this.fetch(`/api/creator-account-service/v1/accounts/${accountId}/users`);
  }

  /**
   * Get current user info
   */
  async getUserInfo(): Promise<any> {
    return this.fetch('/api/co-api/v1/get_user_info');
  }

  /**
   * Get public profile
   */
  async getPublicProfile(accountId: number): Promise<any> {
    const query = this.buildQuery({ rs_account_id: accountId });
    return this.fetch(`/api/pub/v2/profiles/?${query}`);
  }

  /**
   * Get Amazon identities (linked Amazon Associate accounts)
   */
  async getAmazonIdentities(): Promise<any> {
    return this.fetch('/api/co-api/v1/get_amazon_identities');
  }

  /**
   * Get LTK search trends
   */
  async getLTKSearchTrends(): Promise<any> {
    return this.fetch('/api/ltk/v2/ltk_search_trends/');
  }
}

/**
 * Create LTK API client instance
 * 
 * @param getIdToken - Function that returns current Auth0 ID token
 * @param onTokenRefresh - Optional callback to refresh token on 401
 */
export function createLTKApiClient(
  getIdToken: () => string | null,
  onTokenRefresh?: () => Promise<void>
): LTKApiClient {
  return new LTKApiClient(getIdToken, onTokenRefresh);
}
