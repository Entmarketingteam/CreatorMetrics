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

export default router;
