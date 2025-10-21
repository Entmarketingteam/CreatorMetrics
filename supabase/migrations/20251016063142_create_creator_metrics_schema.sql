/*
  # CreatorMetrics Database Schema

  ## Overview
  Complete database schema for CreatorMetrics - a creator analytics dashboard
  for tracking affiliate sales, products, and platform connections.

  ## Tables Created

  ### 1. profiles (extends auth.users)
  - `id` (uuid, primary key, references auth.users)
  - `display_name` (text)
  - `niche` (text, optional)
  - `audience_size` (integer, optional)
  - `instagram_handle` (text, optional)
  - `tiktok_handle` (text, optional)
  - `onboarding_completed` (boolean, default false)
  - `subscription_tier` (text, default 'FREE')
  - `subscription_status` (text, default 'ACTIVE')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. platform_connections
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `platform` (text: LTK, AMAZON, WALMART, SHOPSTYLE)
  - `status` (text: CONNECTED, DISCONNECTED, ERROR)
  - `connected_at` (timestamptz)
  - `last_synced_at` (timestamptz)
  - `metadata` (jsonb for platform-specific data)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. sales
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `platform` (text)
  - `sale_date` (timestamptz)
  - `product_name` (text)
  - `product_sku` (text, optional)
  - `brand` (text)
  - `type` (text: SALE_COMMISSION, CLICK_COMMISSION, BONUS)
  - `status` (text: OPEN, PENDING, PAID, REVERSED)
  - `commission_amount` (decimal)
  - `order_value` (decimal, optional)
  - `click_id` (text, optional)
  - `order_id` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. products
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `name` (text)
  - `brand` (text)
  - `category` (text, optional)
  - `image_url` (text, optional)
  - `total_revenue` (decimal, default 0)
  - `total_sales` (integer, default 0)
  - `total_clicks` (integer, default 0)
  - `conversion_rate` (decimal, default 0)
  - `avg_commission` (decimal, default 0)
  - `is_favorite` (boolean, default false)
  - `platform_links` (jsonb)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Policies for SELECT, INSERT, UPDATE, DELETE
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  niche text,
  audience_size integer,
  instagram_handle text,
  tiktok_handle text,
  onboarding_completed boolean DEFAULT false,
  subscription_tier text DEFAULT 'FREE',
  subscription_status text DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create platform_connections table
CREATE TABLE IF NOT EXISTS platform_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('LTK', 'AMAZON', 'WALMART', 'SHOPSTYLE')),
  status text DEFAULT 'DISCONNECTED' CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ERROR')),
  connected_at timestamptz,
  last_synced_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  sale_date timestamptz NOT NULL,
  product_name text NOT NULL,
  product_sku text,
  brand text NOT NULL,
  type text NOT NULL CHECK (type IN ('SALE_COMMISSION', 'CLICK_COMMISSION', 'BONUS')),
  status text NOT NULL CHECK (status IN ('OPEN', 'PENDING', 'PAID', 'REVERSED')),
  commission_amount decimal(10,2) NOT NULL,
  order_value decimal(10,2),
  click_id text,
  order_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text NOT NULL,
  category text,
  image_url text,
  total_revenue decimal(10,2) DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_clicks integer DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  avg_commission decimal(10,2) DEFAULT 0,
  is_favorite boolean DEFAULT false,
  platform_links jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_user_platform ON sales(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_products_user_revenue ON products(user_id, total_revenue DESC);
CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id, platform);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Platform connections policies
CREATE POLICY "Users can view own platform connections"
  ON platform_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own platform connections"
  ON platform_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platform connections"
  ON platform_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own platform connections"
  ON platform_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Sales policies
CREATE POLICY "Users can view own sales"
  ON sales FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales"
  ON sales FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_platform_connections_updated_at
  BEFORE UPDATE ON platform_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
