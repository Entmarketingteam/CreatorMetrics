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

### Option 1: Full-Stack (Recommended)

Vercel can deploy both frontend and backend together.

1. **Connect Repository:**
   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import `CreatorMetrics` repository

2. **Configure:**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables:**
   ```
   NODE_ENV=production
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_BACKEND_URL= (leave empty for same-origin)
   ```

4. **Deploy:**
   - Vercel will deploy automatically
   - API routes at `/api/*` will be handled by `server/index.ts`
   - Frontend routes will serve from `dist/`

### Option 2: Separate Frontend/Backend

If you prefer separate services:

**Frontend (Vercel):**
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Environment: Set `VITE_BACKEND_URL` to your backend URL

**Backend (Railway or Vercel):**
- Deploy `server/` directory separately
- Set `PORT` environment variable
- Frontend will call backend via `VITE_BACKEND_URL`

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
