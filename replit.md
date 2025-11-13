# Overview

CreatorMetrics is a comprehensive creator analytics dashboard that helps content creators track affiliate sales, analyze product performance, and attribute revenue to specific social media posts across multiple affiliate networks (LTK, Amazon, Walmart, ShopStyle). The platform provides AI-generated insights to help creators optimize their content strategy and maximize earnings.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

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