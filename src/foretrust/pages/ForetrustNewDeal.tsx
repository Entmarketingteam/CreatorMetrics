// Foretrust New Deal - Upload/Create Deal Page
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForetrust } from '../hooks/useForetrust';
import {
  FileUp,
  Link as LinkIcon,
  Edit3,
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

type SourceType = 'pdf' | 'url' | 'manual';

interface ManualDealData {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  tenantName: string;
  propertyType: string;
  buildingSqft: string;
  landAcres: string;
  yearBuilt: string;
  leaseType: string;
  leaseStartDate: string;
  leaseEndDate: string;
  baseRentAnnual: string;
  purchasePrice: string;
}

const INITIAL_MANUAL_DATA: ManualDealData = {
  addressLine1: '',
  city: '',
  state: '',
  postalCode: '',
  tenantName: '',
  propertyType: '',
  buildingSqft: '',
  landAcres: '',
  yearBuilt: '',
  leaseType: 'NNN',
  leaseStartDate: '',
  leaseEndDate: '',
  baseRentAnnual: '',
  purchasePrice: ''
};

const PROPERTY_TYPES = [
  'Industrial',
  'Retail',
  'Office',
  'Flex',
  'Warehouse',
  'Distribution Center',
  'Medical Office',
  'Net Lease',
  'Other'
];

export default function ForetrustNewDeal() {
  const navigate = useNavigate();
  const { createDeal, runPipeline, loading, error } = useForetrust();

  const [sourceType, setSourceType] = useState<SourceType>('pdf');
  const [dealName, setDealName] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [documentContent, setDocumentContent] = useState('');
  const [manualData, setManualData] = useState<ManualDealData>(INITIAL_MANUAL_DATA);
  const [runFullPipeline, setRunFullPipeline] = useState(true);
  const [status, setStatus] = useState<'idle' | 'creating' | 'processing' | 'complete' | 'error'>('idle');
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  function handleManualChange(field: keyof ManualDealData, value: string) {
    setManualData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!dealName.trim()) {
      return;
    }

    setStatus('creating');

    // Create the deal
    const deal = await createDeal({
      name: dealName,
      sourceType,
      sourceUrl: sourceUrl || undefined
    });

    if (!deal) {
      setStatus('error');
      return;
    }

    if (runFullPipeline) {
      setStatus('processing');

      // Prepare data for pipeline
      let pipelineData: {
        documentContent?: string;
        manualData?: object;
        purchasePrice?: number;
      } = {};

      if (sourceType === 'manual') {
        pipelineData.manualData = {
          addressLine1: manualData.addressLine1 || null,
          city: manualData.city || null,
          state: manualData.state || null,
          postalCode: manualData.postalCode || null,
          tenantName: manualData.tenantName || null,
          propertyType: manualData.propertyType || null,
          buildingSqft: manualData.buildingSqft ? parseInt(manualData.buildingSqft) : null,
          landAcres: manualData.landAcres ? parseFloat(manualData.landAcres) : null,
          yearBuilt: manualData.yearBuilt ? parseInt(manualData.yearBuilt) : null,
          leaseType: manualData.leaseType || null,
          leaseStartDate: manualData.leaseStartDate || null,
          leaseEndDate: manualData.leaseEndDate || null,
          baseRentAnnual: manualData.baseRentAnnual ? parseFloat(manualData.baseRentAnnual) : null,
          purchasePrice: manualData.purchasePrice ? parseFloat(manualData.purchasePrice) : null,
          rentEscalations: [],
          options: []
        };
        if (manualData.purchasePrice) {
          pipelineData.purchasePrice = parseFloat(manualData.purchasePrice);
        }
      } else if (documentContent) {
        pipelineData.documentContent = documentContent;
      }

      const result = await runPipeline(deal.id, pipelineData);

      if (result.success) {
        setProcessingTime(result.processingTimeSec || null);
        setStatus('complete');
        // Navigate to deal detail after a short delay
        setTimeout(() => {
          navigate(`/foretrust/deal/${deal.id}`);
        }, 2000);
      } else {
        setStatus('error');
      }
    } else {
      // Just navigate to deal detail for manual processing
      navigate(`/foretrust/deal/${deal.id}`);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-7 h-7 text-indigo-600" />
          New Deal
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Upload an OM, paste a URL, or enter deal details manually
        </p>
      </div>

      {/* Processing Status */}
      {(status === 'creating' || status === 'processing') && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
          <h3 className="text-lg font-medium text-indigo-900">
            {status === 'creating' ? 'Creating Deal...' : 'Running AI Pipeline...'}
          </h3>
          <p className="text-indigo-700 mt-1">
            {status === 'processing'
              ? 'Parsing document, enriching data, calculating scores, and generating memo'
              : 'Setting up your deal'}
          </p>
        </div>
      )}

      {status === 'complete' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-green-900">Deal Complete!</h3>
          <p className="text-green-700 mt-1">
            Processed in {processingTime} seconds. Redirecting to deal detail...
          </p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deal Name */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Deal Name *
          </label>
          <input
            type="text"
            value={dealName}
            onChange={(e) => setDealName(e.target.value)}
            placeholder="e.g., Walgreens NNN - Dallas, TX"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        {/* Source Type Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Data Source
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setSourceType('pdf')}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                sourceType === 'pdf'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <FileUp className={`w-6 h-6 mb-2 ${sourceType === 'pdf' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <h3 className="font-medium text-gray-900 dark:text-white">PDF / Document</h3>
              <p className="text-sm text-gray-500">Paste OM or flyer content</p>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                sourceType === 'url'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <LinkIcon className={`w-6 h-6 mb-2 ${sourceType === 'url' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <h3 className="font-medium text-gray-900 dark:text-white">Listing URL</h3>
              <p className="text-sm text-gray-500">LoopNet, Crexi, etc.</p>
            </button>
            <button
              type="button"
              onClick={() => setSourceType('manual')}
              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                sourceType === 'manual'
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              <Edit3 className={`w-6 h-6 mb-2 ${sourceType === 'manual' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <h3 className="font-medium text-gray-900 dark:text-white">Manual Entry</h3>
              <p className="text-sm text-gray-500">Enter details directly</p>
            </button>
          </div>
        </div>

        {/* Source-specific inputs */}
        {sourceType === 'pdf' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Content
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Paste the full text from your OM, broker flyer, or listing
            </p>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste document content here..."
              rows={12}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        )}

        {sourceType === 'url' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Listing URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.loopnet.com/Listing/..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-500 mt-2">
              Note: URL scraping requires additional content to be pasted below
            </p>
            <textarea
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              placeholder="Paste listing content here if URL cannot be scraped directly..."
              rows={8}
              className="w-full mt-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
            />
          </div>
        )}

        {sourceType === 'manual' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 space-y-6">
            {/* Property Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Property Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={manualData.addressLine1}
                    onChange={(e) => handleManualChange('addressLine1', e.target.value)}
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={manualData.city}
                    onChange={(e) => handleManualChange('city', e.target.value)}
                    placeholder="Dallas"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={manualData.state}
                    onChange={(e) => handleManualChange('state', e.target.value)}
                    placeholder="TX"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={manualData.postalCode}
                    onChange={(e) => handleManualChange('postalCode', e.target.value)}
                    placeholder="75201"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Property Type
                  </label>
                  <select
                    value={manualData.propertyType}
                    onChange={(e) => handleManualChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="">Select type...</option>
                    {PROPERTY_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Building SF
                  </label>
                  <input
                    type="number"
                    value={manualData.buildingSqft}
                    onChange={(e) => handleManualChange('buildingSqft', e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Land Acres
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualData.landAcres}
                    onChange={(e) => handleManualChange('landAcres', e.target.value)}
                    placeholder="2.5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Year Built
                  </label>
                  <input
                    type="number"
                    value={manualData.yearBuilt}
                    onChange={(e) => handleManualChange('yearBuilt', e.target.value)}
                    placeholder="2018"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Tenant & Lease */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tenant & Lease</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tenant Name
                  </label>
                  <input
                    type="text"
                    value={manualData.tenantName}
                    onChange={(e) => handleManualChange('tenantName', e.target.value)}
                    placeholder="Walgreens"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lease Type
                  </label>
                  <select
                    value={manualData.leaseType}
                    onChange={(e) => handleManualChange('leaseType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="NNN">NNN</option>
                    <option value="NN">NN</option>
                    <option value="N">N</option>
                    <option value="Gross">Gross</option>
                    <option value="Modified Gross">Modified Gross</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lease Start Date
                  </label>
                  <input
                    type="date"
                    value={manualData.leaseStartDate}
                    onChange={(e) => handleManualChange('leaseStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lease End Date
                  </label>
                  <input
                    type="date"
                    value={manualData.leaseEndDate}
                    onChange={(e) => handleManualChange('leaseEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Financials */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Annual Base Rent ($)
                  </label>
                  <input
                    type="number"
                    value={manualData.baseRentAnnual}
                    onChange={(e) => handleManualChange('baseRentAnnual', e.target.value)}
                    placeholder="250000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Purchase Price ($)
                  </label>
                  <input
                    type="number"
                    value={manualData.purchasePrice}
                    onChange={(e) => handleManualChange('purchasePrice', e.target.value)}
                    placeholder="4000000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipeline Option */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={runFullPipeline}
              onChange={(e) => setRunFullPipeline(e.target.checked)}
              className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                Run Full AI Pipeline
              </span>
              <p className="text-sm text-gray-500 mt-0.5">
                Automatically parse document, enrich data, calculate scores, and generate IC memo (typically &lt; 2 minutes)
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/foretrust')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || status === 'creating' || status === 'processing'}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading || status === 'creating' || status === 'processing' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Create Deal
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
