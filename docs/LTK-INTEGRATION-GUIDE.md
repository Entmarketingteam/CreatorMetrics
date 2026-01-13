# LTK API Integration Guide for New Applications

**Quick Start:** How to add LTK API integration to any new application

This guide walks you through integrating the LTK (LikeToKnow.it / RewardStyle) API into a new application, whether it's a React app, Node.js backend, Python script, or any other platform.

---

## 📚 Prerequisites

1. **Read the Complete Reference First:**
   - [`LTK-API-COMPLETE-REFERENCE.md`](./LTK-API-COMPLETE-REFERENCE.md) - All endpoint details, auth flows, code examples

2. **Understand the Requirements:**
   - Auth0 OAuth 2.0 authentication
   - Dual-header requirement (Authorization + X-id-token)
   - Token refresh flow
   - Base URL: `https://api-gateway.rewardstyle.com`

---

## Step-by-Step Integration

### Step 1: Set Up OAuth Authentication

#### Option A: Frontend-Only (Development/Testing)

**For React/Next.js/Vue/etc:**

1. **Install dependencies:**
   ```bash
   npm install jwt-decode  # For decoding JWT tokens
   ```

2. **Create auth service** (copy from `src/lib/ltkAuth.ts`):
   - Token storage (localStorage for dev)
   - Token refresh logic
   - Auth state management

3. **Set up OAuth redirect:**
   ```typescript
   // Redirect to Auth0
   const authUrl = `https://creator-auth.shopltk.com/authorize?` +
     `response_type=code` +
     `&client_id=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT` +
     `&redirect_uri=${encodeURIComponent('http://localhost:3000/callback')}` +
     `&scope=openid profile email ltk.publisher offline_access` +
     `&state=${randomState}`;
   
   window.location.href = authUrl;
   ```

4. **Handle OAuth callback:**
   ```typescript
   // On callback page
   const code = new URLSearchParams(window.location.search).get('code');
   
   // Exchange code for tokens
   const response = await fetch('https://creator-auth.shopltk.com/oauth/token', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
     body: new URLSearchParams({
       grant_type: 'authorization_code',
       code: code,
       redirect_uri: 'http://localhost:3000/callback',
       client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT'
     })
   });
   
   const tokens = await response.json();
   // CRITICAL: Store both access_token AND id_token
   ```

#### Option B: Backend Proxy (Production Recommended)

**For Node.js/Express/Python/etc:**

1. **Create backend OAuth endpoints:**
   ```typescript
   // GET /auth/ltk/login
   router.get('/auth/ltk/login', (req, res) => {
     const state = generateRandomState();
     req.session.oauthState = state;
     
     const authUrl = `https://creator-auth.shopltk.com/authorize?` +
       `response_type=code` +
       `&client_id=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT` +
       `&redirect_uri=${encodeURIComponent(process.env.LTK_REDIRECT_URI)}` +
       `&scope=openid profile email ltk.publisher offline_access` +
       `&state=${state}`;
     
     res.redirect(authUrl);
   });
   
   // GET /auth/ltk/callback
   router.get('/auth/ltk/callback', async (req, res) => {
     const { code, state } = req.query;
     
     // Verify state
     if (state !== req.session.oauthState) {
       return res.status(400).json({ error: 'Invalid state' });
     }
     
     // Exchange code for tokens
     const tokenResponse = await fetch('https://creator-auth.shopltk.com/oauth/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: new URLSearchParams({
         grant_type: 'authorization_code',
         code: code as string,
         redirect_uri: process.env.LTK_REDIRECT_URI!,
         client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT'
       })
     });
     
     const tokens = await tokenResponse.json();
     
     // Store tokens securely (database, encrypted session, etc.)
     // Return success or redirect to frontend
     res.redirect('/dashboard?auth=success');
   });
   ```

2. **Create token refresh endpoint:**
   ```typescript
   // POST /auth/ltk/refresh
   router.post('/auth/ltk/refresh', async (req, res) => {
     const { refresh_token } = req.body;
     
     const response = await fetch('https://creator-auth.shopltk.com/oauth/token', {
       method: 'POST',
       headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
       body: new URLSearchParams({
         grant_type: 'refresh_token',
         refresh_token: refresh_token,
         client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT'
       })
     });
     
     const tokens = await response.json();
     // CRITICAL: Return both access_token AND id_token
     res.json(tokens);
   });
   ```

---

### Step 2: Create API Client

#### Option A: Direct API Calls (Frontend)

**Create API client class:**

```typescript
// ltkApiClient.ts
const LTK_API_BASE = 'https://api-gateway.rewardstyle.com';

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

    const response = await fetch(`${LTK_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-id-token': idToken,  // CRITICAL: Both headers required
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  // Example methods
  async getContributors() {
    return this.request('/analytics/contributors');
  }

  async getPerformanceSummary(params: {
    start_date: string;
    end_date: string;
    publisher_ids: string;
    platform: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/creator-analytics/v1/performance_summary?${query}`);
  }

  // Add more methods as needed (see complete reference)
}
```

#### Option B: Backend Proxy (Recommended for Production)

**Create backend proxy routes:**

```typescript
// server/routes/ltkProxy.ts
import { Router } from 'express';
const router = Router();

const LTK_API_BASE = 'https://api-gateway.rewardstyle.com';

async function proxyLTKRequest(
  endpoint: string,
  accessToken: string,
  idToken: string,
  method: string = 'GET',
  body?: any
) {
  const url = `${LTK_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-id-token': idToken,  // CRITICAL: Both headers required
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Example endpoint
router.get('/analytics/contributors', async (req, res) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens' });
    }

    const result = await proxyLTKRequest('/analytics/contributors', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add more endpoints (see complete reference for all 14+ endpoints)
export default router;
```

**Frontend calls proxy:**
```typescript
// Frontend API client
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export class LTKApiClient {
  constructor(
    private getAccessToken: () => string,
    private getIdToken: () => string
  ) {}

  private async request(endpoint: string) {
    const accessToken = this.getAccessToken();
    const idToken = this.getIdToken();
    
    const response = await fetch(`${BACKEND_URL}/api/ltk${endpoint}`, {
      headers: {
        'x-ltk-access-token': accessToken,
        'x-ltk-id-token': idToken,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getContributors() {
    return this.request('/analytics/contributors');
  }
}
```

---

### Step 3: Get Your Publisher ID

After authentication, get your publisher ID:

```typescript
// First API call after authentication
const client = new LTKApiClient(
  () => storedTokens.access_token,
  () => storedTokens.id_token
);

const contributors = await client.getContributors();
const publisherId = contributors.contributors[0].publisher_id; // e.g., "293045"

// Store publisherId for future API calls
```

---

### Step 4: Implement Token Refresh

**Token refresh function:**

```typescript
async function refreshLTKTokens(refreshToken: string): Promise<{
  access_token: string;
  id_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const response = await fetch('https://creator-auth.shopltk.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT',
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  
  // CRITICAL: Capture both access_token AND id_token
  if (!data.access_token || !data.id_token) {
    throw new Error('Missing tokens in refresh response');
  }

  return data;
}
```

**Auto-refresh before expiration:**

```typescript
// Check token expiration and refresh if needed
async function ensureValidTokens() {
  const tokens = getStoredTokens();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = tokens.expires_at - now;
  
  // Refresh if expires in less than 5 minutes
  if (expiresIn < 300) {
    const newTokens = await refreshLTKTokens(tokens.refresh_token);
    storeTokens(newTokens);
    return newTokens;
  }
  
  return tokens;
}
```

---

### Step 5: Environment Variables

**Create `.env` file:**

```bash
# Backend URL (if using proxy)
REACT_APP_BACKEND_URL=http://localhost:3001
# or
VITE_BACKEND_URL=http://localhost:3001

# OAuth Redirect URI (must match Auth0 config)
LTK_REDIRECT_URI=http://localhost:3000/auth/ltk/callback

# Session secret (for backend)
SESSION_SECRET=your-secret-key-here
```

**Add to `.gitignore`:**
```
.env
.env.local
.env.production
```

---

### Step 6: Copy Reusable Code

**From CreatorMetrics project, you can copy/adapt:**

1. **Authentication Service:**
   - `src/lib/ltkAuth.ts` - Token management, refresh logic
   - Adapt to your storage mechanism (localStorage, database, etc.)

2. **API Client:**
   - `src/lib/ltkApiClient.ts` - API methods
   - Adapt to your HTTP client/library

3. **Backend Proxy (if using):**
   - `server/routes/ltkProxy.ts` - All endpoint routes
   - Adapt to your backend framework

4. **Revenue Matching:**
   - `src/lib/contentMatcher.ts` - Instagram Story attribution
   - Reusable as-is

---

## Platform-Specific Guides

### React/Next.js

1. **Install dependencies:**
   ```bash
   npm install jwt-decode
   ```

2. **Copy auth service** from `src/lib/ltkAuth.ts`

3. **Copy API client** from `src/lib/ltkApiClient.ts`

4. **Set up OAuth redirect** in your auth flow

5. **Use in components:**
   ```typescript
   import { LTKApiClient } from './lib/ltkApiClient';
   import { ltkAuthService } from './lib/ltkAuth';
   
   const client = new LTKApiClient(
     () => ltkAuthService.getTokens()?.access_token || '',
     () => ltkAuthService.getTokens()?.id_token || ''
   );
   
   const data = await client.getPerformanceSummary({...});
   ```

### Node.js/Express Backend

1. **Set up OAuth routes** (see Step 1, Option B)

2. **Create proxy routes** (see Step 2, Option B)

3. **Add CORS** if frontend on different domain:
   ```typescript
   import cors from 'cors';
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

4. **Store tokens securely:**
   - Database (encrypted)
   - Redis (with expiration)
   - Encrypted session

### Python

```python
import requests
from typing import Dict, Optional

class LTKApiClient:
    BASE_URL = "https://api-gateway.rewardstyle.com"
    
    def __init__(self, access_token: str, id_token: str):
        self.access_token = access_token
        self.id_token = id_token
    
    def _request(self, endpoint: str, params: Optional[Dict] = None):
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'X-id-token': self.id_token,  # CRITICAL: Both headers
            'Content-Type': 'application/json'
        }
        
        url = f"{self.BASE_URL}{endpoint}"
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_contributors(self):
        return self._request('/analytics/contributors')
    
    def get_performance_summary(self, start_date: str, end_date: str, 
                                publisher_ids: str, platform: str = 'rs,ltk'):
        params = {
            'start_date': start_date,
            'end_date': end_date,
            'publisher_ids': publisher_ids,
            'platform': platform,
            'timezone': 'UTC'
        }
        return self._request('/api/creator-analytics/v1/performance_summary', params)

# Token refresh
def refresh_tokens(refresh_token: str) -> Dict:
    response = requests.post(
        'https://creator-auth.shopltk.com/oauth/token',
        data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT'
        },
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    response.raise_for_status()
    return response.json()
```

### Google AI Studio / Other Platforms

1. **Use backend proxy approach** (recommended)
   - Deploy backend proxy to handle CORS and token management
   - Frontend calls your backend, backend calls LTK API

2. **Or use direct API calls** if platform supports:
   - Ensure you can set both headers
   - Handle token refresh
   - Store tokens securely

---

## Quick Checklist

- [ ] Read complete reference documentation
- [ ] Set up OAuth authentication flow
- [ ] Implement token storage and refresh
- [ ] Create API client (direct or via proxy)
- [ ] Get publisher ID from contributors endpoint
- [ ] Test authentication with simple API call
- [ ] Implement error handling
- [ ] Set up environment variables
- [ ] Test token refresh flow
- [ ] Implement desired endpoints (see complete reference)

---

## Common Issues & Solutions

### Issue: 401 Unauthorized
**Solution:** Ensure BOTH `Authorization: Bearer {access_token}` AND `X-id-token: {id_token}` headers are present

### Issue: CORS Errors
**Solution:** Use backend proxy instead of direct API calls from browser

### Issue: Token Expired
**Solution:** Implement auto-refresh logic (refresh 5 minutes before expiration)

### Issue: Missing id_token
**Solution:** Ensure you capture `id_token` from both initial auth AND refresh responses

### Issue: 404 Not Found
**Solution:** Verify endpoint path matches complete reference exactly

---

## Next Steps

1. **Choose your approach:**
   - Frontend-only (dev/testing)
   - Backend proxy (production recommended)

2. **Copy/adapt code** from CreatorMetrics project

3. **Test with one endpoint** first (e.g., `/analytics/contributors`)

4. **Add more endpoints** as needed (see complete reference)

5. **Implement revenue matching** if you need Instagram Story attribution

---

## Resources

- **Complete API Reference:** [`LTK-API-COMPLETE-REFERENCE.md`](./LTK-API-COMPLETE-REFERENCE.md)
- **CreatorMetrics Implementation:** Reference code in this project
- **Auth0 Documentation:** https://auth0.com/docs

---

**Remember:** Always use the complete reference document for endpoint details, parameters, and code examples!
