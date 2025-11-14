/*
  # Add LTK Post Attribution for Instagram ↔ LTK Matching
  
  This migration enables matching Instagram posts to LTK sales data.
  
  1. Enhance social_posts table
    - Add `detected_links` (jsonb array) to store found LTK links
    - Add `has_ltk_link` (boolean) for quick filtering
    - Add `post_url` (text) for Instagram permalink
    
  2. Create ltk_posts table
    - Stores LTK post performance data from API
    - Fields: ltk_id, permalink, published_at, clicks, revenue, items_sold
    
  3. Create post_attributions table
    - Bridge table linking social_posts ↔ ltk_posts
    - Stores match confidence, type, and combined metrics
*/

-- Add Instagram ↔ LTK matching fields to social_posts
ALTER TABLE social_posts 
  ADD COLUMN IF NOT EXISTS detected_links jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS has_ltk_link boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS post_url text;

-- Create index for faster filtering by LTK link presence
CREATE INDEX IF NOT EXISTS idx_social_posts_has_ltk_link 
  ON social_posts(has_ltk_link) 
  WHERE has_ltk_link = true;

-- Create ltk_posts table to store LTK performance data
CREATE TABLE IF NOT EXISTS ltk_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  ltk_id text NOT NULL,
  permalink text,
  link_slug text,
  published_at timestamptz NOT NULL,
  clicks integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  items_sold integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure we don't duplicate LTK posts per user
  UNIQUE(user_id, ltk_id)
);

ALTER TABLE ltk_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ltk_posts"
  ON ltk_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ltk_posts"
  ON ltk_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ltk_posts"
  ON ltk_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ltk_posts"
  ON ltk_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ltk_posts_user_id ON ltk_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_published_at ON ltk_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_link_slug ON ltk_posts(link_slug);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_revenue ON ltk_posts(revenue DESC);

-- Create post_attributions bridge table (Instagram ↔ LTK matches)
CREATE TABLE IF NOT EXISTS post_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  social_post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  ltk_post_id uuid REFERENCES ltk_posts(id) ON DELETE CASCADE NOT NULL,
  match_type text NOT NULL CHECK (match_type IN ('direct_url', 'time_window', 'keyword')),
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  
  -- Combined metrics
  instagram_engagement integer DEFAULT 0,
  ltk_clicks integer DEFAULT 0,
  ltk_revenue numeric DEFAULT 0,
  ltk_items_sold integer DEFAULT 0,
  roas numeric DEFAULT 0, -- Return on Ad Spend
  
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- One social post can match one LTK post
  UNIQUE(social_post_id, ltk_post_id)
);

ALTER TABLE post_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own post_attributions"
  ON post_attributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own post_attributions"
  ON post_attributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own post_attributions"
  ON post_attributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own post_attributions"
  ON post_attributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_attributions_user_id ON post_attributions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_attributions_social_post_id ON post_attributions(social_post_id);
CREATE INDEX IF NOT EXISTS idx_post_attributions_ltk_post_id ON post_attributions(ltk_post_id);
CREATE INDEX IF NOT EXISTS idx_post_attributions_confidence ON post_attributions(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_post_attributions_revenue ON post_attributions(ltk_revenue DESC);

-- Add comments for documentation
COMMENT ON COLUMN social_posts.detected_links IS 'Array of LTK link slugs found in post caption/bio';
COMMENT ON COLUMN social_posts.has_ltk_link IS 'Quick filter: true if post contains any LTK link';
COMMENT ON COLUMN social_posts.post_url IS 'Instagram permalink URL';
COMMENT ON TABLE ltk_posts IS 'LTK post performance data from API (top_performers/ltks endpoint)';
COMMENT ON TABLE post_attributions IS 'Bridge table linking Instagram posts to LTK posts with match confidence';
COMMENT ON COLUMN post_attributions.match_type IS 'How the match was made: direct_url (URL in caption), time_window (±48hrs), keyword (product similarity)';
COMMENT ON COLUMN post_attributions.roas IS 'Return on Ad Spend: LTK revenue divided by Instagram engagement';
