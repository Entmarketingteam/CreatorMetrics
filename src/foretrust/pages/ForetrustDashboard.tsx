// Foretrust Dashboard - Deal List View
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForetrust, Deal } from '../hooks/useForetrust';
import {
  Building2,
  Plus,
  Search,
  Filter,
  TrendingUp,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2
} from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ingested: { bg: 'bg-blue-100', text: 'text-blue-700' },
  enriched: { bg: 'bg-purple-100', text: 'text-purple-700' },
  underwritten: { bg: 'bg-amber-100', text: 'text-amber-700' },
  memo_generated: { bg: 'bg-green-100', text: 'text-green-700' },
  archived: { bg: 'bg-gray-200', text: 'text-gray-500' }
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  ingested: 'Ingested',
  enriched: 'Enriched',
  underwritten: 'Underwritten',
  memo_generated: 'Complete',
  archived: 'Archived'
};

function ScoreBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) {
    return <span className="text-gray-400">--</span>;
  }

  let color = 'text-gray-600 bg-gray-100';
  if (score >= 75) color = 'text-green-700 bg-green-100';
  else if (score >= 50) color = 'text-amber-700 bg-amber-100';
  else color = 'text-red-700 bg-red-100';

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${color}`}>
      {score}
    </span>
  );
}

function formatPercent(value?: number): string {
  if (value === undefined || value === null) return '--';
  return `${(value * 100).toFixed(2)}%`;
}

export default function ForetrustDashboard() {
  const { listDeals, deleteDeal, loading, error } = useForetrust();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadDeals();
  }, [statusFilter]);

  async function loadDeals() {
    const data = await listDeals({
      status: statusFilter || undefined,
      tenant: searchTerm || undefined
    });
    setDeals(data);
  }

  async function handleSearch() {
    await loadDeals();
  }

  async function handleDelete(dealId: string) {
    const success = await deleteDeal(dealId);
    if (success) {
      setDeals(deals.filter(d => d.id !== dealId));
    }
    setDeleteConfirm(null);
  }

  // Stats
  const totalDeals = deals.length;
  const completedDeals = deals.filter(d => d.status === 'memo_generated').length;
  const avgScore = deals.reduce((sum, d) => sum + (d.overall_score || 0), 0) / (totalDeals || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600" />
            Foretrust Deals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            AI-powered real estate underwriting platform
          </p>
        </div>
        <Link
          to="/foretrust/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Deal
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Deals</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalDeals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{completedDeals}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {totalDeals - completedDeals}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Avg Score</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {avgScore.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="ingested">Ingested</option>
            <option value="enriched">Enriched</option>
            <option value="underwritten">Underwritten</option>
            <option value="memo_generated">Complete</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Deals Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading deals...</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No deals yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first deal</p>
            <Link
              to="/foretrust/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Create Deal
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cap Rate
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    IRR
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {deals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <Link
                        to={`/foretrust/deal/${deal.id}`}
                        className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      >
                        {deal.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(deal.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-gray-900 dark:text-gray-100">
                      {deal.tenant_name || '--'}
                    </td>
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                      {deal.city && deal.state ? `${deal.city}, ${deal.state}` : '--'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <ScoreBadge score={deal.overall_score} />
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-100">
                      {formatPercent(deal.cap_rate)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-900 dark:text-gray-100">
                      {formatPercent(deal.levered_irr)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          STATUS_COLORS[deal.status]?.bg || 'bg-gray-100'
                        } ${STATUS_COLORS[deal.status]?.text || 'text-gray-700'}`}
                      >
                        {STATUS_LABELS[deal.status] || deal.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {deleteConfirm === deal.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(deal.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
