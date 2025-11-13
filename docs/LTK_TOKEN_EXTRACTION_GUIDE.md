# LTK Token Extraction Guide

This guide shows creators how to extract their authentication credentials from LikeToKnow.it (LTK) using Chrome DevTools.

## Prerequisites
- Chrome browser
- Active LTK creator account
- Access to your LTK creator dashboard

## Step-by-Step Token Extraction

### Method 1: Using Network Tab (Recommended)

1. **Open Chrome DevTools**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)
   - Or right-click → Inspect

2. **Go to Network Tab**
   - Click the "Network" tab in DevTools
   - Check "Preserve log" checkbox (important!)
   - Click the filter icon and select "Fetch/XHR"

3. **Clear and Prepare**
   - Click the clear button (🚫) to clear existing requests
   - Keep DevTools open

4. **Log Into LTK**
   - Go to https://www.liketoknow.it or your LTK creator portal
   - Log in with your credentials
   - Navigate to your dashboard/stats page

5. **Find Authentication Requests**
   - Look for requests to endpoints like:
     - `/login`
     - `/auth`
     - `/token`
     - `/session`
     - `/api/v1/...`
   - Click on each request to inspect it

6. **Extract Token from Headers**
   - Click on a request
   - Go to "Headers" tab
   - Look under "Request Headers" for:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     Cookie: session=abc123...; auth_token=xyz789...
     X-API-Key: ...
     X-Auth-Token: ...
     ```
   - Copy the entire token value

7. **Extract Token from Response**
   - Go to "Response" or "Preview" tab
   - Look for JSON containing:
     ```json
     {
       "access_token": "...",
       "token": "...",
       "auth_token": "...",
       "session_token": "..."
     }
     ```

### Method 2: Using Application Tab

1. **Open DevTools Application Tab**
   - Press `F12` → Click "Application" tab

2. **Check Cookies**
   - Expand "Cookies" in left sidebar
   - Click on LTK domain (e.g., `.liketoknow.it`)
   - Look for cookies named:
     - `session`
     - `auth_token`
     - `access_token`
     - `ltk_token`
   - Copy the "Value" column

3. **Check Local Storage**
   - Expand "Local Storage" in left sidebar
   - Click on LTK domain
   - Look for keys like:
     - `token`
     - `authToken`
     - `accessToken`
     - `user`
     - `credentials`
   - Copy the value

4. **Check Session Storage**
   - Same process as Local Storage
   - Often contains temporary session tokens

### Method 3: Using Console (Quick Extract)

1. **Open Console Tab**
   - Press `F12` → Click "Console" tab

2. **Run Extraction Script**
   ```javascript
   // Check all storage mechanisms
   console.log('=== COOKIES ===');
   console.log(document.cookie);

   console.log('\n=== LOCAL STORAGE ===');
   Object.keys(localStorage).forEach(key => {
     console.log(key + ':', localStorage.getItem(key));
   });

   console.log('\n=== SESSION STORAGE ===');
   Object.keys(sessionStorage).forEach(key => {
     console.log(key + ':', sessionStorage.getItem(key));
   });

   // Common token locations
   console.log('\n=== COMMON TOKEN LOCATIONS ===');
   [
     'token', 'auth_token', 'authToken', 'access_token',
     'accessToken', 'ltk_token', 'session', 'jwt'
   ].forEach(key => {
     const local = localStorage.getItem(key);
     const session = sessionStorage.getItem(key);
     if (local) console.log('localStorage.' + key + ':', local);
     if (session) console.log('sessionStorage.' + key + ':', session);
   });
   ```

3. **Copy Output**
   - Right-click on the output → "Copy object"
   - Or manually copy the token values

## What to Look For

### JWT Tokens
Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

### Session Cookies
Look like: `session=s%3Aabcdefghijklmnopqrstuvwxyz.1234567890`

### API Keys
Look like: `sk_live_abc123xyz789` or random strings

## Important Security Notes

⚠️ **NEVER share your tokens publicly**
- Tokens give full access to your account
- Treat them like passwords
- Don't post them on social media or public forums

⚠️ **Token Expiration**
- Most tokens expire after a period (hours/days)
- You'll need to re-extract when they expire
- Our app will notify you when refresh is needed

⚠️ **Use at Your Own Risk**
- This is reverse-engineering LTK's API
- LTK could change their API at any time
- Not officially supported by LTK

## Entering Token Into CreatorMetrics

Once you have your token:

1. Go to **Settings** → **Platform Connections**
2. Click **"Connect LTK"**
3. Paste your token into the input field
4. Select the token type (Bearer Token, Cookie, etc.)
5. Click **"Test Connection"** to verify
6. Click **"Save"** to enable auto-refresh

The app will:
- Test the token immediately
- Start fetching your LTK data
- Auto-refresh every 15 minutes
- Notify you if the token expires

## Troubleshooting

### "Invalid Token" Error
- Token may have expired → Extract a fresh one
- Wrong token type → Try different extraction method
- Token incomplete → Make sure you copied the entire value

### "No Token Found"
- Try Method 2 (Application tab) instead of Method 1
- Check if you're fully logged in to LTK
- Some tokens appear only after navigating to certain pages

### "Connection Failed"
- LTK may have changed their API
- Check Network tab for the actual API endpoints being used
- Contact support with the endpoint URLs you see

## Advanced: Finding API Endpoints

1. **Network Tab → XHR Filter**
2. **Navigate through LTK dashboard**
3. **Note endpoint patterns:**
   - Stats: `/api/v1/stats`, `/api/stats/summary`
   - Earnings: `/api/v1/earnings`, `/api/revenue`
   - Products: `/api/v1/products`, `/api/products/top`
4. **Right-click request → Copy → Copy as fetch**
5. **Send to support to add new endpoint**

## Need Help?

If you're having trouble:
1. Take screenshots of your DevTools (hide sensitive data)
2. Note any error messages
3. Contact support through the app
