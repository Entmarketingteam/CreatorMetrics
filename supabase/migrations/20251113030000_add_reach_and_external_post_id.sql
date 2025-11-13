-- Add reach and external_post_id columns to social_posts table
-- Reach = unique accounts reached (different from views which can be total plays)
-- External Post ID = platform-specific post identifier (Instagram Post ID, TikTok ID, etc.)

ALTER TABLE social_posts 
  ADD COLUMN IF NOT EXISTS reach integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS external_post_id text;

-- Backfill reach with views for existing records to preserve engagement rate calculations
UPDATE social_posts 
SET reach = views 
WHERE reach IS NULL OR reach = 0;

-- Create unique index on (user_id, platform, external_post_id) for better upsert handling
-- This prevents duplicate imports of the same post
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_posts_external_id 
  ON social_posts(user_id, platform, external_post_id) 
  WHERE external_post_id IS NOT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN social_posts.reach IS 'Number of unique accounts that saw this post (used for engagement rate calculation)';
COMMENT ON COLUMN social_posts.external_post_id IS 'Platform-specific post identifier (Instagram Post ID, TikTok video ID, etc.)';
