# Updating Existing Railway Deployment

## ✅ If App is Already on Railway

**You DON'T need to create a new project!** Just update the existing one.

### Option 1: Auto-Deploy (Easiest)

Railway automatically deploys when you push to GitHub:

1. **Check Railway Dashboard:**
   - Go to railway.app
   - Open your existing `CreatorMetrics` project
   - Railway should show "Deploying..." or "Building..." after the push

2. **Verify Deployment:**
   - Check the "Deployments" tab
   - Latest deployment should show the new commit
   - Check logs for any errors

3. **That's it!** Your app is updated with all the LTK endpoints

### Option 2: Manual Redeploy

If auto-deploy didn't trigger:

1. **Go to Railway Dashboard:**
   - Open your `CreatorMetrics` project
   - Click "Redeploy" or "Deploy Latest"

2. **Or via CLI:**
   ```bash
   railway up
   ```

### Verify Environment Variables

Make sure these are set in Railway (Settings → Variables):

```
NODE_ENV=production
VITE_SUPABASE_URL=your_supabase_url (if using)
VITE_SUPABASE_ANON_KEY=your_supabase_key (if using)
```

**Note:** `PORT` is auto-set by Railway, don't override it.

### Check What's Deployed

After deployment, verify:

1. **Health Check:**
   ```bash
   curl https://your-railway-app.railway.app/api/health
   ```

2. **Frontend Loads:**
   - Visit your Railway URL
   - Should see the app

3. **LTK API Works:**
   - Authenticate via OAuth
   - Test `/api/ltk/analytics/contributors`

---

## 🔍 Troubleshooting

### Build Fails

1. **Check Railway Logs:**
   - Go to Deployments → Latest → View Logs
   - Look for build errors

2. **Common Issues:**
   - Missing dependencies (check `package.json`)
   - TypeScript errors (run `npm run build` locally first)
   - Environment variables missing

### App Doesn't Update

1. **Check if Railway is connected to GitHub:**
   - Settings → Source → Should show GitHub repo
   - If not, connect it

2. **Force Redeploy:**
   - Click "Redeploy" in Railway dashboard
   - Or push an empty commit: `git commit --allow-empty -m "Trigger deploy" && git push`

### Port Issues

- Railway auto-sets `PORT` - don't override
- Server code uses `process.env.PORT || 3001` (correct)

---

## ✅ Summary

**If already on Railway:**
- ✅ Just push to GitHub (already done!)
- ✅ Railway auto-deploys
- ✅ Check Railway dashboard to verify
- ✅ No new project needed

**If NOT on Railway yet:**
- Create new project
- Connect to GitHub repo
- Deploy

Your code is already pushed, so Railway should be deploying now! 🚀
