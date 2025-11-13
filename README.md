# CreatorMetrics - Content Attribution & AI Insights

A comprehensive creator analytics dashboard for tracking affiliate sales, products, and platform connections across multiple affiliate networks (LTK, Amazon, Walmart, ShopStyle).

## Features

- **Dashboard**: Overview of revenue, clicks, conversion rates, and top-performing products
- **Earnings**: Detailed sales tracking with filtering, sorting, and CSV export
- **Products**: Performance analytics for promoted products
- **Content**: Track social media post performance and attribute sales to specific content
- **Insights**: AI-generated actionable recommendations
- **Platforms**: Manage affiliate platform connections
- **Dark Mode**: Full dark mode support with theme persistence

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Authentication + Database)
- **UI**: TailwindCSS + Lucide Icons
- **Charts**: Recharts
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account and project

### Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Supabase**:
   - Create a new Supabase project at https://supabase.com
   - Copy the project URL and anon key
   - Add them to Replit Secrets:
     - `VITE_SUPABASE_URL`: Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

3. **Run database migrations**:
   - Navigate to your Supabase project dashboard
   - Go to SQL Editor
   - Run the migration files in `supabase/migrations/` in order:
     1. `20251016063142_create_creator_metrics_schema.sql`
     2. `20251021020954_add_social_posts_and_attribution_tables.sql`

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The application will be available at the Replit webview URL.

## Database Schema

### Tables

- **profiles**: User profiles with subscription and onboarding status
- **platform_connections**: Affiliate platform connection management
- **sales**: Individual sales transactions and commissions
- **products**: Product performance metrics and attribution
- **social_posts**: Social media content tracking
- **attributions**: Links between sales and social posts
- **insights**: AI-generated recommendations

## Environment Variables

Required environment variables (add via Replit Secrets):

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

See `.env.example` for reference.

## Development

- `npm run dev` - Start development server on port 5000
- `npm run build` - Build for production
- `npm run start` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Attribution Engine

The platform includes an intelligent attribution system that links sales to social media posts based on:

- Product name matching
- Time window correlation
- Platform matching
- Confidence scoring

## Deployment

This application is configured for Replit deployment:

- Frontend runs on port 5000 (configured in vite.config.ts)
- Supabase handles backend operations
- Row-level security (RLS) ensures data isolation between users

## Support

For issues or questions, please refer to the Supabase documentation or Replit support.

## License

Private project - All rights reserved
