/*
  # LTK Scraper Tables Migration

  Creates tables for storing LTK scraped data and AI-generated captions.

  1. New Tables
    - `ltk_posts`
      - Stores scraped LTK post metadata
      - Links to user who initiated the scrape
      - Tracks creator info, caption, and engagement

    - `ltk_products`
      - Stores product information extracted from LTK posts
      - Links to parent ltk_post
      - Includes product URLs and images

    - `generated_captions`
      - Stores AI-generated captions for posts
      - Multiple caption variations per post
      - Tracks prompt type and generation parameters

  2. Security
    - RLS enabled on all tables
    - Users can only access their own data
*/

-- Create ltk_posts table
CREATE TABLE IF NOT EXISTS ltk_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_handle text NOT NULL,
  creator_profile_url text,
  post_url text NOT NULL,
  original_caption text NOT NULL,
  category text,
  scraped_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ltk_products table
CREATE TABLE IF NOT EXISTS ltk_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES ltk_posts(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  merchant text NOT NULL,
  product_url text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Create generated_captions table
CREATE TABLE IF NOT EXISTS generated_captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES ltk_posts(id) ON DELETE CASCADE NOT NULL,
  caption text NOT NULL,
  caption_type text NOT NULL CHECK (caption_type IN ('short', 'long', 'alt_text')),
  prompt_type text NOT NULL,
  tone text NOT NULL,
  hashtags text[] DEFAULT '{}',
  word_count integer NOT NULL,
  char_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ltk_posts_user_id ON ltk_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_creator ON ltk_posts(creator_handle);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_category ON ltk_posts(category);
CREATE INDEX IF NOT EXISTS idx_ltk_posts_scraped_at ON ltk_posts(scraped_at DESC);

CREATE INDEX IF NOT EXISTS idx_ltk_products_post_id ON ltk_products(post_id);
CREATE INDEX IF NOT EXISTS idx_ltk_products_merchant ON ltk_products(merchant);

CREATE INDEX IF NOT EXISTS idx_generated_captions_user_id ON generated_captions(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_captions_post_id ON generated_captions(post_id);
CREATE INDEX IF NOT EXISTS idx_generated_captions_type ON generated_captions(caption_type);

-- Enable Row Level Security
ALTER TABLE ltk_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ltk_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_captions ENABLE ROW LEVEL SECURITY;

-- ltk_posts policies
CREATE POLICY "Users can view own ltk posts"
  ON ltk_posts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ltk posts"
  ON ltk_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ltk posts"
  ON ltk_posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ltk posts"
  ON ltk_posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ltk_products policies
-- Users can view products from their posts
CREATE POLICY "Users can view products from own posts"
  ON ltk_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ltk_posts
      WHERE ltk_posts.id = ltk_products.post_id
      AND ltk_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to own posts"
  ON ltk_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ltk_posts
      WHERE ltk_posts.id = ltk_products.post_id
      AND ltk_posts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from own posts"
  ON ltk_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ltk_posts
      WHERE ltk_posts.id = ltk_products.post_id
      AND ltk_posts.user_id = auth.uid()
    )
  );

-- generated_captions policies
CREATE POLICY "Users can view own generated captions"
  ON generated_captions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generated captions"
  ON generated_captions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own generated captions"
  ON generated_captions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generated captions"
  ON generated_captions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on ltk_posts
CREATE TRIGGER update_ltk_posts_updated_at
  BEFORE UPDATE ON ltk_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
