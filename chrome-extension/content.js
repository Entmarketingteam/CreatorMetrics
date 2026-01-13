// Content script that runs on creator.shopltk.com
// Extracts tokens from cookies and network requests

(function() {
  'use strict';
  
  // Function to extract tokens from cookies
  function extractTokensFromCookies() {
    const cookies = document.cookie.split('; ');
    let accessToken = null;
    let idToken = null;
    let refreshToken = null;
    
    // Try different cookie name patterns
    const accessTokenPatterns = [
      'auth._token.auth0',
      'auth.token.auth0',
      '_token.auth0',
      'sigil_access_token'
    ];
    
    const idTokenPatterns = [
      'auth._id_token.auth0',
      'auth.id_token.auth0',
      '_id_token.auth0',
      'sigil_id_token'
    ];
    
    const refreshTokenPatterns = [
      'auth._refresh_token.auth0',
      'auth.refresh_token.auth0',
      '_refresh_token.auth0'
    ];
    
    // Search for access token
    for (const pattern of accessTokenPatterns) {
      const cookie = cookies.find(row => row.startsWith(pattern + '='));
      if (cookie) {
        accessToken = decodeURIComponent(cookie.split('=')[1]);
        break;
      }
    }
    
    // Search for ID token
    for (const pattern of idTokenPatterns) {
      const cookie = cookies.find(row => row.startsWith(pattern + '='));
      if (cookie) {
        idToken = decodeURIComponent(cookie.split('=')[1]);
        break;
      }
    }
    
    // Search for refresh token
    for (const pattern of refreshTokenPatterns) {
      const cookie = cookies.find(row => row.startsWith(pattern + '='));
      if (cookie) {
        refreshToken = decodeURIComponent(cookie.split('=')[1]);
        break;
      }
    }
    
    return { accessToken, idToken, refreshToken };
  }
  
  // Extract tokens periodically
  function captureTokens() {
    const tokens = extractTokensFromCookies();
    
    if (tokens.accessToken && tokens.idToken) {
      const tokenData = {
        access_token: tokens.accessToken,
        id_token: tokens.idToken,
        refresh_token: tokens.refreshToken || '',
        captured_at: Date.now(),
        expires_at: Date.now() + (10 * 60 * 60 * 1000) // 10 hours default
      };
      
      // Send to background script
      chrome.runtime.sendMessage({
        type: 'TOKENS_FROM_COOKIES',
        tokens: tokenData
      });
    }
  }
  
  // Capture tokens on page load
  captureTokens();
  
  // Also capture when cookies change (Auth0 login)
  const observer = new MutationObserver(() => {
    captureTokens();
  });
  
  observer.observe(document, {
    childList: true,
    subtree: true
  });
  
  // Monitor network requests for tokens
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      // Check if this is an LTK API request
      const url = args[0];
      if (typeof url === 'string' && url.includes('api-gateway.rewardstyle.com')) {
        // Tokens might be in request headers, but we can't access them here
        // Background script handles that via webRequest API
      }
      return response;
    });
  };
  
  // Add visual indicator when tokens are captured
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TOKENS_CAPTURED') {
      // Show a subtle notification
      const notification = document.createElement('div');
      notification.textContent = '✅ LTK tokens captured!';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    }
  });
})();
