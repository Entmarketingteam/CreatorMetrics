# Overview

CreatorMetrics is a comprehensive analytics dashboard designed for content creators. It enables tracking of affiliate sales, analysis of product performance, and attribution of revenue to specific social media posts across various affiliate networks (LTK, Amazon, Walmart, ShopStyle). The platform features a **3-tier matching algorithm** that connects Instagram content (stories, reels, posts) to LTK sales data, showing which specific Instagram posts drive the most revenue. The platform aims to provide AI-generated insights to optimize content strategy and maximize creators' earnings.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite for building.
**UI Components & Styling:** TailwindCSS for utility-first styling (with dark mode), Lucide React for icons, Recharts for data visualization, custom MetricCard component.
**State Management:** React Context API for global state, `useState` for local component state.
**Routing Strategy:** React Router DOM v7 with protected routes for authentication.
**Key Pages:** Dashboard, Earnings, Products, Content, **Content Analytics** (NEW - Instagram ↔ LTK matching), Insights, Platforms, Import, Settings.

## Backend Architecture

**Authentication & Database:** Supabase as the primary Backend-as-a-Service (BaaS) for authentication and PostgreSQL database hosting.
**Data Models:** Key entities include Users/Profiles, Sales, Products, Social Posts, Attributions, Insights, Platform Connections, **LTK Posts** (NEW - LTK performance data), and **Post Attributions** (NEW - Instagram ↔ LTK matching bridge table).
**Attribution Engine:** A custom algorithm (`attributionEngine.ts`) matches sales to social posts based on product keywords, time windows, and platform matching, assigning a confidence score.
**Content Matcher (NEW):** A 3-tier matching system (`contentMatcher.ts`) links Instagram posts to LTK sales:
  1. **Direct URL Match** - Detects ltk.it/shopltk.com links in Instagram captions (95% confidence)
  2. **Time Window Match** - Matches posts ±48 hours from LTK clicks (70% confidence)
  3. **Keyword Similarity** - Fallback matching using product keywords (50% confidence)
  - Returns combined metrics (IG engagement + LTK revenue) for ROI analysis
**Content Generation:** Mock data generators (`contentGenerator.ts`) for development and testing.
**Data Import:** CSV import functionality for LTK earnings exports, including parsing, status mapping, product upsert logic, and error handling.
**Proxy Server:** An Express.js backend proxies requests to `api-gateway.rewardstyle.com` for LTK API integration, handling secure token forwarding and bypassing CORS. It supports a dual-server setup for development and a single-server setup for production on Replit.

## Data Flow & Patterns

**Authentication Flow:** User credentials sent to Supabase Auth, session stored, AuthContext provides state, protected routes enforce authentication.
**Data Fetching Pattern:** Direct Supabase client queries from React components using `useEffect` for loading, with loading states and error handling.
**Theme Management:** `localStorage` for persistence, CSS class toggling on the document root, Context provider for state.

# External Dependencies

## Core Services

**Supabase:**
- Authentication (email/password)
- PostgreSQL Database
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

## Affiliate Platforms (Integration Points)

- LTK (LikeToKnow.it) - Implemented via a backend proxy for API calls.
- Amazon Associates - Planned integration.
- Walmart Affiliate Program - Planned integration.
- ShopStyle Collective - Planned integration.

## NPM Dependencies

**Production:**
- `@supabase/supabase-js`
- `react`, `react-dom`
- `react-router-dom`
- `recharts`
- `lucide-react`

**Development:**
- `vite`
- `typescript`
- `tailwindcss`
- `eslint`

## Database Schema

**Key Tables:** `profiles`, `sales`, `products`, `social_posts`, `attributions`, `insights`, `platform_connections`, **`ltk_posts`** (NEW - stores LTK post performance), **`post_attributions`** (NEW - bridges social_posts ↔ ltk_posts with match type and confidence).

**Recent Schema Updates:**
- Added `detected_links` (jsonb), `has_ltk_link` (boolean), and `post_url` to `social_posts` for LTK link detection
- Created `ltk_posts` table with: ltk_id, permalink, published_at, clicks, revenue, items_sold, conversion_rate
- Created `post_attributions` table with: match_type, confidence, combined IG + LTK metrics (engagement, clicks, revenue, ROAS)