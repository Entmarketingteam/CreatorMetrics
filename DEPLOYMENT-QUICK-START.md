# Quick Deployment Checklist

## ✅ What's Already Done

- ✅ All code pushed to GitHub: `https://github.com/Entmarketingteam/CreatorMetrics`
- ✅ Deployment configs created (`vercel.json`, `railway.json`, `Procfile`)
- ✅ Build scripts configured
- ✅ All LTK endpoints working

---

## 🚂 Railway (Recommended for Full-Stack)

### Quick Setup (5 minutes)

1. **Go to Railway:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Select:** `CreatorMetrics`
4. **Set Environment Variables:**
   ```
   NODE_ENV=production
   VITE_SUPABASE_URL=your_supabase_url (if using)
   VITE_SUPABASE_ANON_KEY=your_supabase_key (if using)
   ```
5. **Deploy** - Railway auto-detects config and deploys!

### Verify Deployment

- Visit Railway URL
- Check `/api/health` endpoint
- Test LTK endpoints (with authentication)

---

## ▲ Vercel (Frontend + API Routes)

### Quick Setup (5 minutes)

1. **Go to Vercel:** https://vercel.com
2. **Add New Project** → **Import** `CreatorMetrics`
3. **Configure:**
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Set Environment Variables:**
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```
5. **Deploy**

### Note for Vercel

Vercel works best for frontend. For full backend with Express, Railway is recommended.

If you need both:
- **Frontend on Vercel** (set `VITE_BACKEND_URL` to Railway URL)
- **Backend on Railway** (serves API + can also serve frontend)

---

## 🔍 Verify Everything Works

### 1. Health Check
```bash
curl https://your-domain.com/api/health
# Should return: {"status":"ok",...}
```

### 2. Frontend Loads
- Visit root URL
- Should see login/dashboard

### 3. LTK API (with auth)
- Authenticate via OAuth
- Test `/api/ltk/analytics/contributors`
- Should return contributor data

---

## 🐛 Common Issues

### Build Fails
- Check logs for TypeScript errors
- Ensure all dependencies in `package.json`
- Run `npm run build` locally first

### White Screen
- Check browser console for errors
- Verify `dist/index.html` exists
- Check environment variables are set

### API 404
- Verify backend is running
- Check `/api/health` endpoint
- Ensure routes are prefixed with `/api/`

---

## 📞 Need Help?

- Check deployment logs in Railway/Vercel dashboard
- See full guide: `DEPLOYMENT.md`
- Check LTK API docs: `docs/LTK-API-COMPLETE-REFERENCE.md`
