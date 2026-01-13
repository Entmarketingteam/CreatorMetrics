# OAuth Callback URL Fix

## The Problem

LTK's Auth0 application has a **whitelist of allowed callback URLs**. When you try to use OAuth, you get this error:

```
unauthorized_client: Callback URL mismatch. 
https://creatotmetrics.vercel.app/auth/ltk/callback is not in the list of allowed callback URLs
```

## The Solution

We've implemented a **backend-initiated OAuth flow** that uses your Railway backend URL for the callback instead of the Vercel frontend URL.

### How It Works Now

1. **User clicks "Connect LTK"** on `/platforms` page
2. **Frontend calls backend:** `/api/ltk/oauth/login`
3. **Backend redirects to Auth0** using Railway backend URL as callback
4. **User logs in** on LTK's Auth0 page
5. **Auth0 redirects back** to Railway backend: `/api/ltk/oauth/callback`
6. **Backend exchanges code** for tokens
7. **Backend redirects to frontend** with tokens in URL
8. **Frontend stores tokens** and redirects to `/platforms`

## Important: Callback URL Must Be Whitelisted

**The Railway backend callback URL must be whitelisted in LTK's Auth0 app settings.**

Your callback URL is:
```
https://web-production-7199b.up.railway.app/api/ltk/oauth/callback
```

### If You Get Callback URL Mismatch Error

**Option 1: Contact LTK Support (Recommended)**
- Request they whitelist your Railway callback URL
- Provide them: `https://web-production-7199b.up.railway.app/api/ltk/oauth/callback`
- They need to add it to their Auth0 app's allowed callback URLs

**Option 2: Use Manual Token Entry (Fallback)**
- Go to `/jwt-decoder` page
- Click "Manual Input"
- Paste tokens from browser DevTools (see `GET-LTK-TOKENS.md`)
- Click "Add Tokens"

**Option 3: Use Chrome Extension**
- Install the Chrome extension from `chrome-extension/` folder
- Visit creator.shopltk.com
- Extension auto-captures tokens
- Click "Send to CreatorMetrics"

## Environment Variables

Make sure these are set in Railway:

```bash
FRONTEND_URL=https://creatotmetrics.vercel.app
RAILWAY_PUBLIC_DOMAIN=web-production-7199b.up.railway.app
```

## Testing

1. **Test OAuth flow:**
   - Go to `/platforms`
   - Click "Connect" on LTK
   - Should redirect to Auth0
   - After login, should redirect back and store tokens

2. **If callback URL error:**
   - Use manual token entry (Option 2 above)
   - Or contact LTK to whitelist your callback URL

## Troubleshooting

### "Callback URL mismatch" error

**Solution:** The Railway backend URL needs to be whitelisted in LTK's Auth0 settings. Contact LTK support or use manual token entry.

### "Invalid state parameter" error

**Solution:** Cookies might be blocked. Check browser settings and ensure cookies are enabled for your domain.

### Tokens not stored

**Solution:** Check browser console for errors. Make sure localStorage is enabled.

---

**Last Updated:** January 2025
