# Connect Vercel Frontend to Railway Backend

This guide shows how to connect your Vercel frontend deployment to your Railway backend.

---

## 🎯 Setup Overview

- **Frontend:** Vercel (serves static files, fast CDN)
- **Backend:** Railway (serves API endpoints + can also serve frontend)
- **Connection:** Vercel frontend calls Railway backend via `VITE_BACKEND_URL`

---

## ✅ Step 1: Get Your Railway URL

Your Railway backend URL is:
```
https://web-production-7199b.up.railway.app
```

**Verify it works:**
```bash
curl https://web-production-7199b.up.railway.app/api/health
# Should return: {"status":"ok",...}
```

---

## 🚀 Step 2: Set Environment Variable in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com
   - Open your `creatormetrics` project
   - Go to **Settings** → **Environment Variables**

2. **Add New Variable:**
   - Click **+ Add New**
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://web-production-7199b.up.railway.app`
   - **Environment:** Select all (Production, Preview, Development)
   - Click **Save**

3. **Redeploy:**
   - Go to **Deployments** tab
   - Click **⋯** (three dots) on latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger auto-deploy

### Method 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set the variable
vercel env add VITE_BACKEND_URL production
# When prompted, enter: https://web-production-7199b.up.railway.app

# Redeploy
vercel --prod
```

---

## ✅ Step 3: Verify It Works

After redeploying Vercel:

1. **Visit your Vercel URL:**
   - Your app should load normally

2. **Test API Connection:**
   - Open browser DevTools → Console
   - Try using LTK features
   - API calls should go to: `https://web-production-7199b.up.railway.app/api/ltk/...`
   - Should NOT see CORS errors

3. **Check Network Tab:**
   - Open DevTools → Network
   - Look for requests to `/api/ltk/...`
   - They should be proxied to Railway backend

---

## 🔧 How It Works

### Frontend (Vercel)
- Serves static files from `dist/`
- React app runs in browser
- API calls use `VITE_BACKEND_URL` environment variable

### Backend (Railway)
- Express server handles `/api/*` routes
- Proxies LTK API requests
- Can also serve frontend (but Vercel is faster for static files)

### Connection Flow
```
Browser → Vercel (static files)
       ↓
Browser → Railway (API calls via VITE_BACKEND_URL)
       ↓
Railway → LTK API Gateway
```

---

## 📋 Environment Variables Summary

### Vercel (Frontend)
```bash
VITE_BACKEND_URL=https://web-production-7199b.up.railway.app
VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Railway (Backend)
```bash
VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production (auto-set)
PORT=3001 (auto-set)
```

---

## 🐛 Troubleshooting

### Issue: API calls fail with CORS errors

**Solution:**
- Check that `VITE_BACKEND_URL` is set correctly in Vercel
- Verify Railway backend is running (check Railway dashboard)
- Check Railway logs for errors

### Issue: API calls go to wrong URL

**Solution:**
- Verify `VITE_BACKEND_URL` in Vercel environment variables
- Check browser console for the actual URL being used
- Rebuild Vercel deployment after changing env vars

### Issue: "Network Error" or "Failed to fetch"

**Solution:**
- Check Railway backend is online (Railway dashboard)
- Test Railway health endpoint: `curl https://web-production-7199b.up.railway.app/api/health`
- Check Railway logs for errors

---

## ✅ Alternative: Use Railway for Everything

If you prefer one domain for everything:

1. **Use Railway URL only:**
   - Don't set `VITE_BACKEND_URL` in Vercel
   - Railway serves both frontend and backend
   - One domain: `https://web-production-7199b.up.railway.app`

2. **Benefits:**
   - Simpler setup (one deployment)
   - No CORS issues
   - One domain to manage

3. **Trade-offs:**
   - Vercel CDN is faster for static files
   - Railway is fine for full-stack apps

---

## 📚 Related Documentation

- **Railway Setup:** See `RAILWAY-ENV-VARIABLES.md`
- **Vercel Update:** See `VERCEL-UPDATE.md`
- **Full Deployment:** See `DEPLOYMENT.md`

---

**Last Updated:** January 2025
