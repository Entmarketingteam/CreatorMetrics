# LTK Auth0 Integration Guide

## Overview

LTK (creator.shopltk.com) uses **Auth0** for authentication, not custom OAuth. This document describes the actual authentication flow discovered through HAR file analysis and browser storage inspection.

---

## Authentication Architecture

### Auth0 Configuration
- **Provider**: Auth0 (auth0.com)
- **Domain**: Appears to use Auth0's hosted authentication
- **Client**: `auth0-spa-js` (version 2.0.8)
- **Grant Type**: Authorization Code with PKCE (Proof Key for Code Exchange)

### Token Storage Pattern

LTK stores Auth0 tokens in **browser cookies** with the following naming convention:

```
auth.strategy
auth._id_token.auth0
auth._id_token_expiration.auth0
auth._token.auth0
auth._token_expiration.auth0
auth._refresh_token.auth0
auth._refresh_token_expiration.auth0
```

**Critical Tokens:**
1. **ID Token** (`auth._id_token.auth0`): JWT used for API authentication
2. **Access Token** (`auth._token.auth0`): OAuth access token
3. **Refresh Token** (`auth._refresh_token.auth0`): Used to obtain new access/id tokens

---

## API Request Pattern

### Header Authentication

All LTK API requests use the **`x-id-token`** header (NOT standard `Authorization: Bearer`):

```http
GET https://api-gateway.rewardstyle.com/analytics/contributors
x-id-token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IlR5Tmg2SXR3dUVrR1hGMTBoeHhJbyJ9...
```

**Important:** The `x-id-token` header contains the Auth0 ID token (JWT), not the access token.

---

## Discovered API Endpoints

### Base URL
```
https://api-gateway.rewardstyle.com
```

### Analytics Endpoints

#### 1. User Profile
```
GET /api/creator-account-service/v1/users/{user_id}
GET /api/creator-account-service/v1/accounts/{account_id}
GET /api/co-api/v1/get_user_info
GET /api/pub/v2/profiles/
```

#### 2. Analytics Dashboard
```
GET /analytics/contributors
GET /analytics/hero_chart?start_date={start}&end_date={end}&publisher_ids={ids}&interval=day&platform=rs,ltk&timezone=UTC
GET /api/creator-analytics/v1/performance_summary
```

#### 3. Performance Data
```
GET /analytics/top_performers/links?start_date={start}&end_date={end}&publisher_ids={ids}&platform=rs,ltk&timezone=UTC
```

---

## Token Format & Claims

### ID Token Structure (JWT)

```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "TyNh6ItwuEkGXF10hxxIo"
  },
  "payload": {
    "http://shopltk.com/profile": {
      "account_id": 278632,
      "app_user_id": 293045,
      // ... additional profile data
    },
    "iss": "https://{auth0-domain}/",
    "sub": "auth0|{user_id}",
    "aud": ["{client_id}"],
    "iat": 1234567890,
    "exp": 1234567890,
    "scope": "openid profile email"
  }
}
```

**Key Claims:**
- `http://shopltk.com/profile`: Custom namespace with LTK user data
- `account_id`: LTK account identifier
- `app_user_id`: LTK user/publisher ID
- `exp`: Token expiration timestamp (Unix seconds)

---

## Storage Items Beyond Auth Tokens

The screenshot shows additional storage items used by LTK:

### Session Storage
- Auth0 session state
- PKCE verifiers and state parameters
- Transaction data for OAuth flow

### Local Storage
- Analytics tracking (Google Analytics, Facebook Pixel, etc.)
- User preferences
- Session identifiers

### Cookies (Non-Auth)
- `OptanonConsent`, `OptanonAlertBoxClosed`: Cookie consent tracking
- `_ga`, `_gid`: Google Analytics
- `_fbp`: Facebook Pixel
- `hubspotutk`: HubSpot tracking
- Various marketing/analytics cookies

**Note:** For API integration, only the Auth0 authentication cookies are required. Marketing/analytics cookies are NOT needed for data fetching.

---

## Implementation Requirements

### For CreatorMetrics Integration

#### Required Tokens
1. **ID Token** - Used in `x-id-token` header for all API requests
2. **Refresh Token** - Used to obtain new ID/access tokens before expiration

#### NOT Required
- Marketing cookies (GA, Facebook, Pinterest, etc.)
- Consent management cookies
- Session tracking cookies (FullStory, etc.)

---

## Security Considerations

### Current Auth0 Implementation (LTK Production)

**Strengths:**
- Uses PKCE flow (more secure than implicit flow)
- Cookies have domain restrictions
- ID tokens are short-lived (typically 1 hour)

**Potential Concerns:**
- Tokens stored in cookies (vulnerable if not httpOnly)
- Client-side JavaScript has access to tokens
- No visible httpOnly flag in storage inspector (may be set server-side)

### Recommendations for CreatorMetrics

1. **Token Storage**: Use httpOnly cookies in production (currently using localStorage for dev)
2. **CORS**: Configure proper CORS headers for api-gateway.rewardstyle.com
3. **Token Refresh**: Implement automatic refresh 5 minutes before expiration
4. **Error Handling**: Handle 401 responses with automatic token refresh + retry

---

## Testing the Integration

### Manual Testing with Browser Tokens

1. Log into creator.shopltk.com in Chrome
2. Open DevTools → Application → Cookies
3. Copy the value of `auth._id_token.auth0`
4. Paste into CreatorMetrics JWT Decoder at `/jwt-decoder`
5. Verify token decodes and shows account_id/app_user_id

### API Testing

```javascript
// Example fetch with x-id-token
const idToken = 'eyJhbGci...'; // From cookie

const response = await fetch('https://api-gateway.rewardstyle.com/analytics/contributors', {
  headers: {
    'x-id-token': idToken,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Contributors:', data);
```

---

## Next Steps for Implementation

1. **Update LTK Auth Service**: Add Auth0-specific adapter
2. **Implement x-id-token Header**: Update API client to use custom header
3. **Cookie Management**: Read Auth0 cookies (browser) or store in httpOnly cookies (production)
4. **Test with Real Tokens**: Use actual LTK ID tokens from browser for validation
5. **Build API Client**: Create typed methods for discovered endpoints

---

## References

- Auth0 SPA SDK: https://auth0.com/docs/libraries/auth0-spa-js
- PKCE Flow: https://auth0.com/docs/get-started/authentication-and-authorization-flow/authorization-code-flow-with-proof-key-for-code-exchange-pkce
- JWT Decoder: https://jwt.io
