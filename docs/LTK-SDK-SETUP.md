# Creating a Reusable LTK SDK Package

**Yes, it's absolutely normal and recommended** to create a separate reusable package for integrations like this that you'll use across multiple projects.

---

## Why Create a Separate Package?

✅ **Benefits:**
- **DRY Principle**: Write once, use everywhere
- **Version Control**: Update once, all projects benefit
- **Testing**: Test the integration once, not in every project
- **Documentation**: Single source of truth
- **Maintenance**: Fix bugs once, not in multiple places
- **Sharing**: Easy to share with team or open source

---

## Option 1: NPM Package (Recommended)

Create a standalone npm package that can be installed in any project.

### Step 1: Create New Repository

```bash
# Create new directory
mkdir ltk-sdk
cd ltk-sdk
git init
npm init -y
```

### Step 2: Package Structure

```
ltk-sdk/
├── src/
│   ├── index.ts              # Main entry point
│   ├── auth/
│   │   ├── ltkAuth.ts        # Authentication service
│   │   └── types.ts          # Token types
│   ├── client/
│   │   ├── ltkApiClient.ts   # API client
│   │   └── types.ts          # API types
│   ├── utils/
│   │   └── contentMatcher.ts # Revenue matching utilities
│   └── proxy/
│       └── proxyRoutes.ts     # Backend proxy routes (optional)
├── dist/                      # Built output
├── package.json
├── tsconfig.json
├── README.md
└── .gitignore
```

### Step 3: package.json

```json
{
  "name": "@yourusername/ltk-sdk",
  "version": "1.0.0",
  "description": "LTK (LikeToKnow.it) API SDK for TypeScript/JavaScript",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "ltk",
    "liketoknowit",
    "rewardstyle",
    "affiliate",
    "api",
    "sdk"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "jwt-decode": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.5.3"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "react": {
      "optional": true
    }
  }
}
```

### Step 4: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 5: Main Entry Point (src/index.ts)

```typescript
// Export everything from the SDK
export * from './auth/ltkAuth';
export * from './client/ltkApiClient';
export * from './utils/contentMatcher';
export * from './auth/types';
export * from './client/types';

// Re-export for convenience
export { LTKAuthService } from './auth/ltkAuth';
export { LTKApiClient } from './client/ltkApiClient';
```

### Step 6: Copy Core Files

Copy these files from CreatorMetrics:

1. **`src/lib/ltkAuth.ts`** → `src/auth/ltkAuth.ts`
2. **`src/lib/ltkApiClient.ts`** → `src/client/ltkApiClient.ts`
3. **`src/lib/contentMatcher.ts`** → `src/utils/contentMatcher.ts`
4. **`server/routes/ltkProxy.ts`** → `src/proxy/proxyRoutes.ts` (optional, for backend)

### Step 7: Make It Framework-Agnostic

Update `ltkAuth.ts` to work without React:

```typescript
// Remove React-specific code, use generic storage interface
export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LTKAuthService {
  constructor(private storage: TokenStorage = typeof window !== 'undefined' 
    ? window.localStorage 
    : new MemoryStorage()) {
    // ...
  }
}

// Memory storage for Node.js environments
class MemoryStorage implements TokenStorage {
  private data: Record<string, string> = {};
  getItem(key: string) { return this.data[key] || null; }
  setItem(key: string, value: string) { this.data[key] = value; }
  removeItem(key: string) { delete this.data[key]; }
}
```

### Step 8: Build & Publish

```bash
# Build
npm run build

# Test locally (link to another project)
npm link

# Publish to npm (private or public)
npm publish --access public  # or --access restricted for private
```

### Step 9: Use in Other Projects

```bash
# Install from npm
npm install @yourusername/ltk-sdk

# Or install from GitHub
npm install github:yourusername/ltk-sdk

# Or install from local path
npm install ../ltk-sdk
```

**Usage:**
```typescript
import { LTKAuthService, LTKApiClient } from '@yourusername/ltk-sdk';

const auth = new LTKAuthService();
const client = new LTKApiClient(
  () => auth.getTokens()?.access_token || '',
  () => auth.getTokens()?.id_token || ''
);

const data = await client.getPerformanceSummary({...});
```

---

## Option 2: Git Submodule (Simple Alternative)

If you don't want to publish to npm, use git submodules:

### Step 1: Create Separate Repo

```bash
# Create new repo for LTK SDK
mkdir ltk-sdk
cd ltk-sdk
git init
# Copy files, commit, push to GitHub
```

### Step 2: Add as Submodule

```bash
# In your project
git submodule add https://github.com/yourusername/ltk-sdk.git packages/ltk-sdk
git submodule update --init --recursive
```

### Step 3: Use in Project

```typescript
// Import directly from submodule
import { LTKAuthService } from './packages/ltk-sdk/src/auth/ltkAuth';
```

**Update submodule:**
```bash
git submodule update --remote
```

---

## Option 3: Monorepo (For Multiple Related Projects)

If you have multiple projects that use LTK, use a monorepo:

```
workspace/
├── packages/
│   ├── ltk-sdk/           # Reusable SDK
│   ├── creator-metrics/   # Your current app
│   └── new-app/           # New app using LTK
├── package.json           # Root workspace
└── pnpm-workspace.yaml    # or npm/yarn workspaces
```

**Root package.json:**
```json
{
  "name": "workspace",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

**Use in packages:**
```json
{
  "dependencies": {
    "@workspace/ltk-sdk": "workspace:*"
  }
}
```

---

## Recommended Structure for LTK SDK

```
ltk-sdk/
├── src/
│   ├── index.ts                    # Main exports
│   ├── auth/
│   │   ├── index.ts
│   │   ├── ltkAuth.ts             # Auth service
│   │   ├── types.ts                # Token interfaces
│   │   └── storage.ts              # Storage abstraction
│   ├── client/
│   │   ├── index.ts
│   │   ├── ltkApiClient.ts        # API client
│   │   ├── types.ts                # API types
│   │   └── endpoints.ts            # Endpoint definitions
│   ├── utils/
│   │   ├── index.ts
│   │   ├── contentMatcher.ts      # Revenue matching
│   │   └── validators.ts           # Input validation
│   └── proxy/                      # Optional backend proxy
│       ├── index.ts
│       └── proxyRoutes.ts
├── docs/
│   ├── README.md                   # Usage docs
│   ├── API.md                      # API reference
│   └── examples/                   # Code examples
├── tests/
│   └── *.test.ts
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## Quick Start: Create SDK Now

### 1. Create New Repo on GitHub

Create a new repository called `ltk-sdk` (or `@yourusername/ltk-sdk`)

### 2. Initialize Package

```bash
mkdir ltk-sdk && cd ltk-sdk
git init
npm init -y
npm install -D typescript @types/node
npm install jwt-decode
```

### 3. Copy Files

```bash
# From CreatorMetrics project
cp src/lib/ltkAuth.ts src/auth/
cp src/lib/ltkApiClient.ts src/client/
cp src/lib/contentMatcher.ts src/utils/
```

### 4. Set Up Build

```bash
# Add to package.json
"main": "dist/index.js",
"types": "dist/index.d.ts",
"scripts": {
  "build": "tsc",
  "prepublishOnly": "npm run build"
}
```

### 5. Create Entry Point

```typescript
// src/index.ts
export * from './auth/ltkAuth';
export * from './client/ltkApiClient';
export * from './utils/contentMatcher';
```

### 6. Build & Test

```bash
npm run build
npm link  # Test locally in another project
```

### 7. Publish or Use via Git

**Option A: Publish to npm**
```bash
npm publish --access public
```

**Option B: Use from GitHub**
```bash
# In other projects
npm install github:yourusername/ltk-sdk
```

---

## Using SDK in New Projects

### Install

```bash
npm install @yourusername/ltk-sdk
# or
npm install github:yourusername/ltk-sdk
```

### Use

```typescript
import { 
  LTKAuthService, 
  LTKApiClient,
  matchStoryLinksToCommissions 
} from '@yourusername/ltk-sdk';

// Initialize
const auth = new LTKAuthService();
const client = new LTKApiClient(
  () => auth.getTokens()?.access_token || '',
  () => auth.getTokens()?.id_token || ''
);

// Use
const data = await client.getPerformanceSummary({
  start_date: '2025-10-01T00:00:00Z',
  end_date: '2025-10-07T23:59:59Z',
  publisher_ids: '293045',
  platform: 'rs,ltk'
});
```

---

## Benefits of This Approach

✅ **Single Source of Truth**: All LTK integration code in one place  
✅ **Easy Updates**: Fix bugs once, all projects benefit  
✅ **Version Control**: Tag releases, track changes  
✅ **Documentation**: Centralized docs  
✅ **Testing**: Test once, use everywhere  
✅ **Sharing**: Easy to share with team or open source  

---

## Next Steps

1. **Create the SDK repository** (Option 1 recommended)
2. **Copy and adapt the core files**
3. **Test in one project first**
4. **Publish or use via git**
5. **Update all projects to use the SDK**

This is a standard practice for reusable integrations! 🚀
