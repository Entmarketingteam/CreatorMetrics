# CreatorMetrics LTK Token Manager - Chrome Extension

Automatically captures and manages LTK tokens from creator.shopltk.com, making it easy to sync tokens with your CreatorMetrics app.

---

## ✨ Features

- **🔍 Auto-Capture:** Automatically captures tokens from LTK Creator Portal
- **🔄 Auto-Refresh:** Monitors token expiration and refreshes automatically
- **📋 One-Click Copy:** Copy tokens as JSON with one click
- **🚀 Direct Sync:** Send tokens directly to CreatorMetrics app
- **⏰ Expiration Tracking:** Shows when tokens expire
- **🔐 Secure Storage:** Tokens stored locally in browser

---

## 🚀 Installation

### Option 1: Load Unpacked (Development)

1. **Download/Clone this extension:**
   ```bash
   cd chrome-extension
   ```

2. **Open Chrome Extensions:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load Extension:**
   - Click "Load unpacked"
   - Select the `chrome-extension` folder
   - Extension is now installed!

### Option 2: Pack Extension (For Distribution)

1. **Create Icons:**
   - Create `icons/icon16.png`, `icon48.png`, `icon128.png`
   - Or use placeholder icons

2. **Pack Extension:**
   - Go to `chrome://extensions/`
   - Click "Pack extension"
   - Select the `chrome-extension` folder
   - Creates `.crx` file for distribution

---

## 📖 How to Use

### Step 1: Install Extension

Follow installation steps above.

### Step 2: Visit LTK Creator Portal

1. Go to https://creator.shopltk.com
2. Log in with your credentials
3. Extension automatically captures tokens from cookies and network requests

### Step 3: Use Tokens

**Option A: Copy Tokens**
1. Click extension icon in Chrome toolbar
2. Click "📋 Copy Tokens JSON"
3. Paste into CreatorMetrics `/jwt-decoder` page

**Option B: Direct Sync**
1. Click extension icon
2. Click "🚀 Send to CreatorMetrics"
3. Extension opens CreatorMetrics app and injects tokens automatically

**Option C: Manual Refresh**
1. If tokens expire, click "🔄 Refresh Tokens"
2. Extension uses refresh token to get new tokens

---

## 🔧 How It Works

### Token Capture Methods

1. **From Cookies:**
   - Monitors `creator.shopltk.com` cookies
   - Extracts `auth._token.auth0` and `auth._id_token.auth0`
   - Runs via content script

2. **From Network Requests:**
   - Intercepts API requests to `api-gateway.rewardstyle.com`
   - Captures `Authorization` and `X-id-token` headers
   - Runs via background service worker

### Token Storage

- Stored in `chrome.storage.local`
- Key: `ltk_tokens`
- Includes: `access_token`, `id_token`, `refresh_token`, `expires_at`, `captured_at`

### Auto-Refresh

- Checks token expiration every minute
- Auto-refreshes if expires in < 5 minutes
- Uses refresh token to get new tokens

---

## 🛠️ Development

### File Structure

```
chrome-extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (token capture, refresh)
├── content.js          # Content script (runs on creator.shopltk.com)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── icons/              # Extension icons
└── README.md           # This file
```

### Testing

1. Load extension in developer mode
2. Visit https://creator.shopltk.com
3. Open extension popup
4. Verify tokens are captured
5. Test copy/send functionality

### Debugging

- **Background Script:** Go to `chrome://extensions/` → Click "service worker" link
- **Content Script:** Use DevTools on creator.shopltk.com
- **Popup:** Right-click extension icon → "Inspect popup"

---

## 🔐 Security & Privacy

- ✅ Tokens stored locally (never sent to external servers)
- ✅ Only accesses creator.shopltk.com and your CreatorMetrics app
- ✅ No data collection or tracking
- ✅ Open source - you can review all code

---

## 📝 Permissions Explained

- **storage:** Store tokens locally
- **webRequest:** Capture tokens from network requests
- **tabs:** Open CreatorMetrics app for token sync
- **host_permissions:** Access LTK and CreatorMetrics domains

---

## 🐛 Troubleshooting

### "No tokens found"

**Solution:**
- Make sure you're logged into creator.shopltk.com
- Refresh the page after logging in
- Check extension has permission to access the site

### "Tokens expired"

**Solution:**
- Click "🔄 Refresh Tokens" button
- Or visit creator.shopltk.com again to capture fresh tokens

### "Send to CreatorMetrics" doesn't work

**Solution:**
- Make sure CreatorMetrics app is accessible
- Tokens are copied to clipboard as fallback
- Paste manually into `/jwt-decoder` page

---

## 🚀 Future Enhancements

- [ ] Token expiration notifications
- [ ] Multiple account support
- [ ] Token history/rotation
- [ ] Direct API testing from extension
- [ ] Export tokens to file

---

## 📚 Related Documentation

- **Main App:** See `GET-LTK-TOKENS.md` for manual token methods
- **LTK API:** See `docs/LTK-API-COMPLETE-REFERENCE.md`
- **Integration:** See `docs/LTK-INTEGRATION-GUIDE.md`

---

**Last Updated:** January 2025
