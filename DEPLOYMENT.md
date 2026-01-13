# Deployment Guide - CreatorMetrics

This guide covers deploying CreatorMetrics to Railway and Vercel.

---

## 🚂 Railway Deployment

### Setup

1. **Connect Repository:**
   - Go to [Railway](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `CreatorMetrics` repository

2. **Configure Build:**
   - Railway will auto-detect from `railway.json`
   - Build command: `npm run build`
   - Start command: `npm run start`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   PORT=3001 (auto-set by Railway, but can override)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_BACKEND_URL= (leave empty for same-origin)
   ```

4. **Deploy:**
   - Railway will automatically deploy on push to `main` branch
   - Check logs for any errors
   - Visit the generated Railway URL

### Railway-Specific Notes

- ✅ Railway auto-sets `PORT` environment variable
- ✅ Railway runs `npm run build` automatically (via railway.json)
- ✅ Backend serves both API and static frontend files
- ✅ Health check available at `/api/health`

---

## ▲ Vercel Deployment

### Current Setup (Frontend Only - What Was Working Before)

Your Vercel deployment was working for the frontend. The `vercel.json` is configured to:
- Build the Vite frontend
- Serve static files from `dist/`
- Handle SPA routing

**To Update Your Existing Vercel Deployment:**

1. **Vercel will auto-deploy** when you push to GitHub (already connected)
2. **No changes needed** - the frontend will work as before
3. **For LTK API endpoints**, you have two options:

### Option 1: Use Railway for Backend (Recommended)

Since Vercel works great for frontend, deploy the backend separately:

1. **Deploy Backend to Railway** (see Railway section above)
2. **Set Environment Variable in Vercel:**
   ```
   VITE_BACKEND_URL=https://your-railway-app.railway.app
   ```
3. **Frontend will call backend** via the Railway URL

### Option 2: Keep Everything on Vercel

If you want everything on Vercel, you'll need to:
- Use Vercel Serverless Functions for API routes
- Adapt Express routes to serverless functions
- More complex setup

**Recommendation:** Use Railway for backend (handles Express perfectly) + Vercel for frontend (what you already have working).

---

## 🔧 Environment Variables

### Required for Production

```bash
# Supabase (if using)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Backend URL (optional - leave empty for same-origin)
VITE_BACKEND_URL=

# Node Environment
NODE_ENV=production

# Port (auto-set by platforms, but can override)
PORT=3001
```

### Optional

```bash
# LTK OAuth (if using backend OAuth flow)
LTK_CLIENT_ID=iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT
LTK_REDIRECT_URI=https://your-domain.com/auth/ltk/callback
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Frontend loads at root URL
- [ ] API health check works: `https://your-domain.com/api/health`
- [ ] LTK proxy works: Test `/api/ltk/analytics/contributors` (with auth)
- [ ] Static assets load (CSS, JS files)
- [ ] React Router works (navigate between pages)
- [ ] Environment variables are set correctly

---

## 🐛 Troubleshooting

### Issue: White Screen / Build Not Found

**Solution:**
- Ensure `npm run build` runs successfully
- Check that `dist/` folder exists after build
- Verify `NODE_ENV=production` is set

### Issue: API Routes Return 404

**Solution:**
- Check that `server/index.ts` is being served
- Verify routes are prefixed with `/api/`
- Check deployment logs for errors

### Issue: CORS Errors

**Solution:**
- Ensure `VITE_BACKEND_URL` is set correctly
- If same-origin, leave `VITE_BACKEND_URL` empty
- Check backend CORS configuration

### Issue: Port Already in Use

**Solution:**
- Railway/Vercel auto-set `PORT` - don't hardcode
- Use `process.env.PORT || 3001` in server code

---

## 📝 Deployment Commands

### Local Production Test

```bash
# Build frontend
npm run build

# Start production server
npm run start

# Or combined
npm run start:prod
```

### Check Build Output

```bash
# Verify dist folder exists
ls -la dist/

# Check for index.html
cat dist/index.html
```

---

## 🔄 Auto-Deploy

Both Railway and Vercel support auto-deploy:

- **Railway:** Deploys on push to `main` branch
- **Vercel:** Deploys on push to connected branch

To trigger manual deploy:
- **Railway:** Click "Redeploy" in dashboard
- **Vercel:** Push a new commit or click "Redeploy"

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [LTK API Reference](./docs/LTK-API-COMPLETE-REFERENCE.md)
