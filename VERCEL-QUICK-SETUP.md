# Quick Vercel Setup - Connect to Railway

## ✅ What You Need to Do

Since I can't directly access your Vercel dashboard, here's the fastest way:

### Option 1: Vercel Dashboard (2 minutes)

1. **In the Vercel dashboard you have open:**
   - You're already in Settings → Environment Variables
   - Click **+ Add New** button
   - **Name:** `VITE_BACKEND_URL`
   - **Value:** `https://web-production-7199b.up.railway.app`
   - **Environment:** Select all three (Production, Preview, Development)
   - Click **Save**

2. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or just click the "Redeploy" button in the modal you have open

### Option 2: Vercel CLI (If you have it)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Set the variable (will prompt for value)
vercel env add VITE_BACKEND_URL production
# When prompted, enter: https://web-production-7199b.up.railway.app

# Repeat for other environments
vercel env add VITE_BACKEND_URL preview
vercel env add VITE_BACKEND_URL development

# Redeploy
vercel --prod
```

Or use the script:
```bash
./set-vercel-env.sh
```

---

## 🎯 What This Does

- Sets `VITE_BACKEND_URL` to point to your Railway backend
- Your Vercel frontend will call Railway for all API requests
- No code changes needed - it's just an environment variable

---

## ✅ After Setup

1. **Redeploy Vercel** (you have the modal open - just click "Redeploy")
2. **Test it:**
   - Visit your Vercel URL
   - Open browser console
   - Try using LTK features
   - Should work! 🎉

---

## 🐛 If Something Goes Wrong

If the redeploy has issues:

1. **Check Vercel logs** in the dashboard
2. **Verify the variable is set:**
   - Settings → Environment Variables
   - Should see `VITE_BACKEND_URL` with Railway URL
3. **Check Railway is running:**
   - Go to Railway dashboard
   - Verify service is "Online"
   - Test: `curl https://web-production-7199b.up.railway.app/api/health`

---

**That's it!** Just add the environment variable and redeploy. The modal you have open is perfect - just add the variable first, then click Redeploy.
