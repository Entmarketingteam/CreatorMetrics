/*
  # Add Sync Logs Table

  ## Overview
  Creates a sync_logs table to track platform synchronization history
  and updates to the platform_connections table.

  ## Changes

  ### 1. Update platform_connections
  - Add status enum constraint to include 'SYNCING'
  - Add sync statistics to metadata

  ### 2. New sync_logs table
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `platform` (text)
  - `status` (text: SUCCESS, FAILED, PARTIAL)
  - `records_synced` (integer)
  - `revenue_added` (decimal)
  - `duration` (integer, in seconds)
  - `error` (text, optional)
  - `synced_at` (timestamptz)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled
  - Users can only view their own sync logs
*/

-- Update platform_connections status constraint to include SYNCING
ALTER TABLE platform_connections DROP CONSTRAINT IF EXISTS platform_connections_status_check;
ALTER TABLE platform_connections ADD CONSTRAINT platform_connections_status_check 
  CHECK (status IN ('CONNECTED', 'DISCONNECTED', 'ERROR', 'SYNCING'));

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform text NOT NULL,
  status text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
  records_synced integer DEFAULT 0,
  revenue_added decimal(10,2) DEFAULT 0,
  duration integer DEFAULT 0,
  error text,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_date ON sync_logs(user_id, synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_platform ON sync_logs(platform);

-- Enable RLS
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Sync logs policies
CREATE POLICY "Users can view own sync logs"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON sync_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
