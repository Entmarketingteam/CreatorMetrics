import { Link2, CheckCircle2, XCircle } from 'lucide-react';

const platforms = [
  {
    id: 1,
    name: 'LTK',
    connected: true,
    revenue: 5420,
    color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  },
  {
    id: 2,
    name: 'Amazon',
    connected: true,
    revenue: 3280,
    color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  },
  {
    id: 3,
    name: 'Walmart',
    connected: false,
    revenue: 0,
    color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  },
  {
    id: 4,
    name: 'ShopStyle',
    connected: false,
    revenue: 0,
    color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  },
];

export default function Platforms() {
  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Platform Connections</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your affiliate platform connections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center`}>
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {platform.connected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Not Connected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {platform.connected && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${platform.revenue.toFixed(2)}
                </p>
              </div>
            )}

            <button
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                platform.connected
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {platform.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
