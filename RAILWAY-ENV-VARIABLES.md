# Railway Environment Variables Setup

This guide lists all environment variables needed for Railway deployment.

---

## ✅ Required Environment Variables

### 1. Supabase Configuration (Required if using database features)

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Where to find:**
- Go to your Supabase project dashboard
- Settings → API
- Copy "Project URL" → `VITE_SUPABASE_URL`
- Copy "anon public" key → `VITE_SUPABASE_ANON_KEY`

**Note:** These are prefixed with `VITE_` because they're used in the frontend (Vite) build.

---

### 2. Database Connection (Required if using Instagram posts features)

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Where to find:**
- If using Supabase: Settings → Database → Connection string
- If using Railway PostgreSQL: Railway will auto-generate this
- If using external PostgreSQL: Your database provider's connection string

**Note:** Railway can auto-provision a PostgreSQL database and set this variable automatically.

---

## 🔧 Auto-Set by Railway (No Action Needed)

These are automatically set by Railway - you don't need to configure them:

```bash
NODE_ENV=production          # Railway sets this automatically
PORT=3001                    # Railway sets this automatically (can override)
```

---

## 📝 Optional Environment Variables

### Backend URL (Optional - usually not needed)

```bash
VITE_BACKEND_URL=
```

**When to set:**
- Leave empty for same-origin (recommended)
- Only set if frontend and backend are on different domains
- Example: `VITE_BACKEND_URL=https://your-railway-app.railway.app`

---

## 🚀 How to Set Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to your Railway project: https://railway.app
2. Click on your service (e.g., "web")
3. Go to **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://your-project-id.supabase.co`
   - Click **Add**
6. Repeat for all required variables

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Set variables
railway variables set VITE_SUPABASE_URL=https://your-project-id.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=your_key_here
railway variables set DATABASE_URL=postgresql://...
```

---

## ✅ Quick Setup Checklist

Copy and paste these into Railway Variables:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Database (Required if using Instagram posts)
DATABASE_URL=postgresql://user:password@host:port/database

# Optional
VITE_BACKEND_URL=
```

---

## 🔍 Verify Variables Are Set

After setting variables:

1. **Redeploy** your service (Railway will use new variables)
2. **Check logs** - you should see:
   - ✅ No Supabase warnings (if variables are set)
   - ✅ Server starting successfully
   - ✅ Database connection working (if DATABASE_URL is set)

3. **Test the app:**
   - Visit your Railway URL
   - Check browser console for errors
   - Test Supabase features (if using)

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution:**
- Check that variables are set in Railway dashboard
- Ensure variable names are exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Redeploy after adding variables

### Issue: "Database connection failed"

**Solution:**
- Verify `DATABASE_URL` is set correctly
- Check database is accessible from Railway
- For Supabase: Ensure connection pooling is enabled

### Issue: "Port already in use"

**Solution:**
- Railway sets `PORT` automatically - don't override unless needed
- Use `process.env.PORT || 3001` in code (already done)

---

## 📚 Related Documentation

- **Full Deployment Guide:** See `DEPLOYMENT.md`
- **Railway Update Guide:** See `RAILWAY-UPDATE.md`
- **LTK API Setup:** See `docs/LTK-API-COMPLETE-REFERENCE.md`

---

## 🔐 Security Notes

- ✅ Never commit `.env` files to Git
- ✅ Railway variables are encrypted at rest
- ✅ Variables are only accessible to your Railway project
- ✅ Use Railway's variable management (not hardcoded values)

---

**Last Updated:** January 2025
