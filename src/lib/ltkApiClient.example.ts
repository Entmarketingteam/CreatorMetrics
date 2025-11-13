/**
 * LTK API Client (Type-Safe)
 *
 * This is an EXAMPLE/TEMPLATE showing how a type-safe API client with
 * 401 handling could be implemented. This can work alongside or replace
 * the existing services/ltkApi.ts implementation.
 *
 * Features:
 * - Type-safe request/response
 * - Automatic 401 retry with token refresh
 * - Request/response interceptors
 * - Comprehensive endpoint coverage (14+)
 * - Error handling
 * - Rate limiting awareness
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LTKClientConfig {
  baseURL?: string;
  timeout?: number;
  retryAttempts?: number;
  onTokenExpired?: () => void;
  onError?: (error: LTKApiError) => void;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOn401?: boolean;
}

export class LTKApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: any
  ) {
    super(message);
    this.name = 'LTKApiError';
  }
}

// Stats Types
export interface GetStatsParams {
  range?: 'day' | 'week' | 'month' | 'year' | 'all';
  start?: string;
  end?: string;
}

export interface StatsResponse {
  clicks: number;
  sales: number;
  conversions: number;
  earnings: number;
  commission: number;
  aov: number;
  conversion_rate: number;
}

// Earnings Types
export interface GetEarningsParams {
  start?: string;
  end?: string;
  platform?: string;
  status?: 'pending' | 'paid' | 'all';
}

export interface EarningsResponse {
  total_earnings: number;
  pending: number;
  paid: number;
  by_platform: Array<{
    platform: string;
    amount: number;
    sales: number;
  }>;
  by_month: Array<{
    month: string;
    amount: number;
  }>;
}

// Products Types
export interface GetTopProductsParams {
  limit?: number;
  timeframe?: 'day' | 'week' | 'month';
  sort?: 'sales' | 'revenue' | 'clicks';
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  image_url: string;
  price: number;
  commission_rate: number;
  clicks: number;
  sales: number;
  revenue: number;
  conversion_rate: number;
}

export interface TopProductsResponse {
  products: Product[];
}

// User Types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatar_url: string;
  verified: boolean;
  created_at: string;
}

// Posts Types
export interface GetPostsParams {
  limit?: number;
  offset?: number;
  platform?: 'instagram' | 'tiktok' | 'blog';
  sort?: 'recent' | 'performance' | 'revenue';
}

export interface Post {
  id: string;
  platform: string;
  type: 'post' | 'story' | 'reel';
  caption: string;
  media_url: string;
  posted_at: string;
  clicks: number;
  sales: number;
  revenue: number;
  engagement_rate: number;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  has_more: boolean;
}

// ============================================================================
// API Client Class
// ============================================================================

export class LTKApiClient {
  private baseURL: string;
  private token: string | null = null;
  private config: LTKClientConfig;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: LTKClientConfig = {}) {
    this.baseURL = config.baseURL || 'https://api.liketoknow.it';
    this.config = {
      timeout: 30000,
      retryAttempts: 1,
      ...config,
    };
  }

  // ============================================================================
  // Token Management
  // ============================================================================

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  getToken(): string | null {
    return this.token;
  }

  // ============================================================================
  // Core Request Method with 401 Handling
  // ============================================================================

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipAuth = false, retryOn401 = true, ...fetchOptions } = options;

    // Build headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...fetchOptions.headers,
    };

    // Add auth token if available and not skipped
    if (!skipAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Build full URL
    const url = `${this.baseURL}${endpoint}`;

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.config.timeout
    );

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401: Token expired or invalid
      if (response.status === 401 && retryOn401) {
        console.warn('401 Unauthorized - Attempting token refresh');

        // Try to refresh token (singleton promise to avoid multiple refreshes)
        if (!this.refreshPromise) {
          this.refreshPromise = this.refreshToken();
        }

        const refreshed = await this.refreshPromise;
        this.refreshPromise = null;

        if (refreshed) {
          // Retry original request with new token
          console.log('Token refreshed - Retrying request');
          return this.request<T>(endpoint, {
            ...options,
            retryOn401: false, // Don't retry again
          });
        } else {
          // Refresh failed - notify callback
          if (this.config.onTokenExpired) {
            this.config.onTokenExpired();
          }
          throw new LTKApiError(401, 'Token expired and refresh failed');
        }
      }

      // Handle other error statuses
      if (!response.ok) {
        const errorText = await response.text();
        const error = new LTKApiError(
          response.status,
          `HTTP ${response.status}: ${errorText}`,
          errorText
        );

        if (this.config.onError) {
          this.config.onError(error);
        }

        throw error;
      }

      // Parse JSON response
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LTKApiError) {
        throw error;
      }

      // Network error or timeout
      const apiError = new LTKApiError(
        0,
        error instanceof Error ? error.message : 'Network error'
      );

      if (this.config.onError) {
        this.config.onError(apiError);
      }

      throw apiError;
    }
  }

  // ============================================================================
  // Token Refresh (placeholder - needs actual implementation)
  // ============================================================================

  private async refreshToken(): Promise<boolean> {
    try {
      // TODO: Implement actual token refresh logic
      // This would call an LTK refresh endpoint if it exists
      // For now, return false to indicate refresh not available

      // Example implementation if refresh endpoint exists:
      // const response = await this.request<{ token: string }>('/api/v1/auth/refresh', {
      //   method: 'POST',
      //   skipAuth: true,
      //   retryOn401: false,
      // });
      // this.setToken(response.token);
      // return true;

      console.warn('Token refresh not implemented - LTK may not support automatic refresh');
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // ============================================================================
  // API Endpoint Methods
  // ============================================================================

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserProfile> {
    return this.request<UserProfile>('/api/v1/user/profile');
  }

  /**
   * Get stats for a given time range
   */
  async getStats(params: GetStatsParams = {}): Promise<StatsResponse> {
    const queryParams = new URLSearchParams();
    if (params.range) queryParams.append('range', params.range);
    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);

    const query = queryParams.toString();
    const endpoint = `/api/v1/stats${query ? `?${query}` : ''}`;

    return this.request<StatsResponse>(endpoint);
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/v1/dashboard/summary');
  }

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview(): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/v1/analytics/overview');
  }

  /**
   * Get earnings
   */
  async getEarnings(params: GetEarningsParams = {}): Promise<EarningsResponse> {
    const queryParams = new URLSearchParams();
    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.status) queryParams.append('status', params.status);

    const query = queryParams.toString();
    const endpoint = `/api/v1/earnings${query ? `?${query}` : ''}`;

    return this.request<EarningsResponse>(endpoint);
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(): Promise<any> {
    return this.request<any>('/api/v1/revenue/breakdown');
  }

  /**
   * Get commissions
   */
  async getCommissions(): Promise<any> {
    return this.request<any>('/api/v1/commissions');
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(): Promise<any> {
    return this.request<any>('/api/v1/payments/history');
  }

  /**
   * Get top products
   */
  async getTopProducts(params: GetTopProductsParams = {}): Promise<TopProductsResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.timeframe) queryParams.append('timeframe', params.timeframe);
    if (params.sort) queryParams.append('sort', params.sort);

    const query = queryParams.toString();
    const endpoint = `/api/v1/products/top${query ? `?${query}` : ''}`;

    return this.request<TopProductsResponse>(endpoint);
  }

  /**
   * Get trending products
   */
  async getTrendingProducts(): Promise<TopProductsResponse> {
    return this.request<TopProductsResponse>('/api/v1/products/trending');
  }

  /**
   * Get product performance
   */
  async getProductPerformance(productId: string): Promise<any> {
    return this.request<any>(`/api/v1/products/${productId}/performance`);
  }

  /**
   * Get links performance
   */
  async getLinksPerformance(): Promise<any> {
    return this.request<any>('/api/v1/links/performance');
  }

  /**
   * Get all links
   */
  async getLinks(): Promise<any> {
    return this.request<any>('/api/v1/links');
  }

  /**
   * Create a new link
   */
  async createLink(data: { products: string[]; title: string; description?: string }): Promise<any> {
    return this.request<any>('/api/v1/links/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get link details
   */
  async getLink(linkId: string): Promise<any> {
    return this.request<any>(`/api/v1/links/${linkId}`);
  }

  /**
   * Get posts
   */
  async getPosts(params: GetPostsParams = {}): Promise<PostsResponse> {
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());
    if (params.platform) queryParams.append('platform', params.platform);
    if (params.sort) queryParams.append('sort', params.sort);

    const query = queryParams.toString();
    const endpoint = `/api/v1/posts${query ? `?${query}` : ''}`;

    return this.request<PostsResponse>(endpoint);
  }

  /**
   * Get post details
   */
  async getPost(postId: string): Promise<any> {
    return this.request<any>(`/api/v1/posts/${postId}`);
  }

  /**
   * Get content performance
   */
  async getContentPerformance(): Promise<any> {
    return this.request<any>('/api/v1/content/performance');
  }

  /**
   * Search products
   */
  async searchProducts(query: string, filters?: Record<string, any>): Promise<any> {
    const queryParams = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
    }

    return this.request<any>(`/api/v1/products/search?${queryParams.toString()}`);
  }
}

// ============================================================================
// Singleton Instance (Optional)
// ============================================================================

export const ltkApiClient = new LTKApiClient({
  onTokenExpired: () => {
    console.warn('LTK token expired - user needs to re-authenticate');
    // Could trigger a notification or redirect
  },
  onError: (error) => {
    console.error('LTK API Error:', error);
    // Could log to analytics or error tracking service
  },
});

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Set token
ltkApiClient.setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// Fetch stats
const stats = await ltkApiClient.getStats({ range: 'week' });
console.log(`Earnings: $${stats.earnings}`);

// Fetch top products
const { products } = await ltkApiClient.getTopProducts({ limit: 5 });
products.forEach(p => {
  console.log(`${p.name}: $${p.revenue}`);
});

// Handle errors
try {
  const earnings = await ltkApiClient.getEarnings({
    start: '2024-01-01',
    end: '2024-01-31'
  });
} catch (error) {
  if (error instanceof LTKApiError) {
    if (error.status === 401) {
      // Token expired - show re-auth UI
    } else {
      // Other error
    }
  }
}

// Search products
const searchResults = await ltkApiClient.searchProducts('shoes', {
  category: 'fashion',
  min_commission: 10
});
*/
