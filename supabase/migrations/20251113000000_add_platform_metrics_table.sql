/*
  # Platform Metrics Table

  ## Purpose
  Stores metrics data fetched from various platforms (like LTK) for historical tracking
  and analytics. Used by the auto-refresh system to store periodically fetched data.

  ## Table: platform_metrics
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `platform` (text: ltk, amazon, walmart, shopstyle, etc.)
  - `metric_type` (text: stats, earnings, clicks, sales, etc.)
  - `metric_value` (decimal) - primary numeric value (e.g., earnings amount)
  - `clicks` (integer, optional) - number of clicks
  - `sales` (integer, optional) - number of sales/conversions
  - `metadata` (jsonb) - flexible storage for platform-specific data
  - `recorded_at` (timestamptz) - when the metric was recorded
  - `created_at` (timestamptz) - when the record was created in our database
  - `updated_at` (timestamptz) - last update timestamp
*/

-- Create platform_metrics table
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value DECIMAL(10, 2) DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  sales INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_platform_metrics_user_id ON platform_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_platform ON platform_metrics(platform);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_recorded_at ON platform_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_user_platform ON platform_metrics(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_user_platform_recorded ON platform_metrics(user_id, platform, recorded_at DESC);

-- Enable Row Level Security
ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can view their own metrics
CREATE POLICY "Users can view their own platform metrics"
  ON platform_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own metrics
CREATE POLICY "Users can insert their own platform metrics"
  ON platform_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own metrics
CREATE POLICY "Users can update their own platform metrics"
  ON platform_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own metrics
CREATE POLICY "Users can delete their own platform metrics"
  ON platform_metrics
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the update function
CREATE TRIGGER platform_metrics_updated_at
  BEFORE UPDATE ON platform_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_metrics_updated_at();

-- Add comments for documentation
COMMENT ON TABLE platform_metrics IS 'Stores historical metrics data from various affiliate platforms';
COMMENT ON COLUMN platform_metrics.platform IS 'Platform identifier (ltk, amazon, walmart, etc.)';
COMMENT ON COLUMN platform_metrics.metric_type IS 'Type of metric (stats, earnings, clicks, sales, etc.)';
COMMENT ON COLUMN platform_metrics.metric_value IS 'Primary numeric value for the metric';
COMMENT ON COLUMN platform_metrics.metadata IS 'Platform-specific data stored as JSON (e.g., top products, breakdowns)';
COMMENT ON COLUMN platform_metrics.recorded_at IS 'When the metric was recorded/valid for';
