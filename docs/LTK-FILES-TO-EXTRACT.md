# Files to Extract for LTK SDK

Quick reference: Which files to copy when creating a reusable LTK SDK package.

---

## Core Files (Required)

### 1. Authentication Service
**Source:** `src/lib/ltkAuth.ts`  
**Destination:** `ltk-sdk/src/auth/ltkAuth.ts`  
**What it does:** Token management, OAuth flow, token refresh

### 2. API Client
**Source:** `src/lib/ltkApiClient.ts`  
**Destination:** `ltk-sdk/src/client/ltkApiClient.ts`  
**What it does:** All API endpoint methods, request handling

### 3. Revenue Matching Utilities
**Source:** `src/lib/contentMatcher.ts`  
**Destination:** `ltk-sdk/src/utils/contentMatcher.ts`  
**What it does:** Instagram Story link matching, attribution logic

---

## Optional Files

### 4. Backend Proxy Routes
**Source:** `server/routes/ltkProxy.ts`  
**Destination:** `ltk-sdk/src/proxy/proxyRoutes.ts`  
**What it does:** Express.js proxy routes (if using backend proxy)

**Note:** Adapt to your backend framework if not using Express.

---

## Type Definitions

Extract these interfaces/types from the files above:

- `LTKTokens` - Token structure
- `LTKTokenPayload` - JWT payload
- `LTKAuthState` - Auth state
- `LTKAnalyticsParams` - API parameters
- `InstagramPost` - Instagram post structure
- `LTKPost` - LTK post structure
- `MatchedContent` - Attribution result

---

## Documentation to Include

Copy these docs to your SDK:

- `docs/LTK-API-COMPLETE-REFERENCE.md` - Full API reference
- `docs/LTK-INTEGRATION-GUIDE.md` - Integration guide

---

## Dependencies Needed

**Required:**
- `jwt-decode` - For decoding JWT tokens

**Optional (framework-specific):**
- `react` - Only if using React hooks/context
- `express` - Only if including backend proxy

---

## Quick Copy Command

```bash
# From CreatorMetrics root
mkdir -p ../ltk-sdk/src/{auth,client,utils,proxy}

# Copy core files
cp src/lib/ltkAuth.ts ../ltk-sdk/src/auth/
cp src/lib/ltkApiClient.ts ../ltk-sdk/src/client/
cp src/lib/contentMatcher.ts ../ltk-sdk/src/utils/

# Copy backend proxy (optional)
cp server/routes/ltkProxy.ts ../ltk-sdk/src/proxy/

# Copy documentation
cp docs/LTK-API-COMPLETE-REFERENCE.md ../ltk-sdk/docs/
cp docs/LTK-INTEGRATION-GUIDE.md ../ltk-sdk/docs/
```

---

## What NOT to Copy

❌ **Don't copy:**
- React-specific context files (`LTKAuthContext.tsx`)
- Project-specific hooks (`useLTKAuth.ts`)
- Supabase integration (`supabase.ts`)
- UI components
- Database migrations
- App-specific routing

✅ **Only copy:**
- Core business logic
- API client
- Authentication service
- Utility functions
- Type definitions

---

## After Copying

1. **Remove React dependencies** (if making framework-agnostic)
2. **Abstract storage** (localStorage → interface)
3. **Update imports** (remove project-specific paths)
4. **Add tests** (if you want)
5. **Create entry point** (`src/index.ts`)
6. **Build and publish**

See `LTK-SDK-SETUP.md` for complete setup instructions.
