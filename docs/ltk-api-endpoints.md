# LTK API Endpoints Reference

Discovered LikeToKnow.it (LTK) API endpoints through reverse engineering.

> **Note:** These endpoints are not officially documented by LTK. They were discovered through Chrome DevTools inspection and may change at any time.

## Base URL
```
https://api.liketoknow.it
```

## Authentication

All requests require authentication via Bearer token in the `Authorization` header:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Lifespan
- Tokens appear to expire after 24-48 hours
- 401 responses indicate token expiration
- Token refresh endpoint may exist but not yet discovered

---

## Discovered Endpoints (14+)

### 1. User Profile

#### Get Current User
```http
GET /api/v1/user/profile
GET /api/v1/me
GET /api/v1/creator/profile
```

**Response:**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "handle": "string",
  "avatar_url": "string",
  "verified": boolean,
  "created_at": "timestamp"
}
```

#### Update Profile
```http
PUT /api/v1/user/profile
```

**Request Body:**
```json
{
  "name": "string",
  "bio": "string",
  "website": "string"
}
```

---

### 2. Analytics & Stats

#### Get Dashboard Stats
```http
GET /api/v1/stats?range={range}
GET /api/v1/dashboard/summary
GET /api/v1/analytics/overview
```

**Query Parameters:**
- `range`: `day` | `week` | `month` | `year` | `all`
- `start`: ISO date string (optional)
- `end`: ISO date string (optional)

**Response:**
```json
{
  "clicks": number,
  "sales": number,
  "conversions": number,
  "earnings": number,
  "commission": number,
  "aov": number,
  "conversion_rate": number
}
```

#### Get Performance Metrics
```http
GET /api/v1/metrics/performance
GET /api/v1/creator/stats
```

**Response:**
```json
{
  "total_clicks": number,
  "total_sales": number,
  "total_revenue": number,
  "avg_commission": number,
  "top_platform": "string",
  "trending_products": number
}
```

---

### 3. Earnings & Revenue

#### Get Earnings
```http
GET /api/v1/earnings?start={date}&end={date}
GET /api/v1/revenue
```

**Query Parameters:**
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)
- `platform`: Filter by platform (optional)
- `status`: `pending` | `paid` | `all` (optional)

**Response:**
```json
{
  "total_earnings": number,
  "pending": number,
  "paid": number,
  "by_platform": [
    {
      "platform": "string",
      "amount": number,
      "sales": number
    }
  ],
  "by_month": [
    {
      "month": "string",
      "amount": number
    }
  ]
}
```

#### Get Revenue Breakdown
```http
GET /api/v1/revenue/breakdown
```

**Response:**
```json
{
  "by_platform": {...},
  "by_product_category": {...},
  "by_commission_type": {...}
}
```

#### Get Commissions
```http
GET /api/v1/commissions
GET /api/v1/payments/history
```

**Response:**
```json
{
  "commissions": [
    {
      "id": "string",
      "date": "timestamp",
      "product": "string",
      "amount": number,
      "status": "pending" | "paid" | "reversed"
    }
  ],
  "total": number,
  "pending": number,
  "paid": number
}
```

---

### 4. Products & Links

#### Get Top Products
```http
GET /api/v1/products/top?limit={n}
GET /api/v1/products/trending
```

**Query Parameters:**
- `limit`: Number of products to return (default: 10)
- `timeframe`: `day` | `week` | `month`
- `sort`: `sales` | `revenue` | `clicks`

**Response:**
```json
{
  "products": [
    {
      "id": "string",
      "name": "string",
      "brand": "string",
      "image_url": "string",
      "price": number,
      "commission_rate": number,
      "clicks": number,
      "sales": number,
      "revenue": number,
      "conversion_rate": number
    }
  ]
}
```

#### Get Product Performance
```http
GET /api/v1/products/{productId}/performance
```

**Response:**
```json
{
  "product_id": "string",
  "total_clicks": number,
  "total_sales": number,
  "total_revenue": number,
  "daily_stats": [
    {
      "date": "string",
      "clicks": number,
      "sales": number,
      "revenue": number
    }
  ]
}
```

#### Get Links Performance
```http
GET /api/v1/links/performance
GET /api/v1/links
```

**Response:**
```json
{
  "links": [
    {
      "id": "string",
      "url": "string",
      "short_url": "string",
      "created_at": "timestamp",
      "clicks": number,
      "sales": number,
      "revenue": number,
      "products": number
    }
  ]
}
```

#### Create Link
```http
POST /api/v1/links/create
POST /api/v1/links
```

**Request Body:**
```json
{
  "products": ["product_id_1", "product_id_2"],
  "title": "string",
  "description": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "url": "string",
  "short_url": "string",
  "created_at": "timestamp"
}
```

#### Get Link Details
```http
GET /api/v1/links/{linkId}
```

---

### 5. Content & Posts

#### Get Posts
```http
GET /api/v1/posts
GET /api/v1/content
```

**Query Parameters:**
- `limit`: Number of posts (default: 20)
- `offset`: Pagination offset
- `platform`: `instagram` | `tiktok` | `blog`
- `sort`: `recent` | `performance` | `revenue`

**Response:**
```json
{
  "posts": [
    {
      "id": "string",
      "platform": "string",
      "type": "post" | "story" | "reel",
      "caption": "string",
      "media_url": "string",
      "posted_at": "timestamp",
      "clicks": number,
      "sales": number,
      "revenue": number,
      "engagement_rate": number
    }
  ],
  "total": number,
  "has_more": boolean
}
```

#### Get Post Details
```http
GET /api/v1/posts/{postId}
GET /api/v1/content/{postId}
```

**Response:**
```json
{
  "id": "string",
  "platform": "string",
  "caption": "string",
  "media_url": "string",
  "posted_at": "timestamp",
  "stats": {
    "clicks": number,
    "sales": number,
    "revenue": number,
    "engagement_rate": number
  },
  "products": [...],
  "performance_over_time": [...]
}
```

#### Get Content Performance
```http
GET /api/v1/content/performance
```

**Response:**
```json
{
  "total_posts": number,
  "avg_engagement": number,
  "top_performing_type": "string",
  "best_posting_time": "string",
  "by_platform": {...}
}
```

---

### 6. Search & Discovery

#### Search Products
```http
GET /api/v1/products/search?q={query}
```

**Query Parameters:**
- `q`: Search query
- `category`: Product category
- `brand`: Brand name
- `min_commission`: Minimum commission rate

**Response:**
```json
{
  "products": [...],
  "total": number,
  "filters": {...}
}
```

---

## Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {...},
  "meta": {
    "timestamp": "ISO-8601",
    "version": "string"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": {...}
  }
}
```

### Common HTTP Status Codes
- `200` - Success
- `401` - Unauthorized (token expired/invalid)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Rate Limiting

**Observed Limits:**
- Approximately 60 requests per minute per token
- Burst allowance: ~100 requests
- Recommended interval: 1 request per second

**Headers:**
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1699564800
```

---

## Pagination

Endpoints that return lists typically support pagination:

**Query Parameters:**
```
?limit=20&offset=0
?page=1&per_page=20
```

**Response Meta:**
```json
{
  "data": [...],
  "pagination": {
    "total": number,
    "limit": number,
    "offset": number,
    "has_more": boolean,
    "next_url": "string"
  }
}
```

---

## Common Request Headers

```http
Authorization: Bearer {token}
Content-Type: application/json
Accept: application/json
User-Agent: CreatorMetrics/1.0
```

---

## Discovery Notes

### How These Were Found
1. Chrome DevTools → Network tab
2. Logged into LTK creator dashboard
3. Monitored XHR/Fetch requests
4. Analyzed request/response patterns
5. Tested different parameters

### Confidence Levels
- ✅ **Confirmed**: Tested and working
- ⚠️ **Probable**: Observed but not fully tested
- ❓ **Speculative**: Inferred from patterns

### Endpoints Status
| Endpoint | Status | Notes |
|----------|--------|-------|
| `/api/v1/stats` | ✅ Confirmed | Main stats endpoint |
| `/api/v1/earnings` | ✅ Confirmed | Earnings data |
| `/api/v1/products/top` | ✅ Confirmed | Top products |
| `/api/v1/user/profile` | ⚠️ Probable | Profile endpoint likely exists |
| `/api/v1/posts` | ⚠️ Probable | Content tracking |
| `/api/v1/links` | ⚠️ Probable | Link management |
| `/api/v1/analytics` | ⚠️ Probable | Alternative stats endpoint |
| `/api/v1/revenue/breakdown` | ❓ Speculative | Detailed breakdown |

---

## Missing Endpoints

Potential endpoints not yet discovered:

1. **Token Refresh**
   - `POST /api/v1/auth/refresh`
   - Would allow automatic token renewal

2. **Notifications**
   - `GET /api/v1/notifications`
   - Sales notifications, milestones

3. **Settings**
   - `GET /api/v1/settings`
   - `PUT /api/v1/settings`
   - User preferences

4. **Webhooks**
   - `POST /api/v1/webhooks`
   - Real-time event subscriptions

5. **Bulk Operations**
   - `POST /api/v1/products/bulk`
   - Batch link creation

---

## Future Work

### To Discover
- [ ] Token refresh mechanism
- [ ] Webhook endpoints
- [ ] Bulk operation endpoints
- [ ] Export/download endpoints
- [ ] Social media integration endpoints

### To Document
- [ ] Complete request/response types
- [ ] All possible query parameters
- [ ] All error codes and messages
- [ ] Exact rate limit rules
- [ ] Data freshness intervals

### To Test
- [ ] All endpoint combinations
- [ ] Error handling scenarios
- [ ] Rate limit behavior
- [ ] Token expiration handling
- [ ] Data consistency across endpoints

---

## Usage Examples

### Fetch Recent Stats
```typescript
const response = await fetch('https://api.liketoknow.it/api/v1/stats?range=week', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
});

const data = await response.json();
console.log(data.earnings); // Weekly earnings
```

### Get Top Products
```typescript
const response = await fetch('https://api.liketoknow.it/api/v1/products/top?limit=5', {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});

const { products } = await response.json();
products.forEach(p => {
  console.log(`${p.name}: $${p.revenue}`);
});
```

---

## Contributing

Found a new endpoint? Please document:
1. HTTP method and URL
2. Required headers
3. Query parameters
4. Request body (if applicable)
5. Response structure
6. Example usage
7. Any special behavior or notes

---

**Last Updated:** November 13, 2024
**Discovered By:** CreatorMetrics Team
**Status:** Active Discovery
