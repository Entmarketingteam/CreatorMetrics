# LTK Implementation Comparison

Analysis of different approaches to LTK API integration in CreatorMetrics.

## Current Implementation Overview

### Existing: Services Layer Approach (`src/services/`)

**Files Created:**
- `src/services/ltkApi.ts` - API client with endpoint discovery
- `src/services/ltkTokenManager.ts` - Token storage and management
- `src/services/ltkRefreshScheduler.ts` - Auto-refresh scheduler
- `src/hooks/useLTK.ts` - React hook for easy integration
- `src/components/LTKConnectionSettings.tsx` - Settings UI
- `src/components/LTKStatsWidget.tsx` - Dashboard widget

**Architecture:**
```
┌─────────────────────────────────────┐
│         UI Components               │
│  (Settings, Dashboard Widget)       │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         React Hook (useLTK)         │
│  - Manages state                    │
│  - Provides actions                 │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│         Service Layer               │
│  ┌──────────────────────────────┐  │
│  │ ltkApi                       │  │
│  │ - API calls                  │  │
│  │ - Endpoint discovery         │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ltkTokenManager              │  │
│  │ - Storage                    │  │
│  │ - Validation                 │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ltkRefreshScheduler          │  │
│  │ - Auto-refresh               │  │
│  │ - Error handling             │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Strengths:**
- ✅ Complete end-to-end solution (API + UI + scheduling)
- ✅ Auto-refresh built-in
- ✅ Token management included
- ✅ React integration via hooks
- ✅ Database persistence
- ✅ User-friendly UI components
- ✅ Comprehensive documentation

**Weaknesses:**
- ❌ Hardcoded endpoint patterns (tries multiple but limited)
- ❌ No 401 automatic retry logic
- ❌ Basic encryption (XOR + Base64)
- ❌ Limited endpoint coverage (only stats, earnings, products)
- ❌ Tightly coupled to React/UI

---

### Potential: API Client Approach (`src/lib/ltkApiClient.ts`)

**Proposed Architecture:**
```
┌─────────────────────────────────────┐
│      Type-Safe API Client           │
│  ┌──────────────────────────────┐  │
│  │ Authentication Layer          │  │
│  │ - Token injection            │  │
│  │ - 401 auto-retry             │  │
│  │ - Token refresh              │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Endpoint Methods              │  │
│  │ - 14+ discovered endpoints   │  │
│  │ - Type-safe responses        │  │
│  │ - Request/response types     │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ Interceptors                  │  │
│  │ - Request logging            │  │
│  │ - Error handling             │  │
│  │ - Rate limiting              │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Potential Strengths:**
- ✅ Framework-agnostic (not tied to React)
- ✅ Type-safe with full TypeScript support
- ✅ 401 automatic handling with retry
- ✅ Comprehensive endpoint coverage (14+ endpoints)
- ✅ Request/response interceptors
- ✅ Centralized API logic
- ✅ Easier to test in isolation
- ✅ Reusable across different features

**Potential Weaknesses:**
- ❌ No UI components
- ❌ No auto-refresh scheduling
- ❌ No token storage management
- ❌ Requires additional integration work
- ❌ More boilerplate for React usage

---

## Feature Comparison Matrix

| Feature | Services Layer | API Client | Combined |
|---------|---------------|------------|----------|
| **API Calls** | ✅ Basic | ✅ Advanced | ✅ Best |
| **Type Safety** | ⚠️ Partial | ✅ Full | ✅ Full |
| **Endpoint Coverage** | ⚠️ 3 endpoints | ✅ 14+ endpoints | ✅ 14+ endpoints |
| **401 Retry** | ❌ No | ✅ Yes | ✅ Yes |
| **Token Storage** | ✅ Yes | ❌ No | ✅ Yes |
| **Auto-Refresh** | ✅ Yes | ❌ No | ✅ Yes |
| **React Hook** | ✅ Yes | ❌ No | ✅ Yes |
| **UI Components** | ✅ Yes | ❌ No | ✅ Yes |
| **Database Persist** | ✅ Yes | ❌ No | ✅ Yes |
| **Framework Agnostic** | ❌ No | ✅ Yes | ⚠️ Partial |
| **Testability** | ⚠️ Medium | ✅ High | ✅ High |
| **Documentation** | ✅ Extensive | ⚠️ Needs work | ✅ Extensive |

---

## Discovered LTK Endpoints (Reference)

Based on reverse-engineering, here are potential LTK API endpoints:

### Authentication
```typescript
POST /api/v1/auth/login
POST /api/v1/auth/refresh
GET  /api/v1/auth/me
```

### User Profile
```typescript
GET  /api/v1/user/profile
PUT  /api/v1/user/profile
GET  /api/v1/creator/stats
```

### Analytics & Stats
```typescript
GET  /api/v1/stats?range={day|week|month}
GET  /api/v1/analytics/overview
GET  /api/v1/dashboard/summary
GET  /api/v1/metrics/performance
```

### Earnings & Revenue
```typescript
GET  /api/v1/earnings?start={date}&end={date}
GET  /api/v1/revenue/breakdown
GET  /api/v1/commissions
GET  /api/v1/payments/history
```

### Products & Links
```typescript
GET  /api/v1/products/top?limit={n}
GET  /api/v1/products/trending
GET  /api/v1/links/performance
POST /api/v1/links/create
GET  /api/v1/links/{linkId}
```

### Content & Posts
```typescript
GET  /api/v1/posts
GET  /api/v1/posts/{postId}
GET  /api/v1/content/performance
```

---

## Integration Strategies

### Option 1: Keep Both (Recommended for Now)

**Structure:**
```
src/
├── lib/
│   └── ltkApiClient.ts          # Low-level API client
│       - Type-safe endpoints
│       - 401 handling
│       - Interceptors
│
├── services/
│   ├── ltkApi.ts                 # High-level wrapper (uses ltkApiClient)
│   ├── ltkTokenManager.ts        # Token storage/management
│   └── ltkRefreshScheduler.ts    # Auto-refresh logic
│
├── hooks/
│   └── useLTK.ts                 # React integration
│
└── components/
    ├── LTKConnectionSettings.tsx
    └── LTKStatsWidget.tsx
```

**Why:**
- API client handles low-level HTTP concerns
- Services layer adds business logic
- Clear separation of concerns
- Easy to test each layer independently

**Migration Path:**
```typescript
// Before (current)
const result = await ltkApi.fetchStats();

// After (using API client internally)
// In ltkApi.ts
import { ltkApiClient } from '../lib/ltkApiClient';

async fetchStats() {
  return ltkApiClient.getStats({ range: 'week' });
}
```

### Option 2: Merge into Single Client

**Structure:**
```
src/
├── lib/
│   └── ltk/
│       ├── client.ts             # API client
│       ├── auth.ts               # Token management
│       ├── scheduler.ts          # Auto-refresh
│       └── types.ts              # TypeScript types
│
├── hooks/
│   └── useLTK.ts
│
└── components/
    └── LTK/
```

**Why:**
- Single source of truth
- Easier to maintain
- Less duplication

**Against:**
- More complex single file/module
- Harder to test individual pieces

### Option 3: Adapter Pattern

**Structure:**
```typescript
// Low-level client (framework agnostic)
class LTKApiClient {
  async getStats(params) { ... }
  async getEarnings(params) { ... }
}

// React adapter
class LTKReactAdapter {
  constructor(private client: LTKApiClient) {}

  useStats() {
    // React-specific logic
    // Uses client internally
  }
}

// Auto-refresh adapter
class LTKSchedulerAdapter {
  constructor(private client: LTKApiClient) {}

  startAutoRefresh() {
    // Uses client for periodic fetches
  }
}
```

**Why:**
- Maximum flexibility
- Easy to add new adapters (Vue, Angular, etc.)
- Clean separation

**Against:**
- More boilerplate
- Might be over-engineering for current needs

---

## Recommended Approach

### Phase 1: Enhance API Client ✅
Create `src/lib/ltkApiClient.ts` with:
- All 14+ discovered endpoints
- Full TypeScript types
- 401 automatic retry
- Request/response interceptors
- Comprehensive error handling

### Phase 2: Refactor Services ✅
Update `src/services/ltkApi.ts` to:
- Use `ltkApiClient` internally
- Add business logic layer
- Keep existing interface (no breaking changes)

### Phase 3: Enhance Types 📋
Create `src/types/ltk.ts` with:
- Request/response interfaces
- Endpoint parameter types
- Error types
- Metadata types

### Phase 4: Improve Error Handling 📋
Add:
- Retry logic with exponential backoff
- Circuit breaker pattern
- Better error messages
- User-friendly error handling

### Phase 5: Advanced Features 🎯
Consider:
- Request deduplication
- Response caching with cache invalidation
- Optimistic updates
- Offline support
- Background sync

---

## Code Examples

### Current Implementation
```typescript
// src/services/ltkApi.ts
export class LTKApiService {
  async fetchStats() {
    const endpoints = [
      '/api/v1/stats?range=week',
      '/api/v1/analytics?period=week',
      // ... tries multiple patterns
    ];

    for (const endpoint of endpoints) {
      const result = await this.request(endpoint);
      if (result.success) return result;
    }
  }
}
```

### Proposed API Client
```typescript
// src/lib/ltkApiClient.ts
export class LTKApiClient {
  private baseURL = 'https://api.liketoknow.it';
  private token: string | null = null;

  // Automatic 401 handling
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401: Try to refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry original request
        response = await fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...headers,
            'Authorization': `Bearer ${this.token}`,
          },
        });
      }
    }

    if (!response.ok) {
      throw new LTKApiError(response.status, await response.text());
    }

    return response.json();
  }

  // Type-safe endpoint methods
  async getStats(params: GetStatsParams): Promise<StatsResponse> {
    return this.request<StatsResponse>('/api/v1/stats', {
      method: 'GET',
      // ... handle params
    });
  }

  async getEarnings(params: GetEarningsParams): Promise<EarningsResponse> {
    return this.request<EarningsResponse>('/api/v1/earnings', {
      method: 'GET',
      // ... handle params
    });
  }

  // ... 14+ more endpoints
}
```

### Integrated Approach
```typescript
// src/services/ltkApi.ts (refactored)
import { ltkApiClient } from '../lib/ltkApiClient';
import { ltkTokenManager } from './ltkTokenManager';

export class LTKApiService {
  private client: LTKApiClient;

  constructor() {
    this.client = new LTKApiClient();
  }

  async fetchStats(timeRange?: string): Promise<LTKApiResponse<LTKStatsResponse>> {
    try {
      // Get token from manager
      const credentials = await ltkTokenManager.getCredentials();
      if (!credentials) {
        return { success: false, error: 'No credentials' };
      }

      // Set token in client
      this.client.setToken(credentials.value);

      // Use type-safe client method
      const data = await this.client.getStats({ range: timeRange || 'week' });

      // Normalize response (business logic)
      return {
        success: true,
        data: this.normalizeStatsResponse(data),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private normalizeStatsResponse(data: any): LTKStatsResponse {
    // Business logic to normalize different response formats
    return {
      clicks: data.clicks || data.totalClicks || 0,
      sales: data.sales || data.conversions || 0,
      earnings: data.earnings || data.revenue || 0,
    };
  }
}
```

---

## Migration Plan

### Immediate (Keep Both)
1. ✅ Keep existing services layer functional
2. ✅ Document both approaches
3. 📋 Create API client in parallel
4. 📋 Add comprehensive TypeScript types
5. 📋 Test both implementations

### Short-term (Integrate)
1. 📋 Refactor services to use API client internally
2. 📋 Maintain backward compatibility
3. 📋 Add 401 retry to existing flows
4. 📋 Expand endpoint coverage

### Long-term (Optimize)
1. 🎯 Consider framework-agnostic approach
2. 🎯 Add advanced features (caching, offline, etc.)
3. 🎯 Performance optimization
4. 🎯 Consider extracting to separate package

---

## Testing Strategy

### API Client Tests
```typescript
describe('LTKApiClient', () => {
  it('should retry on 401 with token refresh', async () => {
    // Mock 401 response, then success
  });

  it('should throw error after failed refresh', async () => {
    // Test error handling
  });

  it('should return typed response', async () => {
    // Test TypeScript types are correct
  });
});
```

### Integration Tests
```typescript
describe('LTK Integration', () => {
  it('should fetch and store stats', async () => {
    // Test full flow
  });

  it('should handle token expiration gracefully', async () => {
    // Test token refresh flow
  });
});
```

---

## Conclusion

**Current State:**
- Working services layer with UI components ✅
- Auto-refresh and token management ✅
- Limited endpoint coverage ⚠️

**Recommended Next Steps:**
1. Create type-safe API client (`src/lib/ltkApiClient.ts`)
2. Document all discovered endpoints
3. Gradually refactor services to use API client
4. Maintain backward compatibility
5. Add comprehensive tests

**Benefits of Combined Approach:**
- Low-level client: Handles HTTP, 401s, types
- Services layer: Business logic, normalization
- Hooks: React integration
- Components: User interface
- Scheduler: Automation

This gives us the best of both worlds: a robust, type-safe API foundation with high-level features for easy integration.
