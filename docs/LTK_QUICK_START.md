# LTK Quick Start Guide

Get your LTK stats into CreatorMetrics in 5 minutes.

## Prerequisites

- Active LTK creator account
- Chrome browser
- Access to your LTK creator dashboard

## Step 1: Extract Your LTK Token (2 minutes)

### Method A: Network Tab (Recommended)

1. Open https://www.liketoknow.it and log in to your creator account

2. Open Chrome DevTools:
   - Press `F12`, or
   - Right-click → Inspect, or
   - `Ctrl+Shift+I` (Windows/Linux)
   - `Cmd+Option+I` (Mac)

3. Click the **Network** tab

4. Check the "**Preserve log**" checkbox (important!)

5. Filter by "**Fetch/XHR**"

6. Navigate around your LTK dashboard (click stats, earnings, etc.)

7. Look for API requests in the Network tab

8. Click on any request and look for **Headers** → **Request Headers**

9. Find the `Authorization` header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

10. Copy **everything after "Bearer "** (the long string starting with `eyJ`)

### Method B: Console (Quick)

1. Log into LTK and open DevTools (F12)

2. Go to **Console** tab

3. Paste this code and press Enter:
   ```javascript
   Object.keys(localStorage).forEach(key => {
     const value = localStorage.getItem(key);
     if (value && value.startsWith('eyJ')) {
       console.log('FOUND TOKEN:', key, '=', value);
     }
   });
   ```

4. Look for a token starting with `eyJ` - that's likely your Bearer token

5. Copy the value

### Method C: Application Tab

1. Log into LTK and open DevTools (F12)

2. Go to **Application** tab

3. Expand **Local Storage** → Click your LTK domain

4. Look for keys like:
   - `token`
   - `auth_token`
   - `access_token`
   - `ltk_token`

5. Copy the value (usually starts with `eyJ`)

## Step 2: Connect to CreatorMetrics (1 minute)

1. In CreatorMetrics, go to **Settings** page

2. Find the **LTK Connection** section

3. Select **Token Type**: "Bearer Token" (most common)

4. Paste your token into the **Token Value** field

5. Click **Test Connection** to verify it works
   - ✅ Success? Great!
   - ❌ Failed? Try re-copying the token or use a different extraction method

6. Click **Save & Connect**

7. Your LTK account is now connected!

## Step 3: Configure Auto-Refresh (1 minute)

1. In the **Auto-Refresh** section, set your preferred interval:
   - **15 minutes** - Good balance (recommended)
   - **30 minutes** - Conservative, less API calls
   - **5 minutes** - More frequent updates (not recommended)

2. Click **Update** to save

3. Auto-refresh will start immediately!

## Step 4: View Your Stats (1 minute)

1. Go to the **Dashboard** page

2. You should see the **LTK Stats** widget displaying:
   - Total clicks
   - Total sales
   - Total earnings
   - Conversion rate
   - Top performing products

3. The widget updates automatically based on your refresh interval

4. Click the refresh icon to manually update anytime

## Troubleshooting

### "Invalid Token" Error

**Problem:** Token is expired or incorrect

**Solution:**
1. Go back to LTK and extract a fresh token
2. Make sure you copied the **entire** token value
3. For Bearer tokens, make sure it starts with `eyJ`
4. Try a different extraction method

### "Connection Failed" Error

**Problem:** Can't reach LTK API

**Solutions:**
1. Make sure you're logged into LTK in your browser
2. Try extracting the token again
3. Check your internet connection
4. LTK might have changed their API (contact support)

### No Data Showing

**Problem:** Connected but no stats visible

**Solutions:**
1. Click the manual refresh button in Settings or Dashboard widget
2. Check if auto-refresh is running (look for green "Active" status)
3. Check for error messages in Settings
4. Wait a few minutes for the first refresh to complete

### Token Keeps Expiring

**Problem:** Need to reconnect frequently

**Solutions:**
1. LTK tokens may have short expiration times
2. Extract a new token each time you get an error
3. This is normal for some platforms - it's a security feature

## Tips for Best Results

### ✅ DO:
- Use 15-30 minute refresh intervals
- Re-authenticate when you see "Token Expired" errors
- Keep your LTK account logged in while using CreatorMetrics
- Check the Dashboard widget regularly for updates

### ❌ DON'T:
- Set refresh interval below 5 minutes (may trigger rate limits)
- Share your token with anyone
- Post your token in screenshots or public forums
- Use tokens from accounts you don't own

## What Happens Next?

### Immediate:
1. ✅ Your LTK data starts syncing automatically
2. 📊 Dashboard widget shows real-time stats
3. 💾 Data is saved to your database for history

### Ongoing:
1. 🔄 Auto-refresh runs every X minutes (your setting)
2. 🔔 You'll get notifications if there are errors
3. 📈 Historical data builds up for trend analysis

### If Token Expires:
1. ⚠️ You'll see an error notification
2. 🛑 Auto-refresh stops automatically
3. 🔑 Simply reconnect with a fresh token to resume

## Next Steps

- **View Historical Data**: Check the Earnings and Products pages (coming soon)
- **Set Up More Platforms**: Connect Amazon, Walmart, etc. (coming soon)
- **Customize Dashboard**: Rearrange widgets to your preference (coming soon)

## Need More Help?

- **Full Documentation**: See `docs/LTK_INTEGRATION.md`
- **Detailed Token Guide**: See `docs/LTK_TOKEN_EXTRACTION_GUIDE.md`
- **Support**: Contact through the app or check console for errors

## Video Tutorial (Coming Soon)

We're working on a video walkthrough showing:
- Live token extraction from LTK
- Connecting to CreatorMetrics
- Configuring auto-refresh
- Viewing your stats

---

**Congrats! You're now syncing your LTK data automatically! 🎉**

The system will keep your stats up-to-date in the background. Just check your Dashboard to see the latest numbers!
