// Foretrust MVP Types

// Database Entities
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  organizationId: string;
  name: string;
  status: 'draft' | 'ingested' | 'enriched' | 'underwritten' | 'memo_generated' | 'archived';
  sourceType: 'pdf' | 'url' | 'manual';
  sourceUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealDocument {
  id: string;
  dealId: string;
  documentType: 'om' | 'lease' | 'rent_roll' | 'other';
  fileName: string;
  fileUrl: string;
  fileSize: number;
  parsedContent?: string;
  createdAt: Date;
}

export interface DealPropertyAttributes {
  id: string;
  dealId: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  buildingSqft?: number;
  landAcres?: number;
  yearBuilt?: number;
  clearHeightFt?: number;
  dockDoors?: number;
  driveInDoors?: number;
  zoning?: string;
  parcelNumber?: string;
  lastSaleDate?: string;
  lastSalePrice?: number;
}

export interface DealLeaseTerms {
  id: string;
  dealId: string;
  tenantName?: string;
  leaseType?: string;
  leaseStartDate?: string;
  leaseEndDate?: string;
  baseRentAnnual?: number;
  rentPsf?: number;
  rentEscalations?: RentEscalation[];
  options?: LeaseOption[];
}

export interface RentEscalation {
  year: number;
  bumpPct: number;
}

export interface LeaseOption {
  type: string;
  years: number;
}

export interface DealScores {
  id: string;
  dealId: string;
  lciScore?: number;
  tenantCreditScore?: number;
  downsideScore?: number;
  marketDepthScore?: number;
  overallScore?: number;
  riskFlags?: string[];
  scoredAt?: Date;
}

export interface DealFinancials {
  id: string;
  dealId: string;
  purchasePrice?: number;
  noiYear1?: number;
  capRate?: number;
  ltvAssumed?: number;
  interestRate?: number;
  ioYears?: number;
  amortYears?: number;
  exitCapRate?: number;
  holdPeriodYears?: number;
  leveredIrr?: number;
  unleveredIrr?: number;
  dscrMin?: number;
  cashOnCashYear1?: number;
  cashOnCashAvg?: number;
}

export interface DealMemo {
  id: string;
  dealId: string;
  version: number;
  contentMarkdown: string;
  recommendation?: 'approve' | 'approve_with_conditions' | 'decline';
  generatedAt: Date;
}

export interface DealEnrichment {
  id: string;
  dealId: string;
  geocode?: {
    latitude: number;
    longitude: number;
  };
  market?: {
    submarketName: string;
    marketRank: number;
  };
  tenant?: {
    industry: string;
    companySize: string;
    publicOrPrivate: string;
    creditImplied: string;
  };
  enrichedAt: Date;
}

// API Request/Response Types
export interface ParsedDealData {
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  tenantName: string | null;
  propertyType: string | null;
  buildingSqft: number | null;
  landAcres: number | null;
  yearBuilt: number | null;
  clearHeightFt: number | null;
  dockDoors: number | null;
  driveInDoors: number | null;
  leaseType: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  baseRentAnnual: number | null;
  rentPsf: number | null;
  rentEscalations: RentEscalation[];
  options: LeaseOption[];
}

export interface EnrichmentData {
  geocode: {
    latitude: number | null;
    longitude: number | null;
  };
  market: {
    submarketName: string | null;
    marketRank: number | null;
  };
  tenant: {
    industry: string | null;
    companySize: string | null;
    publicOrPrivate: string | null;
    creditImplied: string | null;
  };
}

export interface UnderwritingResult {
  scores: {
    lciScore: number;
    tenantCreditScore: number;
    downsideScore: number;
    marketDepthScore: number;
    overallScore: number;
    riskFlags: string[];
  };
  financials: {
    purchasePrice: number | null;
    noiYear1: number | null;
    capRate: number | null;
    ltvAssumed: number;
    interestRate: number;
    ioYears: number;
    amortYears: number;
    exitCapRate: number;
    holdPeriodYears: number;
    leveredIrr: number;
    unleveredIrr: number;
    dscrMin: number;
    cashOnCashYear1: number;
    cashOnCashAvg: number;
  };
}

export interface ScoreExplainability {
  lci: string;
  tenantCredit: string;
  downside: string;
  marketDepth: string;
  overall: string;
}

// Dashboard Types
export interface DealListItem {
  id: string;
  name: string;
  status: Deal['status'];
  tenantName?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  overallScore?: number;
  capRate?: number;
  noiYear1?: number;
  leveredIrr?: number;
  createdAt: Date;
}

export interface DealFilters {
  tenant?: string;
  market?: string;
  propertyType?: string;
  scoreMin?: number;
  scoreMax?: number;
  status?: Deal['status'];
}

// Full Deal View
export interface DealComplete {
  deal: Deal;
  documents: DealDocument[];
  propertyAttributes?: DealPropertyAttributes;
  leaseTerms?: DealLeaseTerms;
  scores?: DealScores;
  financials?: DealFinancials;
  enrichment?: DealEnrichment;
  memos: DealMemo[];
}
