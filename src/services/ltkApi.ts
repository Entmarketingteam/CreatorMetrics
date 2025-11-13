/**
 * LTK API Service
 * Handles authenticated requests to LikeToKnow.it APIs
 */

export interface LTKCredentials {
  type: 'bearer' | 'cookie' | 'api_key';
  value: string;
  expiresAt?: string;
}

export interface LTKStatsResponse {
  clicks: number;
  sales: number;
  earnings: number;
  topProducts?: Array<{
    id: string;
    name: string;
    clicks: number;
    sales: number;
    commission: number;
  }>;
}

export interface LTKApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * LTK API Service Class
 * Handles all interactions with LTK's APIs using extracted credentials
 */
export class LTKApiService {
  private credentials: LTKCredentials | null = null;
  private baseUrl: string = 'https://api.liketoknow.it'; // Default, may need adjustment
  private lastFetchTime: number = 0;
  private cacheData: any = null;
  private cacheDuration: number = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Set credentials for API authentication
   */
  setCredentials(credentials: LTKCredentials): void {
    this.credentials = credentials;
    this.clearCache();
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.cacheData = null;
    this.lastFetchTime = 0;
  }

  /**
   * Get authentication headers based on credential type
   */
  private getAuthHeaders(): HeadersInit {
    if (!this.credentials) {
      throw new Error('No credentials set');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    switch (this.credentials.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${this.credentials.value}`;
        break;
      case 'api_key':
        headers['X-API-Key'] = this.credentials.value;
        break;
      case 'cookie':
        // Cookies are automatically sent by browser if same-origin
        // For cross-origin, we might need to use credentials: 'include'
        headers['Cookie'] = this.credentials.value;
        break;
    }

    return headers;
  }

  /**
   * Make authenticated request to LTK API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<LTKApiResponse<T>> {
    try {
      const headers = this.getAuthHeaders();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: this.credentials?.type === 'cookie' ? 'include' : 'same-origin',
      });

      if (!response.ok) {
        // Handle different error codes
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            error: 'Authentication failed. Token may be expired or invalid.',
          };
        }
        return {
          success: false,
          error: `API request failed: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      console.error('LTK API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Test if credentials are valid
   */
  async testConnection(): Promise<LTKApiResponse<any>> {
    // Try common endpoints that should work with valid credentials
    const testEndpoints = [
      '/api/v1/user/profile',
      '/api/v1/me',
      '/api/user',
      '/v1/user',
    ];

    for (const endpoint of testEndpoints) {
      const result = await this.request(endpoint);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: 'Could not connect to LTK API. Please verify your credentials and endpoint URLs.',
    };
  }

  /**
   * Fetch stats from LTK
   * This method tries multiple possible endpoint patterns
   */
  async fetchStats(timeRange: 'day' | 'week' | 'month' | 'all' = 'week'): Promise<LTKApiResponse<LTKStatsResponse>> {
    // Check cache first
    const now = Date.now();
    if (this.cacheData && (now - this.lastFetchTime) < this.cacheDuration) {
      return {
        success: true,
        data: this.cacheData,
      };
    }

    // Try different endpoint patterns that LTK might use
    const endpoints = [
      `/api/v1/stats?range=${timeRange}`,
      `/api/v1/analytics?period=${timeRange}`,
      `/api/stats?timeRange=${timeRange}`,
      `/v1/stats`,
      `/api/v1/dashboard/stats`,
    ];

    for (const endpoint of endpoints) {
      const result = await this.request<any>(endpoint);
      if (result.success && result.data) {
        // Try to normalize the response into our expected format
        const normalizedData = this.normalizeStatsResponse(result.data);

        // Cache the result
        this.cacheData = normalizedData;
        this.lastFetchTime = now;

        return {
          success: true,
          data: normalizedData,
        };
      }
    }

    return {
      success: false,
      error: 'Could not fetch stats from any known endpoint. Please check the Network tab in DevTools to find the correct endpoint.',
    };
  }

  /**
   * Normalize different possible response formats into our standard format
   */
  private normalizeStatsResponse(data: any): LTKStatsResponse {
    // Try to extract stats from various possible response structures
    return {
      clicks: data.clicks || data.totalClicks || data.click_count || 0,
      sales: data.sales || data.totalSales || data.sale_count || data.conversions || 0,
      earnings: data.earnings || data.totalEarnings || data.revenue || data.commission || 0,
      topProducts: data.topProducts || data.top_products || data.products || [],
    };
  }

  /**
   * Fetch earnings breakdown
   */
  async fetchEarnings(startDate?: string, endDate?: string): Promise<LTKApiResponse<any>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    const queryString = params.toString() ? `?${params.toString()}` : '';

    const endpoints = [
      `/api/v1/earnings${queryString}`,
      `/api/v1/revenue${queryString}`,
      `/api/earnings${queryString}`,
      `/v1/commissions${queryString}`,
    ];

    for (const endpoint of endpoints) {
      const result = await this.request(endpoint);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: 'Could not fetch earnings data',
    };
  }

  /**
   * Fetch top performing products
   */
  async fetchTopProducts(limit: number = 10): Promise<LTKApiResponse<any>> {
    const endpoints = [
      `/api/v1/products/top?limit=${limit}`,
      `/api/v1/products?sort=performance&limit=${limit}`,
      `/api/products/top`,
      `/v1/products/trending`,
    ];

    for (const endpoint of endpoints) {
      const result = await this.request(endpoint);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: 'Could not fetch products data',
    };
  }

  /**
   * Set custom base URL if LTK uses a different domain
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
    this.clearCache();
  }

  /**
   * Check if credentials are expired
   */
  isCredentialsExpired(): boolean {
    if (!this.credentials || !this.credentials.expiresAt) {
      return false; // No expiry set
    }

    return new Date(this.credentials.expiresAt) < new Date();
  }

  /**
   * Clear credentials
   */
  clearCredentials(): void {
    this.credentials = null;
    this.clearCache();
  }
}

// Export singleton instance
export const ltkApi = new LTKApiService();
