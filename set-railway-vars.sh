#!/bin/bash
# Script to set Railway environment variables for CreatorMetrics
# Run this after: railway login && railway link

echo "🚀 Setting Railway Environment Variables..."
echo ""

# Supabase Configuration
railway variables set VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaGhlZ2xsaHdibWFud3ZxYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzQ4NzQsImV4cCI6MjA4MDgxMDg3NH0.FIpuWpH6vU0HhEvDPKLV_nDjFTqX4gXJ6RNh-nNDqOM

echo ""
echo "✅ Environment variables set!"
echo ""
echo "📋 Variables added:"
echo "  - VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co"
echo "  - VITE_SUPABASE_ANON_KEY=***set***"
echo ""
echo "🔄 Railway will use these on the next deployment"
echo "   Go to Railway dashboard and redeploy if needed"
