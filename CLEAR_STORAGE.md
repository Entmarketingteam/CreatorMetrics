# Clear Browser Storage to Fix White Screen

If you're seeing a white screen, it might be due to old token format in localStorage.

## Quick Fix:

Open browser console (F12) and run:

```javascript
localStorage.removeItem('ltk_tokens');
location.reload();
```

This will clear any old tokens that might be causing the app to crash.
