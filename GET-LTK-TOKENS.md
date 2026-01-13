# How to Get LTK Tokens Easily

Now that your app is live, here are the easiest ways to get your LTK tokens:

---

## 🚀 Method 1: Use the Built-in Token Manager (Easiest)

Your app has a built-in token manager page:

1. **Visit your live app:**
   - Vercel: `https://creatotmetrics.vercel.app`
   - Railway: `https://web-production-7199b.up.railway.app`

2. **Go to JWT Decoder page:**
   - Navigate to `/jwt-decoder` or look for "JWT Decoder" in the menu
   - This page lets you paste tokens and manage them

3. **Paste your tokens:**
   - If you have tokens from a previous session, paste them here
   - Click "Save Tokens"
   - Tokens are stored in browser localStorage

---

## 🔑 Method 2: Get Tokens from Browser (If Already Logged In)

If you're already logged into LTK Creator Portal:

1. **Open LTK Creator Portal:**
   - Go to https://creator.shopltk.com
   - Log in if needed

2. **Open Browser DevTools:**
   - Press `F12` or `Cmd+Option+I` (Mac)
   - Go to **Application** tab (Chrome) or **Storage** tab (Firefox)

3. **Find Tokens:**
   - Look for cookies or localStorage
   - Search for: `sigil_access_token`, `sigil_id_token`, or `auth._id_token`
   - Copy the token values

4. **Use in Your App:**
   - Go to `/jwt-decoder` page
   - Paste the tokens
   - Click "Save Tokens"

---

## 🌐 Method 3: Get Tokens from Network Tab (Most Reliable)

This method captures tokens from actual API calls:

1. **Open LTK Creator Portal:**
   - Go to https://creator.shopltk.com
   - Log in

2. **Open Browser DevTools:**
   - Press `F12` or `Cmd+Option+I`
   - Go to **Network** tab

3. **Filter for API calls:**
   - Filter by: `api-gateway.rewardstyle.com` or `creator-api-gateway`
   - Look for any API request

4. **Copy Headers:**
   - Click on any API request
   - Go to **Headers** tab
   - Find:
     - `Authorization: Bearer {access_token}` - Copy the token after "Bearer "
     - `X-id-token: {id_token}` - Copy the full value

5. **Use in Your App:**
   - Go to `/jwt-decoder` page
   - Paste both tokens
   - Click "Save Tokens"

---

## 📋 Method 4: Use curl Command (If You Have One)

If you have a working curl command (like the one you shared earlier):

1. **Extract tokens from curl:**
   ```bash
   # Your curl command has:
   -H 'Authorization: Bearer {access_token}'
   -H 'X-id-token: {id_token}'
   ```

2. **Copy both tokens:**
   - Access Token: The long JWT after `Bearer `
   - ID Token: The long JWT after `X-id-token: `

3. **Use in Your App:**
   - Go to `/jwt-decoder` page
   - Paste both tokens
   - Click "Save Tokens"

---

## 🧪 Method 5: Use LTK Test Page

Your app has a test page that accepts tokens:

1. **Visit:** `/ltk-test` or look for "LTK Test" in the menu

2. **Enter Tokens:**
   - Paste your Access Token
   - Paste your ID Token
   - Click "Save Tokens"

3. **Test Endpoints:**
   - Click "Test All Endpoints"
   - Verify everything works

---

## 🔄 Method 6: Token Refresh (If You Have Refresh Token)

If you have a refresh token stored:

1. **Go to JWT Decoder page:**
   - `/jwt-decoder`

2. **Click "Refresh Token":**
   - If you have a refresh token stored, this will get new tokens
   - Automatically saves new tokens

---

## ✅ Quick Steps Summary

**Fastest way (if you have tokens from curl/previous session):**

1. Visit your live app: `https://creatotmetrics.vercel.app` or Railway URL
2. Go to `/jwt-decoder`
3. Paste your Access Token and ID Token
4. Click "Save Tokens"
5. Done! 🎉

**If you need to get fresh tokens:**

1. Log into https://creator.shopltk.com
2. Open DevTools → Network tab
3. Make any API call (navigate around the dashboard)
4. Copy `Authorization` and `X-id-token` headers from any request
5. Paste into `/jwt-decoder` page
6. Save tokens

---

## 🔐 Token Storage

- **Where:** Browser localStorage (client-side)
- **Key:** `ltk_tokens`
- **Format:** JSON with `access_token`, `id_token`, `refresh_token`, `expires_at`

**To view stored tokens:**
- Browser DevTools → Application → Local Storage
- Look for `ltk_tokens` key

**To clear tokens:**
- Go to `/jwt-decoder` page
- Click "Clear All Tokens"
- Or use browser DevTools to delete `ltk_tokens` from localStorage

---

## 🐛 Troubleshooting

### "Tokens expired"
- Use refresh token to get new ones
- Or get fresh tokens from LTK Creator Portal

### "Missing id_token"
- Make sure you copy BOTH tokens (access_token AND id_token)
- The ID token is required for the new API gateway

### "CORS errors"
- Make sure `VITE_BACKEND_URL` is set in Vercel
- API calls should go through Railway backend

---

## 📚 Related Pages in Your App

- **`/jwt-decoder`** - View, edit, and manage tokens
- **`/ltk-test`** - Test all API endpoints with your tokens
- **`/platforms`** - Connect/disconnect LTK platform

---

**Last Updated:** January 2025
