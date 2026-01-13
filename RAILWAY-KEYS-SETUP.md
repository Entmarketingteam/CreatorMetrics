# Railway Environment Variables - Ready to Set

Your Supabase keys are ready to be added to Railway. Here are your values:

## ✅ Your Supabase Configuration

```bash
VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaGhlZ2xsaHdibWFud3ZxYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzQ4NzQsImV4cCI6MjA4MDgxMDg3NH0.FIpuWpH6vU0HhEvDPKLV_nDjFTqX4gXJ6RNh-nNDqOM
```

---

## 🚀 Method 1: Railway Dashboard (Easiest)

1. **Go to Railway Dashboard:**
   - https://railway.app
   - Open your `CreatorMetrics` project
   - Click on your service (e.g., "web")

2. **Go to Variables Tab:**
   - Click **Variables** in the sidebar
   - Click **+ New Variable**

3. **Add First Variable:**
   - **Name:** `VITE_SUPABASE_URL`
   - **Value:** `https://abhhegllhwbmanwvqanc.supabase.co`
   - Click **Add**

4. **Add Second Variable:**
   - **Name:** `VITE_SUPABASE_ANON_KEY`
   - **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaGhlZ2xsaHdibWFud3ZxYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzQ4NzQsImV4cCI6MjA4MDgxMDg3NH0.FIpuWpH6vU0HhEvDPKLV_nDjFTqX4gXJ6RNh-nNDqOM`
   - Click **Add**

5. **Redeploy:**
   - Railway will automatically use these variables on the next deployment
   - Or click **Redeploy** to trigger immediately

---

## 🖥️ Method 2: Railway CLI (Faster)

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login and link to your project
railway login
railway link

# Set the variables
railway variables set VITE_SUPABASE_URL=https://abhhegllhwbmanwvqanc.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiaGhlZ2xsaHdibWFud3ZxYW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMzQ4NzQsImV4cCI6MjA4MDgxMDg3NH0.FIpuWpH6vU0HhEvDPKLV_nDjFTqX4gXJ6RNh-nNDqOM
```

Or use the provided script:

```bash
./set-railway-vars.sh
```

---

## ✅ Verify Variables Are Set

After setting variables:

1. **Check Railway Dashboard:**
   - Variables tab should show both variables
   - Values should be visible (not masked)

2. **Redeploy:**
   - Click **Redeploy** in Railway
   - Or push a new commit to trigger auto-deploy

3. **Check Logs:**
   - After deployment, check logs
   - Should see: ✅ No Supabase warnings
   - Server should start successfully

4. **Test the App:**
   - Visit your Railway URL
   - Check browser console (should not show Supabase errors)
   - Test Supabase features

---

## 🔐 Security Notes

- ✅ These keys are safe to use in Railway (they're public/anonymous keys)
- ✅ The `anon` key is designed for client-side use
- ✅ Never commit these to Git (already in `.gitignore`)
- ✅ Railway encrypts variables at rest

---

## 📚 Additional Keys (For Reference)

You also have these keys (not needed for Railway, but good to know):

- **Secret Key:** `sb_secret_xZwdEin0Dg0K1As-u6DbZg__jigoPH4` (server-side only, never expose)
- **Publishable Key:** `sb_publishable_fh4xKbfRg6vjpsTC69BpoQ_LbbTNsv2` (new format, not used by current code)

**Note:** The current code uses the legacy `anon` key format, which is what we're setting above.

---

**Last Updated:** January 2025
