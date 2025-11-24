// Foretrust Database Service
import pg from 'pg';
const { Pool } = pg;

// Database connection pool
let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
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
  created_at: Date;
  updated_at: Date;
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
  scored_at?: Date;
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
  enriched_at: Date;
}

export interface DealMemo {
  id: string;
  deal_id: string;
  version: number;
  content_markdown: string;
  recommendation?: 'approve' | 'approve_with_conditions' | 'decline';
  generated_at: Date;
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
  const db = getPool();
  const result = await db.query<Deal>(
    `INSERT INTO ft_deals (name, source_type, source_url, organization_id, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      data.name,
      data.source_type,
      data.source_url || null,
      data.organization_id || DEFAULT_ORG_ID,
      data.created_by || DEFAULT_USER_ID
    ]
  );
  return result.rows[0];
}

export async function getDeal(id: string): Promise<Deal | null> {
  const db = getPool();
  const result = await db.query<Deal>(
    'SELECT * FROM ft_deals WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function updateDealStatus(id: string, status: Deal['status']): Promise<Deal | null> {
  const db = getPool();
  const result = await db.query<Deal>(
    `UPDATE ft_deals SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result.rows[0] || null;
}

export async function listDeals(filters?: {
  organization_id?: string;
  status?: string;
  tenant?: string;
  market?: string;
  limit?: number;
  offset?: number;
}): Promise<Deal[]> {
  const db = getPool();
  let query = `
    SELECT d.*,
           p.city, p.state, p.property_type,
           l.tenant_name,
           s.overall_score, s.lci_score, s.tenant_credit_score,
           f.cap_rate, f.noi_year1, f.levered_irr
    FROM ft_deals d
    LEFT JOIN ft_deal_property_attributes p ON d.id = p.deal_id
    LEFT JOIN ft_deal_lease_terms l ON d.id = l.deal_id
    LEFT JOIN ft_deal_scores s ON d.id = s.deal_id
    LEFT JOIN ft_deal_financials f ON d.id = f.deal_id
    WHERE d.organization_id = $1
  `;
  const params: (string | number)[] = [filters?.organization_id || DEFAULT_ORG_ID];
  let paramIndex = 2;

  if (filters?.status) {
    query += ` AND d.status = $${paramIndex++}`;
    params.push(filters.status);
  }
  if (filters?.tenant) {
    query += ` AND l.tenant_name ILIKE $${paramIndex++}`;
    params.push(`%${filters.tenant}%`);
  }
  if (filters?.market) {
    query += ` AND (p.city ILIKE $${paramIndex} OR p.state ILIKE $${paramIndex++})`;
    params.push(`%${filters.market}%`);
  }

  query += ' ORDER BY d.created_at DESC';

  if (filters?.limit) {
    query += ` LIMIT $${paramIndex++}`;
    params.push(filters.limit);
  }
  if (filters?.offset) {
    query += ` OFFSET $${paramIndex++}`;
    params.push(filters.offset);
  }

  const result = await db.query(query, params);
  return result.rows;
}

// Property Attributes
export async function upsertPropertyAttributes(dealId: string, data: Partial<DealPropertyAttributes>): Promise<DealPropertyAttributes> {
  const db = getPool();
  const result = await db.query<DealPropertyAttributes>(
    `INSERT INTO ft_deal_property_attributes
     (deal_id, address_line1, city, state, postal_code, latitude, longitude,
      property_type, building_sqft, land_acres, year_built, clear_height_ft,
      dock_doors, drive_in_doors, zoning, parcel_number, last_sale_date, last_sale_price)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     ON CONFLICT (deal_id) DO UPDATE SET
       address_line1 = COALESCE(EXCLUDED.address_line1, ft_deal_property_attributes.address_line1),
       city = COALESCE(EXCLUDED.city, ft_deal_property_attributes.city),
       state = COALESCE(EXCLUDED.state, ft_deal_property_attributes.state),
       postal_code = COALESCE(EXCLUDED.postal_code, ft_deal_property_attributes.postal_code),
       latitude = COALESCE(EXCLUDED.latitude, ft_deal_property_attributes.latitude),
       longitude = COALESCE(EXCLUDED.longitude, ft_deal_property_attributes.longitude),
       property_type = COALESCE(EXCLUDED.property_type, ft_deal_property_attributes.property_type),
       building_sqft = COALESCE(EXCLUDED.building_sqft, ft_deal_property_attributes.building_sqft),
       land_acres = COALESCE(EXCLUDED.land_acres, ft_deal_property_attributes.land_acres),
       year_built = COALESCE(EXCLUDED.year_built, ft_deal_property_attributes.year_built),
       clear_height_ft = COALESCE(EXCLUDED.clear_height_ft, ft_deal_property_attributes.clear_height_ft),
       dock_doors = COALESCE(EXCLUDED.dock_doors, ft_deal_property_attributes.dock_doors),
       drive_in_doors = COALESCE(EXCLUDED.drive_in_doors, ft_deal_property_attributes.drive_in_doors),
       zoning = COALESCE(EXCLUDED.zoning, ft_deal_property_attributes.zoning),
       updated_at = NOW()
     RETURNING *`,
    [
      dealId, data.address_line1, data.city, data.state, data.postal_code,
      data.latitude, data.longitude, data.property_type, data.building_sqft,
      data.land_acres, data.year_built, data.clear_height_ft, data.dock_doors,
      data.drive_in_doors, data.zoning, data.parcel_number, data.last_sale_date,
      data.last_sale_price
    ]
  );
  return result.rows[0];
}

export async function getPropertyAttributes(dealId: string): Promise<DealPropertyAttributes | null> {
  const db = getPool();
  const result = await db.query<DealPropertyAttributes>(
    'SELECT * FROM ft_deal_property_attributes WHERE deal_id = $1',
    [dealId]
  );
  return result.rows[0] || null;
}

// Lease Terms
export async function upsertLeaseTerms(dealId: string, data: Partial<DealLeaseTerms>): Promise<DealLeaseTerms> {
  const db = getPool();
  const result = await db.query<DealLeaseTerms>(
    `INSERT INTO ft_deal_lease_terms
     (deal_id, tenant_name, lease_type, lease_start_date, lease_end_date,
      base_rent_annual, rent_psf, rent_escalations, options)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (deal_id) DO UPDATE SET
       tenant_name = COALESCE(EXCLUDED.tenant_name, ft_deal_lease_terms.tenant_name),
       lease_type = COALESCE(EXCLUDED.lease_type, ft_deal_lease_terms.lease_type),
       lease_start_date = COALESCE(EXCLUDED.lease_start_date, ft_deal_lease_terms.lease_start_date),
       lease_end_date = COALESCE(EXCLUDED.lease_end_date, ft_deal_lease_terms.lease_end_date),
       base_rent_annual = COALESCE(EXCLUDED.base_rent_annual, ft_deal_lease_terms.base_rent_annual),
       rent_psf = COALESCE(EXCLUDED.rent_psf, ft_deal_lease_terms.rent_psf),
       rent_escalations = COALESCE(EXCLUDED.rent_escalations, ft_deal_lease_terms.rent_escalations),
       options = COALESCE(EXCLUDED.options, ft_deal_lease_terms.options),
       updated_at = NOW()
     RETURNING *`,
    [
      dealId, data.tenant_name, data.lease_type, data.lease_start_date,
      data.lease_end_date, data.base_rent_annual, data.rent_psf,
      JSON.stringify(data.rent_escalations || []),
      JSON.stringify(data.options || [])
    ]
  );
  return result.rows[0];
}

export async function getLeaseTerms(dealId: string): Promise<DealLeaseTerms | null> {
  const db = getPool();
  const result = await db.query<DealLeaseTerms>(
    'SELECT * FROM ft_deal_lease_terms WHERE deal_id = $1',
    [dealId]
  );
  return result.rows[0] || null;
}

// Scores
export async function upsertScores(dealId: string, data: Partial<DealScores>): Promise<DealScores> {
  const db = getPool();
  const result = await db.query<DealScores>(
    `INSERT INTO ft_deal_scores
     (deal_id, lci_score, tenant_credit_score, downside_score, market_depth_score,
      overall_score, risk_flags, scored_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (deal_id) DO UPDATE SET
       lci_score = EXCLUDED.lci_score,
       tenant_credit_score = EXCLUDED.tenant_credit_score,
       downside_score = EXCLUDED.downside_score,
       market_depth_score = EXCLUDED.market_depth_score,
       overall_score = EXCLUDED.overall_score,
       risk_flags = EXCLUDED.risk_flags,
       scored_at = NOW(),
       updated_at = NOW()
     RETURNING *`,
    [
      dealId, data.lci_score, data.tenant_credit_score, data.downside_score,
      data.market_depth_score, data.overall_score, JSON.stringify(data.risk_flags || [])
    ]
  );
  return result.rows[0];
}

export async function getScores(dealId: string): Promise<DealScores | null> {
  const db = getPool();
  const result = await db.query<DealScores>(
    'SELECT * FROM ft_deal_scores WHERE deal_id = $1',
    [dealId]
  );
  return result.rows[0] || null;
}

// Financials
export async function upsertFinancials(dealId: string, data: Partial<DealFinancials>): Promise<DealFinancials> {
  const db = getPool();
  const result = await db.query<DealFinancials>(
    `INSERT INTO ft_deal_financials
     (deal_id, purchase_price, noi_year1, cap_rate, ltv_assumed, interest_rate,
      io_years, amort_years, exit_cap_rate, hold_period_years, levered_irr,
      unlevered_irr, dscr_min, cash_on_cash_year1, cash_on_cash_avg)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (deal_id) DO UPDATE SET
       purchase_price = EXCLUDED.purchase_price,
       noi_year1 = EXCLUDED.noi_year1,
       cap_rate = EXCLUDED.cap_rate,
       ltv_assumed = EXCLUDED.ltv_assumed,
       interest_rate = EXCLUDED.interest_rate,
       io_years = EXCLUDED.io_years,
       amort_years = EXCLUDED.amort_years,
       exit_cap_rate = EXCLUDED.exit_cap_rate,
       hold_period_years = EXCLUDED.hold_period_years,
       levered_irr = EXCLUDED.levered_irr,
       unlevered_irr = EXCLUDED.unlevered_irr,
       dscr_min = EXCLUDED.dscr_min,
       cash_on_cash_year1 = EXCLUDED.cash_on_cash_year1,
       cash_on_cash_avg = EXCLUDED.cash_on_cash_avg,
       updated_at = NOW()
     RETURNING *`,
    [
      dealId, data.purchase_price, data.noi_year1, data.cap_rate, data.ltv_assumed,
      data.interest_rate, data.io_years, data.amort_years, data.exit_cap_rate,
      data.hold_period_years, data.levered_irr, data.unlevered_irr, data.dscr_min,
      data.cash_on_cash_year1, data.cash_on_cash_avg
    ]
  );
  return result.rows[0];
}

export async function getFinancials(dealId: string): Promise<DealFinancials | null> {
  const db = getPool();
  const result = await db.query<DealFinancials>(
    'SELECT * FROM ft_deal_financials WHERE deal_id = $1',
    [dealId]
  );
  return result.rows[0] || null;
}

// Enrichment
export async function upsertEnrichment(dealId: string, data: Partial<DealEnrichment>): Promise<DealEnrichment> {
  const db = getPool();
  const result = await db.query<DealEnrichment>(
    `INSERT INTO ft_deal_enrichment
     (deal_id, geocode, market, tenant, enriched_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (deal_id) DO UPDATE SET
       geocode = EXCLUDED.geocode,
       market = EXCLUDED.market,
       tenant = EXCLUDED.tenant,
       enriched_at = NOW(),
       updated_at = NOW()
     RETURNING *`,
    [
      dealId,
      JSON.stringify(data.geocode || null),
      JSON.stringify(data.market || null),
      JSON.stringify(data.tenant || null)
    ]
  );
  return result.rows[0];
}

export async function getEnrichment(dealId: string): Promise<DealEnrichment | null> {
  const db = getPool();
  const result = await db.query<DealEnrichment>(
    'SELECT * FROM ft_deal_enrichment WHERE deal_id = $1',
    [dealId]
  );
  return result.rows[0] || null;
}

// Memos
export async function createMemo(dealId: string, data: {
  content_markdown: string;
  recommendation?: 'approve' | 'approve_with_conditions' | 'decline';
}): Promise<DealMemo> {
  const db = getPool();

  // Get next version number
  const versionResult = await db.query<{ max_version: number }>(
    'SELECT COALESCE(MAX(version), 0) as max_version FROM ft_deal_memos WHERE deal_id = $1',
    [dealId]
  );
  const nextVersion = (versionResult.rows[0]?.max_version || 0) + 1;

  const result = await db.query<DealMemo>(
    `INSERT INTO ft_deal_memos
     (deal_id, version, content_markdown, recommendation, generated_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [dealId, nextVersion, data.content_markdown, data.recommendation]
  );
  return result.rows[0];
}

export async function getMemos(dealId: string): Promise<DealMemo[]> {
  const db = getPool();
  const result = await db.query<DealMemo>(
    'SELECT * FROM ft_deal_memos WHERE deal_id = $1 ORDER BY version DESC',
    [dealId]
  );
  return result.rows;
}

export async function getLatestMemo(dealId: string): Promise<DealMemo | null> {
  const db = getPool();
  const result = await db.query<DealMemo>(
    'SELECT * FROM ft_deal_memos WHERE deal_id = $1 ORDER BY version DESC LIMIT 1',
    [dealId]
  );
  return result.rows[0] || null;
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
  const db = getPool();
  const result = await db.query(
    'DELETE FROM ft_deals WHERE id = $1',
    [dealId]
  );
  return (result.rowCount ?? 0) > 0;
}
