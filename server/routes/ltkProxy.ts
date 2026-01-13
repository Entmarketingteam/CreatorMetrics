import { Router, Request, Response } from 'express';

/**
 * LTK API Proxy Routes
 * 
 * 📚 REFERENCE: For complete API documentation, endpoint details, authentication requirements,
 * and implementation guide, see: docs/LTK-API-COMPLETE-REFERENCE.md
 * 
 * This file implements the backend proxy endpoints. All endpoint paths, query parameters,
 * and authentication requirements are documented in the reference guide above.
 */

const router = Router();

// API Gateway - using api-gateway.rewardstyle.com (creator-api-gateway.shopltk.com doesn't resolve)
// The dual headers (Authorization + X-id-token) are still required as per requirements
const LTK_API_BASE = 'https://api-gateway.rewardstyle.com';

/**
 * Generic LTK API proxy handler
 * Forwards requests to LTK API with proper headers to bypass CORS
 */
async function proxyLTKRequest(
  endpoint: string,
  accessToken: string,
  idToken: string,
  method: string = 'GET',
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${LTK_API_BASE}${endpoint}`;
  
  console.log(`[LTK Proxy] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-id-token': idToken, // Capital X as per requirements - both tokens required
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://creator.shopltk.com',
        'Referer': 'https://creator.shopltk.com/',
      },
      body: body ? JSON.stringify(body) : undefined
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      status: response.status,
      data
    };
  } catch (error: any) {
    console.error('[LTK Proxy] Error:', error.message);
    console.error('[LTK Proxy] Error details:', {
      url,
      method,
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw new Error(`LTK API request failed: ${error.message}`);
  }
}

/**
 * POST /api/ltk/proxy
 * Generic proxy endpoint for any LTK API call
 */
router.post('/proxy', async (req: Request, res: Response) => {
  try {
    const { endpoint, method = 'GET', body } = req.body;
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest(endpoint, accessToken, idToken, method, body);
    res.status(result.status).json(result.data);

  } catch (error: any) {
    console.error('[LTK Proxy] Request failed:', error.message);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    });
  }
});

/**
 * Analytics Endpoints
 */

// GET /api/ltk/analytics/contributors
router.get('/analytics/contributors', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest('/analytics/contributors', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/hero-chart
router.get('/analytics/hero-chart', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    // Build query params, filtering out undefined/null/empty values
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const endpoint = `/analytics/hero_chart${queryString ? `?${queryString}` : ''}`;
    
    console.log('[LTK Proxy] Hero Chart endpoint:', endpoint);
    console.log('[LTK Proxy] Query params:', req.query);
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/performance-summary
router.get('/analytics/performance-summary', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/creator-analytics/v1/performance_summary${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/performance-stats
router.get('/analytics/performance-stats', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/creator-analytics/v1/performance_stats${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/top-performers
router.get('/analytics/top-performers', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    // Build query params, filtering out undefined/null/empty values
    const queryParams = new URLSearchParams();
    Object.entries(req.query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const queryString = queryParams.toString();
    const endpoint = `/analytics/top_performers/links${queryString ? `?${queryString}` : ''}`;
    
    console.log('[LTK Proxy] Top Performers endpoint:', endpoint);
    console.log('[LTK Proxy] Query params:', req.query);
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/items-sold
router.get('/analytics/items-sold', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/creator-analytics/v1/items_sold${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/commissions-summary
router.get('/analytics/commissions-summary', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest('/api/creator-analytics/v1/commissions_summary', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * User & Account Endpoints
 */

// GET /api/ltk/user/:publisherId
router.get('/user/:publisherId', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const { publisherId } = req.params;
    const result = await proxyLTKRequest(`/api/creator-account-service/v1/users/${publisherId}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/account/:accountId
router.get('/account/:accountId', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/api/creator-account-service/v1/accounts/${accountId}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/account/:accountId/users
router.get('/account/:accountId/users', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/api/creator-account-service/v1/accounts/${accountId}/users`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/user-info
router.get('/user-info', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest('/api/co-api/v1/get_user_info', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/public-profile/:accountId
router.get('/public-profile/:accountId', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/api/pub/v2/profiles/?rs_account_id=${accountId}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Integration Endpoints
 */

// GET /api/ltk/amazon-identities
router.get('/amazon-identities', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest('/api/co-api/v1/get_amazon_identities', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/search-trends
router.get('/search-trends', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const result = await proxyLTKRequest('/api/ltk/v2/ltk_search_trends/', accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/top-performers/advertisers
router.get('/top-performers/advertisers', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const result = await proxyLTKRequest(`/analytics/top_performers/advertisers${queryParams ? `?${queryParams}` : ''}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/top-performers/links
router.get('/top-performers/links', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const result = await proxyLTKRequest(`/analytics/top_performers/links${queryParams ? `?${queryParams}` : ''}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/top-performers/ltks
router.get('/top-performers/ltks', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const result = await proxyLTKRequest(`/analytics/top_performers/ltks${queryParams ? `?${queryParams}` : ''}`, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Content & Product Endpoints
 */

// GET /api/ltk/favorites
router.get('/favorites', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/pub/v1/favorites/${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/folders
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/pub/v1/folders/${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/product-info
router.get('/product-info', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/co-api/v1/get_products_info${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/product-reviews
router.get('/product-reviews', async (req: Request, res: Response) => {
  try {
    const accessToken = req.headers['x-ltk-access-token'] as string;
    const idToken = req.headers['x-ltk-id-token'] as string;
    if (!accessToken || !idToken) {
      return res.status(401).json({ error: 'Missing LTK tokens (both access and ID tokens required)' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/api/pub/v1/product_reviews/${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, accessToken, idToken);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/oauth/login
// Initiates OAuth flow - redirects to Auth0
router.get('/oauth/login', async (req: Request, res: Response) => {
  try {
    const clientId = 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT';
    
    // Use backend URL for callback (we control this, so it should work)
    // Try using Railway backend URL, or fallback to a known allowed URL
    const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN || 
                      process.env.VERCEL_URL || 
                      req.get('host') || 
                      'localhost:3001';
    
    // Use HTTP/HTTPS based on request
    const protocol = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const redirectUri = `${protocol}://${backendUrl}/api/ltk/oauth/callback`;
    
    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    
    // Store state in session (or we could use a database/cache)
    // For now, we'll pass it in the redirect and verify on callback
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email ltk.publisher offline_access',
      state: state,
    });

    // Store state temporarily (in production, use Redis or database)
    // For now, encode it in a way we can verify
    res.cookie('ltk_oauth_state', state, { 
      httpOnly: true, 
      secure: protocol === 'https',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });

    // Redirect to Auth0 authorization endpoint
    res.redirect(`https://creator-auth.shopltk.com/authorize?${params.toString()}`);
  } catch (error: any) {
    console.error('OAuth login error:', error);
    res.status(500).json({ error: error.message || 'Failed to initiate OAuth flow' });
  }
});

// GET /api/ltk/oauth/callback
// Handles OAuth callback from Auth0
// NOTE: This callback URL must be whitelisted in LTK's Auth0 app settings
router.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    const error = req.query.error as string;
    const errorDescription = req.query.error_description as string;

    // Get frontend URL from cookie (set during login)
    const frontendUrl = req.cookies?.ltk_oauth_frontend || 
                       process.env.FRONTEND_URL || 
                       'https://creatotmetrics.vercel.app';

    // Check for OAuth errors
    if (error) {
      console.error('[OAuth] Error from Auth0:', error, errorDescription);
      return res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent(errorDescription || error || 'Authentication failed')}`);
    }

    // Verify state (CSRF protection)
    const storedState = req.cookies?.ltk_oauth_state;
    if (!state || state !== storedState) {
      console.error('[OAuth] State mismatch:', { received: state, stored: storedState });
      return res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent('Invalid state parameter - security check failed')}`);
    }

    // Clear state cookie
    res.clearCookie('ltk_oauth_state');
    res.clearCookie('ltk_oauth_frontend');

    if (!code) {
      return res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent('No authorization code received')}`);
    }

    // Get redirect URI (must match what we sent in login)
    const backendUrl = process.env.RAILWAY_PUBLIC_DOMAIN || 
                      process.env.VERCEL_URL || 
                      (req.get('host') ? `${req.get('x-forwarded-proto') || 'https'}://${req.get('host')}` : null) ||
                      'https://web-production-7199b.up.railway.app';
    
    const backendDomain = backendUrl.includes('://') 
      ? backendUrl.split('://')[1] 
      : backendUrl;
    
    const protocol = backendUrl.startsWith('https') ? 'https' : 'https';
    const redirectUri = `${protocol}://${backendDomain}/api/ltk/oauth/callback`;

    console.log(`[OAuth] Exchanging code for tokens with redirect_uri: ${redirectUri}`);

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://creator-auth.shopltk.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('[OAuth] Token exchange failed:', tokenResponse.status, errorText);
      return res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent(`Token exchange failed: ${errorText}`)}`);
    }

    const tokenData = await tokenResponse.json();

    // CRITICAL: Verify both tokens are present
    if (!tokenData.access_token || !tokenData.id_token) {
      console.error('[OAuth] Missing tokens in response:', { hasAccess: !!tokenData.access_token, hasId: !!tokenData.id_token });
      return res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent('Missing tokens in response - expected both access_token and id_token')}`);
    }

    // Store tokens temporarily and pass to frontend
    const tokenString = encodeURIComponent(JSON.stringify({
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
      token_type: tokenData.token_type || 'Bearer',
    }));

    console.log('[OAuth] Tokens received, redirecting to frontend');

    // Redirect to frontend with tokens (they'll be stored client-side)
    res.redirect(`${frontendUrl}/auth/ltk/callback?tokens=${tokenString}`);
  } catch (error: any) {
    console.error('[OAuth] Callback error:', error);
    const frontendUrl = req.cookies?.ltk_oauth_frontend || 
                       process.env.FRONTEND_URL || 
                       'https://creatotmetrics.vercel.app';
    res.redirect(`${frontendUrl}/platforms?ltk_error=${encodeURIComponent(error.message || 'Authentication failed')}`);
  }
});

// POST /api/ltk/oauth/callback (legacy - for direct code exchange from frontend)
// Exchanges authorization code for tokens (OAuth callback)
router.post('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, redirect_uri } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    if (!redirect_uri) {
      return res.status(400).json({ error: 'Missing redirect_uri' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://creator-auth.shopltk.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: 'iKyQz7GfBMBPqUqCbbKSNBUlM2VpNWUT',
        // Note: client_secret not required for public client (Auth0 PKCE flow)
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      return res.status(tokenResponse.status).json({ 
        error: `Token exchange failed: ${tokenResponse.status}`,
        details: errorText 
      });
    }

    const tokenData = await tokenResponse.json();

    // CRITICAL: Verify both tokens are present
    if (!tokenData.access_token) {
      return res.status(500).json({ error: 'Missing access_token in response' });
    }

    if (!tokenData.id_token) {
      return res.status(500).json({ error: 'Missing id_token in response - required for new API gateway' });
    }

    // Return tokens to frontend
    res.json({
      access_token: tokenData.access_token,
      id_token: tokenData.id_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 3600,
      token_type: tokenData.token_type || 'Bearer',
    });
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message || 'Token exchange failed' });
  }
});

export default router;
