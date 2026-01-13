// Popup script for LTK Token Manager extension

document.addEventListener('DOMContentLoaded', () => {
  const loading = document.getElementById('loading');
  const content = document.getElementById('content');
  const status = document.getElementById('status');
  const tokenInfo = document.getElementById('tokenInfo');
  const copyTokensBtn = document.getElementById('copyTokens');
  const sendToAppBtn = document.getElementById('sendToApp');
  const refreshTokensBtn = document.getElementById('refreshTokens');
  const clearTokensBtn = document.getElementById('clearTokens');
  
  // Load tokens on popup open
  loadTokens();
  
  // Listen for token updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === 'TOKENS_CAPTURED') {
      loadTokens();
    }
  });
  
  function loadTokens() {
    chrome.runtime.sendMessage({ type: 'GET_TOKENS' }, (response) => {
      loading.classList.add('hidden');
      content.classList.remove('hidden');
      
      if (response.tokens) {
        displayTokens(response.tokens);
      } else {
        showNoTokens();
      }
    });
  }
  
  function displayTokens(tokens) {
    const expiresAt = new Date(tokens.expires_at);
    const now = Date.now();
    const expiresIn = expiresAt - now;
    const isExpired = expiresIn < 0;
    const hoursLeft = Math.floor(expiresIn / (1000 * 60 * 60));
    const minutesLeft = Math.floor((expiresIn % (1000 * 60 * 60)) / (1000 * 60));
    
    // Status
    if (isExpired) {
      status.innerHTML = '<div class="status error">⚠️ Tokens Expired - Refresh needed</div>';
    } else if (hoursLeft < 1) {
      status.innerHTML = `<div class="status info">⏰ Expires in ${minutesLeft} minutes</div>`;
    } else {
      status.innerHTML = `<div class="status success">✅ Tokens Valid - ${hoursLeft}h ${minutesLeft}m remaining</div>`;
    }
    
    // Token info
    tokenInfo.innerHTML = `
      <div class="token-info">
        <strong>Access Token:</strong>
        <div class="token-value">${tokens.access_token.substring(0, 50)}...</div>
        <strong>ID Token:</strong>
        <div class="token-value">${tokens.id_token.substring(0, 50)}...</div>
        <strong>Captured:</strong> ${new Date(tokens.captured_at).toLocaleString()}
      </div>
    `;
    
    // Enable buttons
    copyTokensBtn.disabled = false;
    sendToAppBtn.disabled = false;
    refreshTokensBtn.disabled = !tokens.refresh_token;
    clearTokensBtn.disabled = false;
  }
  
  function showNoTokens() {
    status.innerHTML = '<div class="status info">ℹ️ No tokens found. Visit creator.shopltk.com to capture tokens.</div>';
    tokenInfo.innerHTML = '';
    copyTokensBtn.disabled = true;
    sendToAppBtn.disabled = true;
    refreshTokensBtn.disabled = true;
    clearTokensBtn.disabled = true;
  }
  
  // Copy tokens to clipboard
  copyTokensBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_TOKENS' }, (response) => {
      if (response.tokens) {
        const tokenJSON = JSON.stringify({
          access_token: response.tokens.access_token,
          id_token: response.tokens.id_token,
          refresh_token: response.tokens.refresh_token || '',
          expires_at: Math.floor(response.tokens.expires_at / 1000)
        }, null, 2);
        
        navigator.clipboard.writeText(tokenJSON).then(() => {
          copyTokensBtn.textContent = '✅ Copied!';
          setTimeout(() => {
            copyTokensBtn.textContent = '📋 Copy Tokens JSON';
          }, 2000);
        });
      }
    });
  });
  
  // Send tokens to CreatorMetrics app
  sendToAppBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_TOKENS' }, (response) => {
      if (response.tokens) {
        // Open CreatorMetrics app
        chrome.tabs.create({
          url: 'https://creatotmetrics.vercel.app/jwt-decoder'
        }, (tab) => {
          // Wait for tab to load, then inject tokens
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'INJECT_TOKENS',
              tokens: {
                access_token: response.tokens.access_token,
                id_token: response.tokens.id_token,
                refresh_token: response.tokens.refresh_token || '',
                expires_at: Math.floor(response.tokens.expires_at / 1000)
              }
            }).catch(() => {
              // If message fails, copy to clipboard as fallback
              const tokenJSON = JSON.stringify({
                access_token: response.tokens.access_token,
                id_token: response.tokens.id_token,
                refresh_token: response.tokens.refresh_token || '',
                expires_at: Math.floor(response.tokens.expires_at / 1000)
              }, null, 2);
              navigator.clipboard.writeText(tokenJSON);
              sendToAppBtn.textContent = '✅ Copied! Paste in app';
              setTimeout(() => {
                sendToAppBtn.textContent = '🚀 Send to CreatorMetrics';
              }, 3000);
            });
          }, 2000);
        });
      }
    });
  });
  
  // Refresh tokens
  refreshTokensBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'GET_TOKENS' }, (response) => {
      if (response.tokens && response.tokens.refresh_token) {
        refreshTokensBtn.textContent = '🔄 Refreshing...';
        refreshTokensBtn.disabled = true;
        
        chrome.runtime.sendMessage({
          type: 'REFRESH_TOKENS',
          refreshToken: response.tokens.refresh_token
        }, (refreshResponse) => {
          if (refreshResponse.success) {
            loadTokens();
            refreshTokensBtn.textContent = '✅ Refreshed!';
            setTimeout(() => {
              refreshTokensBtn.textContent = '🔄 Refresh Tokens';
            }, 2000);
          } else {
            alert('Refresh failed: ' + refreshResponse.error);
            refreshTokensBtn.textContent = '🔄 Refresh Tokens';
          }
          refreshTokensBtn.disabled = false;
        });
      }
    });
  });
  
  // Clear tokens
  clearTokensBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all stored tokens?')) {
      chrome.runtime.sendMessage({ type: 'CLEAR_TOKENS' }, () => {
        showNoTokens();
      });
    }
  });
});
