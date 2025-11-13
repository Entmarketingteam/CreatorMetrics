# LTK API Endpoints Reference

## Base URL
```
https://api-gateway.rewardstyle.com
```

## Authentication
All requests require the `x-id-token` header with Auth0 ID token:
```
x-id-token: {JWT_ID_TOKEN}
```

---

## User & Account Management

### Get User Profile
```http
GET /api/creator-account-service/v1/users/{user_id}
```

**Parameters:**
- `user_id` (path): LTK user identifier (e.g., 293045)

**Response:** User profile data including account settings, preferences, social handles

---

### Get Account Details
```http
GET /api/creator-account-service/v1/accounts/{account_id}
```

**Parameters:**
- `account_id` (path): LTK account identifier (e.g., 278632)

**Response:** Account-level information, billing, subscription status

---

### Get User Info
```http
GET /api/co-api/v1/get_user_info
```

**Response:** Current authenticated user's information

---

### Get Public Profile
```http
GET /api/pub/v2/profiles/
```

**Response:** Public-facing profile data

---

## Analytics Endpoints

### Get Contributors
```http
GET /analytics/contributors
```

**Description:** Returns list of contributor/publisher accounts associated with the authenticated user

**Response:**
```json
{
  "contributors": [
    {
      "publisher_id": 293045,
      "name": "...",
      "platform": "ltk",
      ...
    }
  ]
}
```

---

### Get Hero Chart Data
```http
GET /analytics/hero_chart?start_date={start}&end_date={end}&publisher_ids={ids}&interval={interval}&platform={platforms}&timezone={tz}
```

**Parameters:**
- `start_date` (required): ISO 8601 datetime (e.g., `2025-09-17T00:00:00Z`)
- `end_date` (required): ISO 8601 datetime (e.g., `2025-09-24T23:59:59Z`)
- `publisher_ids` (required): Comma-separated publisher IDs (e.g., `293045,987693288,987748582`)
- `interval` (optional): Aggregation interval - `day`, `week`, `month` (default: `day`)
- `platform` (required): Comma-separated platforms - `rs`, `ltk` (e.g., `rs,ltk`)
- `timezone` (optional): Timezone for date bucketing (default: `UTC`)

**Example:**
```
GET /analytics/hero_chart?start_date=2025-09-25T00:00:00Z&end_date=2025-10-02T23:59:59Z&publisher_ids=293045,987693288&interval=day&platform=rs,ltk&timezone=UTC
```

**Response:** Time-series data for dashboard charts (clicks, sales, revenue by day)

---

### Get Performance Summary
```http
GET /api/creator-analytics/v1/performance_summary?start_date={start}&end_date={end}&publisher_ids={ids}&platform={platforms}
```

**Parameters:**
- `start_date` (required): ISO 8601 datetime
- `end_date` (required): ISO 8601 datetime
- `publisher_ids` (required): Comma-separated publisher IDs
- `platform` (required): Comma-separated platforms (`rs,ltk`)

**Response:** Aggregated performance metrics (total clicks, sales, revenue, commission)

---

### Get Top Performing Links
```http
GET /analytics/top_performers/links?start_date={start}&end_date={end}&publisher_ids={ids}&platform={platforms}&timezone={tz}&limit={limit}
```

**Parameters:**
- `start_date` (required): ISO 8601 datetime
- `end_date` (required): ISO 8601 datetime
- `publisher_ids` (required): Comma-separated publisher IDs
- `platform` (required): Comma-separated platforms
- `timezone` (optional): Timezone (default: `UTC`)
- `limit` (optional): Number of results to return (default varies)

**Response:** Array of top-performing affiliate links with metrics

---

## Common Patterns

### Date Ranges
LTK uses ISO 8601 format with explicit UTC timezone:
```
2025-09-17T00:00:00Z  // Start of day
2025-09-24T23:59:59Z  // End of day
```

### Publisher IDs
Multiple publisher IDs are comma-separated:
```
publisher_ids=293045,987693288,987748582
```

This allows querying across multiple creator accounts/profiles.

### Platforms
LTK supports two platforms:
- `rs`: RewardStyle (legacy platform)
- `ltk`: LTK app/website

Use `rs,ltk` to get combined data.

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

**Action:** Refresh the ID token using Auth0 refresh token flow

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}
```

**Action:** User doesn't have access to requested resource

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

---

## Rate Limiting

**Status:** Unknown - needs testing

**Best Practices:**
- Implement exponential backoff on failures
- Cache responses when appropriate
- Batch requests where possible

---

## Implementation Notes

### For CreatorMetrics Integration

1. **API Client Service**
   ```typescript
   class LTKApiClient {
     constructor(private getIdToken: () => string | null) {}
     
     private async fetch(endpoint: string, options = {}) {
       const token = this.getIdToken();
       if (!token) throw new Error('Not authenticated');
       
       return fetch(`https://api-gateway.rewardstyle.com${endpoint}`, {
         ...options,
         headers: {
           'x-id-token': token,
           'Content-Type': 'application/json',
           ...options.headers
         }
       });
     }
     
     async getContributors() {
       const res = await this.fetch('/analytics/contributors');
       return res.json();
     }
     
     async getHeroChart(params: HeroChartParams) {
       const query = new URLSearchParams(params);
       const res = await this.fetch(`/analytics/hero_chart?${query}`);
       return res.json();
     }
   }
   ```

2. **Auto-Retry on 401**
   - Detect 401 response
   - Attempt token refresh
   - Retry original request once
   - If still fails, redirect to login

3. **Type Safety**
   - Create TypeScript interfaces for all response types
   - Validate responses with Zod schemas
   - Handle missing/optional fields gracefully

---

## Testing Endpoints

### Using Browser Console
```javascript
// 1. Get ID token from cookie
const idToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('auth._id_token.auth0='))
  ?.split('=')[1];

// 2. Test API endpoint
const response = await fetch('https://api-gateway.rewardstyle.com/analytics/contributors', {
  headers: { 'x-id-token': idToken }
});

const data = await response.json();
console.log(data);
```

### Using curl
```bash
curl 'https://api-gateway.rewardstyle.com/analytics/contributors' \
  -H 'x-id-token: YOUR_ID_TOKEN_HERE'
```

---

## Future Endpoints to Discover

Likely exist but not yet confirmed:
- `/analytics/earnings` - Detailed earnings/commission data
- `/analytics/products` - Product performance metrics
- `/analytics/social_posts` - Social media post tracking
- `/api/creator-account-service/v1/settings` - User settings management

**Discovery Method:** Monitor network traffic in browser DevTools while using creator.shopltk.com features
