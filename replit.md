# Overview

CreatorMetrics is a comprehensive analytics dashboard designed for content creators. It enables tracking of affiliate sales, analysis of product performance, and attribution of revenue to specific social media posts across various affiliate networks (LTK, Amazon, Walmart, ShopStyle). The platform aims to provide AI-generated insights to optimize content strategy and maximize creators' earnings.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework & Build System:** React 18 with TypeScript, Vite for building.
**UI Components & Styling:** TailwindCSS for utility-first styling (with dark mode), Lucide React for icons, Recharts for data visualization, custom MetricCard component.
**State Management:** React Context API for global state, `useState` for local component state.
**Routing Strategy:** React Router DOM v7 with protected routes for authentication.
**Key Pages:** Dashboard, Earnings, Products, Content, Insights, Platforms, Import, Settings.

## Backend Architecture

**Authentication & Database:** Supabase as the primary Backend-as-a-Service (BaaS) for authentication and PostgreSQL database hosting.
**Data Models:** Key entities include Users/Profiles, Sales, Products, Social Posts, Attributions, Insights, and Platform Connections.
**Attribution Engine:** A custom algorithm (`attributionEngine.ts`) matches sales to social posts based on product keywords, time windows, and platform matching, assigning a confidence score.
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

**Key Tables:** `profiles`, `sales`, `products`, `social_posts`, `post_attributions`, `insights`, `platform_connections`.