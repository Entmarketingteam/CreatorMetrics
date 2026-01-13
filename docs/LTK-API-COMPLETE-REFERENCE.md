# LTK API Complete Reference Guide

**Last Updated:** January 2025  
**Status:** ✅ All 14+ endpoints tested and working

This document provides complete implementation details for integrating with the LTK (LikeToKnow.it / RewardStyle) Creator API. All endpoints have been tested and verified to work correctly.

---

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Critical Requirements](#critical-requirements)
3. [API Base URLs](#api-base-urls)
4. [Complete Endpoint Reference](#complete-endpoint-reference)
5. [Authentication Flow Implementation](#authentication-flow-implementation)
6. [Revenue Matching Logic](#revenue-matching-logic)
7. [Code Examples](#code-examples)
8. [Troubleshooting](#troubleshooting)

---

## Authentication Overview

The LTK API uses **Auth0 OAuth 2.0** with a **dual-header requirement** that is critical for all API calls.

### Key Authentication Points

1. **Two Tokens Required**: Every API request needs BOTH:
   - `access_token` (OAuth access token)
   - `id_token` (Auth0 ID token)

2. **Token Refresh**: Tokens expire after ~10 hours. Use the refresh token flow to get new tokens.

3. **Headers Required**:
   ```
   Authorization: Bearer {access_token}
   X-id-token: {id_token}
   ```

---

## Critical Requirements

### ⚠️ Dual-Header Requirement (MOST IMPORTANT)

**Every request to the LTK API gateway MUST include both headers:**

```http
Authorization: Bearer {access_token}
X-id-token: {id_token}
```

**If either header is missing, the API will return 401 or 403 errors.**

The `X-id-token` header must be pulled from the Auth0 refresh response - it's not the same as the access token.

### ⚠️ API Gateway URL

**Use this base URL:**
```
https://api-gateway.rewardstyle.com
```

**NOT** `https://creator-api-gateway.shopltk.com` (this doesn't resolve)

---

## API Base URLs

### Production API Gateway
```
https://api-gateway.rewardstyle.com
```

### Auth0 Token Endpoint
```
https://creator-auth.shopltk.com/oauth/token
```

### Auth0 Client ID
```
iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
```

---

## Complete Endpoint Reference

### Analytics Endpoints

#### 1. Get Contributors
**Purpose:** Returns list of contributor/publisher accounts associated with the authenticated user

**Backend Route:** `GET /api/ltk/analytics/contributors`

**LTK API Endpoint:** `GET /analytics/contributors`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:** None

**Example Response:**
```json
{
  "contributors": [
    {
      "publisher_id": 293045,
      "name": "...",
      "platform": "ltk"
    }
  ]
}
```

---

#### 2. Get Hero Chart
**Purpose:** Returns time-series chart data for performance metrics

**Backend Route:** `GET /api/ltk/analytics/hero-chart`

**LTK API Endpoint:** `GET /analytics/hero_chart`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `start_date` (required): ISO 8601 datetime, e.g., `2025-10-01T00:00:00Z`
- `end_date` (required): ISO 8601 datetime, e.g., `2025-10-07T23:59:59Z`
- `publisher_ids` (required): Comma-separated IDs, e.g., `293045,987693288`
- `interval` (optional): `day`, `week`, or `month` (default: `day`)
- `platform` (required): `rs`, `ltk`, or `rs,ltk`
- `timezone` (optional): Timezone string (default: `UTC`)

**Example Request:**
```
GET /analytics/hero_chart?start_date=2025-10-01T00:00:00Z&end_date=2025-10-07T23:59:59Z&publisher_ids=293045&interval=day&platform=rs,ltk&timezone=UTC
```

**Important:** Filter out empty/null/undefined query parameters before building the URL.

---

#### 3. Get Performance Summary
**Purpose:** High-level performance metrics summary

**Backend Route:** `GET /api/ltk/analytics/performance-summary`

**LTK API Endpoint:** `GET /api/creator-analytics/v1/performance_summary`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `start_date` (required): ISO 8601 datetime
- `end_date` (required): ISO 8601 datetime
- `publisher_ids` (required): Comma-separated IDs
- `platform` (required): `rs`, `ltk`, or `rs,ltk`
- `timezone` (optional): Timezone string

**Example Request:**
```
GET /api/creator-analytics/v1/performance_summary?start_date=2025-10-01T00:00:00Z&end_date=2025-10-07T23:59:59Z&publisher_ids=293045&platform=rs,ltk&timezone=UTC
```

---

#### 4. Get Performance Stats
**Purpose:** Detailed performance statistics

**Backend Route:** `GET /api/ltk/analytics/performance-stats`

**LTK API Endpoint:** `GET /api/creator-analytics/v1/performance_stats`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `start` (required): ISO 8601 datetime
- `end` (required): ISO 8601 datetime
- `currency` (optional): Currency code, e.g., `USD`

**Example Request:**
```
GET /api/creator-analytics/v1/performance_stats?start=2025-10-01T00:00:00Z&end=2025-10-07T23:59:59Z&currency=USD
```

---

#### 5. Get Top Performers (Links)
**Purpose:** Top performing links with commission data (includes `rs_url` for revenue matching)

**Backend Route:** `GET /api/ltk/analytics/top-performers`

**LTK API Endpoint:** `GET /analytics/top_performers/links`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `start_date` (required): ISO 8601 datetime
- `end_date` (required): ISO 8601 datetime
- `publisher_ids` (required): Comma-separated IDs
- `platform` (required): `rs`, `ltk`, or `rs,ltk`
- `sort_dir` (optional): `asc` or `desc` (default: `desc`)
- `dimension` (optional): `commissions`, `clicks`, etc.
- `last_id` (optional): Pagination cursor
- `timezone` (optional): Timezone string

**Example Request:**
```
GET /analytics/top_performers/links?start_date=2025-10-01T00:00:00Z&end_date=2025-10-07T23:59:59Z&publisher_ids=293045&platform=rs,ltk&sort_dir=desc&dimension=commissions&last_id=0&timezone=UTC
```

**Response includes `rs_url` field** - critical for revenue matching with Instagram Story links.

**Alternative Endpoints:**
- `/analytics/top_performers/advertisers` - Top performing advertisers
- `/analytics/top_performers/ltks` - Top performing LTK posts

---

#### 6. Get Items Sold
**Purpose:** List of items sold with commission details

**Backend Route:** `GET /api/ltk/analytics/items-sold`

**LTK API Endpoint:** `GET /api/creator-analytics/v1/items_sold`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `limit` (optional): Number of items (default: varies)
- `next` (optional): Pagination cursor
- `start` (optional): ISO 8601 datetime
- `end` (optional): ISO 8601 datetime
- `currency` (optional): Currency code

**Example Request:**
```
GET /api/creator-analytics/v1/items_sold?limit=100&start=2025-10-01T00:00:00Z&end=2025-10-07T23:59:59Z&currency=USD
```

---

#### 7. Get Commissions Summary
**Purpose:** Summary of commission earnings

**Backend Route:** `GET /api/ltk/analytics/commissions-summary`

**LTK API Endpoint:** `GET /api/creator-analytics/v1/commissions_summary`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `currency` (optional): Currency code, e.g., `USD`

**Example Request:**
```
GET /api/creator-analytics/v1/commissions_summary?currency=USD
```

---

### User & Account Endpoints

#### 8. Get User Profile
**Purpose:** Get user profile by publisher ID

**Backend Route:** `GET /api/ltk/user/:publisherId`

**LTK API Endpoint:** `GET /api/creator-account-service/v1/users/{publisherId}`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Path Parameters:**
- `publisherId` (required): Publisher/user ID, e.g., `293045`

**Example Request:**
```
GET /api/creator-account-service/v1/users/293045
```

---

#### 9. Get Account Details
**Purpose:** Get account-level information, billing, subscription status

**Backend Route:** `GET /api/ltk/account/:accountId`

**LTK API Endpoint:** `GET /api/creator-account-service/v1/accounts/{accountId}`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Path Parameters:**
- `accountId` (required): Account ID, e.g., `278632`

**Example Request:**
```
GET /api/creator-account-service/v1/accounts/278632
```

---

#### 10. Get Account Users
**Purpose:** Get list of users associated with an account

**Backend Route:** `GET /api/ltk/account/:accountId/users`

**LTK API Endpoint:** `GET /api/creator-account-service/v1/accounts/{accountId}/users`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Path Parameters:**
- `accountId` (required): Account ID

**Example Request:**
```
GET /api/creator-account-service/v1/accounts/278632/users
```

---

#### 11. Get User Info
**Purpose:** Get current authenticated user's information

**Backend Route:** `GET /api/ltk/user-info`

**LTK API Endpoint:** `GET /api/co-api/v1/get_user_info`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:** None

**Example Request:**
```
GET /api/co-api/v1/get_user_info
```

---

#### 12. Get Public Profile
**Purpose:** Get public-facing profile data

**Backend Route:** `GET /api/ltk/public-profile/:accountId`

**LTK API Endpoint:** `GET /api/pub/v2/profiles/?rs_account_id={accountId}`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:**
- `rs_account_id` (required): Account ID

**Example Request:**
```
GET /api/pub/v2/profiles/?rs_account_id=278632
```

---

### Integration Endpoints

#### 13. Get Amazon Identities
**Purpose:** Get linked Amazon affiliate identities

**Backend Route:** `GET /api/ltk/amazon-identities`

**LTK API Endpoint:** `GET /api/co-api/v1/get_amazon_identities`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:** None

**Example Request:**
```
GET /api/co-api/v1/get_amazon_identities
```

---

#### 14. Get LTK Search Trends
**Purpose:** Get LTK search trend data

**Backend Route:** `GET /api/ltk/search-trends`

**LTK API Endpoint:** `GET /api/ltk/v2/ltk_search_trends/`

**Headers Required:**
- `Authorization: Bearer {access_token}`
- `X-id-token: {id_token}`

**Query Parameters:** None

**Example Request:**
```
GET /api/ltk/v2/ltk_search_trends/
```

---

### Additional Top Performers Endpoints

#### 15. Get Top Performers - Advertisers
**Backend Route:** `GET /api/ltk/top-performers/advertisers`

**LTK API Endpoint:** `GET /analytics/top_performers/advertisers`

**Same query parameters as Top Performers Links**

---

#### 16. Get Top Performers - LTKs
**Backend Route:** `GET /api/ltk/top-performers/ltks`

**LTK API Endpoint:** `GET /analytics/top_performers/ltks`

**Same query parameters as Top Performers Links**

---

## Authentication Flow Implementation

### Step 1: Initial OAuth Authorization

Redirect user to Auth0 authorization endpoint:

```
https://creator-auth.shopltk.com/authorize?
  response_type=code
  &client_id=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
  &redirect_uri={your_redirect_uri}
  &scope=openid profile email ltk.publisher offline_access
  &state={random_state}
```

### Step 2: Exchange Authorization Code for Tokens

**Endpoint:** `POST https://creator-auth.shopltk.com/oauth/token`

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body:**
```
grant_type=authorization_code
&code={authorization_code}
&redirect_uri={your_redirect_uri}
&client_id=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
```

**Response:**
```json
{
  "access_token": "...",
  "id_token": "...",  // CRITICAL: Required for X-id-token header
  "refresh_token": "...",
  "expires_in": 36000,
  "token_type": "Bearer"
}
```

**⚠️ CRITICAL:** You MUST capture both `access_token` AND `id_token` from this response.

### Step 3: Refresh Tokens (When Access Token Expires)

**Endpoint:** `POST https://creator-auth.shopltk.com/oauth/token`

**Headers:**
```
Content-Type: application/x-www-form-urlencoded
```

**Body:**
```
grant_type=refresh_token
&refresh_token={refresh_token}
&client_id=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
```

**Response:**
```json
{
  "access_token": "...",
  "id_token": "...",  // CRITICAL: Must capture this for X-id-token header
  "refresh_token": "...",  // May be same or new refresh token
  "expires_in": 36000,
  "token_type": "Bearer"
}
```

**⚠️ CRITICAL:** The refresh response also returns `id_token` - you MUST capture it and use it for the `X-id-token` header.

### Implementation Example (TypeScript)

```typescript
async function refresh_ltk_tokens(refresh_token: string): Promise<LTKTokens> {
  const auth0TokenEndpoint = 'https://creator-auth.shopltk.com/oauth/token';
  const clientId = 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT';

  const response = await fetch(auth0TokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refresh_token,
      client_id: clientId,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // CRITICAL: Capture both access_token AND id_token
  if (!data.access_token) {
    throw new Error('Missing access_token in refresh response');
  }
  if (!data.id_token) {
    throw new Error('Missing id_token in refresh response - required for new API gateway');
  }

  const tokens: LTKTokens = {
    access_token: data.access_token,
    id_token: data.id_token, // Required for X-id-token header
    refresh_token: data.refresh_token || refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    token_type: data.token_type || 'Bearer',
  };

  return tokens;
}
```

---

## Revenue Matching Logic

### Overview

To link Instagram Story sales to LTK commissions, you need to match Instagram Story link stickers (containing `ltk.app.link` URLs) to LTK commission data using the `rs_url` field.

### Step 1: Store `rs_url` from Top Performers Links

When fetching from `/analytics/top_performers/links`, store the `rs_url` field for each post:

```typescript
interface LTKPost {
  id: string;
  rs_url?: string;  // e.g., "rstyle.me/+XXXXX"
  // ... other fields
}
```

### Step 2: Extract Short Codes from Instagram Story Links

Scan Instagram Story link stickers for URLs containing `ltk.app.link`. Extract the short code:

```typescript
function extractLTKAppLinkCodes(text: string): string[] {
  const regex = /ltk\.app\.link\/([A-Za-z0-9_-]+)/g;
  const matches = text.matchAll(regex);
  const codes: string[] = [];
  
  for (const match of matches) {
    codes.push(match[1]);
  }
  
  return codes;
}
```

### Step 3: Extract Short Code from `rs_url`

Extract the short code from the `rs_url` field (format: `rstyle.me/+XXXXX`):

```typescript
function extractRSUrlShortCode(rsUrl: string): string | null {
  // rs_url format: "rstyle.me/+XXXXX" or "https://rstyle.me/+XXXXX"
  const match = rsUrl.match(/rstyle\.me\/\+([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}
```

### Step 4: Match Story Links to Commissions

Match the short codes to attribute commissions:

```typescript
function matchStoryLinksToCommissions(
  instagramStoryLinks: string[],
  ltkCommissions: Array<{ rs_url?: string; [key: string]: any }>
): Map<string, any> {
  const matches = new Map();
  
  for (const storyLink of instagramStoryLinks) {
    const storyCodes = extractLTKAppLinkCodes(storyLink);
    
    for (const storyCode of storyCodes) {
      for (const commission of ltkCommissions) {
        if (commission.rs_url) {
          const rsCode = extractRSUrlShortCode(commission.rs_url);
          if (rsCode === storyCode) {
            matches.set(storyLink, commission);
            break;
          }
        }
      }
    }
  }
  
  return matches;
}
```

---

## Code Examples

### Backend Proxy Implementation (Express.js)

```typescript
import { Router, Request, Response } from 'express';

const router = Router();
const LTK_API_BASE = 'https://api-gateway.rewardstyle.com';

async function proxyLTKRequest(
  endpoint: string,
  accessToken: string,
  idToken: string,
  method: string = 'GET',
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${LTK_API_BASE}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-id-token': idToken, // CRITICAL: Both headers required
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://creator.shopltk.com',
      'Referer': 'https://creator.shopltk.com/',
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type');
  const data = contentType?.includes('application/json')
    ? await response.json()
    : await response.text();

  return {
    status: response.status,
    data
  };
}

// Example endpoint
router.get('/analytics/contributors', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both required)' });
    }

    const result = await proxyLTKRequest('/analytics/contributors', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### Frontend Client Implementation (TypeScript)

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const PROXY_BASE = `${BACKEND_URL}/api/ltk`;

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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-ltk-access-token': accessToken,
        'x-ltk-id-token': idToken,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async getContributors() {
    return this.request('/analytics/contributors');
  }

  async getHeroChart(params: {
    start_date: string;
    end_date: string;
    publisher_ids: string;
    interval?: 'day' | 'week' | 'month';
    platform: string;
    timezone?: string;
  }) {
    // Filter out undefined/null/empty values
    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    });
    const query = new URLSearchParams(cleanParams).toString();
    return this.request(`/analytics/hero-chart${query ? `?${query}` : ''}`);
  }
}
```

---

## Troubleshooting

### Common Errors

#### 401 Unauthorized
**Cause:** Missing or invalid tokens  
**Solution:** 
- Ensure both `Authorization` and `X-id-token` headers are present
- Verify tokens are not expired
- Check that `id_token` was captured from Auth0 response

#### 404 Not Found
**Cause:** Incorrect endpoint path  
**Solution:**
- Verify you're using the correct endpoint path (see endpoint reference above)
- Check that the base URL is `https://api-gateway.rewardstyle.com`

#### 400 Bad Request - Date Format Error
**Cause:** Empty or malformed date parameters  
**Solution:**
- Filter out undefined/null/empty query parameters before building URL
- Ensure dates are in RFC3339 format: `2025-10-01T00:00:00Z`
- Use proper URL encoding for query parameters

### Debug Checklist

1. ✅ Both `access_token` and `id_token` are present
2. ✅ Headers are correctly formatted: `Authorization: Bearer {token}` and `X-id-token: {id_token}`
3. ✅ Base URL is `https://api-gateway.rewardstyle.com`
4. ✅ Endpoint path matches the reference exactly
5. ✅ Query parameters are properly encoded and filtered
6. ✅ Tokens are not expired (check `expires_at` timestamp)

### Testing Endpoints

Use the test page at `/ltk-test` to verify all endpoints are working. The test page will:
- Test all 14+ endpoints
- Display response times
- Show any errors
- Allow manual token input for testing

---

## Summary

### Key Takeaways

1. **Dual-Header Requirement**: Always include both `Authorization: Bearer {access_token}` and `X-id-token: {id_token}` headers
2. **Token Refresh**: Capture `id_token` from both initial auth and refresh responses
3. **Base URL**: Use `https://api-gateway.rewardstyle.com` (not `creator-api-gateway.shopltk.com`)
4. **Query Parameters**: Filter out empty/null/undefined values before building URLs
5. **Date Format**: Use RFC3339 format: `2025-10-01T00:00:00Z`

### All Working Endpoints (14+)

✅ Analytics (7):
- Contributors
- Hero Chart
- Performance Summary
- Performance Stats
- Top Performers (Links, Advertisers, LTKs)
- Items Sold
- Commissions Summary

✅ User & Account (5):
- User Profile
- Account Details
- Account Users
- User Info
- Public Profile

✅ Integrations (2):
- Amazon Identities
- LTK Search Trends

---

**For questions or issues, refer to the test page at `/ltk-test` or check the backend console logs for detailed error messages.**
