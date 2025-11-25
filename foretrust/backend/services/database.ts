// Foretrust Database Service - Using Supabase Client
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fetch, { RequestInit } from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Supabase client
let supabase: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabase) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
    }

    // Create proxy agent if HTTPS_PROXY is set
    const httpsProxy = process.env.https_proxy || process.env.HTTPS_PROXY;
    const proxyAgent = httpsProxy ? new HttpsProxyAgent(httpsProxy) : undefined;

    // Custom fetch that uses the proxy
    const customFetch = (url: string | URL, init?: RequestInit) => {
      return fetch(url, {
        ...init,
        agent: proxyAgent
      } as RequestInit);
    };

    supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        fetch: customFetch as unknown as typeof globalThis.fetch
      }
    });
  }
  return supabase;
}

// Types
export interface Deal {
  id: string;
  organization_id: string;
  name: string;
  status: 'draft' | 'ingested' | 'enriched' | 'underwritten' | 'memo_generated' | 'archived';
  source_type: 'pdf' | 'url' | 'manual';
  source_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DealPropertyAttributes {
  id: string;
  deal_id: string;
  address_line1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  property_type?: string;
  building_sqft?: number;
  land_acres?: number;
  year_built?: number;
  clear_height_ft?: number;
  dock_doors?: number;
  drive_in_doors?: number;
  zoning?: string;
  parcel_number?: string;
  last_sale_date?: string;
  last_sale_price?: number;
}

export interface DealLeaseTerms {
  id: string;
  deal_id: string;
  tenant_name?: string;
  lease_type?: string;
  lease_start_date?: string;
  lease_end_date?: string;
  base_rent_annual?: number;
  rent_psf?: number;
  rent_escalations?: object[];
  options?: object[];
}

export interface DealScores {
  id: string;
  deal_id: string;
  lci_score?: number;
  tenant_credit_score?: number;
  downside_score?: number;
  market_depth_score?: number;
  overall_score?: number;
  risk_flags?: string[];
  scored_at?: string;
}

export interface DealFinancials {
  id: string;
  deal_id: string;
  purchase_price?: number;
  noi_year1?: number;
  cap_rate?: number;
  ltv_assumed?: number;
  interest_rate?: number;
  io_years?: number;
  amort_years?: number;
  exit_cap_rate?: number;
  hold_period_years?: number;
  levered_irr?: number;
  unlevered_irr?: number;
  dscr_min?: number;
  cash_on_cash_year1?: number;
  cash_on_cash_avg?: number;
}

export interface DealEnrichment {
  id: string;
  deal_id: string;
  geocode?: object;
  market?: object;
  tenant?: object;
  enriched_at: string;
}

export interface DealMemo {
  id: string;
  deal_id: string;
  version: number;
  content_markdown: string;
  recommendation?: 'approve' | 'approve_with_conditions' | 'decline';
  generated_at: string;
}

// Default org/user for MVP
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

// Deal CRUD operations
export async function createDeal(data: {
  name: string;
  source_type: 'pdf' | 'url' | 'manual';
  source_url?: string;
  organization_id?: string;
  created_by?: string;
}): Promise<Deal> {
  const client = getClient();
  const { data: deal, error } = await client
    .from('ft_deals')
    .insert({
      name: data.name,
      source_type: data.source_type,
      source_url: data.source_url || null,
      organization_id: data.organization_id || DEFAULT_ORG_ID,
      created_by: data.created_by || DEFAULT_USER_ID
    })
    .select()
    .single();

  if (error) throw error;
  return deal;
}

export async function getDeal(id: string): Promise<Deal | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deals')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateDealStatus(id: string, status: Deal['status']): Promise<Deal | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deals')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listDeals(filters?: {
  organization_id?: string;
  status?: string;
  tenant?: string;
  market?: string;
  limit?: number;
  offset?: number;
}): Promise<Deal[]> {
  const client = getClient();

  let query = client
    .from('ft_deals')
    .select(`
      *,
      ft_deal_property_attributes(city, state, property_type),
      ft_deal_lease_terms(tenant_name),
      ft_deal_scores(overall_score, lci_score, tenant_credit_score),
      ft_deal_financials(cap_rate, noi_year1, levered_irr)
    `)
    .eq('organization_id', filters?.organization_id || DEFAULT_ORG_ID)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Flatten joined data
  return (data || []).map((d: Record<string, unknown>) => ({
    ...d,
    city: (d.ft_deal_property_attributes as Record<string, unknown>)?.city,
    state: (d.ft_deal_property_attributes as Record<string, unknown>)?.state,
    property_type: (d.ft_deal_property_attributes as Record<string, unknown>)?.property_type,
    tenant_name: (d.ft_deal_lease_terms as Record<string, unknown>)?.tenant_name,
    overall_score: (d.ft_deal_scores as Record<string, unknown>)?.overall_score,
    lci_score: (d.ft_deal_scores as Record<string, unknown>)?.lci_score,
    tenant_credit_score: (d.ft_deal_scores as Record<string, unknown>)?.tenant_credit_score,
    cap_rate: (d.ft_deal_financials as Record<string, unknown>)?.cap_rate,
    noi_year1: (d.ft_deal_financials as Record<string, unknown>)?.noi_year1,
    levered_irr: (d.ft_deal_financials as Record<string, unknown>)?.levered_irr,
  }));
}

// Property Attributes
export async function upsertPropertyAttributes(dealId: string, data: Partial<DealPropertyAttributes>): Promise<DealPropertyAttributes> {
  const client = getClient();
  const { data: result, error } = await client
    .from('ft_deal_property_attributes')
    .upsert({
      deal_id: dealId,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'deal_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getPropertyAttributes(dealId: string): Promise<DealPropertyAttributes | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_property_attributes')
    .select('*')
    .eq('deal_id', dealId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Lease Terms
export async function upsertLeaseTerms(dealId: string, data: Partial<DealLeaseTerms>): Promise<DealLeaseTerms> {
  const client = getClient();
  const { data: result, error } = await client
    .from('ft_deal_lease_terms')
    .upsert({
      deal_id: dealId,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'deal_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getLeaseTerms(dealId: string): Promise<DealLeaseTerms | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_lease_terms')
    .select('*')
    .eq('deal_id', dealId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Scores
export async function upsertScores(dealId: string, data: Partial<DealScores>): Promise<DealScores> {
  const client = getClient();
  const { data: result, error } = await client
    .from('ft_deal_scores')
    .upsert({
      deal_id: dealId,
      ...data,
      scored_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'deal_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getScores(dealId: string): Promise<DealScores | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_scores')
    .select('*')
    .eq('deal_id', dealId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Financials
export async function upsertFinancials(dealId: string, data: Partial<DealFinancials>): Promise<DealFinancials> {
  const client = getClient();
  const { data: result, error } = await client
    .from('ft_deal_financials')
    .upsert({
      deal_id: dealId,
      ...data,
      updated_at: new Date().toISOString()
    }, { onConflict: 'deal_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getFinancials(dealId: string): Promise<DealFinancials | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_financials')
    .select('*')
    .eq('deal_id', dealId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Enrichment
export async function upsertEnrichment(dealId: string, data: Partial<DealEnrichment>): Promise<DealEnrichment> {
  const client = getClient();
  const { data: result, error } = await client
    .from('ft_deal_enrichment')
    .upsert({
      deal_id: dealId,
      ...data,
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'deal_id' })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getEnrichment(dealId: string): Promise<DealEnrichment | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_enrichment')
    .select('*')
    .eq('deal_id', dealId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Memos
export async function createMemo(dealId: string, data: {
  content_markdown: string;
  recommendation?: 'approve' | 'approve_with_conditions' | 'decline';
}): Promise<DealMemo> {
  const client = getClient();

  // Get next version number
  const { data: existing } = await client
    .from('ft_deal_memos')
    .select('version')
    .eq('deal_id', dealId)
    .order('version', { ascending: false })
    .limit(1);

  const nextVersion = (existing?.[0]?.version || 0) + 1;

  const { data: result, error } = await client
    .from('ft_deal_memos')
    .insert({
      deal_id: dealId,
      version: nextVersion,
      content_markdown: data.content_markdown,
      recommendation: data.recommendation,
      generated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return result;
}

export async function getMemos(dealId: string): Promise<DealMemo[]> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_memos')
    .select('*')
    .eq('deal_id', dealId)
    .order('version', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getLatestMemo(dealId: string): Promise<DealMemo | null> {
  const client = getClient();
  const { data, error } = await client
    .from('ft_deal_memos')
    .select('*')
    .eq('deal_id', dealId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Get complete deal data
export async function getCompleteDeal(dealId: string): Promise<{
  deal: Deal | null;
  propertyAttributes: DealPropertyAttributes | null;
  leaseTerms: DealLeaseTerms | null;
  scores: DealScores | null;
  financials: DealFinancials | null;
  enrichment: DealEnrichment | null;
  memos: DealMemo[];
}> {
  const [deal, propertyAttributes, leaseTerms, scores, financials, enrichment, memos] = await Promise.all([
    getDeal(dealId),
    getPropertyAttributes(dealId),
    getLeaseTerms(dealId),
    getScores(dealId),
    getFinancials(dealId),
    getEnrichment(dealId),
    getMemos(dealId)
  ]);

  return { deal, propertyAttributes, leaseTerms, scores, financials, enrichment, memos };
}

// Delete deal
export async function deleteDeal(dealId: string): Promise<boolean> {
  const client = getClient();
  const { error } = await client
    .from('ft_deals')
    .delete()
    .eq('id', dealId);

  if (error) throw error;
  return true;
}
