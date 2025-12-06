// Foretrust Deal Detail - Complete Deal View with IC Memo
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForetrust, DealComplete, ScoreExplainability } from '../hooks/useForetrust';
import {
  Building2,
  MapPin,
  User,
  DollarSign,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Play,
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ingested: 'Ingested',
  enriched: 'Enriched',
  underwritten: 'Underwritten',
  memo_generated: 'Complete',
  archived: 'Archived'
};

function ScoreCard({ label, score, explanation }: { label: string; score?: number; explanation?: string }) {
  if (score === undefined || score === null) {
    return (
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-400">--</p>
      </div>
    );
  }

  let bgColor = 'bg-gray-50 dark:bg-gray-700';
  let textColor = 'text-gray-900';
  if (score >= 75) {
    bgColor = 'bg-green-50 dark:bg-green-900/20';
    textColor = 'text-green-700 dark:text-green-400';
  } else if (score >= 50) {
    bgColor = 'bg-amber-50 dark:bg-amber-900/20';
    textColor = 'text-amber-700 dark:text-amber-400';
  } else {
    bgColor = 'bg-red-50 dark:bg-red-900/20';
    textColor = 'text-red-700 dark:text-red-400';
  }

  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{score}</p>
      {explanation && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{explanation}</p>
      )}
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">
        {value ?? '--'}
      </span>
    </div>
  );
}

function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value?: number, decimals = 2): string {
  if (value === undefined || value === null) return '--';
  return `${(value * 100).toFixed(decimals)}%`;
}

export default function ForetrustDealDetail() {
  const { dealId } = useParams<{ dealId: string }>();
  const {
    getDeal,
    getExplainability,
    ingestDeal,
    enrichDeal,
    underwriteDeal,
    generateMemo,
    loading,
    error
  } = useForetrust();

  const [deal, setDeal] = useState<DealComplete | null>(null);
  const [explainability, setExplainability] = useState<ScoreExplainability | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  useEffect(() => {
    if (dealId) {
      loadDeal();
    }
  }, [dealId]);

  async function loadDeal() {
    if (!dealId) return;
    const data = await getDeal(dealId);
    setDeal(data);

    // Load explainability if underwritten
    if (data?.scores) {
      const explain = await getExplainability(dealId);
      setExplainability(explain);
    }
  }

  async function handleRunStep(step: 'ingest' | 'enrich' | 'underwrite' | 'memo') {
    if (!dealId) return;
    setProcessingStep(step);

    let success = false;
    switch (step) {
      case 'ingest':
        success = await ingestDeal(dealId, {});
        break;
      case 'enrich':
        success = await enrichDeal(dealId);
        break;
      case 'underwrite':
        success = await underwriteDeal(dealId);
        break;
      case 'memo':
        success = await generateMemo(dealId);
        break;
    }

    if (success) {
      await loadDeal();
    }
    setProcessingStep(null);
  }

  function downloadMemo() {
    if (!deal?.memos?.[0]) return;

    const blob = new Blob([deal.memos[0].content_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `IC_Memo_${deal.deal.name.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (loading && !deal) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-500">Loading deal...</p>
        </div>
      </div>
    );
  }

  if (!deal?.deal) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h2 className="text-xl font-medium text-gray-900 dark:text-white">Deal not found</h2>
        <Link to="/foretrust" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block">
          Back to deals
        </Link>
      </div>
    );
  }

  const { deal: dealInfo, propertyAttributes, leaseTerms, scores, financials, enrichment, memos } = deal;
  const latestMemo = memos?.[0];
  const recommendation = latestMemo?.recommendation;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/foretrust"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to deals
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            {dealInfo.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700`}>
              {STATUS_LABELS[dealInfo.status] || dealInfo.status}
            </span>
            <span>Created {new Date(dealInfo.created_at).toLocaleDateString()}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadDeal}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {latestMemo && (
            <button
              onClick={downloadMemo}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              Download Memo
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Recommendation Banner */}
      {recommendation && (
        <div
          className={`rounded-lg p-4 flex items-center gap-3 ${
            recommendation === 'approve'
              ? 'bg-green-50 border border-green-200'
              : recommendation === 'approve_with_conditions'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {recommendation === 'approve' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : recommendation === 'approve_with_conditions' ? (
            <HelpCircle className="w-6 h-6 text-amber-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <p className={`font-semibold ${
              recommendation === 'approve'
                ? 'text-green-800'
                : recommendation === 'approve_with_conditions'
                ? 'text-amber-800'
                : 'text-red-800'
            }`}>
              {recommendation === 'approve'
                ? 'APPROVE'
                : recommendation === 'approve_with_conditions'
                ? 'APPROVE WITH CONDITIONS'
                : 'DECLINE'}
            </p>
            <p className="text-sm text-gray-600">AI Recommendation</p>
          </div>
        </div>
      )}

      {/* Pipeline Steps (if not complete) */}
      {dealInfo.status !== 'memo_generated' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Processing Pipeline</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleRunStep('ingest')}
              disabled={processingStep !== null || dealInfo.status !== 'draft'}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStep === 'ingest' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Ingest
            </button>
            <button
              onClick={() => handleRunStep('enrich')}
              disabled={processingStep !== null || !['ingested'].includes(dealInfo.status)}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStep === 'enrich' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Enrich
            </button>
            <button
              onClick={() => handleRunStep('underwrite')}
              disabled={processingStep !== null || !['enriched', 'ingested'].includes(dealInfo.status)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStep === 'underwrite' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Underwrite
            </button>
            <button
              onClick={() => handleRunStep('memo')}
              disabled={processingStep !== null || dealInfo.status !== 'underwritten'}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingStep === 'memo' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Generate Memo
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scores & Financials */}
        <div className="space-y-6">
          {/* Scores */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Deal Scores
              </h3>
              {scores && (
                <button
                  onClick={() => setShowExplain(!showExplain)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  {showExplain ? 'Hide' : 'Show'} Explanations
                  {showExplain ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ScoreCard
                label="Overall"
                score={scores?.overall_score}
                explanation={showExplain ? explainability?.explainability?.overall : undefined}
              />
              <ScoreCard
                label="Location (LCI)"
                score={scores?.lci_score}
                explanation={showExplain ? explainability?.explainability?.lci : undefined}
              />
              <ScoreCard
                label="Tenant Credit"
                score={scores?.tenant_credit_score}
                explanation={showExplain ? explainability?.explainability?.tenantCredit : undefined}
              />
              <ScoreCard
                label="Downside"
                score={scores?.downside_score}
                explanation={showExplain ? explainability?.explainability?.downside : undefined}
              />
              <ScoreCard
                label="Market Depth"
                score={scores?.market_depth_score}
                explanation={showExplain ? explainability?.explainability?.marketDepth : undefined}
              />
            </div>

            {/* Risk Flags */}
            {scores?.risk_flags && scores.risk_flags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Risk Flags</p>
                <ul className="space-y-1">
                  {scores.risk_flags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Financials */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Financial Metrics
            </h3>
            <div className="space-y-1">
              <MetricRow label="Purchase Price" value={formatCurrency(financials?.purchase_price)} />
              <MetricRow label="Year 1 NOI" value={formatCurrency(financials?.noi_year1)} />
              <MetricRow label="Cap Rate" value={formatPercent(financials?.cap_rate)} />
              <MetricRow label="LTV" value={formatPercent(financials?.ltv_assumed)} />
              <MetricRow label="Interest Rate" value={formatPercent(financials?.interest_rate)} />
              <MetricRow label="Levered IRR" value={formatPercent(financials?.levered_irr)} />
              <MetricRow label="Unlevered IRR" value={formatPercent(financials?.unlevered_irr)} />
              <MetricRow label="DSCR" value={financials?.dscr_min?.toFixed(2)} />
              <MetricRow label="Cash-on-Cash Y1" value={formatPercent(financials?.cash_on_cash_year1)} />
            </div>
          </div>
        </div>

        {/* Middle Column - Property & Lease */}
        <div className="space-y-6">
          {/* Property Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Property Details
            </h3>
            <div className="space-y-1">
              <MetricRow label="Address" value={propertyAttributes?.address_line1} />
              <MetricRow
                label="Location"
                value={
                  propertyAttributes?.city && propertyAttributes?.state
                    ? `${propertyAttributes.city}, ${propertyAttributes.state} ${propertyAttributes.postal_code || ''}`
                    : undefined
                }
              />
              <MetricRow label="Property Type" value={propertyAttributes?.property_type} />
              <MetricRow label="Building SF" value={propertyAttributes?.building_sqft?.toLocaleString()} />
              <MetricRow label="Land Acres" value={propertyAttributes?.land_acres?.toFixed(2)} />
              <MetricRow label="Year Built" value={propertyAttributes?.year_built} />
              <MetricRow label="Clear Height (ft)" value={propertyAttributes?.clear_height_ft} />
              <MetricRow label="Dock Doors" value={propertyAttributes?.dock_doors} />
            </div>
          </div>

          {/* Tenant & Lease */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-600" />
              Tenant & Lease
            </h3>
            <div className="space-y-1">
              <MetricRow label="Tenant" value={leaseTerms?.tenant_name} />
              <MetricRow label="Lease Type" value={leaseTerms?.lease_type} />
              <MetricRow label="Lease Start" value={leaseTerms?.lease_start_date} />
              <MetricRow label="Lease End" value={leaseTerms?.lease_end_date} />
              <MetricRow label="Base Rent (Annual)" value={formatCurrency(leaseTerms?.base_rent_annual)} />
              <MetricRow label="Rent PSF" value={leaseTerms?.rent_psf ? `$${leaseTerms.rent_psf.toFixed(2)}` : undefined} />
            </div>

            {/* Enriched Tenant Data */}
            {enrichment?.tenant && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-500 mb-2">Enriched Data</p>
                <div className="space-y-1">
                  <MetricRow label="Industry" value={(enrichment.tenant as Record<string, string>).industry} />
                  <MetricRow label="Company Size" value={(enrichment.tenant as Record<string, string>).companySize} />
                  <MetricRow label="Public/Private" value={(enrichment.tenant as Record<string, string>).publicOrPrivate} />
                  <MetricRow label="Credit Rating" value={(enrichment.tenant as Record<string, string>).creditImplied} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - IC Memo */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              IC Memo
            </h3>

            {latestMemo ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-[600px]"
                  style={{ tabSize: 2 }}
                >
                  {latestMemo.content_markdown}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Version {latestMemo.version} - Generated {new Date(latestMemo.generated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>No memo generated yet</p>
                <p className="text-sm">Complete underwriting to generate IC memo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
