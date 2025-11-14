# Overview

CreatorMetrics is a comprehensive creator analytics dashboard that helps content creators track affiliate sales, analyze product performance, and attribute revenue to specific social media posts across multiple affiliate networks (LTK, Amazon, Walmart, ShopStyle). The platform provides AI-generated insights to help creators optimize their content strategy and maximize earnings.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**November 14, 2025** - Backend Proxy Server Implementation ✅
- **Major Architecture Change**: Added Express backend server to bypass LTK CORS restrictions
- Backend server (port 3001) proxies requests to `api-gateway.rewardstyle.com`
  * All 14 LTK API endpoints now accessible via backend proxy
  * Server-to-server requests bypass browser CORS policies
  * Secure token forwarding via `x-ltk-token` header
- Package.json updated with concurrently to run frontend + backend simultaneously
  * `npm run dev` starts both Vite (5000) and Express (3001)
  * Development: Backend at localhost:3001
  * Production: Backend runs on same domain (Autoscale deployment)
- Frontend LTK API client updated to use backend proxy
  * Removed direct calls to api-gateway.rewardstyle.com
  * Now calls `/api/ltk/*` endpoints on backend
  * Automatic CORS bypass
- Deployment configured for Replit Autoscale
- `/ltk-test` page updated to reflect working backend proxy
- CSV import still available as alternative method
- Documentation: `docs/ltk-integration-limitations.md` explains all integration options

**November 13, 2025** - LTK API Discovery & Integration
- Analyzed LTK HAR files (performance analytics, homepage, earnings pages)
- Discovered LTK uses Auth0 for authentication (not custom OAuth)
- Identified `x-id-token` header pattern for API requests
- Found 14 LTK API endpoints:
  * Analytics: contributors, hero_chart, performance_summary, performance_stats, top_performers, items_sold, commissions_summary
  * User/Account: get_user, get_account, get_account_users, get_user_info, get_public_profile
  * Integration: get_amazon_identities, ltk_search_trends
- Created comprehensive LTK API Client (`src/lib/ltkApiClient.ts`)
  * Type-safe interfaces for all 14 endpoints
  * Automatic 401 retry with token refresh
  * Query string builder for complex parameters
- Created documentation:
  * `docs/ltk-auth0-integration.md` - Auth0 flow, cookies, security
  * `docs/ltk-api-endpoints.md` - Complete API reference with examples
- Sample response structures extracted from real user data
- Integration ready for testing with real Auth0 tokens

**November 13, 2025** - JWT Decoder with Auto-Refresh
- Fixed critical auto-refresh bug (now survives page reloads)
- Added comprehensive security warnings about client_secret exposure
- Documented production security requirements (backend proxy, httpOnly cookies)
- Fixed LSP errors and cleaned up unused imports

**November 13, 2025** - Instagram Import Feature
- Created Instagram Import page for Meta Business Suite CSV exports
- Built CSV parser that handles posts, reels, and stories data (BOM-safe, quoted fields)
- Maps Instagram metrics to social_posts table:
  * CSV "Views" → database "views" (total plays/views)
  * CSV "Reach" → database "reach" (unique accounts reached)
  * CSV "Post ID" → database "external_post_id" (Instagram's unique identifier)
  * CSV "Permalink" → database "thumbnail_url" (for future reference)
  * Engagement rate = (likes + comments + saves + shares) / reach
- Database migration created: adds "reach" and "external_post_id" columns
- Upsert logic prevents duplicate imports using (user_id, platform, external_post_id)
- Batch insertion (50 posts per batch) for large CSV files
- Added Instagram Import to sidebar navigation with Instagram icon
- Content page ready to display imported Instagram data with proper reach metrics
- Integration with attribution engine for post-to-sale matching

**November 13, 2025** - Earnings & Products Pages Redesign
- Redesigned Earnings page with LTK aesthetic:
  * Added period toggle (7 days, 30 days, 1 year)
  * Three summary cards: Total Earnings, Paid, Pending (with color-coded amounts)
  * Search and filter UI with platform and status filters
  * Card-based transaction list with platform badges, status indicators, and hover states
  * Pagination support for large transaction lists
  * Export to CSV functionality
  * Supabase integration with mock data fallback
- Redesigned Products page with LTK aesthetic:
  * Added period toggle (7 days, 30 days, 1 year)
  * Two summary cards: Total Revenue, Total Sales
  * Search and filter UI with platform filter and sort options
  * Responsive grid layout (1-4 columns) using ProductTile component
  * ProductTile displays: product image, name, store, clicks, sales, commission
  * Supabase integration with mock data fallback
  * Hover states on product cards
- Both pages follow LTK design system: teal accents, soft backgrounds, clean typography

**November 13, 2025** - CSV Import Feature
- Added Import page for uploading LTK earnings export CSV files
- Implemented CSV parser that handles quoted fields and commas
- Added status mapping function for LTK statuses (Open → OPEN, Paid → PAID, etc.)
- Implemented product upsert logic with duplicate detection
- Added comprehensive error handling for database operations
- Created UI with drag-drop file upload, progress indicators, and result feedback
- Import feature accessible via sidebar navigation

# System Architecture

## Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety and developer experience
- Vite as the build tool for fast development and optimized production builds
- React Router DOM v7 for client-side routing with protected routes

**UI Components & Styling**
- TailwindCSS with dark mode support (class-based) for responsive, utility-first styling
- Lucide React for consistent iconography
- Recharts library for data visualization (pie charts, line charts)
- Custom MetricCard component for reusable dashboard metrics

**State Management**
- React Context API for global state (AuthContext, ThemeContext)
- Local component state with useState for UI interactions
- No external state management library (Redux/Zustand)

**Routing Strategy**
- Protected routes wrapper that redirects unauthenticated users to login
- Loading states during authentication checks
- Separate public routes for login/register

**Pages**
- Dashboard: Overview of earnings, products, and insights
- Earnings: Detailed sales transaction history
- Products: Product performance and top sellers
- Content: Social media post tracking
- Insights: AI-generated recommendations
- Platforms: Affiliate network connection management
- Import: CSV data import for LTK earnings exports
- Settings: User profile and preferences

## Backend Architecture

**Authentication & Database**
- Supabase as the primary backend service (BaaS approach)
- Supabase Auth for user authentication (email/password)
- PostgreSQL database via Supabase with typed database schema

**Data Models**
- Users/Profiles: Creator account information, niche, audience size, social handles
- Sales: Affiliate commission tracking across platforms
- Products: Product performance metrics and attribution
- Social Posts: Content tracking with engagement metrics
- Attributions: Links sales to specific social posts
- Insights: AI-generated recommendations with priority levels
- Platform Connections: Affiliate network integration status

**Attribution Engine**
- Custom algorithm in `attributionEngine.ts` that matches sales to posts based on:
  - Product keyword matching in post captions
  - Time window analysis (7-day default, 3-day short window)
  - Platform matching
  - Confidence scoring for attribution accuracy

**Content Generation**
- Mock data generators for development/testing (`contentGenerator.ts`)
- Simulates Instagram posts with realistic engagement metrics
- Product mention extraction from captions

**Data Import**
- CSV import functionality for LTK earnings exports (`src/pages/Import.tsx`)
- Parses LTK CSV format with proper handling of quoted fields
- Maps LTK statuses (Open, Pending, Paid, Reversed) to database schema
- Automatically creates/updates products with aggregated metrics
- Comprehensive error handling and user feedback
- Supports duplicate detection and data merging

## Data Flow & Patterns

**Authentication Flow**
1. User credentials → Supabase Auth
2. Session stored in Supabase client
3. AuthContext provides user state to entire app
4. Protected routes check auth state before rendering

**Data Fetching Pattern**
- Direct Supabase client queries from React components
- useEffect hooks for data loading on mount
- Loading states for async operations
- Error handling with try/catch blocks

**Theme Management**
- localStorage persistence for user preference
- CSS class toggling on document root element
- Context provider for theme state

# External Dependencies

## Core Services

**Supabase (Primary Backend)**
- Authentication service with email/password strategy
- PostgreSQL database hosting
- Real-time capabilities (not currently utilized)
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Affiliate Platforms (Integration Points)

**Supported Networks**
- LTK (LikeToKnow.it)
- Amazon Associates
- Walmart Affiliate Program
- ShopStyle Collective

Note: Current implementation uses mock data; actual API integrations are placeholders for future development.

## NPM Dependencies

**Production**
- `@supabase/supabase-js` ^2.57.4 - Supabase client SDK
- `react` ^18.3.1 - UI framework
- `react-dom` ^18.3.1 - React DOM rendering
- `react-router-dom` ^7.9.4 - Client-side routing
- `recharts` ^3.2.1 - Chart components
- `lucide-react` ^0.344.0 - Icon library

**Development**
- `vite` ^5.4.2 - Build tool and dev server
- `typescript` ^5.5.3 - Type checking
- `tailwindcss` ^3.4.1 - CSS framework
- `eslint` + TypeScript plugins - Code linting

## Database Schema

**Migration Files Location**: `supabase/migrations/`
- Initial schema: `20251016063142_create_creator_metrics_schema.sql`
- Social features: `20251021020954_add_social_posts_and_attribution_tables.sql`

**Key Tables**
- `profiles` - User profile data with subscription info
- `sales` - Affiliate transaction records
- `products` - Product catalog and performance
- `social_posts` - Content tracking with engagement
- `post_attributions` - Sale-to-post relationships
- `insights` - AI-generated recommendations
- `platform_connections` - Affiliate network auth status