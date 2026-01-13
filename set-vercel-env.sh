#!/bin/bash
# Script to set Vercel environment variable for Railway backend
# Run this after: vercel login && vercel link

echo "🚀 Setting Vercel Environment Variable..."
echo ""

# Set VITE_BACKEND_URL to Railway backend
vercel env add VITE_BACKEND_URL production <<EOF
https://web-production-7199b.up.railway.app
EOF

vercel env add VITE_BACKEND_URL preview <<EOF
https://web-production-7199b.up.railway.app
EOF

vercel env add VITE_BACKEND_URL development <<EOF
https://web-production-7199b.up.railway.app
EOF

echo ""
echo "✅ Environment variable set for all environments!"
echo ""
echo "📋 Variable added:"
echo "  - VITE_BACKEND_URL=https://web-production-7199b.up.railway.app"
echo ""
echo "🔄 Now redeploy:"
echo "   vercel --prod"
echo ""
echo "Or redeploy from Vercel dashboard"
