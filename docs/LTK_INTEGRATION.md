# LTK Integration Guide

Complete guide for the LikeToKnow.it (LTK) API integration system in CreatorMetrics.

## Overview

This integration allows creators to connect their LTK account to CreatorMetrics by extracting authentication credentials from their browser session. The system automatically refreshes their stats at configurable intervals and stores the data for historical tracking.

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                       │
├─────────────────────────────────────────────────────────┤
│  Settings Page          │  Dashboard Widget             │
│  - Token Input          │  - Live Stats Display         │
│  - Connection Test      │  - Refresh Status             │
│  - Auto-Refresh Config  │  - Top Products               │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    React Hooks                          │
├─────────────────────────────────────────────────────────┤
│  useLTK()              │  useToast()                    │
│  - Data & Status       │  - Notifications               │
│  - Actions (connect,   │  - Error Handling              │
│    disconnect, refresh)│                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Service Layer                          │
├─────────────────────────────────────────────────────────┤
│  LTKApiService         │  LTKTokenManager               │
│  - API Calls           │  - Secure Storage              │
│  - Endpoint Discovery  │  - Token Validation            │
│  - Response Parsing    │  - Expiration Tracking         │
│                        │                                │
│  LTKRefreshScheduler   │                                │
│  - Auto-Refresh        │                                │
│  - Error Handling      │                                │
│  - Database Storage    │                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Data Storage                           │
├─────────────────────────────────────────────────────────┤
│  LocalStorage          │  Supabase Database             │
│  - Encrypted Tokens    │  - platform_metrics table      │
│  - Connection Metadata │  - Historical Data             │
└─────────────────────────────────────────────────────────┘
```

## Files and Their Purposes

### Services (`src/services/`)

#### `ltkApi.ts`
Main API client for interacting with LTK's endpoints.

**Key Features:**
- Supports 3 authentication types: Bearer tokens (JWT), Cookies, API Keys
- Automatic endpoint discovery (tries multiple patterns)
- 5-minute caching to reduce API calls
- Response normalization

**Methods:**
```typescript
setCredentials(credentials: LTKCredentials): void
testConnection(): Promise<LTKApiResponse<any>>
fetchStats(timeRange?: string): Promise<LTKApiResponse<LTKStatsResponse>>
fetchEarnings(startDate?, endDate?): Promise<LTKApiResponse<any>>
fetchTopProducts(limit?): Promise<LTKApiResponse<any>>
setBaseUrl(url: string): void
```

#### `ltkTokenManager.ts`
Handles secure storage and validation of LTK credentials.

**Key Features:**
- Basic XOR + Base64 encryption (upgrade to crypto-js for production)
- Token format validation
- Expiration tracking
- Metadata access without exposing sensitive data

**Methods:**
```typescript
storeCredentials(credentials: LTKCredentials, userId?: string): Promise<void>
getCredentials(): Promise<StoredLTKCredentials | null>
validateCredentialsFormat(credentials): { valid: boolean; error?: string }
isExpired(): Promise<boolean>
clearCredentials(): Promise<void>
```

#### `ltkRefreshScheduler.ts`
Manages automatic data refresh at configurable intervals.

**Key Features:**
- Configurable refresh interval (1-1440 minutes)
- Automatic startup initialization
- Error tracking and handling
- Database persistence
- Token expiration detection

**Methods:**
```typescript
start(config?: Partial<RefreshConfig>): Promise<void>
stop(): void
refresh(): Promise<LTKApiResponse<LTKStatsResponse>>
forceRefresh(): Promise<LTKApiResponse<LTKStatsResponse>>
setInterval(minutes: number): void
getStatus(): RefreshStatus
```

**Configuration:**
```typescript
{
  enabled: boolean,
  intervalMinutes: number,      // Default: 15
  onSuccess?: (data) => void,
  onError?: (error) => void,
  onTokenExpired?: () => void
}
```

### React Hooks (`src/hooks/`)

#### `useLTK.ts`
Provides easy access to LTK data and actions throughout the app.

**Returns:**
```typescript
{
  // Data
  stats: LTKStatsResponse | null,
  isConnected: boolean,
  isLoading: boolean,
  error: string | null,
  refreshStatus: RefreshStatus | null,

  // Actions
  connect(credentials): Promise<{ success: boolean; error?: string }>,
  disconnect(): Promise<void>,
  refresh(): Promise<void>,
  testConnection(credentials): Promise<{ success: boolean; error?: string }>
}
```

**Usage Example:**
```typescript
function MyComponent() {
  const { stats, isConnected, connect, refresh } = useLTK();

  if (!isConnected) {
    return <button onClick={() => connect(credentials)}>Connect</button>;
  }

  return (
    <div>
      <p>Earnings: ${stats?.earnings}</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### UI Components (`src/components/`)

#### `LTKConnectionSettings.tsx`
Complete settings interface for LTK connection.

**Features:**
- Token type selection (Bearer/Cookie/API Key)
- Token input with validation
- Connection testing before saving
- Auto-refresh configuration
- Connection status monitoring
- Manual refresh trigger
- Inline extraction guide

#### `LTKStatsWidget.tsx`
Dashboard widget displaying real-time LTK stats.

**Features:**
- Live connection indicator
- Key metrics display (clicks, sales, earnings)
- Conversion rate calculation
- Top products list (top 3)
- Last refresh time
- Auto-refresh status
- Quick refresh button
- "Connect LTK" prompt when disconnected

### Contexts (`src/contexts/`)

#### `ToastContext.tsx`
App-wide notification system.

**Features:**
- 4 notification types: success, error, warning, info
- Auto-dismissing toasts
- Configurable duration
- Slide-in animations
- Multiple concurrent toasts

**Usage:**
```typescript
const { showToast } = useToast();

showToast('Data refreshed successfully!', 'success', 3000);
showToast('Connection failed', 'error', 5000);
```

### Database (`supabase/migrations/`)

#### `20251113000000_add_platform_metrics_table.sql`
Creates the `platform_metrics` table for storing historical data.

**Schema:**
```sql
CREATE TABLE platform_metrics (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  platform TEXT NOT NULL,           -- 'ltk', 'amazon', etc.
  metric_type TEXT NOT NULL,        -- 'stats', 'earnings', etc.
  metric_value DECIMAL(10, 2),      -- Primary value (e.g., earnings)
  clicks INTEGER,
  sales INTEGER,
  metadata JSONB,                   -- Platform-specific data
  recorded_at TIMESTAMPTZ,          -- When metric was valid
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Indexes:**
- `user_id` - Fast user lookups
- `platform` - Filter by platform
- `recorded_at` - Time-series queries
- `(user_id, platform, recorded_at)` - Composite for dashboard queries

**RLS Policies:**
- Users can only access their own data
- Full CRUD operations for owned records

## User Workflows

### First-Time Setup

1. **Extract Token from LTK:**
   - User logs into LTK in their browser
   - Opens Chrome DevTools (F12)
   - Follows extraction guide to copy token
   - See `docs/LTK_TOKEN_EXTRACTION_GUIDE.md` for detailed steps

2. **Connect to CreatorMetrics:**
   - Navigate to Settings page
   - Click "Connect LTK"
   - Select token type (usually "Bearer Token")
   - Paste token into input field
   - Click "Test Connection" to verify
   - Click "Save & Connect"

3. **Configure Auto-Refresh:**
   - Set refresh interval (recommended: 15-30 minutes)
   - Auto-refresh starts immediately
   - Data appears in Dashboard widget

### Daily Usage

1. **View Stats:**
   - Dashboard automatically shows latest LTK data
   - Widget displays key metrics at a glance
   - Auto-refreshes in background

2. **Manual Refresh:**
   - Click refresh button in widget or settings
   - Forces immediate data fetch
   - Updates display instantly

3. **Monitor Status:**
   - Green indicator = connected and active
   - Last refresh time shown
   - Error notifications if issues occur

### Troubleshooting

#### "Invalid Token" Error
- Token may have expired
- Extract a fresh token from LTK
- Reconnect in Settings

#### "Connection Failed"
- Check if logged into LTK
- Verify token was copied correctly
- LTK may have changed their API

#### Data Not Refreshing
- Check auto-refresh status in Settings
- Look for error count
- Token may have expired
- Check browser console for errors

## API Endpoint Discovery

Since LTK doesn't provide public API documentation, the system tries multiple endpoint patterns:

### Stats Endpoints (Tried in Order):
1. `/api/v1/stats?range={timeRange}`
2. `/api/v1/analytics?period={timeRange}`
3. `/api/stats?timeRange={timeRange}`
4. `/v1/stats`
5. `/api/v1/dashboard/stats`

### Earnings Endpoints:
1. `/api/v1/earnings?start={date}&end={date}`
2. `/api/v1/revenue?start={date}&end={date}`
3. `/api/earnings?start={date}&end={date}`
4. `/v1/commissions?start={date}&end={date}`

### Products Endpoints:
1. `/api/v1/products/top?limit={n}`
2. `/api/v1/products?sort=performance&limit={n}`
3. `/api/products/top`
4. `/v1/products/trending`

The first successful response is used and cached.

## Security Considerations

### Current Implementation
- Tokens stored in localStorage with basic encryption
- XOR cipher with Base64 encoding
- User-specific encryption key

### Production Recommendations
1. **Use crypto-js or Web Crypto API** for proper encryption
2. **Consider server-side token storage** for enhanced security
3. **Implement token rotation** when LTK supports it
4. **Add rate limiting** to prevent API abuse
5. **Monitor for suspicious activity**

### Important Notes
- Never commit tokens to git
- Don't share tokens with third parties
- Tokens give full access to LTK account
- Users should be educated on token security

## Rate Limiting

### Best Practices
- **Minimum refresh interval:** 5 minutes
- **Recommended:** 15-30 minutes
- **Maximum:** User preference, but longer is better

### Caching Strategy
- API responses cached for 5 minutes
- Prevents excessive calls during page refreshes
- Cache cleared on manual refresh
- Cache cleared when credentials change

## Error Handling

### Automatic Recovery
- **3 consecutive errors:** Warns user, checks token validity
- **Token expired:** Stops auto-refresh, notifies user
- **Network errors:** Retries on next scheduled refresh
- **Invalid response:** Tries alternate endpoints

### User Notifications
- Success: Toast notification (green)
- Error: Toast notification (red) with details
- Warning: Token expiring soon (yellow)
- Info: Refresh started/completed (blue)

## Testing

### Manual Testing
1. **Valid Token Test:**
   - Use valid LTK token
   - Verify connection succeeds
   - Check data displays correctly

2. **Invalid Token Test:**
   - Use expired/invalid token
   - Verify error handling
   - Check user sees appropriate message

3. **Auto-Refresh Test:**
   - Set short interval (e.g., 2 minutes)
   - Monitor for successful refreshes
   - Check database for stored data

4. **Reconnection Test:**
   - Disconnect LTK
   - Reconnect with new token
   - Verify smooth transition

### Automated Testing Ideas
```typescript
// Unit tests
describe('LTKApiService', () => {
  it('should authenticate with bearer token', async () => {
    // Test implementation
  });

  it('should handle expired tokens', async () => {
    // Test implementation
  });
});

// Integration tests
describe('LTK Auto-Refresh', () => {
  it('should fetch and store data', async () => {
    // Test implementation
  });
});
```

## Future Enhancements

### Potential Features
1. **Multiple Account Support**
   - Connect multiple LTK accounts
   - Switch between accounts
   - Aggregate stats across accounts

2. **Historical Analytics**
   - Trend charts over time
   - Performance comparisons
   - Earnings predictions

3. **Smart Alerts**
   - Sales milestones reached
   - Unusual activity detected
   - Product performance changes

4. **Advanced Caching**
   - IndexedDB for large datasets
   - Service Worker for offline support
   - Background sync

5. **Webhook Integration**
   - Real-time updates via webhooks (if LTK adds support)
   - Instant notifications
   - No polling needed

6. **Export Capabilities**
   - CSV export of historical data
   - PDF reports
   - Tax document generation

## Support and Maintenance

### Common Updates Needed
1. **Endpoint Changes**
   - Monitor LTK for API changes
   - Update endpoint patterns in `ltkApi.ts`
   - Add new endpoints as discovered

2. **Token Format Changes**
   - Update validation in `ltkTokenManager.ts`
   - Adjust encryption if needed
   - Test with new format

3. **Response Structure Changes**
   - Update `normalizeStatsResponse()` in `ltkApi.ts`
   - Adjust type definitions
   - Test data mapping

### Monitoring
- Check error logs regularly
- Monitor consecutive error counts
- Track refresh success rates
- Review user feedback

### Getting Help
- Check browser console for errors
- Review Network tab for failed requests
- Verify token format and expiration
- Contact support with:
  - Error messages
  - Screenshots of DevTools
  - Steps to reproduce issue

## FAQ

**Q: How often does auto-refresh run?**
A: Default is every 15 minutes. Configurable from 1-1440 minutes.

**Q: Will this work if LTK changes their API?**
A: Possibly not. The system tries multiple endpoints, but significant changes may require updates.

**Q: Is my token secure?**
A: It's encrypted in localStorage. For production, consider server-side storage.

**Q: Can I connect multiple platforms?**
A: Currently LTK only. The architecture supports adding Amazon, Walmart, etc. in the future.

**Q: What happens if my token expires?**
A: Auto-refresh stops and you'll be notified. Simply reconnect with a fresh token.

**Q: Does this violate LTK's terms of service?**
A: This is reverse-engineering. Use at your own risk. Not officially supported by LTK.

**Q: Will LTK block my account for using this?**
A: Unlikely if used reasonably (15+ min intervals), but possible. Monitor your account.

**Q: Can I export my historical data?**
A: Not yet, but it's stored in the database. You can query `platform_metrics` table directly.

## License

This integration is part of CreatorMetrics and follows the project's license.

## Credits

Created for CreatorMetrics to help creators track their LTK performance alongside other affiliate platforms.
