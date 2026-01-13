// Background service worker for LTK Token Manager
// Monitors network requests to capture tokens automatically

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    // Capture tokens from LTK API requests
    const headers = details.requestHeaders || [];
    
    // Look for Authorization and X-id-token headers
    let accessToken = null;
    let idToken = null;
    
    headers.forEach(header => {
      if (header.name === 'Authorization' && header.value) {
        accessToken = header.value.replace('Bearer ', '');
      }
      if (header.name === 'X-id-token' && header.value) {
        idToken = header.value;
      }
    });
    
    // If we found both tokens, store them
    if (accessToken && idToken) {
      const tokens = {
        access_token: accessToken,
        id_token: idToken,
        captured_at: Date.now(),
        expires_at: Date.now() + (10 * 60 * 60 * 1000) // 10 hours default
      };
      
      // Store tokens
      chrome.storage.local.set({ ltk_tokens: tokens }, () => {
        console.log('✅ LTK tokens captured and stored');
        
        // Notify popup/content script
        chrome.runtime.sendMessage({
          type: 'TOKENS_CAPTURED',
          tokens: tokens
        }).catch(() => {
          // Popup might not be open, that's okay
        });
      });
    }
  },
  {
    urls: [
      'https://api-gateway.rewardstyle.com/*',
      'https://creator-api-gateway.shopltk.com/*'
    ]
  },
  ['requestHeaders']
);

// Listen for token refresh requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'REFRESH_TOKENS') {
    refreshTokens(request.refreshToken)
      .then(tokens => sendResponse({ success: true, tokens }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
  
  if (request.type === 'GET_TOKENS') {
    chrome.storage.local.get(['ltk_tokens'], (result) => {
      sendResponse({ tokens: result.ltk_tokens || null });
    });
    return true;
  }
  
  if (request.type === 'CLEAR_TOKENS') {
    chrome.storage.local.remove(['ltk_tokens'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Token refresh function
async function refreshTokens(refreshToken) {
  const response = await fetch('https://creator-auth.shopltk.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.access_token || !data.id_token) {
    throw new Error('Missing tokens in refresh response');
  }
  
  const tokens = {
    access_token: data.access_token,
    id_token: data.id_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + (data.expires_in * 1000),
    captured_at: Date.now()
  };
  
  // Store refreshed tokens
  chrome.storage.local.set({ ltk_tokens: tokens });
  
  return tokens;
}

// Check token expiration and auto-refresh
setInterval(() => {
  chrome.storage.local.get(['ltk_tokens'], (result) => {
    const tokens = result.ltk_tokens;
    if (tokens && tokens.refresh_token) {
      const expiresIn = tokens.expires_at - Date.now();
      // Refresh if expires in less than 5 minutes
      if (expiresIn < 5 * 60 * 1000 && expiresIn > 0) {
        console.log('🔄 Auto-refreshing tokens...');
        refreshTokens(tokens.refresh_token).catch(console.error);
      }
    }
  });
}, 60000); // Check every minute
