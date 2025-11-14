# LTK Production Configuration

## Overview

This document captures the production environment configuration extracted from LTK's creator portal (`window.rewardStyle` object).

**Source:** LTK's production JavaScript bundle (prod.js)

---

## Key API Endpoints

### Primary Gateway
```
API_GATEWAY: https://api-gateway.rewardstyle.com
```
This is the main API endpoint we use for all LTK data fetching.

### Additional Gateways
- **TYK Gateway**: https://prod-tyk-gateway-v3.rewardstyle.com
- **IDM Gateway**: https://prod-idm.shopltk.com (Identity Management)
- **Sigil URL**: https://auth-creator.shopltk.com (Auth service)

---

## Auth0 Configuration

LTK uses Auth0 for authentication with these production settings:

```javascript
AUTH0: {
  audience: "https://creator-api-gateway.shopltk.com/v1",
  clientId: "iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT",
  domain: "creator-auth.shopltk.com",
  redirectUri: "https://creator.shopltk.com/login/callback",
  connection: "InfluencerUser",
  endpoints: {
    passwordReset: "https://creator-auth.shopltk.com/dbconnections/change_password"
  }
}
```

### Key Observations:
- **Audience**: Points to creator-api-gateway (different from main API gateway URL)
- **Client ID**: Public Auth0 client ID for production
- **Domain**: Custom Auth0 domain at `creator-auth.shopltk.com`
- **Connection**: Uses custom "InfluencerUser" connection
- **Redirect**: Standard OAuth callback pattern

---

## Token Storage

LTK stores tokens in cookies with these names:
- `sigil_access_token` - Access token cookie
- `sigil_id_token` - ID token cookie (this is what we use for API calls)

However, we've observed they also use the Auth0 standard cookie naming:
- `auth._id_token.auth0`
- `auth._access_token.auth0`
- `auth._refresh_token.auth0`

---

## Third-Party Integrations

### Analytics & Tracking
- **Amplitude**: API Key `fa201f77b2ff3cebe58c7c7a5a0ffe80`
- **Google Tag Manager**: Container ID `GTM-K32DMC9`
- **FullStory**: Org ID `WG0DF`
- **Snowplow**: Server at `com-ltk-prod1.collector.snplow.net`
- **Datadog**: Application monitoring with RUM

### Services
- **Google Maps**: API key for location features
- **reCAPTCHA**: `6LdyEasUAAAAAHIC-yvEMgnAkqUNMbdaYBkwUVmw`
- **Zendesk**: Support widget key

---

## Platform Links

### External Platforms
- **Main Site**: https://creator.shopltk.com
- **Consumer Platform**: https://www.shopltk.com
- **Marketing Page**: https://company.shopltk.com
- **OnBrand**: https://onbrand.shopltk.com
- **Collaborations**: https://collaborations.shopltk.com
- **Messaging**: https://messaging.shopltk.com
- **Help Center**: help.rewardstyle.com

### Internal Services
- **Product Links**: https://ln-rules.rewardstyle.com
- **Widgets**: widgets.rewardstyle.com
- **Images CDN**: https://images.rewardstyle.com
- **iOS Patch System**: https://static.liketoknow.it/ios/production

---

## Important Notes

### RewardStyle vs LTK Branding
- **RewardStyle**: Legacy/technical name (used in APIs, domains)
- **LTK**: Consumer/creator-facing brand name
- Both refer to the same platform/company

### Environment
- **ENV**: "prod" (production)
- Configuration applies to live creator.shopltk.com platform

### API Integration Strategy

For CreatorMetrics integration:
1. **Use browser-side API calls** - CORS restrictions require browser origin
2. **Use `x-id-token` header** - Pass Auth0 ID token for authentication
3. **Base URL**: `https://api-gateway.rewardstyle.com`
4. **Token source**: Extract from `auth._id_token.auth0` cookie or localStorage

---

## Security Considerations

⚠️ **Public Information**
- These configuration values are publicly visible in LTK's production JavaScript
- API keys shown are for client-side services (reCAPTCHA, analytics)
- Auth0 Client ID is public by design (OAuth2 public client)

⚠️ **Not Exposed**
- Auth0 Client Secret (server-side only)
- Backend API keys
- Database credentials

---

## For CreatorMetrics Implementation

### What We Can Use:
- ✅ API Gateway URL (api-gateway.rewardstyle.com)
- ✅ Auth0 domain and client ID (for future OAuth flow)
- ✅ Token cookie names (for extraction)

### What We Should NOT Use:
- ❌ Third-party API keys (Amplitude, analytics, etc.)
- ❌ LTK's specific Auth0 client ID for direct OAuth (use manual token for now)

### Current Approach:
Manual token extraction from LTK cookies → Browser-side API calls with `x-id-token` header
