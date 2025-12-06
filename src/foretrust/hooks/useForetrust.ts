// Foretrust API Hook
import { useState, useCallback } from 'react';

const API_BASE = '/api/foretrust';

// Types
export interface Deal {
  id: string;
  name: string;
  status: 'draft' | 'ingested' | 'enriched' | 'underwritten' | 'memo_generated' | 'archived';
  source_type: 'pdf' | 'url' | 'manual';
  source_url?: string;
  created_at: string;
  // Joined fields
  city?: string;
  state?: string;
  property_type?: string;
  tenant_name?: string;
  overall_score?: number;
  lci_score?: number;
  tenant_credit_score?: number;
  cap_rate?: number;
  noi_year1?: number;
  levered_irr?: number;
}

export interface DealComplete {
  deal: Deal;
  propertyAttributes?: {
    address_line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    property_type?: string;
    building_sqft?: number;
    land_acres?: number;
    year_built?: number;
    clear_height_ft?: number;
    dock_doors?: number;
    drive_in_doors?: number;
    latitude?: number;
    longitude?: number;
  };
  leaseTerms?: {
    tenant_name?: string;
    lease_type?: string;
    lease_start_date?: string;
    lease_end_date?: string;
    base_rent_annual?: number;
    rent_psf?: number;
    rent_escalations?: Array<{ year: number; bumpPct: number }>;
    options?: Array<{ type: string; years: number }>;
  };
  scores?: {
    lci_score?: number;
    tenant_credit_score?: number;
    downside_score?: number;
    market_depth_score?: number;
    overall_score?: number;
    risk_flags?: string[];
  };
  financials?: {
    purchase_price?: number;
    noi_year1?: number;
    cap_rate?: number;
    ltv_assumed?: number;
    interest_rate?: number;
    levered_irr?: number;
    unlevered_irr?: number;
    dscr_min?: number;
    cash_on_cash_year1?: number;
  };
  enrichment?: {
    geocode?: { latitude: number; longitude: number };
    market?: { submarketName: string; marketRank: number };
    tenant?: { industry: string; companySize: string; publicOrPrivate: string; creditImplied: string };
  };
  memos?: Array<{
    id: string;
    version: number;
    content_markdown: string;
    recommendation?: string;
    generated_at: string;
  }>;
}

export interface ScoreExplainability {
  explainability: {
    lci: string;
    tenantCredit: string;
    downside: string;
    marketDepth: string;
    overall: string;
  };
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Request failed' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error: 'Network error' };
  }
}

export function useForetrust() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // List deals
  const listDeals = useCallback(async (filters?: {
    status?: string;
    tenant?: string;
    market?: string;
  }): Promise<Deal[]> => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.tenant) params.append('tenant', filters.tenant);
    if (filters?.market) params.append('market', filters.market);

    const result = await apiRequest<Deal[]>(`/deals?${params.toString()}`);

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to list deals');
      return [];
    }
    return result.data || [];
  }, []);

  // Get single deal
  const getDeal = useCallback(async (dealId: string): Promise<DealComplete | null> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest<DealComplete>(`/deals/${dealId}`);

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get deal');
      return null;
    }
    return result.data || null;
  }, []);

  // Create deal
  const createDeal = useCallback(async (data: {
    name: string;
    sourceType: 'pdf' | 'url' | 'manual';
    sourceUrl?: string;
  }): Promise<Deal | null> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest<Deal>('/deals', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to create deal');
      return null;
    }
    return result.data || null;
  }, []);

  // Delete deal
  const deleteDeal = useCallback(async (dealId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest(`/deals/${dealId}`, {
      method: 'DELETE'
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to delete deal');
      return false;
    }
    return true;
  }, []);

  // Ingest document
  const ingestDeal = useCallback(async (dealId: string, data: {
    documentContent?: string;
    manualData?: object;
  }): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest(`/deals/${dealId}/ingest`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to ingest deal');
      return false;
    }
    return true;
  }, []);

  // Enrich deal
  const enrichDeal = useCallback(async (dealId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest(`/deals/${dealId}/enrich`, {
      method: 'POST'
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to enrich deal');
      return false;
    }
    return true;
  }, []);

  // Underwrite deal
  const underwriteDeal = useCallback(async (dealId: string, purchasePrice?: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest(`/deals/${dealId}/underwrite`, {
      method: 'POST',
      body: JSON.stringify({ purchasePrice })
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to underwrite deal');
      return false;
    }
    return true;
  }, []);

  // Generate memo
  const generateMemo = useCallback(async (dealId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest(`/deals/${dealId}/memo`, {
      method: 'POST'
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to generate memo');
      return false;
    }
    return true;
  }, []);

  // Run full pipeline
  const runPipeline = useCallback(async (dealId: string, data: {
    documentContent?: string;
    manualData?: object;
    purchasePrice?: number;
  }): Promise<{ success: boolean; processingTimeSec?: number }> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest<{ processingTimeSec: number }>(`/deals/${dealId}/pipeline`, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to run pipeline');
      return { success: false };
    }
    return { success: true, processingTimeSec: result.data?.processingTimeSec };
  }, []);

  // Get score explainability
  const getExplainability = useCallback(async (dealId: string): Promise<ScoreExplainability | null> => {
    setLoading(true);
    setError(null);

    const result = await apiRequest<ScoreExplainability>(`/deals/${dealId}/explain`);

    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Failed to get explainability');
      return null;
    }
    return result.data || null;
  }, []);

  return {
    loading,
    error,
    listDeals,
    getDeal,
    createDeal,
    deleteDeal,
    ingestDeal,
    enrichDeal,
    underwriteDeal,
    generateMemo,
    runPipeline,
    getExplainability
  };
}
