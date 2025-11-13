# Database Migration Instructions

## Quick Setup Guide

### Step 1: Run First Migration

1. Open file in Replit: `supabase/migrations/20251016063142_create_creator_metrics_schema.sql`
2. Select ALL the code (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)
4. Go to Supabase Dashboard → SQL Editor
5. Paste the code
6. Click "Run"

### Step 2: Run Second Migration

1. Open file in Replit: `supabase/migrations/20251021020954_add_social_posts_and_attribution_tables.sql`
2. Select ALL the code (Ctrl+A / Cmd+A)
3. Copy it (Ctrl+C / Cmd+C)
4. Go to Supabase Dashboard → SQL Editor (new query)
5. Paste the code
6. Click "Run"

### Expected Result

After both migrations run successfully, you'll have these tables:
- ✅ profiles
- ✅ platform_connections
- ✅ sales
- ✅ products
- ✅ social_posts
- ✅ attributions
- ✅ insights

### Verify Setup

Go to Supabase Dashboard → Table Editor. You should see all 7 tables listed.

### Then You're Ready!

Return to your CreatorMetrics app and create your account!
