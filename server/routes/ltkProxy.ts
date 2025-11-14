import { Router, Request, Response } from 'express';

const router = Router();

const LTK_API_BASE = 'https://api-gateway.rewardstyle.com';

/**
 * Generic LTK API proxy handler
 * Forwards requests to LTK API with proper headers to bypass CORS
 */
async function proxyLTKRequest(
  endpoint: string,
  token: string,
  method: string = 'GET',
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${LTK_API_BASE}${endpoint}`;
  
  console.log(`[LTK Proxy] ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'x-id-token': token,
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
    throw error;
  }
}

/**
 * POST /api/ltk/proxy
 * Generic proxy endpoint for any LTK API call
 */
router.post('/proxy', async (req: Request, res: Response) => {
  try {
    const { endpoint, method = 'GET', body } = req.body;
    const token = req.headers['x-ltk-token'] as string;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' });
    }

    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token in x-ltk-token header' });
    }

    const result = await proxyLTKRequest(endpoint, token, method, body);
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
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const result = await proxyLTKRequest('/analytics/v1/contributors', token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/hero-chart
router.get('/analytics/hero-chart', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/analytics/v1/hero_chart${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/performance-summary
router.get('/analytics/performance-summary', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/analytics/v1/performance_summary${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/performance-stats
router.get('/analytics/performance-stats', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/analytics/v1/performance_stats${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/top-performers
router.get('/analytics/top-performers', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/analytics/v1/top_performers${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/items-sold
router.get('/analytics/items-sold', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const queryParams = new URLSearchParams(req.query as any).toString();
    const endpoint = `/analytics/v1/items_sold${queryParams ? `?${queryParams}` : ''}`;
    
    const result = await proxyLTKRequest(endpoint, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/analytics/commissions-summary
router.get('/analytics/commissions-summary', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const result = await proxyLTKRequest('/analytics/v1/commissions_summary', token);
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
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const { publisherId } = req.params;
    const result = await proxyLTKRequest(`/publishers/v1/users/${publisherId}`, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/account/:accountId
router.get('/account/:accountId', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/publishers/v1/accounts/${accountId}`, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/account/:accountId/users
router.get('/account/:accountId/users', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/publishers/v1/accounts/${accountId}/users`, token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/user-info
router.get('/user-info', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const result = await proxyLTKRequest('/publishers/v1/user', token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/public-profile/:accountId
router.get('/public-profile/:accountId', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const { accountId } = req.params;
    const result = await proxyLTKRequest(`/publishers/v1/public/accounts/${accountId}`, token);
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
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const result = await proxyLTKRequest('/integrations/v1/amazon/identities', token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ltk/search-trends
router.get('/search-trends', async (req: Request, res: Response) => {
  try {
    const token = req.headers['x-ltk-token'] as string;
    if (!token) {
      return res.status(401).json({ error: 'Missing LTK token' });
    }

    const result = await proxyLTKRequest('/search/v1/trends', token);
    res.status(result.status).json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
