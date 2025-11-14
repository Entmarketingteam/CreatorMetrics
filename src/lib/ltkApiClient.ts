/**
 * LTK API Client
 * 
 * Uses backend proxy to access LTK API and bypass CORS restrictions.
 * Backend server forwards requests to api-gateway.rewardstyle.com
 */

// Use backend proxy URL
// Development: http://localhost:3001
// Production: Same origin (empty string defaults to current host)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const PROXY_BASE = `${BACKEND_URL}/api/ltk`;

export interface LTKAnalyticsParams {
  start_date?: string;
  end_date?: string;
  publisher_ids?: string;
  platform?: string;
  interval?: 'day' | 'week' | 'month';
  limit?: number;
  start?: string;
  end?: string;
}

export class LTKApiClient {
  constructor(
    private getAccessToken: () => string,
    private getIdToken: () => string
  ) {}

  private async request(endpoint: string, options: RequestInit = {}) {
    const accessToken = this.getAccessToken();
    const idToken = this.getIdToken();
    
    if (!accessToken || !idToken) {
      throw new Error('Both Access Token and ID Token are required');
    }

    const url = `${PROXY_BASE}${endpoint}`;
    console.log('[LTK Client] Making request to:', url);
    console.log('[LTK Client] PROXY_BASE:', PROXY_BASE);
    console.log('[LTK Client] BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-ltk-access-token': accessToken,
        'x-ltk-id-token': idToken,
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new Error('Unauthorized - token expired and no refresh handler configured');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Analytics Endpoints
  async getContributors() {
    return this.request('/analytics/contributors');
  }

  async getHeroChart(params: LTKAnalyticsParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/analytics/hero-chart?${query}`);
  }

  async getPerformanceSummary(params: LTKAnalyticsParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/analytics/performance-summary?${query}`);
  }

  async getPerformanceStats(params: LTKAnalyticsParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/analytics/performance-stats?${query}`);
  }

  async getTopPerformers(params: LTKAnalyticsParams) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/analytics/top-performers?${query}`);
  }

  async getItemsSold(params: { limit?: number; offset?: number; status?: string } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/analytics/items-sold?${query}`);
  }

  async getCommissionsSummary() {
    return this.request('/analytics/commissions-summary');
  }

  // User & Account Endpoints
  async getUser(publisherId: number) {
    return this.request(`/user/${publisherId}`);
  }

  async getAccount(accountId: number) {
    return this.request(`/account/${accountId}`);
  }

  async getAccountUsers(accountId: number) {
    return this.request(`/account/${accountId}/users`);
  }

  async getUserInfo() {
    return this.request('/user-info');
  }

  async getPublicProfile(accountId: number) {
    return this.request(`/public-profile/${accountId}`);
  }

  // Integration Endpoints
  async getAmazonIdentities() {
    return this.request('/amazon-identities');
  }

  async getLTKSearchTrends() {
    return this.request('/search-trends');
  }
}
