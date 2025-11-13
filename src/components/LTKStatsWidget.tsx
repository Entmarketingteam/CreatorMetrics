import { useLTK } from '../hooks/useLTK';
import { Link } from 'react-router-dom';

export default function LTKStatsWidget() {
  const { stats, isConnected, isLoading, error, refreshStatus, refresh } = useLTK();

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">LTK Stats</h2>
          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
        </div>
        <div className="text-center py-8">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Not connected to LTK</p>
          <Link
            to="/settings"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Connect LTK Account
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading && !stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">LTK Stats</h2>
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading LTK data...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">LTK Stats</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
          </div>
        </div>
        <button
          onClick={refresh}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh now"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <Link to="/settings" className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1 inline-block">
                Check connection settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.clicks)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatNumber(stats.sales)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.earnings)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Earnings</div>
          </div>
        </div>
      )}

      {/* Conversion Rate */}
      {stats && stats.clicks > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Conversion Rate</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {((stats.sales / stats.clicks) * 100).toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* Top Products */}
      {stats?.topProducts && stats.topProducts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Top Products</h3>
          <div className="space-y-2">
            {stats.topProducts.slice(0, 3).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{index + 1}.</span>
                  <span className="text-gray-900 dark:text-white truncate">{product.name}</span>
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium ml-2">
                  {formatCurrency(product.commission)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Status */}
      {refreshStatus && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Last updated: {getTimeAgo(refreshStatus.lastRefresh)}
            </span>
            {refreshStatus.isRunning && (
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                Auto-refresh active
              </span>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!stats && !isLoading && !error && (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No data available yet</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Fetch Data Now
          </button>
        </div>
      )}
    </div>
  );
}
