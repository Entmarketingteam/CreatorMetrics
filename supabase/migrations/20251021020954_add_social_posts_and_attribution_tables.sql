/*
  # Add Social Posts, Attributions, and Insights Tables

  1. New Tables
    - `social_posts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles)
      - `platform` (text: INSTAGRAM, TIKTOK, YOUTUBE)
      - `post_type` (text: POST, REEL, STORY, VIDEO)
      - `posted_at` (timestamptz)
      - `caption` (text)
      - `thumbnail_url` (text, nullable)
      - `views` (integer)
      - `likes` (integer)
      - `comments` (integer)
      - `shares` (integer)
      - `saves` (integer)
      - `engagement_rate` (numeric)
      - `attributed_revenue` (numeric, default 0)
      - `attributed_sales` (integer, default 0)
      - `created_at` (timestamptz)

    - `attributions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles)
      - `sale_id` (uuid, FK to sales)
      - `post_id` (uuid, FK to social_posts)
      - `confidence` (numeric, 0.0 to 1.0)
      - `method` (text: PRODUCT_MATCH, TIME_WINDOW, PLATFORM_MATCH)
      - `created_at` (timestamptz)

    - `insights`
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to profiles)
      - `type` (text)
      - `priority` (text: HIGH, MEDIUM, LOW)
      - `title` (text)
      - `description` (text)
      - `actionable` (text)
      - `metadata` (jsonb)
      - `dismissed_at` (timestamptz, nullable)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create social_posts table
CREATE TABLE IF NOT EXISTS social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('INSTAGRAM', 'TIKTOK', 'YOUTUBE')),
  post_type text NOT NULL CHECK (post_type IN ('POST', 'REEL', 'STORY', 'VIDEO')),
  posted_at timestamptz NOT NULL,
  caption text NOT NULL,
  thumbnail_url text,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  saves integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  attributed_revenue numeric DEFAULT 0,
  attributed_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON social_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts"
  ON social_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create attributions table
CREATE TABLE IF NOT EXISTS attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES social_posts(id) ON DELETE CASCADE NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  method text NOT NULL CHECK (method IN ('PRODUCT_MATCH', 'TIME_WINDOW', 'PLATFORM_MATCH')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attributions"
  ON attributions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attributions"
  ON attributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own attributions"
  ON attributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own attributions"
  ON attributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
  title text NOT NULL,
  description text NOT NULL,
  actionable text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  dismissed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights"
  ON insights FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insights"
  ON insights FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own insights"
  ON insights FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own insights"
  ON insights FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_posted_at ON social_posts(posted_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_platform ON social_posts(platform);
CREATE INDEX IF NOT EXISTS idx_attributions_user_id ON attributions(user_id);
CREATE INDEX IF NOT EXISTS idx_attributions_sale_id ON attributions(sale_id);
CREATE INDEX IF NOT EXISTS idx_attributions_post_id ON attributions(post_id);
CREATE INDEX IF NOT EXISTS idx_insights_user_id ON insights(user_id);
CREATE INDEX IF NOT EXISTS idx_insights_dismissed_at ON insights(dismissed_at);